import { randomUUID } from 'crypto';
import {
  TIME_SLOTS,
  MAX_PER_DAY,
  getSupabase,
  getActiveBookingsForDate,
  getBlocksForDate,
  omanToday,
  pastSlotsForDate,
  expireStaleHolds,
} from './_lib.js';

// POST /api/submit
// Validates a booking request and reserves the slot (status = pending). The
// customer sends the details to us on WhatsApp, and the owner confirms or
// declines in /admin.
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
  // Reject past dates, and times that have already gone by today — both judged
  // in Oman time, not the server's UTC.
  if (date < omanToday()) {
    return res.status(400).json({ error: 'That date has already passed' });
  }
  if (pastSlotsForDate(date).indexOf(time) !== -1) {
    return res.status(409).json({ error: 'slot_taken', message: 'That time has already passed today.' });
  }

  try {
    const supabase = getSupabase();

    // Server-side availability re-check (never trust the browser).
    const [active, blocks] = await Promise.all([
      getActiveBookingsForDate(date),
      getBlocksForDate(date),
    ]);
    if (blocks.wholeDay) {
      return res.status(409).json({ error: 'full', message: 'That day is not available.' });
    }
    if (blocks.times.indexOf(time) !== -1) {
      return res.status(409).json({ error: 'slot_taken', message: 'That time is not available. Please pick another.' });
    }
    if (active.length >= MAX_PER_DAY) {
      return res.status(409).json({ error: 'full', message: 'That day is fully booked.' });
    }
    if (active.some((b) => b.time === time)) {
      return res.status(409).json({ error: 'slot_taken', message: 'That time was just booked. Please pick another.' });
    }

    // A random id for the row. It used to sign the confirm/decline email links;
    // the column is still NOT NULL, so one is generated here.
    const token = randomUUID() + randomUUID().replace(/-/g, '');

    const row = {
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
    };

    let { error: insertError } = await supabase.from('bookings').insert(row);

    // 23505 = unique violation → something else already holds this slot. If that
    // something is a hold that has timed out, release it and try once more.
    if (insertError && insertError.code === '23505') {
      const released = await expireStaleHolds(date, time);
      if (released) {
        ({ error: insertError } = await supabase.from('bookings').insert(row));
      }
    }

    if (insertError) {
      if (insertError.code === '23505') {
        return res.status(409).json({ error: 'slot_taken', message: 'That time was just booked. Please pick another.' });
      }
      console.error('Insert error:', insertError);
      return res.status(500).json({ error: 'Could not save booking' });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
