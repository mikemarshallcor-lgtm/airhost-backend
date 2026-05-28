const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

const PROPERTIES = [
  {
    id: 'prop_1',
    name: 'Propiedad 1',
    ota: 'airbnb',
    icalUrl: 'https://www.airbnb.cl/calendar/ical/1444475412341586605.ics?t=7e79df6e2b024154a115b06e33a8f155'
  },
  {
    id: 'prop_2',
    name: 'Propiedad 2',
    ota: 'airbnb',
    icalUrl: 'https://www.airbnb.cl/calendar/ical/1470672598371056407.ics?t=f3bbe070f3d947af80e74ad2eaf04c84'
  },
];

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseIcal(icsText, prop) {
  const events = [];
  const blocks = icsText.split('BEGIN:VEVENT');
  blocks.slice(1).forEach(block => {
    const get = (key) => {
      const match = block.match(new RegExp(key + '[^:]*:([^\\r\\n]+)'));
      return match ? match[1].trim() : '';
    };
    const dtstart = get('DTSTART');
    const dtend = get('DTEND');
    const summary = get('SUMMARY');
    const uid = get('UID');
    if (!dtstart || !dtend) return;
    const sum = summary.toLowerCase();
    if (sum.includes('not available') || (sum.includes('airbnb') && !sum.includes('reserved') && !sum.includes('reservation'))) return;
    const parseDate = (d) => {
      if (d.length === 8) return new Date(parseInt(d.slice(0,4)), parseInt(d.slice(4,6))-1, parseInt(d.slice(6,8)));
      return new Date(d.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));
    };
    const checkin = parseDate(dtstart);
    const checkout = parseDate(dtend);
    const nights = Math.round((checkout - checkin) / (1000*60*60*24));
    if (nights < 1) return;
    let guest = summary;
    if (!guest || guest.length < 2) guest = 'Huésped';
    events.push({
      id: uid || `${prop.id}_${dtstart}`,
      propId: prop.id,
      propName: prop.name,
      ota: prop.ota,
      guest,
      checkin: checkin.toISOString().slice(0,10),
      checkout: checkout.toISOString().slice(0,10),
      nights,
    });
  });
  return events;
}

let cache = { data: null, ts: 0 };
const CACHE_TTL = 5 * 60 * 1000;

async function getAllReservations() {
  if (cache.data && Date.now() - cache.ts < CACHE_TTL) return cache.data;
  const all = [];
  for (const prop of PROPERTIES) {
    try {
      const ics = await fetchUrl(prop.icalUrl);
      const events = parseIcal(ics, prop);
      all.push(...events);
    } catch (e) {
      console.error(`Error fetching ${prop.name}:`, e.message);
    }
  }
  cache = { data: all, ts: Date.now() };
  return all;
}

app.get('/reservations', async (req, res) => {
  try {
    const reservations = await getAllReservations();
    res.json({ ok: true, reservations, properties: PROPERTIES.map(p => ({id:p.id,name:p.name,ota:p.ota})) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`AIRHOST backend running on port ${PORT}`));
