import { TIME_SLOTS, MAX_PER_DAY, getActiveBookingsForDate } from './_lib.js';

// GET /api/availability?date=YYYY-MM-DD
// Returns which time slots are taken and whether the day is full, so the
// booking form can grey out unavailable times.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const date = req.query.date;
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid or missing date' });
  }

  try {
    const active = await getActiveBookingsForDate(date);
    const taken = active.map((b) => b.time);
    const full = active.length >= MAX_PER_DAY;

    // If the day's cap is reached, every remaining slot is effectively closed.
    const closed = full ? TIME_SLOTS.slice() : taken;

    return res.status(200).json({
      date,
      full,
      taken: closed,
      remaining: Math.max(0, MAX_PER_DAY - active.length),
      slots: TIME_SLOTS,
    });
  } catch (err) {
    console.error('Availability error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
