const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');

const app = express();
app.use(cors());
app.use(express.json());

// ─── PROPIEDADES AIRHOST.CL ──────────────────────────────────────────────────
const PROPERTIES = [
  { id: 'p01', name: 'Roberto del Río',     ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1660927266209635218.ics?t=81f8d1e504e745dabeb5ad7da52d2953' },
  { id: 'p02', name: 'Wood 115',            ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1603676872799033000.ics?t=ca3ff6da5cbc46e39be3816eca258774' },
  { id: 'p03', name: 'Wood 407',            ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1579966565797271620.ics?t=f94937ca7def445d92c03224886d8afd' },
  { id: 'p04', name: 'San Nicolás',         ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1395237881767021180.ics?t=68e56ccaf2304ccfa91ea28e7707ca04' },
  { id: 'p05', name: 'Wood 605',            ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1551568857429436751.ics?t=132f1d20db5f45f39ec4734d6980de38' },
  { id: 'p06', name: 'Wood 612',            ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1556918719052205568.ics?t=2c16790822ac4d1a800cd5d484bc8e99' },
  { id: 'p07', name: 'Rodrigo de Araya 208',ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1676975188638307540.ics?t=8230891a20c9495aa316e4cc8a9a9324' },
  { id: 'p08', name: 'Suecia 84',           ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1444475412341586605.ics?t=7e79df6e2b024154a115b06e33a8f155' },
  { id: 'p09', name: 'Manuel Montt',        ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1444390933874579412.ics?t=868a8d700e334e59a76840117670b5ee' },
  { id: 'p10', name: 'Toesca 210',          ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1584854189095603273.ics?t=599637a0b8564920abaaf3e24414978c' },
  { id: 'p11', name: 'Román Díaz 503',      ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1567621412491263472.ics?t=599f8176a8a54083b47281b9bcd28b1e' },
  { id: 'p12', name: 'Wood 604',            ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1608048699648552722.ics?t=f42d5d3348ee43fcbb19b9af5e0bb494' },
  { id: 'p13', name: 'Domeyko 709',         ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1601841227199043734.ics?t=c94bc6e3bf1e4406b8b14424f37d8cd9' },
  { id: 'p14', name: 'Toesca 301',          ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1618157734613492564.ics?t=1b201829068548e197b77549a87d49d3' },
  { id: 'p15', name: 'Wood 611',            ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1671347359335600906.ics?t=5f35313c4de242028a4b26f6004659ab' },
  { id: 'p16', name: 'Toesca 905 (2)',      ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1689656011043659207.ics?t=a58ecc5a53844f11b6cf2990fb8bf8fb' },
  { id: 'p17', name: 'Wood 617',            ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1671334041563600485.ics?t=02c8cb9760234132aab8e7f5ac810996' },
  { id: 'p18', name: 'Wood 606',            ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1499364384918693470.ics?t=363c9853c55048ab8774411dc5613325' },
  { id: 'p19', name: 'Toesca 502',          ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1621078116267866476.ics?t=94cf75aa93124e9db2fdd4e4c0734632' },
  { id: 'p20', name: 'Coquimbo 1509',       ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1675771733696707714.ics?t=867c3344474a4a6bbfd7bb0219d54fec' },
  { id: 'p21', name: 'Wood 603',            ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1593416270404357446.ics?t=c99c47a8e4004335b2586ca0ec576564' },
  { id: 'p22', name: 'Tocornal 515',        ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1668920172453073232.ics?t=d1ed46063cf44d7b8700d8fef6ac70f8' },
  { id: 'p23', name: 'Tocornal 804',        ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1675042038393493038.ics?t=da319f66a7874ed880628d459aa77c15' },
  { id: 'p24', name: 'Depto La Marina',     ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/863226848158421849.ics?t=6693a29cc34a4160a8ebeab13d77d686' },
  { id: 'p25', name: 'Macul Siria',         ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1615250091153848056.ics?t=48e4fd5cd91048369e92e8b06792ffcf' },
  { id: 'p26', name: 'Huérfanos',           ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1470672598371056407.ics?t=f3bbe070f3d947af80e74ad2eaf04c84' },
  { id: 'p27', name: 'Domeyko 604',         ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1601044096640674561.ics?t=7969f7cb4ff74f638e42b720204d058d' },
  { id: 'p28', name: 'Wood 516',            ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1593606119943992491.ics?t=66fd3d38685544df8437e8116bc97a48' },
  { id: 'p29', name: 'Wood 412',            ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1554490574857494468.ics?t=371fc95554cf4b17b4f407e625befc1b' },
  { id: 'p30', name: 'Toesca 310',          ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1541475228236772039.ics?t=0d07d29e9b524b5d8474701d01d0e7c5' },
  { id: 'p31', name: 'Sta. Elvira 97',      ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1626991587206641280.ics?t=b2a0d4e50fae4c81a3f4f63a03255b46' },
  { id: 'p32', name: 'Toesca 905',          ota: 'airbnb',  icalUrl: 'https://www.airbnb.cl/calendar/ical/1621081348833059647.ics?t=7e53e43ed8334b9f9302d8c6522b98ed' },
  { id: 'p33', name: 'Toesca 905 BK',       ota: 'booking', icalUrl: 'https://ical.booking.com/v1/export?t=62f63d9d-d684-4f9f-93b9-50e015343c7e' },
  { id: 'p34', name: 'Tocornal 804 BK',     ota: 'booking', icalUrl: 'https://ical.booking.com/v1/export?t=7c8e6d46-24fc-4c46-a0e3-b0dbe092726f' },
  { id: 'p35', name: 'Wood 603 BK',         ota: 'booking', icalUrl: 'https://ical.booking.com/v1/export?t=605c8659-7b50-466b-aec5-b6b79dee6c60' },
  { id: 'p36', name: 'Wood 617 BK',         ota: 'booking', icalUrl: 'https://ical.booking.com/v1/export?t=4cf67ebc-4f87-4300-8dcc-a11a538d183a' },
];
// ────────────────────────────────────────────────────────────────────────────

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
    const dtend   = get('DTEND');
    const summary = get('SUMMARY');
    const uid     = get('UID');
    if (!dtstart || !dtend) return;
    const sum = summary.toLowerCase();
    if (sum.includes('not available') || (sum.includes('airbnb') && !sum.includes('reserved') && !sum.includes('reservation'))) return;
    const parseDate = (d) => {
      if (d.length === 8) return new Date(parseInt(d.slice(0,4)), parseInt(d.slice(4,6))-1, parseInt(d.slice(6,8)));
      return new Date(d.replace(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})/, '$1-$2-$3T$4:$5:$6'));
    };
    const checkin  = parseDate(dtstart);
    const checkout = parseDate(dtend);
    const nights   = Math.round((checkout - checkin) / (1000*60*60*24));
    if (nights < 1) return;
    let guest = summary;
    if (!guest || guest.length < 2) guest = 'Huésped';
    events.push({
      id: uid || `${prop.id}_${dtstart}`,
      propId: prop.id,
      propName: prop.name,
      ota: prop.ota,
      guest,
      checkin:  checkin.toISOString().slice(0,10),
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
      const ics    = await fetchUrl(prop.icalUrl);
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
    res.json({ ok: true, reservations, properties: PROPERTIES.map(p => ({ id: p.id, name: p.name, ota: p.ota })) });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`AIRHOST backend running on port ${PORT}`));
