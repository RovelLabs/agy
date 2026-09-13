# Product Requirements Document (PRD): Universal Personal Automation Layer

**Product Internal Codename:** `abubu` / `agy-core`  
**Document Version:** 1.0.0 (Release Candidate Track)  
**Target Release Date:** 2026 Q4  
**Classification:** Confidential Commercial Software  

---

## 1. Product Vision & Goals

### 1.1 Vision
To be the world's most responsive, trusted, and versatile personal automation layer—empowering individuals to reclaim wasted digital hours through instantaneous, local-first workflows that bridge operating systems without compromising privacy or battery life.

### 1.2 Quantitative Success Metrics (KPIs)
- **Time-to-First-Value (TTFV):** User executes their first pre-installed recipe within **45 seconds** of installation.
- **Overlay Invocation Latency:** < **16 milliseconds** (60 FPS frame boundary) from hotkey press to interactive input readiness.
- **Workflow Execution Overhead:** < **5 milliseconds** engine routing overhead for native action execution.
- **Zero-Crash Baseline:** 99.9% crash-free sessions across all target platforms.
- **Cold Start Time:** < **350 milliseconds** on desktop; < **500 milliseconds** on mobile.
- **Idle Memory Footprint:** < **65 MB** on desktop background mode.
- **Local Data Guarantee:** 100% of core actions execute with zero outbound internet traffic.

---

## 2. Personas & Core User Journeys

### Persona A: Alex, Multi-Platform Senior Developer (32)
- **Environment:** Windows 11 desktop at home, MacBook Pro on travel, Google Pixel 9.
- **Daily Friction:** Constantly copying JSON payloads, log snippets, cURL commands, Git branch names, and formatting them for PRs or documentation.
- **Core Journey:**
  1. Alex copies a messy JSON API response.
  2. Hits `Alt+Space` -> types `json` -> hits `Enter` (`Format & Validate JSON`).
  3. Formatted, indented, validated JSON is copied back to clipboard with a subtle tactile sound and toast notification in under 10ms.

### Persona B: Elena, Digital Operations & Content Specialist (27)
- **Environment:** Windows laptop + iPhone 16 Pro.
- **Daily Friction:** Downloads dozens of screenshots, stock assets, and product graphics daily. Folders get clogged with `Screenshot 2026-09-13 14.23.png` taking up 12MB each.
- **Core Journey:**
  1. Elena highlights 20 PNG screenshots.
  2. Presses `Alt+W` (Quick Action) or uses Command Overlay: `Compress & Convert to WebP`.
  3. App runs a non-destructive dry-run, shows estimated 85% space savings, compresses the files with multicore parallelism, renames with ISO timestamp, and preserves originals in a rollback backup folder.

---

## 3. Functional Requirements

### 3.1 The Deterministic Workflow Domain Model
The engine executes a strongly-typed Directed Acyclic Graph (DAG):
- **Workflow (`IWorkflow`):**
  - `id`: UUID v4
  - `version`: integer schema version (starts at 1)
  - `name`: string (localized)
  - `description`: string (localized)
  - `icon`: string (Lucide icon identifier)
  - `category`: enum (`text`, `file`, `image`, `clipboard`, `developer`, `system`, `custom`)
  - `platforms`: array of supported platforms (`windows`, `macos`, `android`, `ios`)
  - `permissions`: array of required capability tokens (`clipboard.read`, `filesystem.write`, etc.)
  - `trigger`: `ITriggerDefinition`
  - `conditions`: array of `IConditionDefinition` (evaluates logical AND/OR)
  - `steps`: array of `IActionStep`
  - `isBuiltIn`: boolean (immutable pre-packaged recipe vs. user-created)
  - `enabled`: boolean

- **Triggers (`ITriggerDefinition`):**
  1. `manual`: Invoked via Quick Overlay search, hotkey, or mobile quick card.
  2. `clipboard_change`: Triggered when new text/image enters OS clipboard (subject to user opt-in).
  3. `share_target`: Triggered via Android/iOS system Share Sheet.
  4. `file_drop`: Drag-and-drop onto desktop drop target or app window.
  5. `directory_watch`: Watches a directory (e.g. `Downloads` or `Screenshots`) for new files (Desktop only).
  6. `schedule`: Periodic or cron-like trigger (Desktop background service only).

- **Action Steps (`IActionStep`):**
  - `actionId`: string identifier (e.g., `text.transform`, `image.resize`, `file.rename`, `shell.exec`)
  - `parameters`: typed key-value dictionary validated against JSON Schema
  - `continueOnError`: boolean
  - `retryCount`: integer
  - `timeoutMs`: integer

### 3.2 Action Catalog (V1 Standard Library)
1. **Text Domain:**
   - `text.change_case`: Upper, Lower, Title, Camel, Snake, Kebab.
   - `text.strip_markdown`: Removes formatting syntax.
   - `text.clean_url`: Strips UTM parameters, tracking tokens (fbclid, gclid, etc.).
   - `text.format_json`: Formats/minifies JSON with syntax error reporting.
   - `text.markdown_table`: Converts TSV/CSV text into Markdown tables.
   - `text.extract_regex`: Extracts matches (emails, URLs, IP addresses).
   - `text.summarize_local`: Uses local SLM / extractive model to summarize text.
2. **Clipboard Domain:**
   - `clipboard.read`: Retrieves current text, HTML, or image.
   - `clipboard.write`: Replaces clipboard contents with status toast.
   - `clipboard.history_get`: Retrieves recent clipboard items (local encrypted cache).
3. **File & Image Domain:**
   - `file.batch_rename`: Pattern-based renaming with variables (`{date}`, `{counter}`, `{original}`).
   - `file.move_copy`: Moves or copies files with automatic collision handling (rename, overwrite, skip).
   - `file.recycle`: Moves files to system Trash/Recycle Bin (safe deletion).
   - `image.convert_format`: Converts between PNG, JPEG, WebP, AVIF.
   - `image.resize`: Dimension/percentage-based resizing with aspect-ratio preservation.
   - `image.strip_metadata`: Removes EXIF and GPS geolocation metadata for privacy.
4. **Developer & System Domain:**
   - `dev.base64`: Encode / Decode.
   - `dev.hash`: MD5, SHA-256 calculation.
   - `dev.jwt_decode`: Inspects payload/header of JWT tokens offline.
   - `system.open_url`: Launches default browser with sanitized URL.
   - `system.notify`: Dispatches native desktop/mobile OS notification.
   - `system.shell_exec`: Executes shell command (sandboxed, explicit user confirmation required, Desktop only).

### 3.3 Desktop Global Quick Command Interface
- Activated via configurable global shortcut (Default: `Alt+Space` on Windows, `Option+Space` on macOS).
- Centered floating HUD with tactile dark acrylic / mica backdrop.
- Unified search bar supporting instant keystroke fuzzy filtering.
- Dual-pane layout: Search results on left, rich action preview / parameters on right.
- Keyboard navigation: `Up/Down` to select, `Enter` to execute, `Tab` for action secondary options, `Esc` to dismiss.
- Zero flicker: All search operations run synchronously against an in-memory indexed Trie/SQLite FTS5.

### 3.4 Local AI Foundation (Intent-to-Workflow Compiler)
- Input: Natural language query (e.g., *"Convert all pngs in my downloads to webp and delete the originals"*).
- Architecture: Provider interface (`AIEngine`) with fallback tiers:
  - Tier 1 (Deterministic Rule Matcher): Instant regex/pattern parser for standard commands.
  - Tier 2 (Local Micro-Model / ONNX Runtime): 100% offline structured JSON generator with schema constrained decoding.
  - Tier 3 (External Bring-Your-Own-Key Provider): Optional user-configured local LLM (e.g. Ollama localhost) or API key.
- Safety Sandbox: The AI planner **NEVER** executes code directly. It outputs an `IWorkflow` JSON draft. The app displays a visual plan preview and requests explicit user approval before execution.

---

## 4. Platform Architectural Matrix

| Feature / Capability | Windows 10/11 | macOS 14+ | Android 12+ | iOS 17+ |
|---|---|---|---|---|
| **Core Workflow Engine** | Full Native | Full Native | Full Native | Full Native |
| **Global Quick Hotkey** | Yes (Win32 / RegisterHotKey) | Yes (Carbon / NSEvent) | N/A (OS limitation) | N/A (OS limitation) |
| **System Tray / Menu Bar** | Yes (Shell_NotifyIcon) | Yes (NSStatusItem) | N/A | N/A |
| **Share Sheet Action** | Yes (Windows Share) | Yes (Services / Share) | Yes (Intent Filter) | Yes (Share Extension) |
| **Directory Watcher** | Yes (ReadDirectoryChangesW) | Yes (FSEvents) | Limited (Foreground) | Restricted |
| **Shell Command Exec** | Yes (sandboxed) | Yes (sandboxed) | No | No |
| **Image Compression** | Yes (Hardware/Native) | Yes (Hardware/Native) | Yes (Hardware/Native) | Yes (Hardware/Native) |
| **Local AI Inference** | DirectML / ONNX / CPU | Core ML / Metal / CPU | NNAPI / CPU | Core ML / CPU |

---

## 5. Security & Privacy Non-Negotiables
1. **Secret Storage:** API tokens, webhook secrets, and private keys MUST be stored in platform-native encrypted stores:
   - Windows Credential Manager / DPAPI
   - macOS Keychain
   - Android Keystore
   - iOS Keychain
2. **File Safety:** All file operations that overwrite or delete MUST support dry-run preview and default to system Recycle Bin / Trash rather than permanent unrecoverable deletion.
3. **Zero Telemetry by Default:** No network packets sent without explicit opt-in.
