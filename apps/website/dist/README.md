# OPERON Official Website — Cloudflare Deployment Package

This self-contained package contains the complete, production-grade official website for **OPERON** (The Autonomous Personal Operating Layer), specifically structured for zero-configuration Cloudflare deployment.

---

## ⚡ Option 1: Direct ZIP Upload via Cloudflare Dashboard (Fastest, No CLI needed)

1. Log into your Cloudflare Dashboard: **[dash.cloudflare.com](https://dash.cloudflare.com)**
2. In the left sidebar, navigate to: **Workers & Pages** $\rightarrow$ **Create application**
3. Select the **Pages** tab
4. Click **Upload assets**
5. Enter a project name (e.g. `operon` or `operon-website`)
6. Drag and drop the `OPERON-WEBSITE-DEPLOY.zip` file directly into the upload area
7. Click **Deploy site**

✅ **Done!** Your site will be instantly live at `https://operon.pages.dev` (or your custom domain).

---

## 🛠️ Option 2: Deploy via Wrangler CLI

If you prefer using the command line:

```bash
# 1. Unzip the package into a directory
# 2. Deploy directly using Wrangler:
npx wrangler pages deploy . --project-name=operon
```

---

## 📦 What's Inside This Archive:

- `index.html` — Full responsive website with interactive HUD simulator, theme switcher, benchmarks, and pricing
- `404.html` — Custom graphite-themed 404 page for unmatched routes
- `favicon.svg` — Official OPERON vector glyph
- `robots.txt` & `sitemap.xml` — SEO indexing directives
- `_headers` — Production HTTP security headers (CSP, HSTS, X-Frame-Options, Cache-Control)
- `_redirects` — Short URL redirects (`/github`, `/docs`, `/repo`)
- `functions/api/health.js` — Cloudflare Pages serverless edge endpoint (`GET /api/health`)
- `functions/api/version.js` — Cloudflare Pages serverless edge endpoint (`GET /api/version`)
- `wrangler.toml` — Pre-configured Cloudflare Pages configuration

---

## 🔒 Security & Privacy

- **Zero Credentials:** This package contains zero API keys, secrets, or tracking tokens.
- **Client-Side Execution:** The interactive HUD sandbox executes transformations 100% locally in the browser.
