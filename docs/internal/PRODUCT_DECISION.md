# Official Product Decision: Universal Personal Automation Layer

**Decision Date:** September 2026  
**Document ID:** DEC-PROD-2026-001  
**Status:** APPROVED & LOCKED FOR IMPLEMENTATION  

---

## 1. Final Product Selection
The product selected for commercial development across Windows, macOS, Android, iOS, and Cloudflare is:

> **The Universal Personal Automation Layer (Internal Codename: Abubu / Core Platform Engine)**

### Executive Value Proposition:
A native, local-first personal automation layer that bridges the gap between user intent and operating-system execution. It eliminates repetitive friction in managing text, files, clipboard data, images, and developer workflows through sub-millisecond keyboard-driven actions on desktop and fluid share-sheet routines on mobile—completely private, offline-resilient, and powered by deterministic execution with an optional local AI compiler.

---

## 2. Key Differentiation & Defensible Moats

| Dimension | Our Product | Existing Market (Raycast / PowerToys / Shortcuts) |
|---|---|---|
| **Platform Scope** | Unified cross-platform engine (Windows, macOS, Android, iOS) | Fragmented: Raycast is Mac-biased; PowerToys is Win-only; Shortcuts is Apple-only. |
| **Privacy & Architecture** | 100% Local-First. Zero mandatory cloud backend, zero telemetry requirement. | Heavy cloud dependencies, telemetry, mandatory SaaS accounts. |
| **Execution Paradigm** | Deterministic, typed DAG action engine with sub-millisecond execution. | Disjointed point-tools (PowerToys) or fragile script macros. |
| **AI Integration** | Local AI acts as an *offline workflow compiler* and local transformer; no mandatory recurring API costs. | Cloud AI paywalls ($8–$20/mo) or pure novelty chatbots. |
| **UX & Visual Polish** | "Apple-level polish meets premium Linux rice" (Dark neutrals, tactile depth, fluid 120Hz physics). | Disjointed legacy dialogs or generic bloated web wrappers. |
| **Pricing & Monetization** | Fair, ethical freemium: Free daily utility + optional Pro lifetime / regionalized pass. | Aggressive subscription fatigue, crippled free tiers. |

---

## 3. Core Persona Profiles
1. **The Multi-Device Knowledge Worker (Primary):**
   - Works on a Windows desktop or ThinkPad at the office/home, carries an iPhone or Android phone.
   - Constantly handles URLs, screenshots, text formatting, and files across apps.
   - Demands instantaneous hotkey response and zero cognitive friction.
2. **The Software Developer & Technical Power User:**
   - Lives in terminal, VS Code, Git, and browser.
   - Needs rapid clipboard JSON/YAML transformations, regex cleans, base64 encoding, batch renaming, and custom script hooks without opening heavyweight IDE tools or sketchy online web converters.
3. **The Global Everyday User (CIS, EU, Americas, Asia):**
   - Wants one-click recipes that "just work": clean screenshot folders, strip tracking junk from TikTok/YouTube links, convert images to WebP before sending in Telegram/WhatsApp.

---

## 4. Approved MVP to V1 Functional Scope
1. **Deterministic Core Automation Engine:**
   - Strongly-typed, versioned schema (`Trigger -> Conditions -> Action Chain -> Output`).
   - Built-in sandboxed actions: Clipboard, Filesystem, Image, Text, System, Network, Shell (desktop only).
   - Execution history log with timing metrics, rollback, and dry-run preview for destructive tasks.
2. **Desktop Global Quick Command Interface:**
   - Instant activation overlay (Alt+Space / Option+Space) with sub-16ms render time.
   - Deterministic fuzzy search across workflows, recipes, clipboard history, and tools.
3. **Curated Recipe Library (Day One Value):**
   - Minimum 15 fully-implemented, thoroughly tested, production-grade recipes across Text, Image, File, System, and Developer categories.
4. **Local AI Engine Foundation:**
   - Clean provider abstraction (`AIEngine`) supporting local SLM inference (GGUF / ONNX / WebAssembly) and deterministic grammar-guided schema compilation (NL-to-Workflow).
5. **Theme & Motion System:**
   - 4 built-in themes: Graphite (Default Dark), Midnight Slate, OLED Black, and Lunar Light.
   - Full reduced-motion and high-contrast support.
6. **Cloudflare Production Website:**
   - Responsive, dark-aesthetic landing page, interactive workflow playground, platform downloads, feature documentation, and privacy declaration.

---

## 5. Sign-off
- **Product Strategy:** APPROVED
- **Adversarial Red Team:** APPROVED WITH SAFEGUARDS
- **Systems Architecture:** COMMITTED TO PHASE 3 & 4
