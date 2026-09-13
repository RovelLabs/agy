# Platform Limitations & Capabilities Matrix: OPERON

**Document Version:** 1.0.0  
**Authors:** Agent G (Windows), Agent H (Apple), Agent I (Android)  
**Core Rule:** Absolute transparency. Never advertise fake parity or claim background execution where OS policies forbid it.  

---

## 1. Windows (10 & 11)

### Strengths & Native Capabilities:
- Full Win32 system tray (`Shell_NotifyIcon`) with custom dark context menus.
- Global Hotkey registration via `RegisterHotKey` for instant `Alt+Space` HUD overlay.
- High-performance directory watching via `ReadDirectoryChangesW`.
- Safe file recycling via `SHFileOperation` / `IFileOperation` (Recycle Bin).
- Direct shell execution (sandboxed behind User Confirmation & Developer Mode).
- Mica / Acrylic material composition via DwmSetWindowAttribute.

### OS Constraints & Mitigations:
- **Execution Policy:** PowerShell script execution can be restricted by system `ExecutionPolicy`.
  - *Mitigation:* The engine executes internal Node/C#/.NET actions directly without launching external uncontrolled `.ps1` scripts unless explicitly requested by a user's custom workflow.
- **Path Lengths:** Windows legacy 260-character MAX_PATH limitation.
  - *Mitigation:* All internal file APIs use extended-length path prefixes (`\\?\`) where appropriate.

---

## 2. macOS (macOS 14 Sonoma & macOS 15 Sequoia)

### Strengths & Native Capabilities:
- Native Menu Bar Extra (`NSStatusItem`) with sleek dark popover.
- Global hotkey support via Carbon / Accessibility APIs.
- Deep integration with Finder Quick Actions and Services menu.
- Native Apple Silicon hardware acceleration for local AI inference (Metal / Core ML).

### OS Constraints & Mitigations:
- **Permissions Gates:** macOS aggressively prompts for Accessibility and Full Disk Access permissions.
  - *Mitigation:* Never request permissions at first launch. Request contextually only when a specific feature (e.g. Directory Watcher on Desktop or Global Hotkey) is explicitly activated.

---

## 3. Android (API Level 31+)

### Strengths & Native Capabilities:
- Deep System Share Sheet integration via `ACTION_SEND` and `ACTION_SEND_MULTIPLE`.
- Quick Settings Tile for instant recipe invocation.
- Home Screen Widgets for 1-tap routine execution.

### OS Constraints & Mitigations:
- **Background Execution Limits:** Android Doze mode and manufacturer battery killers aggressively terminate persistent background services.
  - *Mitigation:* We do NOT run permanent idle background services on Android. Heavy automations use `WorkManager` for guaranteed background execution when scheduled, and foreground Share Sheet processing for real-time user actions.
- **Scoped Storage:** Broad filesystem access is strictly controlled.
  - *Mitigation:* Operon uses the Storage Access Framework (SAF) and Document Provider APIs, operating only on folders explicitly selected by the user.

---

## 4. iOS (iOS 17 & iOS 18)

### Strengths & Native Capabilities:
- Share Sheet Extension (`ShareExtension`) allowing users to share text, URLs, and photos directly into Operon workflows.
- App Intents & Apple Shortcuts actions: Exposes Operon actions as native blocks within the iOS Shortcuts app.
- Home Screen & Lock Screen Widgets.

### OS Constraints & Mitigations:
- **Strict Sandbox & No Permanent Background Services:** iOS will terminate any app attempting to run background file watchers or keyloggers.
  - *Mitigation:* We explicitly do NOT promise background directory watching or global hotkeys on iOS. On iOS, Operon operates as a powerful on-demand utility via Share Extension, Widgets, and Shortcuts App Intents.
