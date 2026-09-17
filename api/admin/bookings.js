import { randomUUID } from 'crypto';
import { getSupabase, requireAdmin, readJsonBody } from '../_lib.js';

// /api/admin/bookings — the owner's booking list.
//   GET    ?scope=upcoming|pending|all   list bookings
//   POST   { fname, lname, date, time, ... }   add a booking taken by hand
//   PATCH  { id, status }                      confirm / decline
//   DELETE { id }                              remove a booking for good
export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    const supabase = getSupabase();

    if (req.method === 'GET') return list(req, res, supabase);
    if (req.method === 'POST') return create(req, res, supabase);
    if (req.method === 'PATCH') return update(req, res, supabase);
    if (req.method === 'DELETE') return remove(req, res, supabase);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin bookings error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function list(req, res, supabase) {
  const scope = req.query.scope || 'upcoming';

  let query = supabase.from('bookings').select('*');
  if (scope === 'upcoming') {
    query = query.gte('date', today()).in('status', ['pending', 'confirmed'])
      .order('date', { ascending: true }).order('time', { ascending: true });
  } else if (scope === 'pending') {
    query = query.eq('status', 'pending')
      .order('date', { ascending: true }).order('time', { ascending: true });
  } else {
    query = query.order('date', { ascending: false }).order('time', { ascending: true });
  }

  const { data, error } = await query.limit(300);
  if (error) throw error;

  // A small summary for the dashboard header.
  const bookings = data || [];
  const stats = {
    pending: bookings.filter((b) => b.status === 'pending').length,
    upcoming: bookings.filter((b) => b.date >= today() && b.status === 'confirmed').length,
    total: bookings.length,
  };
  return res.status(200).json({ bookings, stats });
}

async function create(req, res, supabase) {
  const body = await readJsonBody(req);
  const { fname, lname, email, phone, service, message, date, time } = body;

  if (!fname || !date || !time) {
    return res.status(400).json({ error: 'Name, date and time are required' });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return res.status(400).json({ error: 'Invalid date' });
  }

  // Bookings added by hand are already agreed with the customer, so they go
  // straight to confirmed. Any time string is allowed here, not just the six
  // slots on the public form.
  const { data, error } = await supabase.from('bookings').insert({
    fname: String(fname).slice(0, 100),
    lname: String(lname || '').slice(0, 100),
    email: String(email || '').slice(0, 200),
    phone: String(phone || '').slice(0, 50),
    service: service ? String(service).slice(0, 200) : null,
    message: message ? String(message).slice(0, 2000) : null,
    date,
    time: String(time).slice(0, 30),
    status: 'confirmed',
    token: randomUUID() + randomUUID().replace(/-/g, ''),
    lang: 'en',
    source: 'manual',
  }).select().maybeSingle();

  if (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'That date and time is already booked.' });
    }
    throw error;
  }
  return res.status(200).json({ success: true, booking: data });
}

async function update(req, res, supabase) {
  const { id, status } = await readJsonBody(req);
  if (!id || ['pending', 'confirmed', 'declined'].indexOf(status) === -1) {
    return res.status(400).json({ error: 'Invalid id or status' });
  }

  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', id)
    .select()
    .maybeSingle();

  if (error) {
    // Re-confirming a slot someone else has taken in the meantime.
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Another booking already holds that slot.' });
    }
    throw error;
  }
  if (!data) return res.status(404).json({ error: 'Booking not found' });
  return res.status(200).json({ success: true, booking: data });
}

async function remove(req, res, supabase) {
  const { id } = await readJsonBody(req);
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const { error } = await supabase.from('bookings').delete().eq('id', id);
  if (error) throw error;
  return res.status(200).json({ success: true });
}
