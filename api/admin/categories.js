import {
  getSupabase,
  requireAdmin,
  readJsonBody,
  getCategories,
  storeImage,
  deleteStoredImage,
} from '../_lib.js';

// /api/admin/categories — the cards under "Explore by Category", which double
// as the gallery filter buttons.
//   GET    list them, with how many photos each holds
//   POST   { title_en, title_ar? }                 add a card
//   PATCH  { id, title_en?, title_ar?, move?, dataUrl? | clearCover? }
//   DELETE { id }                                  remove a card
export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    const supabase = getSupabase();

    if (req.method === 'GET') return list(res, supabase);
    if (req.method === 'POST') return create(req, res, supabase);
    if (req.method === 'PATCH') return edit(req, res, supabase);
    if (req.method === 'DELETE') return remove(req, res, supabase);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin categories error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

// Turn a title into a short key: "Bridal Looks" → "bridal-looks".
function makeKey(title) {
  const base = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
  // Arabic-only titles leave nothing behind, so fall back to a random key.
  return base || 'cat-' + Math.random().toString(36).slice(2, 8);
}

async function list(res, supabase) {
  const categories = await getCategories();
  const { data: images, error } = await supabase.from('gallery').select('category');
  if (error) throw error;

  const withCounts = categories.map((c) => ({
    ...c,
    image_count: (images || []).filter((img) => img.category === c.key).length,
  }));
  return res.status(200).json({ categories: withCounts });
}

async function create(req, res, supabase) {
  const { title_en, title_ar } = await readJsonBody(req);
  if (!title_en) return res.status(400).json({ error: 'An English title is required' });

  const existing = await getCategories();
  let key = makeKey(title_en);
  if (existing.some((c) => c.key === key)) key += '-' + Math.random().toString(36).slice(2, 5);

  const { data, error } = await supabase.from('categories').insert({
    key,
    title_en: String(title_en).slice(0, 80),
    title_ar: title_ar ? String(title_ar).slice(0, 80) : null,
    sort_order: existing.length ? existing[existing.length - 1].sort_order + 1 : 1,
  }).select().maybeSingle();
  if (error) throw error;

  return res.status(200).json({ success: true, category: data });
}

async function edit(req, res, supabase) {
  const { id, title_en, title_ar, move, dataUrl, clearCover } = await readJsonBody(req);
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const categories = await getCategories();
  const index = categories.findIndex((c) => c.id === id);
  if (index === -1) return res.status(404).json({ error: 'Category not found' });

  // Reorder: swap with the neighbouring card.
  if (move === 'up' || move === 'down') {
    const swapWith = move === 'up' ? index - 1 : index + 1;
    if (swapWith < 0 || swapWith >= categories.length) {
      return res.status(200).json({ success: true });
    }
    const a = categories[index];
    const b = categories[swapWith];
    const first = await supabase.from('categories').update({ sort_order: b.sort_order }).eq('id', a.id);
    if (first.error) throw first.error;
    const second = await supabase.from('categories').update({ sort_order: a.sort_order }).eq('id', b.id);
    if (second.error) throw second.error;
    return res.status(200).json({ success: true });
  }

  const patch = {};

  // New card photo — the previous file is removed so uploads don't pile up.
  if (dataUrl) {
    const stored = await storeImage(dataUrl);
    if (stored.error) return res.status(stored.status).json({ error: stored.error });
    patch.cover_url = stored.url;
    patch.cover_path = stored.path;
  } else if (clearCover) {
    patch.cover_url = null;
    patch.cover_path = null;
  }

  if (title_en) patch.title_en = String(title_en).slice(0, 80);
  if (title_ar !== undefined) patch.title_ar = title_ar ? String(title_ar).slice(0, 80) : null;
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to update' });

  const { data: previous } = await supabase
    .from('categories').select('cover_path').eq('id', id).maybeSingle();

  const { data, error } = await supabase
    .from('categories').update(patch).eq('id', id).select().maybeSingle();
  if (error) throw error;

  if ((dataUrl || clearCover) && previous && previous.cover_path) {
    await deleteStoredImage(previous.cover_path);
  }
  return res.status(200).json({ success: true, category: data });
}

async function remove(req, res, supabase) {
  const { id } = await readJsonBody(req);
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const { data: category, error: findError } = await supabase
    .from('categories').select('*').eq('id', id).maybeSingle();
  if (findError) throw findError;
  if (!category) return res.status(404).json({ error: 'Category not found' });

  // Refuse while photos still point at it, rather than quietly hiding them.
  const { count, error: countError } = await supabase
    .from('gallery')
    .select('id', { count: 'exact', head: true })
    .eq('category', category.key);
  if (countError) throw countError;
  if (count) {
    return res.status(409).json({
      error: `That card still holds ${count} photo${count === 1 ? '' : 's'}. Move or delete them first.`,
    });
  }

  await deleteStoredImage(category.cover_path);

  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
  return res.status(200).json({ success: true });
}
