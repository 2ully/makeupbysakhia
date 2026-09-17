// Shared helpers for the booking API. Files prefixed with "_" are NOT exposed
// as routes by Vercel, so this is import-only.

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';

// The bookable time slots shown on the form. Keep in sync with index.html.
export const TIME_SLOTS = [
  '1:00 PM',
  '2:00 PM',
  '3:00 PM',
  '4:00 PM',
  '5:00 PM',
  '6:00 PM',
];

// Maximum number of sessions (active bookings) allowed per day.
export const MAX_PER_DAY = 4;

// Business contact details used in customer emails.
export const WHATSAPP_URL = 'https://wa.me/96890653614';
export const WHATSAPP_DISPLAY = '+968 90653614';
export const SITE_URL = 'https://makeupbysakhia.vercel.app';

// Supabase client using the service-role key — server-side only, never shipped
// to the browser. Created lazily so a missing env var fails loudly per-request.
let _supabase;
export function getSupabase() {
  if (!_supabase) {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    _supabase = createClient(url, key, {
      auth: { persistSession: false },
    });
  }
  return _supabase;
}

// Gmail SMTP transport via Nodemailer. Uses a Google "App Password".
let _transport;
export function getMailer() {
  if (!_transport) {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) {
      throw new Error('Missing GMAIL_USER or GMAIL_APP_PASSWORD');
    }
    _transport = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });
  }
  return _transport;
}

// Escape user-supplied text before putting it inside email HTML.
export function escapeHtml(value) {
  return String(value == null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Build an absolute URL back to this deployment from the incoming request,
// so confirm/decline links work on any Vercel domain without an env var.
export function baseUrlFromRequest(req) {
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  return `${proto}://${host}`;
}

// Read the active (pending OR confirmed) bookings for a date.
export async function getActiveBookingsForDate(date) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('bookings')
    .select('time')
    .eq('date', date)
    .in('status', ['pending', 'confirmed']);
  if (error) throw error;
  return data || [];
}

// Days/slots the owner closed from /admin. A row with time = null closes the
// whole day. Returns { wholeDay: bool, times: [] }.
export async function getBlocksForDate(date) {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('blocked_slots')
    .select('time')
    .eq('date', date);
  if (error) throw error;
  const rows = data || [];
  return {
    wholeDay: rows.some((r) => !r.time),
    times: rows.filter((r) => r.time).map((r) => r.time),
  };
}

// The gallery images shown on the home page, in display order.
export async function getGallery() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('gallery')
    .select('id, url, category, title, sort_order')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ── Admin authentication ──
// One shared password (ADMIN_PASSWORD). After signing in, the browser holds a
// signed cookie instead of the password itself. The signing key is derived from
// the password, so changing the password signs everyone out.

const SESSION_COOKIE = 'admin_session';
const SESSION_DAYS = 30;

function signingKey() {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('Missing ADMIN_PASSWORD');
  return crypto.createHash('sha256').update('makeupbysakhia:' + password).digest();
}

// Compare two strings without leaking how much of them matched.
function safeEqual(a, b) {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

export function checkPassword(candidate) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) throw new Error('Missing ADMIN_PASSWORD');
  return safeEqual(candidate || '', password);
}

// Token is "<expiry>.<signature of expiry>".
function makeToken() {
  const expires = Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000;
  const sig = crypto.createHmac('sha256', signingKey()).update(String(expires)).digest('hex');
  return `${expires}.${sig}`;
}

function tokenIsValid(token) {
  if (!token || token.indexOf('.') === -1) return false;
  const [expires, sig] = token.split('.');
  if (!/^\d+$/.test(expires) || Number(expires) < Date.now()) return false;
  const expected = crypto.createHmac('sha256', signingKey()).update(expires).digest('hex');
  return safeEqual(sig, expected);
}

function readCookie(req, name) {
  const header = req.headers.cookie || '';
  const match = header.split(';').map((c) => c.trim()).find((c) => c.startsWith(name + '='));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export function setSessionCookie(res) {
  const maxAge = SESSION_DAYS * 24 * 60 * 60;
  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${makeToken()}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`
  );
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`);
}

export function isAdmin(req) {
  try {
    return tokenIsValid(readCookie(req, SESSION_COOKIE));
  } catch (err) {
    return false; // ADMIN_PASSWORD not configured — nobody is an admin.
  }
}

// Guard for the /api/admin routes. Returns false once it has answered the
// request, so handlers can simply `if (!requireAdmin(req, res)) return;`.
export function requireAdmin(req, res) {
  if (isAdmin(req)) return true;
  res.status(401).json({ error: 'unauthorized' });
  return false;
}

// Read a JSON body whether or not the platform already parsed it.
export async function readJsonBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); } catch (err) { return {}; }
  }
  return {};
}
