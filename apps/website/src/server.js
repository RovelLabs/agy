/**
 * Local development server for Cloudflare Worker website preview
 */
import http from 'node:http';
import worker from './index.js';

const PORT = 49220;

const server = http.createServer(async (req, res) => {
  const url = `http://localhost:${PORT}${req.url}`;
  const request = new Request(url, {
    method: req.method,
    headers: req.headers
  });

  const response = await worker.fetch(request, {}, {});

  res.statusCode = response.status;
  for (const [key, value] of response.headers.entries()) {
    res.setHeader(key, value);
  }

  const body = await response.text();
  res.end(body);
});

server.listen(PORT, () => {
  console.log(`[OPERON Website] Preview running at http://localhost:${PORT}`);
});
