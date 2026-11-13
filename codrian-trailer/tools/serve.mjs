// Servidor estático mínimo (sem dependências) para prévia e render.
import http from 'node:http'; import { readFile, stat } from 'node:fs/promises'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.svg': 'image/svg+xml', '.png': 'image/png' };
export function serve(port = 0) {
  return new Promise((res) => {
    const srv = http.createServer(async (req, rsp) => {
      try { let p = decodeURIComponent(new URL(req.url, 'http://x').pathname); if (p === '/') p = '/index.html'; const f = path.join(root, p); if (!f.startsWith(root)) throw 0; const s = await stat(f); if (s.isDirectory()) throw 0;
        rsp.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); rsp.end(await readFile(f)); } catch { rsp.writeHead(404); rsp.end('404'); }
    }).listen(port, () => res({ srv, port: srv.address().port }));
  });
}
if (process.argv[1] === fileURLToPath(import.meta.url)) { const { port } = await serve(Number(process.env.PORT) || 5173); console.log(`Prévia: http://localhost:${port}/`); }
