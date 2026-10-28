import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';

const root = resolve('docs');
const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript' };
createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (path === '/poker' || path.startsWith('/poker/')) path = path.slice(6) || '/';
    const file = resolve(root, '.' + (path === '/' ? '/index.html' : path));
    if (!file.startsWith(root + sep)) throw new Error('Invalid path');
    const content = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] || 'application/octet-stream' });
    res.end(content);
  } catch {
    res.writeHead(404); res.end('Not found');
  }
}).listen(4173, '127.0.0.1', () => console.log('Serving http://127.0.0.1:4173'));
