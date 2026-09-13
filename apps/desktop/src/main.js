import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LocalDataStore } from '../../../packages/storage/src/index.js';
import { coreRecipes, defaultActionRegistry, WorkflowEngine, Capabilities } from '../../../packages/core/src/index.js';
import { AIWorkflowCompiler } from '../../../ai/src/index.js';
import { EntitlementManager, EntitlementTier, LicenseVerifier } from '../../../packages/entitlements/src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function parseJsonBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

export class OperonDesktopApp {
  constructor(options = {}) {
    this.port = options.port !== undefined ? options.port : 49210;
    this.store = new LocalDataStore({
      storagePath: options.storagePath || options.dbPath || path.join(process.cwd(), '.operon', 'operon_desktop.json')
    });
    this.compiler = new AIWorkflowCompiler();
    this.engine = new WorkflowEngine({
      platform: process.platform === 'win32' ? 'windows' : (process.platform === 'darwin' ? 'macos' : 'linux'),
      grantedCapabilities: Object.values(Capabilities)
    });
    this.entitlements = new EntitlementManager({ store: this.store });
    this.server = null;
  }

  async start() {
    console.log('[OPERON Desktop] Initializing local database and storage...');
    await this.store.init();
    await this.entitlements.init();

    // Seed core recipes (ensuring all 30 are available)
    const existing = await this.store.getWorkflows();
    const existingIds = new Set(existing.map(w => w.id));
    for (const r of coreRecipes) {
      if (!existingIds.has(r.id)) {
        await this.store.saveWorkflow(r);
      }
    }

    // Start local zero-latency HUD server
    this.server = http.createServer(async (req, res) => {
      const url = new URL(req.url, `http://localhost:${this.port}`);
      
      // CORS headers for local host
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // API: List workflows
      if (url.pathname === '/api/workflows' && req.method === 'GET') {
        const workflows = await this.store.getWorkflows();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ workflows }));
        return;
      }

      // API: Save / update workflow
      if (url.pathname === '/api/workflows' && req.method === 'POST') {
        try {
          const body = await parseJsonBody(req);
          if (!body.id || typeof body.id !== 'string' || !/^[a-zA-Z0-9_-]{1,64}$/.test(body.id)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Valid alphanumeric workflow id required (max 64 chars, no path traversal)' }));
            return;
          }
          if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0 || body.name.length > 128) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Valid workflow name required (1-128 chars)' }));
            return;
          }
          if (body.steps && !Array.isArray(body.steps)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Workflow steps must be an array' }));
            return;
          }
          await this.store.saveWorkflow(body);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, workflow: body }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      // API: Delete workflow
      if (url.pathname === '/api/workflows' && req.method === 'DELETE') {
        try {
          const id = url.searchParams.get('id');
          if (!id || !/^[a-zA-Z0-9_-]{1,64}$/.test(id)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Valid alphanumeric workflow id required' }));
            return;
          }
          await this.store.deleteWorkflow(id);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, deletedId: id }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      // API: Execution history
      if (url.pathname === '/api/history' && req.method === 'GET') {
        const limit = Number(url.searchParams.get('limit')) || 50;
        const history = await this.store.getExecutionHistory(limit);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ history }));
        return;
      }

      // API: Record execution history
      if (url.pathname === '/api/history' && req.method === 'POST') {
        try {
          const body = await parseJsonBody(req);
          await this.store.logExecution(body);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      // API: Settings
      if (url.pathname === '/api/settings' && req.method === 'GET') {
        const settings = await this.store.getSettings();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ settings }));
        return;
      }

      if (url.pathname === '/api/settings' && req.method === 'POST') {
        try {
          const body = await parseJsonBody(req);
          await this.store.updateSettings(body);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      // API: Entitlements status
      if (url.pathname === '/api/entitlements' && req.method === 'GET') {
        const status = this.entitlements.getStatus();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(status));
        return;
      }

      // API: Start 14-day zero-card Pro trial
      if (url.pathname === '/api/trial/start' && req.method === 'POST') {
        try {
          const body = await parseJsonBody(req);
          const days = body.days || 14;
          const result = await this.entitlements.startTrial(days);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      // API: Activate offline cryptographic license key
      if (url.pathname === '/api/license/activate' && req.method === 'POST') {
        try {
          const body = await parseJsonBody(req);
          if (!body.licenseKey || typeof body.licenseKey !== 'string') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Valid licenseKey string required' }));
            return;
          }
          const result = await this.entitlements.activateLicense(body.licenseKey.trim());
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify(result));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      // API: Simulate sandbox purchase (issues and activates valid cryptographic license)
      if (url.pathname === '/api/license/simulate-purchase' && req.method === 'POST') {
        try {
          const body = await parseJsonBody(req);
          const tier = body.tier || EntitlementTier.PRO_LIFETIME;
          const email = body.email || 'sandbox.tester@operon.local';
          const key = LicenseVerifier.issueLicense({
            tier,
            customerEmail: email
          });
          const result = await this.entitlements.activateLicense(key);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            ...result,
            issuedKey: key
          }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      // API: List all registered actions with schemas
      if (url.pathname === '/api/actions' && req.method === 'GET') {
        const actions = defaultActionRegistry.list().map(a => ({
          id: a.id,
          name: a.name,
          description: a.description,
          category: a.category,
          requiredCapabilities: a.requiredCapabilities,
          supportedPlatforms: a.supportedPlatforms,
          schema: a.schema
        }));
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ actions }));
        return;
      }

      // API: Execute workflow live
      if (url.pathname === '/api/execute' && req.method === 'POST') {
        try {
          const body = await parseJsonBody(req);
          let { workflow, workflowId, input = {}, options = {} } = body;
          if (!workflow && workflowId) {
            const allWfs = await this.store.getWorkflows();
            workflow = allWfs.find(w => w.id === workflowId) || coreRecipes.find(r => r.id === workflowId);
          }
          if (!workflow || !workflow.steps) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Valid workflow with steps required' }));
            return;
          }
          const executionResult = await this.engine.execute(workflow, input, options);
          const finalOutput = executionResult.stepResults && executionResult.stepResults.length > 0
            ? executionResult.stepResults[executionResult.stepResults.length - 1].output
            : {};

          // Auto log to history
          await this.store.logExecution({
            workflowId: workflow.id,
            workflowName: workflow.name,
            status: executionResult.status,
            durationMs: executionResult.durationMs,
            stepCount: (workflow.steps || []).length,
            error: executionResult.error || null,
            timestamp: new Date().toISOString()
          });
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            result: executionResult,
            status: executionResult.status,
            output: finalOutput
          }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      // API: Compile Natural Language Intent to Workflow
      if (url.pathname === '/api/compile-ai' && req.method === 'POST') {
        try {
          const body = await parseJsonBody(req);
          const prompt = body.prompt || '';
          const compiled = await this.compiler.compile(prompt);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ compiled }));
        } catch (err) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: err.message }));
        }
        return;
      }

      // Static file serving for HUD & Studio
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
        const addr = this.server.address();
        if (addr && typeof addr === 'object' && addr.port) {
          this.port = addr.port;
        }
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
if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const app = new OperonDesktopApp({ port: process.env.PORT ? Number(process.env.PORT) : 49215 });
  app.start().catch(err => {
    console.error('[OPERON Desktop] Fatal start error:', err);
    process.exit(1);
  });
}

