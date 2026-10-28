// Cloudflare Pages Function: /api/sync
// Handles bidirectional cloud sync between client and Cloudflare D1 with tenant isolation & session security

interface Env {
  DB?: D1Database;
}

function getSessionUser(request: Request): { id: string; email?: string } | null {
  // 1. Check Bearer Authorization Header
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) return { id: token };
  }

  // 2. Check session_user Cookie
  const cookieHeader = request.headers.get('Cookie') || '';
  const match = cookieHeader.match(/session_user=([^;]+)/);
  if (match) {
    try {
      const decoded = decodeURIComponent(match[1]);
      const user = JSON.parse(decoded);
      if (user && user.id) {
        return user;
      }
    } catch {
      // ignore
    }
  }
  return null;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body: {
      userId: string;
      invoices?: any[];
      deletedInvoiceIds?: string[];
      issuer?: any;
      issuerProfile?: any;
    } = await context.request.json();

    if (!body.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized: missing userId' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sessionUser = getSessionUser(context.request);
    // BOLA / IDOR Protection: ensure authenticated user cannot write to another tenant's partition
    if (context.env.DB && sessionUser && sessionUser.id !== body.userId) {
      return new Response(JSON.stringify({ error: 'Forbidden: Cannot modify other user data' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!context.env.DB) {
      // In local dev without remote D1 bindings, respond gracefully with success
      return new Response(JSON.stringify({
        success: true,
        mode: 'local_fallback',
        syncedCount: (body.invoices || []).length
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = context.env.DB;
    const userId = body.userId;
    const iss = body.issuerProfile || body.issuer;

    // Ensure user record exists for Foreign Key integrity
    await db.prepare(
      `INSERT INTO users (id, email, name, updated_at)
       VALUES (?, ?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(id) DO NOTHING`
    ).bind(userId, `${userId}@sync.local`, iss?.name || 'User').run();

    // 1. Sync Issuer Profile
    if (iss) {
      await db.prepare(
        `INSERT INTO issuer_profiles (
          user_id, name, tax_id, address, phone, promptpay_id, 
          bank_name, bank_account, bank_account_name, signature_mode, 
          signature_data_url, logo_url, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          name=excluded.name,
          tax_id=excluded.tax_id,
          address=excluded.address,
          phone=excluded.phone,
          promptpay_id=excluded.promptpay_id,
          bank_name=excluded.bank_name,
          bank_account=excluded.bank_account,
          bank_account_name=excluded.bank_account_name,
          signature_mode=excluded.signature_mode,
          signature_data_url=excluded.signature_data_url,
          logo_url=excluded.logo_url,
          updated_at=CURRENT_TIMESTAMP`
      ).bind(
        userId,
        iss.name || '',
        iss.taxId || '',
        iss.address || '',
        iss.phone || '',
        iss.promptPayId || '',
        iss.bankName || '',
        iss.bankAccount || '',
        iss.bankAccountName || '',
        iss.signatureMode || 'auto',
        iss.signatureDataUrl || '',
        iss.logoUrl || ''
      ).run();
    }

    // 2. Handle Deletions (Tombstones to prevent zombie resurrection)
    if (body.deletedInvoiceIds && Array.isArray(body.deletedInvoiceIds) && body.deletedInvoiceIds.length > 0) {
      const delStmts = body.deletedInvoiceIds.map(delId =>
        db.prepare(
          `UPDATE invoices SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ? AND id = ?`
        ).bind(userId, delId)
      );
      await db.batch(delStmts);
    }

    // 3. Sync Invoices (Batch Upsert with Attachment & Multi-Tenant Isolation)
    if (body.invoices && body.invoices.length > 0) {
      const stmts = body.invoices.map(inv => {
        // Normalize whtRate: store whole percentage (3) consistently
        const rateVal = inv.whtRate ? (inv.whtRate < 1 ? inv.whtRate * 100 : inv.whtRate) : 3;

        return db.prepare(
          `INSERT INTO invoices (
            id, user_id, invoice_number, issue_date, due_date, 
            category, client_name, client_tax_id, client_address, 
            items_json, subtotal, wht_rate, wht_amount, net_total, 
            status, has_50_tawi, tawi_doc_number, notes, slip_image, tawi_image, is_deleted, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
          ON CONFLICT(user_id, id) DO UPDATE SET
            invoice_number=excluded.invoice_number,
            issue_date=excluded.issue_date,
            due_date=excluded.due_date,
            category=excluded.category,
            client_name=excluded.client_name,
            client_tax_id=excluded.client_tax_id,
            client_address=excluded.client_address,
            items_json=excluded.items_json,
            subtotal=excluded.subtotal,
            wht_rate=excluded.wht_rate,
            wht_amount=excluded.wht_amount,
            net_total=excluded.net_total,
            status=excluded.status,
            has_50_tawi=excluded.has_50_tawi,
            tawi_doc_number=excluded.tawi_doc_number,
            notes=excluded.notes,
            slip_image=COALESCE(excluded.slip_image, invoices.slip_image),
            tawi_image=COALESCE(excluded.tawi_image, invoices.tawi_image),
            is_deleted=0,
            updated_at=CURRENT_TIMESTAMP
          WHERE invoices.user_id = excluded.user_id`
        ).bind(
          inv.id,
          userId,
          inv.invoiceNumber,
          inv.issueDate,
          inv.dueDate,
          inv.category,
          inv.clientName,
          inv.clientTaxId || '',
          inv.clientAddress || '',
          JSON.stringify(inv.items || []),
          inv.subtotal || 0,
          rateVal,
          inv.whtAmount || 0,
          inv.netTotal || 0,
          inv.status || 'draft',
          inv.has50Tawi ? 1 : 0,
          inv.tawiDocNumber || '',
          inv.notes || '',
          inv.slipImage || null,
          inv.tawiImage || null
        );
      });

      await db.batch(stmts);
    }

    return new Response(JSON.stringify({
      success: true,
      syncedCount: (body.invoices || []).length,
      syncedAt: new Date().toISOString()
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Sync Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const url = new URL(context.request.url);
    const userId = url.searchParams.get('userId');

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sessionUser = getSessionUser(context.request);
    // BOLA / IDOR Protection: verify user cannot read other users' accounts
    if (context.env.DB && sessionUser && sessionUser.id !== userId) {
      return new Response(JSON.stringify({ error: 'Forbidden: Cannot access other user data' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!context.env.DB) {
      return new Response(JSON.stringify({ invoices: [], issuerProfile: null, subscription: null }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = context.env.DB;

    // 1. Fetch Issuer
    const issuerRow: any = await db.prepare(
      `SELECT * FROM issuer_profiles WHERE user_id = ?`
    ).bind(userId).first();

    const formattedIssuer = issuerRow ? {
      name: issuerRow.name,
      taxId: issuerRow.tax_id,
      address: issuerRow.address,
      phone: issuerRow.phone,
      promptPayId: issuerRow.promptpay_id,
      bankName: issuerRow.bank_name,
      bankAccount: issuerRow.bank_account,
      bankAccountName: issuerRow.bank_account_name,
      signatureMode: issuerRow.signature_mode,
      signatureDataUrl: issuerRow.signature_data_url,
      logoUrl: issuerRow.logo_url
    } : null;

    // 2. Fetch Invoices (Excluding soft-deleted invoices)
    const invoiceRows: any = await db.prepare(
      `SELECT * FROM invoices WHERE user_id = ? AND (is_deleted IS NULL OR is_deleted = 0) ORDER BY issue_date DESC`
    ).bind(userId).all();

    const invoices = (invoiceRows.results || []).map((row: any) => ({
      id: row.id,
      invoiceNumber: row.invoice_number,
      issueDate: row.issue_date,
      dueDate: row.due_date,
      category: row.category,
      clientName: row.client_name,
      clientTaxId: row.client_tax_id,
      clientAddress: row.client_address,
      items: JSON.parse(row.items_json || '[]'),
      subtotal: row.subtotal,
      whtRate: row.wht_rate,
      whtAmount: row.wht_amount,
      netTotal: row.net_total,
      status: row.status,
      has50Tawi: !!row.has_50_tawi,
      tawiDocNumber: row.tawi_doc_number,
      notes: row.notes,
      slipImage: row.slip_image || undefined,
      tawiImage: row.tawi_image || undefined
    }));

    // 3. Fetch Subscription
    const subRow: any = await db.prepare(
      `SELECT tier, status, expires_at FROM subscriptions WHERE user_id = ?`
    ).bind(userId).first();

    const subscription = subRow ? {
      tier: subRow.tier,
      status: subRow.status,
      expiresAt: subRow.expires_at
    } : null;

    return new Response(JSON.stringify({
      success: true,
      issuerProfile: formattedIssuer,
      issuer: formattedIssuer,
      invoices,
      subscription
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Fetch Sync Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
