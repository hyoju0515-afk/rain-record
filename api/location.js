import { get, put } from '@vercel/blob';

const DEFAULT_LOCATION = {
  name: '광주 북구 중흥동',
  latitude: 35.1678,
  longitude: 126.9145
};

export default async function handler(req, res) {
  if (req.method === 'GET') {
    try {
      const item = await get('rain-alert/location.json', { access: 'private' });
      if (!item) return res.status(200).json(DEFAULT_LOCATION);
      return res.status(200).json(JSON.parse(await new Response(item.stream).text()));
    } catch (error) {
      console.error(error);
      return res.status(200).json(DEFAULT_LOCATION);
    }
  }
  if (req.method !== 'POST') return res.status(405).end();
  const { name, latitude, longitude } = req.body || {};
  if (typeof name !== 'string' || !name.trim() || name.length > 100 ||
      !Number.isFinite(latitude) || latitude < -90 || latitude > 90 ||
      !Number.isFinite(longitude) || longitude < -180 || longitude > 180) {
    return res.status(400).json({ error: 'Invalid location' });
  }
  try {
    const location = { name: name.trim(), latitude, longitude };
    await put('rain-alert/location.json', JSON.stringify(location), {
      access: 'private', addRandomSuffix: false, allowOverwrite: true,
      contentType: 'application/json'
    });
    return res.status(200).json({ ok: true, location });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Location save failed' });
  }
}
