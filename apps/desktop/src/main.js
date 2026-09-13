/**
 * OPERON Desktop Application Host Runtime
 */
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LocalDataStore } from '../../../packages/storage/src/index.js';
import { coreRecipes } from '../../../packages/core/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class OperonDesktopApp {
  constructor(options = {}) {
    this.port = options.port || 49210;
    this.store = new LocalDataStore({
      storagePath: path.join(process.cwd(), '.operon', 'operon_desktop.json')
    });
    this.server = null;
  }

  async start() {
    console.log('[OPERON Desktop] Initializing local database and storage...');
    await this.store.init();

    // Seed core recipes
    const existing = await this.store.getWorkflows();
    if (existing.length === 0) {
      console.log('[OPERON Desktop] Seeding 15 curated core recipes...');
      for (const r of coreRecipes) {
        await this.store.saveWorkflow(r);
      }
    }

    // Start local zero-latency HUD server
    this.server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${this.port}`);
      
      // API Routes
      if (url.pathname === '/api/workflows') {
        const workflows = await this.store.getWorkflows();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ workflows }));
        return;
      }

      if (url.pathname === '/api/settings') {
        const settings = await this.store.getSettings();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ settings }));
        return;
      }

      // Static file serving for HUD
      let filePath = path.join(__dirname, 'hud', url.pathname === '/' ? 'index.html' : url.pathname.slice(1));
      
      // Handle imports targeting packages
      if (url.pathname.startsWith('/packages/') || url.pathname.startsWith('/ai/')) {
        filePath = path.join(process.cwd(), url.pathname.slice(1));
      }

      try {
        const content = await fs.readFile(filePath);
        let mime = 'text/plain';
        if (filePath.endsWith('.html')) mime = 'text/html';
        else if (filePath.endsWith('.js')) mime = 'application/javascript';
        else if (filePath.endsWith('.css')) mime = 'text/css';
        else if (filePath.endsWith('.svg')) mime = 'image/svg+xml';
        else if (filePath.endsWith('.json')) mime = 'application/json';

        res.writeHead(200, { 'Content-Type': mime });
        res.end(content);
      } catch {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File Not Found');
      }
    });

    return new Promise((resolve) => {
      this.server.listen(this.port, () => {
        console.log(`[OPERON Desktop] Quick Command HUD available at: http://localhost:${this.port}`);
        resolve(`http://localhost:${this.port}`);
      });
    });
  }

  async stop() {
    if (this.server) {
      await new Promise(r => this.server.close(r));
    }
    await this.store.close();
    console.log('[OPERON Desktop] Application stopped.');
  }
}

// Standalone execution
if (process.argv[1] === __filename) {
  const app = new OperonDesktopApp();
  app.start().catch(err => {
    console.error('[OPERON Desktop] Fatal start error:', err);
    process.exit(1);
  });
}
