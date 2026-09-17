import { getGallery } from './_lib.js';

// GET /api/gallery
// Public list of the home page gallery images, in display order. The images
// themselves are managed from /admin.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const images = await getGallery();
    // Safe to cache briefly at the edge — the gallery changes rarely.
    // Cached only briefly, so gallery edits show up on the site within a minute.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ images });
  } catch (err) {
    console.error('Gallery error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
