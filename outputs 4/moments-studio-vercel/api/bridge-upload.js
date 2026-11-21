import { createHmac, randomUUID } from 'node:crypto';
import { put, list, del } from '@vercel/blob';

const MAX_BYTES = 4 * 1024 * 1024;
const TOKEN_TTL_SECONDS = 5 * 60;
const PREFIX = 'moments-bridge/';

function sign(payload, secret) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
  const allowedOrigin = process.env.SITE_ORIGIN;
  if (!allowedOrigin || req.headers.origin !== allowedOrigin) return res.status(403).json({ error: 'This site is not allowed to create bridge shares' });
  const secret = process.env.BRIDGE_SECRET;
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
  if (!secret || !blobToken) return res.status(503).json({ error: 'Bridge storage is not configured' });

  try {
    const imageBase64 = req.body?.imageBase64;
    if (typeof imageBase64 !== 'string' || imageBase64.length > Math.ceil(MAX_BYTES * 4 / 3) + 16) {
      return res.status(413).json({ error: 'Image is missing or too large' });
    }
    const image = Buffer.from(imageBase64, 'base64');
    if (!image.length || image.length > MAX_BYTES || image[0] !== 0xff || image[1] !== 0xd8) {
      return res.status(400).json({ error: 'A JPEG image under 4 MB is required' });
    }

    // Opportunistically remove expired, abandoned images whenever a new share begins.
    const old = await list({ prefix: PREFIX, token: blobToken });
    const cutoff = Date.now() - 60 * 60 * 1000;
    const expired = old.blobs.filter(item => new Date(item.uploadedAt).getTime() < cutoff).map(item => item.pathname);
    if (expired.length) await del(expired, { token: blobToken });

    const pathname = `${PREFIX}${randomUUID()}.jpg`;
    const uploaded = await put(pathname, image, {
      access: 'private',
      contentType: 'image/jpeg',
      addRandomSuffix: true,
      token: blobToken,
    });
    const token = sign({ pathname: uploaded.pathname, expiresAt: Date.now() + TOKEN_TTL_SECONDS * 1000 }, secret);
    return res.status(200).json({ token, expiresIn: TOKEN_TTL_SECONDS });
  } catch (error) {
    console.error('Bridge upload failed:', error?.message || error);
    return res.status(500).json({ error: 'Could not prepare the image for Instagram' });
  }
}
