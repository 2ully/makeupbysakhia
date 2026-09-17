import { checkPassword, setSessionCookie, clearSessionCookie, isAdmin, readJsonBody } from '../_lib.js';

// Slow down guessing. Vercel may run several instances, so this is a speed
// bump rather than a wall — the password itself is the real protection.
const attempts = new Map(); // ip -> { count, first }
const WINDOW_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 10;

function tooManyAttempts(ip) {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || now - entry.first > WINDOW_MS) {
    attempts.set(ip, { count: 1, first: now });
    return false;
  }
  entry.count += 1;
  return entry.count > MAX_ATTEMPTS;
}

// GET    /api/admin/login → { authenticated: bool }  (is the cookie still good?)
// POST   /api/admin/login → sign in with { password }
// DELETE /api/admin/login → sign out
export default async function handler(req, res) {
  if (req.method === 'GET') {
    return res.status(200).json({ authenticated: isAdmin(req) });
  }

  if (req.method === 'DELETE') {
    clearSessionCookie(res);
    return res.status(200).json({ success: true });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({ error: 'Dashboard not set up yet — add ADMIN_PASSWORD in Vercel.' });
  }

  const ip = req.headers['x-forwarded-for'] || 'unknown';
  if (tooManyAttempts(String(ip).split(',')[0].trim())) {
    return res.status(429).json({ error: 'Too many attempts. Try again in 10 minutes.' });
  }

  try {
    const { password } = await readJsonBody(req);
    if (!checkPassword(password)) {
      return res.status(401).json({ error: 'Wrong password' });
    }
    setSessionCookie(res);
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Admin login error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
