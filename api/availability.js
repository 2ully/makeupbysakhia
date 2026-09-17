import { TIME_SLOTS, MAX_PER_DAY, getActiveBookingsForDate, getBlocksForDate } from './_lib.js';

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
    const [active, blocks] = await Promise.all([
      getActiveBookingsForDate(date),
      getBlocksForDate(date),
    ]);

    // Taken = already booked, plus any individual slots the owner closed.
    const taken = active.map((b) => b.time).concat(blocks.times);
    const openSlots = TIME_SLOTS.filter((s) => taken.indexOf(s) === -1).length;
    // The day is unavailable if the owner closed it, the daily cap is reached,
    // or nothing is left to book.
    const full = blocks.wholeDay || active.length >= MAX_PER_DAY || openSlots === 0;

    // When the day is closed, every slot is effectively unavailable.
    const closed = full ? TIME_SLOTS.slice() : taken;

    return res.status(200).json({
      date,
      full,
      taken: closed,
      remaining: full ? 0 : Math.min(MAX_PER_DAY - active.length, openSlots),
      slots: TIME_SLOTS,
    });
  } catch (err) {
    console.error('Availability error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
