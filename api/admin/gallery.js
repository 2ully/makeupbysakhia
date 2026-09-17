import {
  getSupabase,
  requireAdmin,
  readJsonBody,
  getGallery,
  getCategories,
  storeImage,
  deleteStoredImage,
} from '../_lib.js';

// /api/admin/gallery — the photos in the home page gallery strip.
//   GET    list every image (plus the categories, for the dropdowns)
//   POST   { dataUrl, category, title }      upload a photo
//   PATCH  { id, category?, title?, move? }  edit or reorder ("up" / "down")
//   DELETE { id }                            remove photo + stored file
export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    const supabase = getSupabase();

    if (req.method === 'GET') {
      const [images, categories] = await Promise.all([getGallery(), getCategories()]);
      return res.status(200).json({ images, categories });
    }
    if (req.method === 'POST') return upload(req, res, supabase);
    if (req.method === 'PATCH') return edit(req, res, supabase);
    if (req.method === 'DELETE') return remove(req, res, supabase);
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('Admin gallery error:', err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}

// Fall back to the first category if the browser sent one we don't know.
async function safeCategory(wanted) {
  const categories = await getCategories();
  if (!categories.length) return null;
  return categories.some((c) => c.key === wanted) ? wanted : categories[0].key;
}

async function upload(req, res, supabase) {
  const { dataUrl, category, title } = await readJsonBody(req);

  const key = await safeCategory(category);
  if (!key) return res.status(400).json({ error: 'Add a category first' });

  const stored = await storeImage(dataUrl);
  if (stored.error) return res.status(stored.status).json({ error: stored.error });

  // New photos go to the end of the strip.
  const { data: last } = await supabase
    .from('gallery')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase.from('gallery').insert({
    url: stored.url,
    path: stored.path,
    category: key,
    title: title ? String(title).slice(0, 120) : null,
    sort_order: (last ? last.sort_order : 0) + 1,
  }).select().maybeSingle();
  if (error) throw error;

  return res.status(200).json({ success: true, image: data });
}

async function edit(req, res, supabase) {
  const { id, category, title, move } = await readJsonBody(req);
  if (!id) return res.status(400).json({ error: 'Missing id' });

  // Reordering: swap places with the neighbour in the current order.
  if (move === 'up' || move === 'down') {
    const images = await getGallery();
    const index = images.findIndex((img) => img.id === id);
    const swapWith = move === 'up' ? index - 1 : index + 1;
    if (index === -1 || swapWith < 0 || swapWith >= images.length) {
      return res.status(200).json({ success: true }); // already at the end
    }
    const a = images[index];
    const b = images[swapWith];
    // Two updates rather than an upsert: an upsert would re-insert the rows and
    // trip over the NOT NULL url column.
    const first = await supabase.from('gallery').update({ sort_order: b.sort_order }).eq('id', a.id);
    if (first.error) throw first.error;
    const second = await supabase.from('gallery').update({ sort_order: a.sort_order }).eq('id', b.id);
    if (second.error) throw second.error;
    return res.status(200).json({ success: true });
  }

  const patch = {};
  if (category) patch.category = await safeCategory(category);
  if (title !== undefined) patch.title = title ? String(title).slice(0, 120) : null;
  if (!Object.keys(patch).length) return res.status(400).json({ error: 'Nothing to update' });

  const { data, error } = await supabase.from('gallery').update(patch).eq('id', id).select().maybeSingle();
  if (error) throw error;
  if (!data) return res.status(404).json({ error: 'Image not found' });
  return res.status(200).json({ success: true, image: data });
}

async function remove(req, res, supabase) {
  const { id } = await readJsonBody(req);
  if (!id) return res.status(400).json({ error: 'Missing id' });

  const { data: image, error: findError } = await supabase
    .from('gallery').select('*').eq('id', id).maybeSingle();
  if (findError) throw findError;
  if (!image) return res.status(404).json({ error: 'Image not found' });

  // Only uploaded photos have a storage path; the seeded ones ship with the site.
  await deleteStoredImage(image.path);

  const { error } = await supabase.from('gallery').delete().eq('id', id);
  if (error) throw error;
  return res.status(200).json({ success: true });
}
