'use strict';
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const crypto = require('node:crypto');

const secret = process.env.READER_PASSWORD || '';
if (secret.length < 12) {
  console.error('READER_PASSWORD must be set to a private password of at least 12 characters.');
  process.exit(1);
}
const USERNAME = 'reader';
const expectedHash = crypto.createHash('sha256').update(secret).digest();
const root = __dirname;
const port = Number(process.env.PORT) || 3000;
const permitted = /^(?:\/|\/index\.html|\/styles\.css|\/reader\.js|\/chapters\/catalog\.js|\/chapters\/chapter-\d{3}\.js)$/;
const contentTypes = {'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8'};

function authenticated(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Basic ')) return false;
  let decoded;
  try { decoded = Buffer.from(header.slice(6), 'base64').toString('utf8'); } catch { return false; }
  const colon = decoded.indexOf(':');
  if (colon < 0 || decoded.slice(0, colon) !== USERNAME) return false;
  const actualHash = crypto.createHash('sha256').update(decoded.slice(colon + 1)).digest();
  return crypto.timingSafeEqual(actualHash, expectedHash);
}

http.createServer(async (req, res) => {
  res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('X-Frame-Options','DENY');
  res.setHeader('Referrer-Policy','no-referrer');
  res.setHeader('Cache-Control','private, no-store, max-age=0');
  res.setHeader('Content-Security-Policy',"default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self'; connect-src 'self'; img-src 'self' data:; font-src 'self'; base-uri 'none'; frame-ancestors 'none'");

  // Render health checks reveal no book text and do not require credentials.
  if (req.url === '/healthz') {
    res.writeHead(200, {'Content-Type':'text/plain; charset=utf-8'});
    return res.end('ok');
  }
  if (!authenticated(req)) {
    res.writeHead(401, {'Content-Type':'text/plain; charset=utf-8','WWW-Authenticate':'Basic realm="English Novel Reader", charset="UTF-8"'});
    return res.end('This is a private reader. Sign in with username reader and your password.');
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, {'Allow':'GET, HEAD'});
    return res.end();
  }

  let uri;
  try { uri = decodeURIComponent(new URL(req.url, 'http://localhost').pathname); }
  catch { res.writeHead(400); return res.end('Bad request'); }

  if (!permitted.test(uri)) { res.writeHead(404); return res.end('Not found'); }
  const file = path.join(root, uri === '/' ? 'index.html' : uri.slice(1));
  try {
    const body = await fs.readFile(file);
    res.writeHead(200, {'Content-Type':contentTypes[path.extname(file)] || 'application/octet-stream'});
    return res.end(req.method === 'HEAD' ? undefined : body);
  } catch (error) {
    if (error.code !== 'ENOENT') console.error('File read error:', error.code);
    res.writeHead(404);
    return res.end('Not found');
  }
}).listen(port, '0.0.0.0', () => console.log('Private novel reader listening on port ' + port));
