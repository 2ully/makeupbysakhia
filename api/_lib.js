// Shared helpers for the booking API. Files prefixed with "_" are NOT exposed
// as routes by Vercel, so this is import-only.

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
