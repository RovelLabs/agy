# OPERON Official Website: Cloudflare Manual Deployment Guide

This package contains the complete production-ready website build for **OPERON**, configured for deployment on Cloudflare (Worker: `yellow-water-78f7` / Cloudflare Pages).

---

## Deployment Option 1: Cloudflare Dashboard Quick Editor (Easiest & Fastest)

1. Log in to your Cloudflare Dashboard and navigate to:
   👉 [Cloudflare Worker Editor for `yellow-water-78f7`](https://dash.cloudflare.com/0a4357eeb937ef38bc7b1889527e12c8/workers/services/edit/yellow-water-78f7/production)
2. Open the file `src/index.js` from this package.
3. Select All (`Ctrl+A`) and Copy (`Ctrl+C`).
4. Paste into the Cloudflare Web Editor, replacing the existing code.
5. Click **Deploy** (top right).
6. Verify your site at:
   `https://yellow-water-78f7.rovel.workers.dev` (or your connected custom domain).

---

## Deployment Option 2: Wrangler CLI

If you have Wrangler CLI or an authenticated terminal:
```bash
# 1. Install dependencies
npm install

# 2. Deploy to Cloudflare Worker
npx wrangler deploy
```

*Required Environment Variables (already configured in `wrangler.toml`):*
* `ENVIRONMENT = "production"`
* `VERSION = "1.0.0-rc.1"`
* `BRAND_NAME = "OPERON"`

---

## Deployment Option 3: Cloudflare Pages (Direct Drag & Drop)

If you prefer Cloudflare Pages static hosting:
1. Open Cloudflare Dashboard $\rightarrow$ **Workers & Pages** $\rightarrow$ **Create Application** $\rightarrow$ **Pages** $\rightarrow$ **Upload Assets**.
2. Project name: `operon-website`
3. Drag and drop the `dist/` folder from this package.
4. Click **Deploy site**.

---

## Verification Endpoints

Once deployed, verify that all routes respond:
- `GET /` $\rightarrow$ Complete responsive landing page & interactive HUD (HTTP 200)
- `GET /api/health` $\rightarrow$ JSON health status `{"status": "healthy", "product": "OPERON"}`
- `GET /api/version` $\rightarrow$ JSON version and download catalog
- `GET /robots.txt` $\rightarrow$ SEO crawler directives
- `GET /sitemap.xml` $\rightarrow$ XML sitemap

---

## Security Audit
* **Zero Credentials Included:** This deployment package contains no API tokens, GitHub secrets, or private keys.
* **100% Client-Side Local:** All interactive demo transformations run in-memory within the visitor's browser.
