import { getGallery, getCategories } from './_lib.js';

// GET /api/gallery
// Public content for the home page: the gallery images in display order, and
// the categories behind the "Explore by Category" cards and filter buttons.
// All of it is managed from /admin.
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const [images, categories] = await Promise.all([getGallery(), getCategories()]);
    // Cached only briefly, so edits show up on the site within a minute.
    res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ images, categories });
  } catch (err) {
    console.error('Gallery error:', err);
    return res.status(500).json({ error: 'Server error' });
  }
}
