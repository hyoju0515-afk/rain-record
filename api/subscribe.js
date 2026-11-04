import { put, list, get } from '@vercel/blob';

async function readSubscriptions() {
  const { blobs } = await list({ prefix: 'rain-alert/subscriptions.json' });
  if (!blobs.length) return [];
  const item = await get('rain-alert/subscriptions.json', { access: 'private' });
  if (!item) return [];
  return JSON.parse(await new Response(item.stream).text());
}

export default async function handler(req, res) {
  if (req.method === 'GET') return res.status(200).json({ publicKey: process.env.VAPID_PUBLIC_KEY });
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const subscription = req.body;
    if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
      return res.status(400).json({ error: 'Invalid subscription' });
    }
    const items = await readSubscriptions();
    const next = [...items.filter(x => x.endpoint !== subscription.endpoint), subscription];
    await put('rain-alert/subscriptions.json', JSON.stringify(next), {
      access: 'private', addRandomSuffix: false, allowOverwrite: true,
      contentType: 'application/json'
    });
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Subscription save failed' });
  }
}
