# Unit Economics & Financial Projections: OPERON

**Author:** Agent N (Monetization & Commercial Strategy)  
**Date:** September 2026  
**Status:** Canonical Financial Model  

---

## 1. Unit Economics Philosophy: The Local-First Margin Advantage

Most AI and SaaS startups in 2026 operate with thin or negative gross margins due to heavy per-query cloud model inference fees (OpenAI/Anthropic APIs) and continuous server synchronization costs.

**Operon's Structural Cost Moat:**
1. **Core Automation:** Runs 100% locally on user CPU/GPU. Marginal cost to Operon = **$0.00**.
2. **Local AI Intent Compiler:** Runs on-device via quantized SLMs and deterministic rules. Marginal cost to Operon = **$0.00**.
3. **Storage:** Local encrypted SQLite / JSON files on client device. Marginal cloud storage cost = **$0.00**.
4. **Bandwidth:** Cloudflare Worker edge delivery for website, documentation, and app installer CDN distribution (~$0.015 per GB).

---

## 2. Revenue & Cost per User by Tier

| Metric | Free User | Pro Annual ($39/yr) | Pro Lifetime ($79 once) | Future Plus ($7.99/mo) |
|---|---|---|---|---|
| **Gross Annual Revenue** | $0.00 | $39.00 | $79.00 (Year 1) | $95.88 ($7.99/mo x 12) |
| **Payment Gateway / Store Fee** | $0.00 | -$2.43 (Stripe 2.9%+$0.30) / -$5.85 (App Store 15%) | -$3.59 (Stripe) / -$11.85 (App Store 15%) | -$7.28 (Stripe) / -$14.38 (App Store) |
| **Blended Sales Tax / VAT (15% avg)** | $0.00 | -$5.09 | -$10.30 | -$12.51 |
| **Client CDN / Update Bandwidth** | -$0.04 | -$0.08 | -$0.08 | -$0.12 |
| **Cloud Server / Sync Infrastructure**| $0.00 | $0.00 | $0.00 | -$4.80 ($0.40/mo SQLite E2EE sync) |
| **Customer Support Allocation** | -$0.02 | -$0.80 | -$1.20 | -$2.40 |
| **Net Contribution Margin ($)** | **-$0.06** | **+$30.60** | **+$53.83** (Year 1) | **+$58.77** / year |
| **Contribution Margin (%)** | N/A | **78.5%** (Direct) / **69.7%** (Store) | **68.1%** (Blended) | **61.3%** |

*Crucial Insight:* Because Free users cost less than $0.06/year (pure CDN), a modest 3.5% free-to-paid conversion rate comfortably finances 50 free users for every single paid Pro user!

---

## 3. Cohort Scaling Projections

We model four distinct growth horizons based on realistic conversion and churn benchmarks:
- **Free-to-Pro Conversion Rate:** 3.8% (Benchmark: Raycast ~3-4%, Alfred ~4-5%, Obsidian ~3.5%)
- **Pro Mix:** 55% Pro Annual ($39/yr), 45% Pro Lifetime ($79 once)
- **Yearly Renewal Rate (Pro Annual):** 78%

### Horizon 1: 1,000 Active Users (Launch / Beta Stage)
- Free Users: 962
- Paid Pro Users: 38 (21 Annual, 17 Lifetime)
- Gross Revenue: (21 x $39) + (17 x $79) = **$2,162**
- Infrastructure & CDN Costs: ~$42
- Net Operating Profit: **+$1,680**

### Horizon 2: 10,000 Active Users (Product-Market Fit Stage)
- Free Users: 9,620
- Paid Pro Users: 380 (209 Annual, 171 Lifetime)
- Gross Revenue: (209 x $39) + (171 x $79) = **$21,660**
- Infrastructure & CDN Costs: ~$380
- Net Operating Profit: **+$16,750**

### Horizon 3: 100,000 Active Users (Scale Stage)
- Free Users: 96,200
- Paid Pro Users: 3,800 (2,090 Annual, 1,710 Lifetime)
- Gross Revenue: (2,090 x $39) + (1,710 x $79) = **$216,600**
- Infrastructure & CDN Costs: ~$3,600
- Net Operating Profit: **+$168,200**

### Horizon 4: 1,000,000 Active Users (Global Expansion)
- Free Users: 962,000
- Paid Pro Users: 38,000 (20,900 Annual, 17,100 Lifetime)
- Gross Revenue: (20,900 x $39) + (17,100 x $79) = **$2,166,000**
- Infrastructure & CDN Costs: ~$32,000
- Net Operating Profit: **+$1,684,000**

---

## 4. Sensitivity & Downside Stress Test

### Scenario A: Conservative (Low Conversion, Heavy Support)
- Conversion drops to 1.8%.
- Average Revenue Per Payer: $42.
- 100,000 users yields 1,800 paid customers = $75,600 revenue.
- Still generates **+$52,000 net cash flow** because local software has zero variable compute drain.

### Scenario B: Cloud Plus Cannibalization Protection
- Lifetime licenses explicitly cover **Local Product Functionality Only**.
- If a user desires future cloud E2EE sync or hosted compute models, they subscribe to **Plus Cloud** at $7.99/mo.
- Under zero circumstances can a lifetime purchaser bankrupt the company with server inference costs.
