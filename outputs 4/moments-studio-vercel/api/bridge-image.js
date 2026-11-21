import { createHmac, timingSafeEqual } from 'node:crypto';
import { Readable } from 'node:stream';
import { get, del } from '@vercel/blob';

const PREFIX = 'moments-bridge/';

function verify(token, secret) {
  const [encoded, supplied, extra] = String(token || '').split('.');
  if (!encoded || !supplied || extra) return null;
  const expected = createHmac('sha256', secret).update(encoded).digest();
  let actual;
  try { actual = Buffer.from(supplied, 'base64url'); } catch { return null; }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
    if (typeof payload.pathname !== 'string' || !payload.pathname.startsWith(PREFIX)) return null;
    if (!Number.isFinite(payload.expiresAt) || payload.expiresAt < Date.now()) return null;
    return payload;
  } catch { return null; }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).end('GET required');

  const secret = process.env.BRIDGE_SECRET;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  const payload = verify(req.query.token, secret || '');
  if (!payload || !blobToken) return res.status(404).end('Share link expired or invalid');

  try {
    const found = await get(payload.pathname, { access: 'private', token: blobToken });
    if (!found || found.statusCode !== 200 || !found.stream) return res.status(404).end('Image already used or expired');
    const chunks = [];
    for await (const chunk of Readable.fromWeb(found.stream)) chunks.push(Buffer.from(chunk));
    const image = Buffer.concat(chunks);
    // Delete after the single bridge fetch so the image is not left in storage.
    await del(payload.pathname, { token: blobToken });
    res.setHeader('Content-Type', 'image/jpeg');
    res.setHeader('Content-Length', String(image.length));
    return res.status(200).end(image);
  } catch (error) {
    console.error('Bridge image retrieval failed:', error?.message || error);
    return res.status(500).end('Could not retrieve the image');
  }
}
