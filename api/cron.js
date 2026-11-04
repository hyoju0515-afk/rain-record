import { list, get } from '@vercel/blob';
import webpush from 'web-push';

const DEFAULT_LOCATION = {
  name: '광주 북구 중흥동',
  latitude: 35.1678,
  longitude: 126.9145
};

async function getLocation() {
  try {
    const item = await get('rain-alert/location.json', { access: 'private' });
    return item ? { ...DEFAULT_LOCATION, ...JSON.parse(await new Response(item.stream).text()) } : DEFAULT_LOCATION;
  } catch (error) {
    console.error('Location lookup failed; using default location', error);
    return DEFAULT_LOCATION;
  }
}

async function getSubscriptions() {
  const { blobs } = await list({ prefix: 'rain-alert/subscriptions.json' });
  if (!blobs.length) return [];
  const item = await get('rain-alert/subscriptions.json', { access: 'private' });
  return item ? JSON.parse(await new Response(item.stream).text()) : [];
}

export default async function handler(req, res) {
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send('Unauthorized');
  }
  try {
    const location = await getLocation();
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({
      latitude: String(location.latitude), longitude: String(location.longitude),
      hourly: 'precipitation_probability,precipitation',
      forecast_days: '1', timezone: 'Asia/Seoul'
    });
    const weatherRes = await fetch(url);
    if (!weatherRes.ok) throw new Error('Weather API failed');
    const weather = await weatherRes.json();
    const idx = weather.hourly.time.findIndex(t => t.endsWith('T08:00'));
    const probability = idx >= 0 ? weather.hourly.precipitation_probability[idx] : null;
    const mm = idx >= 0 ? weather.hourly.precipitation[idx] : null;
    const shouldAlert = probability !== null && (probability >= 40 || mm >= 0.1);
    if (!shouldAlert) return res.status(200).json({ sent: 0, rainExpected: false, probability, location: location.name });
    webpush.setVapidDetails('mailto:rain-alert@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
    const subscriptions = await getSubscriptions();
    const payload = JSON.stringify({
      title: '☔ 오늘 오전 비 예보',
      body: `${location.name}, 오전 8시 비 올 가능성 ${probability}%예요. 외출 전 우산을 챙기세요.`
    });
    let sent = 0;
    for (const sub of subscriptions) {
      try { await webpush.sendNotification(sub, payload); sent++; }
      catch (e) { if (e.statusCode !== 404 && e.statusCode !== 410) console.error(e); }
    }
    return res.status(200).json({ sent, rainExpected: true, probability, location: location.name });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Cron failed' });
  }
}
