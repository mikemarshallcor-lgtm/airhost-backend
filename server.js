const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hrhmkosrukuvjwiznssr.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhyaG1rb3NydWt1dmp3aXpuc3NyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk5MjAyNTAsImV4cCI6MjA5NTQ5NjI1MH0.aw6lp1EauCeOWki9GuN85-8WxjRvoYo6IIU7ZijrbVg';

// ── Fetch properties from Supabase ────────────────────────────────────────────
async function getProperties() {
  const res = await fetchUrl(
    `${SUPABASE_URL}/rest/v1/properties?active=eq.true&order=ota.asc,name.asc`,
    { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  );
  return JSON.parse(res).map(p => ({
    id: p.id, name: p.name, ota: p.ota, icalUrl: p.ical_url
  }));
}

// ── HTTP fetch utility ────────────────────────────────────────────────────────
function fetchUrl(url, extraHeaders = {}) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      headers: { 'User-Agent': 'AIRHOST/1.0', ...extraHeaders }
    };
    const req = client.get(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        fetchUrl(res.headers.location, extraHeaders).then(resolve).catch(reject);
        return;
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// ── iCal parser ───────────────────────────────────────────────────────────────
function parseDate(d) {
  d = d.replace(/.*:/, '').trim();
  if (d.length === 8) {
    return new Date(Date.UTC(parseInt(d.slice(0,4)), parseInt(d.slice(4,6))-1, parseInt(d.slice(6,8))));
  }
  return new Date(d.replace(/T(\d{2})(\d{2})(\d{2})Z?$/, 'T$1:$2:$3Z'));
}

function parseIcal(icsText, prop) {
  const events = [];
  const blocks = icsText.split('BEGIN:VEVENT');
  blocks.slice(1).forEach(block => {
    const get = (key) => {
      const match = block.match(new RegExp(key + '[^:\\r\\n]*:([^\\r\\n]+(?:\\r?\\n[ \\t][^\\r\\n]+)*)'));
      return match ? match[1].replace(/\r?\n[ \t]/g, '').trim() : '';
    };
    const dtstart = get('DTSTART'), dtend = get('DTEND');
    const summary = get('SUMMARY') || '', uid = get('UID'), status = get('STATUS');
    if (!dtstart || !dtend) return;
    if (status === 'CANCELLED') return;
    const checkin = parseDate(dtstart), checkout = parseDate(dtend);
    if (isNaN(checkin.getTime()) || isNaN(checkout.getTime())) return;
    const nights = Math.round((checkout - checkin) / (1000 * 60 * 60 * 24));
    if (nights < 1) return;
    const sum = summary.toLowerCase();
    if (prop.ota === 'airbnb') {
      const isBlock = sum === 'not available' || sum === 'airbnb (not available)' ||
        sum === 'blocked' || sum === 'unavailable' ||
        (sum.includes('not available') && !sum.includes('@'));
      if (isBlock) return;
    }
    let guest = prop.ota === 'booking' ? 'Huésped Booking' :
      summary.replace(/^(reservation|reserva)\s*[-–:]/i, '').trim();
    if (!guest || guest.length < 2 || sum.includes('airbnb') || sum.includes('hmac')) guest = 'Huésped Airbnb';
    events.push({
      id: uid || `${prop.id}_${dtstart}`,
      propId: prop.id, propName: prop.name, ota: prop.ota,
      guest, checkin: checkin.toISOString().slice(0,10), checkout: checkout.toISOString().slice(0,10), nights,
    });
  });
  return events;
}

// ── Cache ─────────────────────────────────────────────────────────────────────
let cache = { data: null, props: null, ts: 0 };
const CACHE_TTL = 5 * 60 * 1000;

async function getAllReservations() {
  if (cache.data && Date.now() - cache.ts < CACHE_TTL) return cache;
  const properties = await getProperties();
  const all = [];
  for (const prop of properties) {
    try {
      const ics = await fetchUrl(prop.icalUrl);
      const events = parseIcal(ics, prop);
      console.log(`${prop.name} (${prop.ota}): ${events.length} reservas`);
      all.push(...events);
    } catch (e) {
      console.error(`Error fetching ${prop.name}:`, e.message);
    }
  }
  cache = { data: all, props: properties, ts: Date.now() };
  return cache;
}

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/reservations', async (req, res) => {
  try {
    const { data: reservations, props: properties } = await getAllReservations();
    res.json({ ok: true, reservations, properties: properties.map(p => ({ id: p.id, name: p.name, ota: p.ota })) });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/status', async (req, res) => {
  try {
    const properties = await getProperties();
    const results = [];
    for (const prop of properties) {
      const start = Date.now();
      try {
        const ics = await fetchUrl(prop.icalUrl);
        const events = parseIcal(ics, prop);
        results.push({ id: prop.id, name: prop.name, ota: prop.ota, ok: true, events: events.length, ms: Date.now() - start });
      } catch (e) {
        results.push({ id: prop.id, name: prop.name, ota: prop.ota, ok: false, events: 0, error: e.message, ms: Date.now() - start });
      }
    }
    res.json({ ok: true, checked: results.length, results });
  } catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/debug/:propId', async (req, res) => {
  try {
    const properties = await getProperties();
    const prop = properties.find(p => p.id === req.params.propId);
    if (!prop) return res.status(404).json({ error: 'Not found' });
    const ics = await fetchUrl(prop.icalUrl);
    res.type('text/plain').send(ics.slice(0, 5000));
  } catch(e) { res.status(500).json({ error: e.message }); }
});

// Invalidate cache when properties change
app.post('/invalidate', (req, res) => {
  cache = { data: null, props: null, ts: 0 };
  res.json({ ok: true });
});

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`AIRHOST backend running on port ${PORT}`));
