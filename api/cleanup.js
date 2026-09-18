import { expireStaleHolds, PENDING_HOLD_HOURS } from './_lib.js';

// GET /api/cleanup — run once a day by the Vercel cron in vercel.json.
//
// Two jobs in one request:
//  1. Release bookings that were submitted but never followed through on
//     WhatsApp, so their slots don't stay held forever.
//  2. Touch the database, which stops Supabase pausing the free project after a
//     quiet week.
//
// Safe to call by hand at any time — it only ever affects holds already past
// their deadline.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const released = await expireStaleHolds();
    if (released) console.log(`Released ${released} stale hold(s)`);
    return res.status(200).json({ ok: true, released, holdHours: PENDING_HOLD_HOURS });
  } catch (err) {
    console.error('Cleanup error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
