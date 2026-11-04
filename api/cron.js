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
      forecast_days: '2', timezone: 'Asia/Seoul'
    });
    const weatherRes = await fetch(url);
    if (!weatherRes.ok) throw new Error('Weather API failed');
    const weather = await weatherRes.json();

    const today = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit'
    }).format(new Date());
    const todayIndexes = weather.hourly.time
      .map((time, index) => time.startsWith(today) ? index : -1)
      .filter(index => index >= 0);

    const hourly = todayIndexes.map(index => ({
      probability: weather.hourly.precipitation_probability[index],
      precipitation: weather.hourly.precipitation[index]
    }));
    const maxProbability = hourly.reduce((max, hour) =>
      hour.probability == null ? max : Math.max(max, hour.probability), 0);
    const totalPrecipitation = hourly.reduce((sum, hour) =>
      sum + (Number(hour.precipitation) || 0), 0);
    const shouldAlert = hourly.some(hour =>
      (hour.probability != null && hour.probability >= 40) ||
      (Number(hour.precipitation) >= 0.1)
    );

    if (!todayIndexes.length) throw new Error('No hourly forecast data for today');
    if (!shouldAlert) {
      return res.status(200).json({
        sent: 0, rainExpected: false, maxProbability, totalPrecipitation, location: location.name
      });
    }

    webpush.setVapidDetails('mailto:rain-alert@example.com', process.env.VAPID_PUBLIC_KEY, process.env.VAPID_PRIVATE_KEY);
    const subscriptions = await getSubscriptions();
    const payload = JSON.stringify({
      title: '☔ 오늘 비 예보',
      body: `${location.name}, 오늘 중 비가 예상돼요. 강수확률 최고 ${maxProbability}%, 예상 강수량 ${totalPrecipitation.toFixed(1)}mm예요. 우산을 챙기세요.`
    });
    let sent = 0;
    for (const sub of subscriptions) {
      try { await webpush.sendNotification(sub, payload); sent++; }
      catch (e) { if (e.statusCode !== 404 && e.statusCode !== 410) console.error(e); }
    }
    return res.status(200).json({
      sent, rainExpected: true, maxProbability, totalPrecipitation, location: location.name
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Cron failed' });
  }
}
