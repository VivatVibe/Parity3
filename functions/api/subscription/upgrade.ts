// Cloudflare Pages Function: /api/subscription/upgrade
// Handles Pro tier upgrade with PromptPay slip reference

interface Env {
  DB?: D1Database;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body: { userId?: string; slipRef?: string; months?: number } = await context.request.json();
    const { userId, slipRef, months = 1 } = body;

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Missing userId' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (!slipRef || slipRef.trim().length < 4) {
      return new Response(JSON.stringify({ error: 'กรุณาระบุเลขอ้างอิงสลิปหรือรหัสทำรายการอย่างน้อย 4 หลัก' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const daysToAdd = Math.max(1, months) * 30;
    const now = new Date();
    const expiresDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const expiresAtIso = expiresDate.toISOString();

    if (context.env.DB) {
      const db = context.env.DB;

      // Ensure user record exists for FK integrity
      await db.prepare(
        `INSERT INTO users (id, email, name, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO NOTHING`
      ).bind(userId, `${userId}@subscriber.local`, 'Pro Subscriber').run();

      // Upsert subscription to pro
      await db.prepare(
        `INSERT INTO subscriptions (user_id, tier, status, expires_at, slip_ref, updated_at)
         VALUES (?, 'pro', 'active', ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(user_id) DO UPDATE SET
           tier = 'pro',
           status = 'active',
           expires_at = excluded.expires_at,
           slip_ref = excluded.slip_ref,
           updated_at = CURRENT_TIMESTAMP`
      ).bind(userId, expiresAtIso, slipRef.trim()).run();
    }

    return new Response(JSON.stringify({
      success: true,
      tier: 'pro',
      status: 'active',
      expiresAt: expiresAtIso,
      slipRef: slipRef.trim(),
      message: 'ยินดีต้อนรับสู่ Pro Tier! ปลดล็อกการออกบิลไม่จำกัดและทุกฟีเจอร์เรียบร้อยแล้ว'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
