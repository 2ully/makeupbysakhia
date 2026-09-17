import { getSupabase, requireAdmin, readJsonBody, TIME_SLOTS } from '../_lib.js';

// /api/admin/blocks — days and slots the owner has closed.
//   GET    list blocks from today onwards
//   POST   { date, time?, reason? }   close a whole day (no time) or one slot
//   DELETE { id }                     reopen it
export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    const supabase = getSupabase();

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('blocked_slots')
        .select('*')
        .gte('date', new Date().toISOString().slice(0, 10))
        .order('date', { ascending: true });
      if (error) throw error;
      return res.status(200).json({ blocks: data || [] });
    }

    if (req.method === 'POST') {
      const { date, time, reason } = await readJsonBody(req);
      if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return res.status(400).json({ error: 'Invalid date' });
      }
      if (time && TIME_SLOTS.indexOf(time) === -1) {
        return res.status(400).json({ error: 'Invalid time slot' });
      }

      const { data, error } = await supabase
        .from('blocked_slots')
        .insert({ date, time: time || null, reason: reason ? String(reason).slice(0, 200) : null })
        .select()
        .maybeSingle();

      if (error) {
        if (error.code === '23505') {
          return res.status(409).json({ error: 'That day or slot is already blocked.' });
        }
        throw error;
      }
      return res.status(200).json({ success: true, block: data });
    }

    if (req.method === 'DELETE') {
      const { id } = await readJsonBody(req);
      if (!id) return res.status(400).json({ error: 'Missing id' });
      const { error } = await supabase.from('blocked_slots').delete().eq('id', id);
      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin blocks error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
