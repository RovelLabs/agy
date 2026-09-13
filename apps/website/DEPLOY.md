# OPERON Official Website: Cloudflare Deployment Guide

This package contains the complete production-grade website for **OPERON**, prepared for direct deployment to Cloudflare Pages (or Cloudflare Workers).

---

## ⚡ Deployment Option 1: Cloudflare Pages Direct ZIP Upload (Zero Configuration, Fastest)

1. Open the Cloudflare Dashboard: **[dash.cloudflare.com](https://dash.cloudflare.com)**
2. In the left navigation menu, click **Workers & Pages** $\rightarrow$ **Create application**
3. Select the **Pages** tab at the top
4. Click **Upload assets**
5. Enter a project name (e.g. `operon` or `operon-website`)
6. Under **Upload assets**, drag and drop the file:
   `OPERON-WEBSITE-DEPLOY.zip` (located in project root or `apps/website/`)
7. Click **Deploy site**

✅ **Done!** Cloudflare Pages immediately unzips the assets:
- `index.html` is at the root $\rightarrow$ Instant responsive landing page with interactive HUD, themes, and pricing.
- `404.html` $\rightarrow$ Custom branded 404 error page.
- `functions/api/health.js` $\rightarrow$ Edge serverless health check at `/api/health`.
- `functions/api/version.js` $\rightarrow$ Edge serverless release metadata at `/api/version`.
- `_headers` $\rightarrow$ Enterprise HTTP security headers (CSP, HSTS, X-Frame-Options) and asset caching.
- `_redirects` $\rightarrow$ Direct redirects for `/github` and `/docs`.

---

## 🛠️ Deployment Option 2: Wrangler CLI

If you have Node.js and Wrangler installed:

```bash
# Option A: Deploy to Cloudflare Pages via CLI
npx wrangler pages deploy . --project-name=operon

# Option B: Deploy as a Cloudflare Worker (Worker ID: yellow-water-78f7)
npx wrangler deploy
```

---

## 💻 Deployment Option 3: Cloudflare Dashboard Quick Web Editor

1. Open: [Cloudflare Worker Web Editor](https://dash.cloudflare.com/0a4357eeb937ef38bc7b1889527e12c8/workers/services/edit/yellow-water-78f7/production)
2. Copy the entire contents of `apps/website/src/index.js` (or `worker.js` from the zip).
3. Paste into the web editor and click **Deploy**.

---

## 🔍 Verification Checklist

After deploying, verify the following URLs:
- `https://<your-project>.pages.dev/` $\rightarrow$ Full responsive website with interactive Command HUD (HTTP 200)
- `https://<your-project>.pages.dev/api/health` $\rightarrow$ `{"status": "healthy", "product": "OPERON"}` (HTTP 200)
- `https://<your-project>.pages.dev/api/version` $\rightarrow$ `{"version": "1.0.0-rc.2", "channel": "release-candidate"}` (HTTP 200)
- `https://<your-project>.pages.dev/robots.txt` $\rightarrow$ Crawler indexing rules (HTTP 200)
- `https://<your-project>.pages.dev/sitemap.xml` $\rightarrow$ Search engine XML sitemap (HTTP 200)
- `https://<your-project>.pages.dev/unmapped-path` $\rightarrow$ Custom 404 error page (HTTP 404)
- `https://<your-project>.pages.dev/github` $\rightarrow$ Redirects to `https://github.com/RovelLabs/agy` (HTTP 302)

---

## 🔒 Security Audit & Privacy Guarantee

- **Zero API Keys / Secrets:** This package contains no credentials or private keys.
- **Client-Side Simulation:** The interactive HUD operates 100% locally in the user's browser using deterministic Web APIs.
