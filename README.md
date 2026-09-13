# OPERON: The Autonomous Personal Operating Layer

<div align="center">
  <img src="packages/design/src/icons.js" width="72" height="72" alt="OPERON Logo" />
  <p><strong>Universal, Local-First Personal Automation & On-Device Intelligence</strong></p>
  <p><em>Target Platforms: Windows • macOS • Android • iOS • Cloudflare Edge</em></p>
</div>

---

## Overview

**OPERON** is an autonomous operating layer designed to eliminate repetitive digital work across text, files, clipboard, images, and developer workflows.

Unlike cloud-dependent subscription launchers or siloed platform tools, Operon runs **100% local-first**:
- **Deterministic Sub-1ms DAG Execution:** All workflows run deterministically on-device without cloud API dependencies.
- **Desktop Quick Command HUD (`Alt+Space`):** Sub-16ms invocation latency with tactile acrylic/mica dark aesthetics.
- **Mobile Share-Sheet Integration:** Native Android `ACTION_SEND` and iOS `ShareExtension` adapters.
- **Local AI Intent Compiler:** Natural language prompts compile offline into typed, schema-validated workflow graphs with explicit user plan approval before execution.
- **No Mandatory Accounts:** Fully functional on day one without cloud registration or telemetry.

---

## Monorepo Architecture

```
project-abubu/
├── packages/
│   ├── core/         # Universal deterministic workflow DAG & action engine
│   ├── storage/      # LocalDataStore with schema migrations & backup
│   └── design/       # Operon design tokens, themes & vector glyphs
├── apps/
│   ├── desktop/      # Native desktop client & Quick Command HUD
│   ├── mobile/       # Android Intent & iOS ShareExtension bridges
│   └── website/      # Cloudflare Worker edge website (yellow-water-78f7)
├── ai/               # Local AI compiler, intent classifier & safety validator
├── docs/             # Engineering documentation, PRDs, ADRs & threat models
├── tests/            # Full test suite (core, storage, ai, mobile, breaker QA)
└── .github/          # CI/CD multi-OS automated testing workflows
```

---

## Quick Start & Verification

### Prerequisites
- Node.js `v20+` or `v22+`
- Git

### Run Test Suite
```bash
# Execute the entire suite (Core, Storage, AI, Mobile, Breaker QA)
node --test tests/core.test.js tests/storage.test.js tests/ai.test.js tests/mobile.test.js tests/breaker_qa.test.js
```

### Start Desktop Quick Command HUD
```bash
npm --workspace=@operon/desktop start
# Opens HUD at http://localhost:49210
```

### Preview Cloudflare Website
```bash
node apps/website/src/server.js
# Serves interactive web playground at http://localhost:49220
```

---

## 15 Pre-Installed Production Recipes
1. **Strip Tracking Parameters from URLs:** Cleans UTM, `fbclid`, and `gclid` tracking parameters from copied links.
2. **Format & Validate JSON:** Indents and syntax-checks JSON with 2-space formatting.
3. **Convert CSV/TSV to Markdown Table:** Formats spreadsheet clipboard text into GitHub Markdown tables.
4. **Batch Rename Files with Timestamp:** Renames file batches with ISO dates and sequence counters.
5. **Convert & Compress Images to WebP:** Reduces image payload by ~55% locally with zero cloud upload.
6. **Strip EXIF & Geolocation Metadata:** Scrubs sensitive GPS and camera metadata before sharing photos.
7. **Base64 Encode Clipboard:** Instant offline Base64 string encoding.
8. **Base64 Decode to Plain Text:** Reverses Base64 data to UTF-8.
9. **Calculate SHA-256 Checksum:** Cryptographic hash generation for verification.
10. **Inspect JSON Web Token Offline:** Parses JWT header and claims without leaking secrets online.
11. **Convert Text to camelCase:** Programming identifier transformation.
12. **Convert Text to kebab-case:** CSS and URL slug generator.
13. **Extract All URLs from Text:** Scans text and extracts clean hyperlinked lists.
14. **Summarize Long Text Locally:** Heuristic offline summarizer with reading time metrics.
15. **Send Instant Desktop Notification:** Native system toast dispatching.

---

## License & Commercial Status
Proprietary Closed-Source Commercial Software.  
© 2026 Rovel Labs. All rights reserved.
