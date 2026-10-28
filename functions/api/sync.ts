// Cloudflare Pages Function: /api/sync
// Handles bidirectional cloud sync between client and Cloudflare D1

interface Env {
  DB?: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body: {
      userId: string;
      invoices?: any[];
      issuer?: any;
      issuerProfile?: any;
    } = await context.request.json();

    if (!body.userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized: missing userId' }), {
        status: 401,
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

    // 2. Sync Invoices (Batch Upsert)
    if (body.invoices && body.invoices.length > 0) {
      const stmts = body.invoices.map(inv => {
        return db.prepare(
          `INSERT INTO invoices (
            id, user_id, invoice_number, issue_date, due_date, 
            category, client_name, client_tax_id, client_address, 
            items_json, subtotal, wht_rate, wht_amount, net_total, 
            status, has_50_tawi, tawi_doc_number, notes, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
          ON CONFLICT(id) DO UPDATE SET
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
            updated_at=CURRENT_TIMESTAMP`
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
          inv.whtRate || 3,
          inv.whtAmount || 0,
          inv.netTotal || 0,
          inv.status || 'draft',
          inv.has50Tawi ? 1 : 0,
          inv.tawiDocNumber || '',
          inv.notes || ''
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

    // 2. Fetch Invoices
    const invoiceRows: any = await db.prepare(
      `SELECT * FROM invoices WHERE user_id = ? ORDER BY issue_date DESC`
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
      notes: row.notes
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
