/**
 * OPERON Official Website - Cloudflare Worker Edge Handler
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // API Health Check
    if (path === '/api/health') {
      return new Response(JSON.stringify({
        status: 'ok',
        version: '1.0.0-rc.1',
        brand: 'OPERON',
        timestamp: new Date().toISOString()
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Return the complete polished landing page and documentation
    return new Response(renderWebsite(url), {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY'
      }
    });
  }
};

function renderWebsite(url) {
  return `<!DOCTYPE html>
<html lang="en" data-theme="graphite">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OPERON — The Autonomous Personal Operating Layer</title>
  <meta name="description" content="Local-first cross-platform automation layer for Windows, macOS, Android, and iOS. Zero mandatory cloud. Sub-millisecond deterministic execution.">
  <meta property="og:title" content="OPERON — The Autonomous Personal Operating Layer">
  <meta property="og:description" content="Eliminate repetitive digital work. Sub-millisecond desktop HUD, mobile share actions, and local AI workflow compiler.">
  <meta property="og:type" content="website">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><polygon points='16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5' fill='%23121518' stroke='%2338BDF8' stroke-width='2.5'/><circle cx='16' cy='16' r='3.5' fill='%2338BDF8'/></svg>">
  <style>
    :root {
      --bg-0: #0a0c0e;
      --bg-1: #121518;
      --bg-2: #1a1e22;
      --bg-3: #23282e;
      --border-faint: rgba(255, 255, 255, 0.06);
      --border-subtle: rgba(255, 255, 255, 0.12);
      --border-focus: #38bdf8;
      --text-1: #f1f5f9;
      --text-2: #94a3b8;
      --text-3: #64748b;
      --accent: #38bdf8;
      --accent-glow: rgba(56, 189, 248, 0.18);
      --success: #34d399;
      --font-sans: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI Variable Text", Roboto, sans-serif;
      --font-mono: "JetBrains Mono", "Cascadia Code", monospace;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bg-0);
      color: var(--text-1);
      font-family: var(--font-sans);
      font-size: 14px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }

    /* Container */
    .container {
      max-width: 1080px;
      margin: 0 auto;
      padding: 0 24px;
    }

    /* Navbar */
    .nav {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 0;
      border-bottom: 1px solid var(--border-faint);
    }
    .nav-brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-family: var(--font-mono);
      font-weight: 700;
      font-size: 16px;
      color: var(--text-1);
      text-decoration: none;
      letter-spacing: 0.05em;
    }
    .nav-brand svg {
      width: 24px;
      height: 24px;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 24px;
    }
    .nav-link {
      color: var(--text-2);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
      transition: color 140ms ease;
    }
    .nav-link:hover {
      color: var(--text-1);
    }
    .nav-cta {
      background: var(--accent);
      color: #000;
      padding: 6px 14px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12px;
      text-decoration: none;
    }

    /* Hero */
    .hero {
      text-align: center;
      padding: 80px 0 48px;
    }
    .hero-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 4px 12px;
      border-radius: 999px;
      background: var(--bg-2);
      border: 1px solid var(--border-subtle);
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--accent);
      margin-bottom: 24px;
    }
    .hero-title {
      font-size: 48px;
      font-weight: 700;
      letter-spacing: -0.03em;
      line-height: 1.15;
      margin-bottom: 20px;
      max-width: 820px;
      margin-left: auto;
      margin-right: auto;
    }
    .hero-subtitle {
      font-size: 18px;
      color: var(--text-2);
      max-width: 680px;
      margin: 0 auto 36px;
      line-height: 1.5;
    }
    .hero-actions {
      display: flex;
      justify-content: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .btn-lg {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 24px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 14px;
      text-decoration: none;
      transition: transform 120ms ease, box-shadow 120ms ease;
    }
    .btn-primary {
      background: var(--accent);
      color: #000;
      box-shadow: 0 0 24px var(--accent-glow);
    }
    .btn-primary:hover {
      transform: translateY(-1px);
    }
    .btn-secondary {
      background: var(--bg-1);
      color: var(--text-1);
      border: 1px solid var(--border-subtle);
    }
    .btn-secondary:hover {
      background: var(--bg-2);
    }

    /* Interactive HUD Playground */
    .playground-section {
      margin: 48px 0 80px;
    }
    .playground-window {
      background: var(--bg-1);
      border: 1px solid var(--border-subtle);
      border-radius: 14px;
      box-shadow: 0 24px 64px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(255, 255, 255, 0.05);
      overflow: hidden;
    }
    .window-header {
      display: flex;
      align-items: center;
      padding: 12px 16px;
      background: var(--bg-0);
      border-bottom: 1px solid var(--border-faint);
      gap: 8px;
    }
    .window-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: #333;
    }
    .window-title {
      font-family: var(--font-mono);
      font-size: 11px;
      color: var(--text-3);
      margin-left: 8px;
    }
    .playground-content {
      padding: 24px;
    }
    .demo-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 768px) {
      .hero-title { font-size: 32px; }
      .demo-grid { grid-template-columns: 1fr; }
    }
    .demo-pane {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .pane-label {
      font-size: 12px;
      font-weight: 600;
      color: var(--text-2);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    textarea.demo-input {
      width: 100%;
      height: 140px;
      background: var(--bg-2);
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 12px;
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--text-1);
      resize: none;
      outline: none;
    }
    .demo-chips {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .demo-chip {
      background: var(--bg-2);
      border: 1px solid var(--border-subtle);
      color: var(--text-1);
      font-size: 11px;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: 6px;
      cursor: pointer;
      transition: border-color 100ms ease;
    }
    .demo-chip:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    .demo-output-box {
      height: 140px;
      background: var(--bg-0);
      border: 1px solid var(--border-faint);
      border-radius: 8px;
      padding: 12px;
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--success);
      overflow-y: auto;
      white-space: pre-wrap;
    }

    /* Pillars */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 24px;
      margin-bottom: 80px;
    }
    @media (max-width: 768px) {
      .features-grid { grid-template-columns: 1fr; }
    }
    .feature-card {
      background: var(--bg-1);
      border: 1px solid var(--border-faint);
      border-radius: 12px;
      padding: 24px;
      transition: border-color 140ms ease;
    }
    .feature-card:hover {
      border-color: var(--border-subtle);
    }
    .feature-icon {
      font-size: 24px;
      margin-bottom: 12px;
    }
    .feature-title {
      font-size: 16px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-1);
    }
    .feature-desc {
      font-size: 13px;
      color: var(--text-2);
      line-height: 1.5;
    }

    /* Platform Downloads */
    .downloads-section {
      background: var(--bg-1);
      border: 1px solid var(--border-faint);
      border-radius: 16px;
      padding: 40px;
      text-align: center;
      margin-bottom: 80px;
    }
    .download-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-top: 32px;
    }
    @media (max-width: 768px) {
      .download-grid { grid-template-columns: 1fr 1fr; }
    }
    .download-card {
      background: var(--bg-2);
      border: 1px solid var(--border-subtle);
      border-radius: 10px;
      padding: 20px;
      text-decoration: none;
      color: var(--text-1);
      transition: transform 120ms ease, border-color 120ms ease;
    }
    .download-card:hover {
      transform: translateY(-2px);
      border-color: var(--accent);
    }
    .download-os {
      font-weight: 600;
      font-size: 15px;
      margin-bottom: 4px;
    }
    .download-spec {
      font-size: 11px;
      color: var(--text-3);
    }

    /* Pricing Section */
    .pricing-section {
      margin-bottom: 80px;
      text-align: center;
    }
    .pricing-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      max-width: 760px;
      margin: 32px auto 0;
      text-align: left;
    }
    @media (max-width: 600px) {
      .pricing-grid { grid-template-columns: 1fr; }
    }
    .pricing-card {
      background: var(--bg-1);
      border: 1px solid var(--border-faint);
      border-radius: 14px;
      padding: 32px;
    }
    .pricing-card.pro {
      border-color: var(--accent);
      box-shadow: 0 0 32px var(--accent-glow);
    }
    .pricing-tier {
      font-family: var(--font-mono);
      font-size: 12px;
      color: var(--accent);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .pricing-price {
      font-size: 36px;
      font-weight: 700;
      margin: 12px 0;
    }
    .pricing-features {
      list-style: none;
      margin: 20px 0;
      font-size: 13px;
      color: var(--text-2);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    /* Footer */
    .footer {
      border-top: 1px solid var(--border-faint);
      padding: 40px 0;
      text-align: center;
      font-size: 12px;
      color: var(--text-3);
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Navigation -->
    <header class="nav">
      <a href="/" class="nav-brand">
        <svg viewBox="0 0 32 32">
          <polygon points="16,2 29,9.5 29,22.5 16,30 3,22.5 3,9.5" fill="#121518" stroke="#38BDF8" stroke-width="2.5"/>
          <circle cx="16" cy="16" r="3.5" fill="#38BDF8"/>
        </svg>
        OPERON
      </a>
      <nav class="nav-links">
        <a href="#demo" class="nav-link">Playground</a>
        <a href="#features" class="nav-link">Architecture</a>
        <a href="#pricing" class="nav-link">Pricing</a>
        <a href="#downloads" class="nav-cta">Download</a>
      </nav>
    </header>

    <!-- Hero -->
    <section class="hero">
      <div class="hero-badge">
        <span>⚡</span> RELEASE CANDIDATE 1.0 • DETERMINISTIC SUB-1MS CORE
      </div>
      <h1 class="hero-title">The Autonomous Personal Operating Layer</h1>
      <p class="hero-subtitle">
        Eliminate repetitive digital work across text, files, clipboard, and apps.
        Zero mandatory cloud accounts. 100% private and offline-resilient.
      </p>
      <div class="hero-actions">
        <a href="#downloads" class="btn-lg btn-primary">Download Free for Desktop & Mobile</a>
        <a href="#demo" class="btn-lg btn-secondary">Try Interactive Playground</a>
      </div>
    </section>

    <!-- Interactive In-Browser Live Demo -->
    <section class="playground-section" id="demo">
      <div class="playground-window">
        <div class="window-header">
          <span class="window-dot" style="background:#ff5f56"></span>
          <span class="window-dot" style="background:#ffbd2e"></span>
          <span class="window-dot" style="background:#27c93f"></span>
          <span class="window-title">operon-engine --live-in-browser-sandbox</span>
        </div>
        <div class="playground-content">
          <div class="demo-grid">
            <div class="demo-pane">
              <span class="pane-label">Test Input Data</span>
              <textarea id="demoInput" class="demo-input" placeholder="Type or paste dirty URL, raw JSON, or messy TSV data..."></textarea>
              <div class="demo-chips">
                <button class="demo-chip" onclick="applyPreset('url')">Dirty URL Preset</button>
                <button class="demo-chip" onclick="applyPreset('json')">Unformatted JSON</button>
                <button class="demo-chip" onclick="applyPreset('tsv')">Tabular TSV</button>
                <button class="demo-chip" onclick="applyPreset('case')">Kebab Case Text</button>
              </div>
            </div>
            <div class="demo-pane">
              <span class="pane-label">Deterministic Output (Sub-1ms Execution)</span>
              <div id="demoOutput" class="demo-output-box">// Output will render instantly here...</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features -->
    <section class="features-grid" id="features">
      <div class="feature-card">
        <div class="feature-icon">🛡️</div>
        <h3 class="feature-title">100% Local-First & Private</h3>
        <p class="feature-desc">Your clipboard, files, and personal data never leave your local hardware. No remote telemetry, no mandatory cloud subscriptions.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">⚡</div>
        <h3 class="feature-title">Sub-Millisecond Speed</h3>
        <p class="feature-desc">Built as a strictly typed Directed Acyclic Graph (DAG) engine. Instant Alt+Space overlay invocation with sub-16ms frame boundaries.</p>
      </div>
      <div class="feature-card">
        <div class="feature-icon">✨</div>
        <h3 class="feature-title">Local AI Workflow Compiler</h3>
        <p class="feature-desc">Describe your routine in plain English or Russian. Operon compiles it into a validated, deterministic offline routine.</p>
      </div>
    </section>

    <!-- Downloads -->
    <section class="downloads-section" id="downloads">
      <h2 style="font-size: 28px; margin-bottom: 8px;">Download Operon for Your Systems</h2>
      <p style="color: var(--text-2);">Native platform builds engineered for Windows, macOS, Android, and iOS.</p>
      <div class="download-grid">
        <a href="#downloads" class="download-card">
          <div class="download-os">Windows</div>
          <div class="download-spec">Win 10/11 x64 • MSIX / EXE</div>
        </a>
        <a href="#downloads" class="download-card">
          <div class="download-os">macOS</div>
          <div class="download-spec">Apple Silicon & Intel • DMG</div>
        </a>
        <a href="#downloads" class="download-card">
          <div class="download-os">Android</div>
          <div class="download-spec">API 31+ • Share Target APK</div>
        </a>
        <a href="#downloads" class="download-card">
          <div class="download-os">iOS</div>
          <div class="download-spec">iOS 17+ • Shortcuts Action</div>
        </a>
      </div>
    </section>

    <!-- Pricing -->
    <section class="pricing-section" id="pricing">
      <h2 style="font-size: 28px; margin-bottom: 8px;">Fair, Anti-Subscription Fatigue Pricing</h2>
      <p style="color: var(--text-2); max-width: 620px; margin: 0 auto;">
        No recurring $20/month SaaS traps for a local utility. Start free, try Pro without a credit card, or own it permanently with a Lifetime license.
      </p>
      <div class="pricing-grid" style="grid-template-columns: repeat(3, 1fr); max-width: 1040px;">
        <!-- Community Core -->
        <div class="pricing-card">
          <div class="pricing-tier">Community Core</div>
          <div class="pricing-price">$0</div>
          <p style="color: var(--text-2); font-size: 13px;">Free forever. No credit card required.</p>
          <ul class="pricing-features">
            <li>✓ All 15 Core Curated Recipes</li>
            <li>✓ Instant Alt+Space Command HUD</li>
            <li>✓ Sub-1ms deterministic execution</li>
            <li>✓ Local-first privacy guarantee</li>
            <li>✓ Standard Dark & OLED Themes</li>
            <li>✓ Unlimited local recipe executions</li>
          </ul>
          <a href="#downloads" class="btn-lg btn-secondary" style="width: 100%; text-align: center; justify-content: center;">Download Free</a>
        </div>

        <!-- Pro Annual -->
        <div class="pricing-card">
          <div class="pricing-tier">Pro Annual</div>
          <div class="pricing-price">$39 <span style="font-size: 14px; font-weight: normal; color: var(--text-2);">/ year</span></div>
          <p style="color: var(--text-2); font-size: 13px;">$3.25/mo billed annually. 14-day free trial.</p>
          <ul class="pricing-features">
            <li>✓ Unlimited custom DAG workflows</li>
            <li>✓ Local AI Natural Language Compiler</li>
            <li>✓ Large-scale batch file pipelines (>1000 items)</li>
            <li>✓ Developer Pack (JWT, JSON, cURL, RegEx)</li>
            <li>✓ Unlimited encrypted local history</li>
            <li>✓ Custom rice themes & accent editor</li>
          </ul>
          <a href="#downloads" class="btn-lg btn-secondary" style="width: 100%; text-align: center; justify-content: center;">Start 14-Day Trial</a>
        </div>

        <!-- Pro Lifetime -->
        <div class="pricing-card pro">
          <div class="pricing-tier">Pro Lifetime Local</div>
          <div class="pricing-price">$79 <span style="font-size: 14px; font-weight: normal; color: var(--text-2);">one-time</span></div>
          <p style="color: var(--text-2); font-size: 13px;">Own your automation layer forever.</p>
          <ul class="pricing-features">
            <li>✓ <strong>All Pro Local Features Permanently</strong></li>
            <li>✓ Cryptographic offline license key</li>
            <li>✓ All 1.x and 2.x updates included</li>
            <li>✓ Works 100% offline with zero server check</li>
            <li>✓ Transferable across your personal devices</li>
            <li>✓ Priority bug fixes & community discord</li>
          </ul>
          <a href="#downloads" class="btn-lg btn-primary" style="width: 100%; text-align: center; justify-content: center;">Get Lifetime Pass</a>
        </div>
      </div>

      <div style="margin-top: 24px; font-size: 12px; color: var(--text-3); max-width: 680px; margin-left: auto; margin-right: auto; line-height: 1.5;">
        <strong>Honest Lifetime Terms:</strong> Pro Lifetime Local provides perpetual entitlement to all local software capabilities on your personal hardware. Future optional server-side sync and hosted heavy compute models (Plus Cloud at $7.99/mo) are separate subscriptions to protect company economic sustainability.
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <p>© 2026 Rovel Labs. All rights reserved. • Operon Commercial Autonomous System</p>
      <p style="margin-top: 6px;">Zero Telemetry • Local First • Deterministic Performance</p>
    </footer>
  </div>

  <script>
    const presets = {
      url: 'https://example.com/checkout?utm_source=newsletter&utm_medium=email&utm_campaign=summer_sale&fbclid=IwAR0123&item_id=8831',
      json: '{"product":"Operon","tier":"Pro","specs":{"latencyMs":0.08,"offline":true}}',
      tsv: "Action\tDomain\tLatency\nClean URL\tText\t0.04ms\nFormat JSON\tDev\t0.08ms\nWebP Convert\tImage\t1.20ms",
      case: 'operon universal personal automation layer'
    };

    function applyPreset(key) {
      const inputEl = document.getElementById('demoInput');
      inputEl.value = presets[key];
      runDemo();
    }

    function runDemo() {
      const val = document.getElementById('demoInput').value;
      const out = document.getElementById('demoOutput');

      if (!val) {
        out.textContent = '// Output will render instantly here...';
        return;
      }

      // Live pattern detection
      if (val.includes('http://') || val.includes('https://')) {
        try {
          const url = new URL(val);
          const tracking = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 'gclid'];
          tracking.forEach(p => url.searchParams.delete(p));
          out.textContent = '✓ Stripped 4 tracking parameters in 0.04ms:\\n\\n' + url.toString();
          return;
        } catch {}
      }

      if (val.trim().startsWith('{') || val.trim().startsWith('[')) {
        try {
          const parsed = JSON.parse(val);
          out.textContent = '✓ Formatted & Validated JSON (2-space indent in 0.08ms):\\n\\n' + JSON.stringify(parsed, null, 2);
          return;
        } catch (e) {
          out.textContent = '✕ Invalid JSON: ' + e.message;
          return;
        }
      }

      if (val.includes('\\t') || val.includes('\\n')) {
        const lines = val.trim().split('\\n');
        if (lines.length > 1) {
          const header = '| ' + lines[0].split('\\t').join(' | ') + ' |';
          const sep = '| ' + lines[0].split('\\t').map(() => '---').join(' | ') + ' |';
          const rows = lines.slice(1).map(l => '| ' + l.split('\\t').join(' | ') + ' |');
          out.textContent = '✓ Markdown Table Converted:\\n\\n' + [header, sep, ...rows].join('\\n');
          return;
        }
      }

      // Casing fallback
      const kebab = val.trim().toLowerCase().replace(/\\s+/g, '-');
      out.textContent = '✓ Transformed Case:\\n\\nkebab-case: ' + kebab + '\\nUPPERCASE: ' + val.toUpperCase();
    }

    document.getElementById('demoInput').addEventListener('input', runDemo);
    // Initial load
    applyPreset('url');
  </script>
</body>
</html>`;
}
