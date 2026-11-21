import { list, del } from '@vercel/blob';

export default async function handler(req, res) {
  const expected = process.env.CRON_SECRET;
  if (!expected || req.headers.authorization !== `Bearer ${expected}`) return res.status(401).end('Unauthorized');
  try {
    const result = await list({ prefix: 'moments-bridge/' });
    const cutoff = Date.now() - 15 * 60 * 1000;
    const expired = result.blobs.filter(blob => new Date(blob.uploadedAt).getTime() < cutoff).map(blob => blob.pathname);
    if (expired.length) await del(expired);
    return res.status(200).json({ deleted: expired.length });
  } catch (error) {
    console.error('Bridge cleanup failed:', error?.message || error);
    return res.status(500).json({ error: 'Cleanup failed' });
  }
}
