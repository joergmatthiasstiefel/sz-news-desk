const https = require('https');
const http = require('http');

exports.handler = async function(event) {
  const url = event.queryStringParameters && event.queryStringParameters.url;
  if (!url) return { statusCode: 400, body: 'Missing url parameter' };

  const allowed = [
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

  let parsedUrl;
  try { parsedUrl = new URL(url); } catch(e) { return { statusCode: 400, body: 'Invalid URL' }; }
  if (!allowed.includes(parsedUrl.hostname)) {
    return { statusCode: 403, body: 'Domain not allowed: ' + parsedUrl.hostname };
  }

  return new Promise((resolve) => {
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
    const req = lib.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers: {
            'Content-Type': res.headers['content-type'] || 'text/plain',
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=60',
          },
          body: data,
        });
      });
    });
    req.on('error', (e) => resolve({ statusCode: 500, body: 'Fetch error: ' + e.message }));
    req.on('timeout', () => { req.destroy(); resolve({ statusCode: 504, body: 'Timeout' }); });
  });
};
