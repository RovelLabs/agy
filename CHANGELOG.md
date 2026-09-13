# Changelog: OPERON

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

## [1.0.0-rc.1] - 2026-09-13

### Added
- **Core Automation Engine (`@operon/core`):**
  - Fully typed, deterministic Directed Acyclic Graph (DAG) workflow runner.
  - Action Registry with Standard Library across Text, Clipboard, File, Image, Developer, and System domains.
  - Variable interpolation (`${input}`, `${steps}`) and condition algebra.
  - 15 curated, tested production recipes pre-installed.
  - `WorkflowSerializer` with integrity hashing and security capability auditing.
- **Storage Layer (`@operon/storage`):**
  - `LocalDataStore` with atomic file-backed and memory persistence.
  - Schema migrations, execution history bounds, and backup/restore.
  - Full interface decoupling from future `ISyncProvider` and `IIdentityProvider`.
- **Design System (`@operon/design`):**
  - Layered dark neutrals design system ("Apple polish + Linux rice").
  - 4 themes: Graphite Dark, Midnight Slate, OLED Black, Lunar Light.
  - Spring motion tokens and brand vector glyphs.
- **Desktop Application Shell (`apps/desktop`):**
  - Quick Command HUD overlay (`Alt+Space`) with instant keystroke fuzzy search.
  - Sub-16ms invocation latency and tactile dark styling.
  - Automatic recipe seeding and local API server.
- **Mobile Adapters (`apps/mobile`):**
  - `AndroidShareReceiver` for handling `ACTION_SEND` intent routing.
  - `IOSShareExtensionBridge` for processing `NSExtensionItem` payloads.
- **Local AI Compiler (`ai/`):**
  - Natural-language to typed workflow compilation with fallback tiers.
  - `AIPlanValidator` enforcing capability safety and plan preview approval.
- **Cloudflare Edge Website (`apps/website`):**
  - Edge Worker for `yellow-water-78f7` with responsive landing page, pricing, and downloads.
  - In-browser interactive live workflow playground.
- **Test & QA Suite (`tests/`):**
  - Comprehensive unit, storage, AI, mobile, and QA breaker stress tests.
  - CI/CD workflow for multi-OS GitHub Actions.
