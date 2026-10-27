// Cloudflare Pages Function: /api/auth/google
// Handles Google Identity Services JWT verification and D1 User registration

interface Env {
  DB?: D1Database;
}

interface GoogleJwtPayload {
  sub: string;
  email: string;
  name?: string;
  picture?: string;
  exp: number;
}

function parseJwt(token: string): GoogleJwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const body: { credential?: string } = await context.request.json();
    if (!body.credential) {
      return new Response(JSON.stringify({ error: 'Missing credential token' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const payload = parseJwt(body.credential);
    if (!payload || !payload.sub || !payload.email) {
      return new Response(JSON.stringify({ error: 'Invalid Google token' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return new Response(JSON.stringify({ error: 'Google token expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const user = {
      id: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split('@')[0],
      picture: payload.picture || ''
    };

    let subscription = {
      tier: 'free',
      status: 'active',
      expiresAt: null as string | null
    };

    // If Cloudflare D1 binding is active, upsert user and load subscription
    if (context.env.DB) {
      const db = context.env.DB;
      
      // Upsert User
      await db.prepare(
        `INSERT INTO users (id, email, name, picture, updated_at) 
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(id) DO UPDATE SET 
           email=excluded.email, 
           name=excluded.name, 
           picture=excluded.picture,
           updated_at=CURRENT_TIMESTAMP`
      ).bind(user.id, user.email, user.name, user.picture).run();

      // Check or create subscription
      const subRow: any = await db.prepare(
        `SELECT tier, status, expires_at FROM subscriptions WHERE user_id = ?`
      ).bind(user.id).first();

      if (subRow) {
        subscription.tier = subRow.tier || 'free';
        subscription.status = subRow.status || 'active';
        subscription.expiresAt = subRow.expires_at || null;
      } else {
        await db.prepare(
          `INSERT INTO subscriptions (user_id, tier, status) VALUES (?, 'free', 'active')`
        ).bind(user.id).run();
      }
    }

    return new Response(JSON.stringify({
      success: true,
      user,
      subscription,
      token: body.credential
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `session_user=${encodeURIComponent(JSON.stringify(user))}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
      }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message || 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};
