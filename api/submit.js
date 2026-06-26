import { randomUUID } from 'crypto';
import {
  TIME_SLOTS,
  MAX_PER_DAY,
  getSupabase,
  getMailer,
  getActiveBookingsForDate,
  escapeHtml,
  baseUrlFromRequest,
} from './_lib.js';

// POST /api/submit
// Validates a booking request, reserves the slot (status = pending), and emails
// the manager a notification with Confirm / Decline buttons.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { fname, lname, email, phone, service, date, time, message, lang } = req.body || {};
  const language = lang === 'ar' ? 'ar' : 'en';

  // Validation
  if (!fname || !lname || !email || !phone || !date || !time) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ error: 'Invalid email address' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date' });
  }
  if (!TIME_SLOTS.includes(time)) {
    return res.status(400).json({ error: 'Invalid time slot' });
  }
  // Reject bookings for dates in the past (compare as plain YYYY-MM-DD strings).
  const today = new Date().toISOString().slice(0, 10);
  if (date < today) {
    return res.status(400).json({ error: 'That date has already passed' });
  }

  try {
    const supabase = getSupabase();

    // Server-side availability re-check (never trust the browser).
    const active = await getActiveBookingsForDate(date);
    if (active.length >= MAX_PER_DAY) {
      return res.status(409).json({ error: 'full', message: 'That day is fully booked.' });
    }
    if (active.some((b) => b.time === time)) {
      return res.status(409).json({ error: 'slot_taken', message: 'That time was just booked. Please pick another.' });
    }

    const token = randomUUID() + randomUUID().replace(/-/g, '');

    const { error: insertError } = await supabase.from('bookings').insert({
      fname: String(fname).slice(0, 100),
      lname: String(lname).slice(0, 100),
      email: String(email).slice(0, 200),
      phone: String(phone).slice(0, 50),
      service: service ? String(service).slice(0, 200) : null,
      message: message ? String(message).slice(0, 2000) : null,
      date,
      time,
      status: 'pending',
      token,
      lang: language,
    });

    if (insertError) {
      // 23505 = unique violation → the slot was taken between our check and insert.
      if (insertError.code === '23505') {
        return res.status(409).json({ error: 'slot_taken', message: 'That time was just booked. Please pick another.' });
      }
      console.error('Insert error:', insertError);
      return res.status(500).json({ error: 'Could not save booking' });
    }

    // Notify the manager with Confirm / Decline buttons.
    await sendManagerEmail(req, { fname, lname, email, phone, service, date, time, message, token });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

async function sendManagerEmail(req, b) {
  const base = baseUrlFromRequest(req);
  const confirmUrl = `${base}/api/confirm?token=${encodeURIComponent(b.token)}&action=confirm`;
  const declineUrl = `${base}/api/confirm?token=${encodeURIComponent(b.token)}&action=decline`;
  const manager = process.env.MANAGER_EMAIL || process.env.GMAIL_USER;

  const row = (label, value) => `
    <tr>
      <td style="padding:10px 0;color:#9e7e6e;font-size:13px;width:140px;vertical-align:top;">${label}</td>
      <td style="padding:10px 0;color:#3a2820;font-size:14px;">${escapeHtml(value) || 'Not specified'}</td>
    </tr>`;

  const html = `
    <div style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:32px;background:#fdf8f5;border:1px solid #e8ddd5;">
      <h2 style="color:#5c3d2e;font-size:24px;margin-bottom:4px;">✦ New Booking Request</h2>
      <p style="color:#9e7e6e;font-size:13px;margin-top:0;">Makeup by Sakhia — pending your confirmation</p>
      <hr style="border:none;border-top:1px solid #e8ddd5;margin:24px 0;" />
      <table style="width:100%;border-collapse:collapse;">
        ${row('👤 Full Name', `${b.fname} ${b.lname}`)}
        ${row('📧 Email', b.email)}
        ${row('📱 Phone', b.phone)}
        ${row('💄 Service', b.service)}
        ${row('📅 Date', b.date)}
        ${row('🕐 Time', b.time)}
        ${row('💬 Vision', b.message)}
      </table>
      <hr style="border:none;border-top:1px solid #e8ddd5;margin:24px 0;" />
      <p style="color:#3a2820;font-size:14px;margin-bottom:16px;">Confirm this booking to automatically email the customer:</p>
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:12px;">
          <a href="${confirmUrl}" style="display:inline-block;background:#5c3d2e;color:#fff;text-decoration:none;padding:12px 28px;border-radius:4px;font-size:14px;">✓ Confirm</a>
        </td>
        <td>
          <a href="${declineUrl}" style="display:inline-block;background:#fff;color:#9e7e6e;text-decoration:none;padding:12px 28px;border-radius:4px;font-size:14px;border:1px solid #e8ddd5;">✕ Decline</a>
        </td>
      </tr></table>
      <p style="color:#b3a49a;font-size:12px;margin-top:24px;">Declining frees the slot so another client can book it.</p>
    </div>`;

  await getMailer().sendMail({
    from: `Makeup by Sakhia <${process.env.GMAIL_USER}>`,
    to: manager,
    replyTo: b.email,
    subject: `New Booking Request — ${b.fname} ${b.lname} · ${b.date} ${b.time}`,
    html,
  });
}
