import { NextResponse, type NextRequest } from 'next/server';

// Run on every request (pages, assets, and /api/* alike).
export const config = {
  matcher: '/:path*',
};

// Cookie-based password gate with a small login page.
//
// A cookie is sent automatically on EVERY same-origin request, so the user
// logs in once on a styled page and never sees a prompt again.
//
// Protects ALL URLs — including the public *.vercel.app production domain
// that Vercel's Deployment Protection doesn't cover on the Hobby plan.
//
// Configure in Vercel → Project → Settings → Environment Variables:
//   BASIC_AUTH_PASSWORD   (required)
const COOKIE = 'site_auth';
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

async function tokenFor(password: string): Promise<string> {
  const data = new TextEncoder().encode(`v1:${password}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function loginPage({ error }: { error?: string } = {}): string {
  return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Private</title>
<style>
  *{box-sizing:border-box} body{margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;
  background:#08080c;color:#f5f5f7;font-family:Inter,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif}
  .card{width:100%;max-width:360px;padding:32px;border:1px solid #1f1f2b;border-radius:16px;background:#0e0e14}
  h1{margin:0 0 8px;font-size:20px} p{margin:0 0 20px;color:#a1a1aa;font-size:14px;line-height:1.5}
  input{width:100%;padding:11px 14px;border:1px solid #2a2a38;border-radius:10px;background:#16161f;color:#f5f5f7;font-size:15px}
  input:focus{outline:none;border-color:#6366f1}
  button{width:100%;margin-top:12px;padding:11px;border:0;border-radius:999px;background:#6366f1;color:#fff;font-weight:600;font-size:15px;cursor:pointer}
  button:hover{background:#818cf8} .err{margin:0 0 14px;color:#f87171;font-size:13px}
</style></head><body>
<form class="card" method="POST" action="/__auth">
  <h1>🔒 Private</h1>
  <p>This site is private. Enter the password to continue.</p>
  ${error ? `<p class="err">${error}</p>` : ''}
  <input type="password" name="password" placeholder="Password" autofocus autocomplete="current-password" />
  <button type="submit">Enter</button>
</form></body></html>`;
}

export default async function middleware(request: NextRequest) {
  const password = process.env.BASIC_AUTH_PASSWORD;

  // Fail closed: if no password is set, lock everyone out.
  if (!password) {
    return new Response('This site is private and not yet configured.', { status: 503 });
  }

  const token = await tokenFor(password);
  const url = new URL(request.url);

  // Handle the login form submission.
  if (request.method === 'POST' && url.pathname === '/__auth') {
    const form = await request.formData();
    if (form.get('password') === password) {
      return new Response(null, {
        status: 303,
        headers: {
          Location: '/',
          'Set-Cookie': `${COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`,
        },
      });
    }
    return new Response(loginPage({ error: 'Wrong password. Try again.' }), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  // Already authenticated → let the request through.
  const cookie = request.cookies.get(COOKIE)?.value;
  if (cookie === token) {
    return NextResponse.next();
  }

  // Not authenticated. Login page for page views; plain 401 for assets/API.
  const accept = request.headers.get('accept') || '';
  if (request.method === 'GET' && accept.includes('text/html')) {
    return new Response(loginPage(), {
      status: 401,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
  return new Response('Unauthorized', { status: 401 });
}
