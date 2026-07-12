const express = require('express');
const https = require('https');
const http = require('http');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

const ALLOWED_HOSTS = [
  // Seriöse Nachrichtenquellen
  'rss.sueddeutsche.de',
  'www.faz.net',
  'www.handelsblatt.com',
  'www.welt.de',
  'www.zeit.de',
  'www.n-tv.de',
  'www.spiegel.de',
  'rp-online.de',
  // Wissenschaft & Technik
  'www.spektrum.de',
  't3n.de',
  'www.netzwelt.de',
  'winfuture.de',
  // KI-News
  'www.heise.de',
  'www.golem.de',
  // Klatsch & Tratsch
  'www.promiflash.de',
  'www.gala.de',
  'www.vogue.de',
  'www.stern.de',
  'www.rtl.de',
  'www.bunte.de',
  'www.ok-magazin.de',
  'www.intouch-magazin.de',
  'www.vip.de',
  // Medien & Digitales
  'www.wuv.de',
  'www.horizont.net',
  'www.dwdl.de',
  'www.meedia.de',
  'www.kress.de',
  // Wetter
  'api.open-meteo.com',
];

app.get('/.netlify/functions/proxy', (req, res) => {
  const url = req.query.url;
  if (!url) return res.status(400).send('Missing url parameter');

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    return res.status(400).send('Invalid URL');
  }
  if (!ALLOWED_HOSTS.includes(parsedUrl.hostname)) {
    return res.status(403).send('Domain not allowed: ' + parsedUrl.hostname);
  }

  const lib = parsedUrl.protocol === 'https:' ? https : http;
  const options = {
    hostname: parsedUrl.hostname,
    path: parsedUrl.pathname + parsedUrl.search,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; Dashboard/1.0)',
      'Accept': '*/*',
    },
    timeout: 8000,
  };

  const upstreamReq = lib.get(options, (upstreamRes) => {
    res.set('Content-Type', upstreamRes.headers['content-type'] || 'text/plain');
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Cache-Control', 'public, max-age=60');
    upstreamRes.pipe(res);
  });
  upstreamReq.on('error', (e) => res.status(500).send('Fetch error: ' + e.message));
  upstreamReq.on('timeout', () => {
    upstreamReq.destroy();
    res.status(504).send('Timeout');
  });
});

app.use(express.static(path.join(__dirname), { extensions: ['html'] }));

app.listen(PORT, () => {
  console.log(`News Desk server listening on port ${PORT}`);
});
