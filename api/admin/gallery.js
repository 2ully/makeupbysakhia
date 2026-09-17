import { getSupabase, requireAdmin, readJsonBody, getGallery } from '../_lib.js';

const BUCKET = 'gallery';
const ALLOWED = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_BYTES = 4 * 1024 * 1024; // Vercel caps request bodies at ~4.5MB.

// /api/admin/gallery — the home page images.
//   GET    list every image
//   POST   { dataUrl, category, title }   upload a new image
//   PATCH  { id, category?, title?, move? }  edit or reorder ("up" / "down")
//   DELETE { id }                         remove image + stored file
export default async function handler(req, res) {
  if (!requireAdmin(req, res)) return;

  try {
    const supabase = getSupabase();

    if (req.method === 'GET') {
      return res.status(200).json({ images: await getGallery() });
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

// Create the storage bucket on first use so there is no manual dashboard step.
async function ensureBucket(supabase) {
  const { data } = await supabase.storage.getBucket(BUCKET);
  if (data) return;
  const { error } = await supabase.storage.createBucket(BUCKET, {
    public: true,
    fileSizeLimit: MAX_BYTES,
  });
  // Ignore "already exists" — two uploads at once can race here.
  if (error && !/exist/i.test(error.message || '')) throw error;
}

async function upload(req, res, supabase) {
  const { dataUrl, category, title } = await readJsonBody(req);

  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl || '');
  if (!match) return res.status(400).json({ error: 'Invalid image data' });

  const contentType = match[1];
  const ext = ALLOWED[contentType];
  if (!ext) return res.status(400).json({ error: 'Only JPG, PNG and WebP images are allowed' });

  const bytes = Buffer.from(match[2], 'base64');
  if (bytes.length > MAX_BYTES) {
    return res.status(413).json({ error: 'Image is too large — please pick a smaller one' });
  }

  await ensureBucket(supabase);

  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, cacheControl: '31536000', upsert: false });
  if (uploadError) throw uploadError;

  const { data: publicUrl } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // New images go to the end of the strip.
  const { data: last } = await supabase
    .from('gallery')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase.from('gallery').insert({
    url: publicUrl.publicUrl,
    path,
    category: category === 'editorial' ? 'editorial' : 'glam',
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
  if (category) patch.category = category === 'editorial' ? 'editorial' : 'glam';
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

  // Only uploaded images have a storage path; the seeded ones ship with the site.
  if (image.path) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([image.path]);
    if (storageError) console.error('Could not delete stored file:', storageError);
  }

  const { error } = await supabase.from('gallery').delete().eq('id', id);
  if (error) throw error;
  return res.status(200).json({ success: true });
}
