# Security Model & Threat Assessment: OPERON

**Classification:** Internal Engineering Security Directive  
**Date:** September 2026  
**Authors:** Agent L (Security Engineer) & Agent C (Adversarial Red Team)  

---

## 1. Threat Vectors & Mitigations

### Threat 1: Malicious Imported Workflows (Remote Code Execution / Supply Chain)
- **Risk:** An attacker shares an `.operon` workflow file claiming to be a "YouTube Video Downloader" that actually executes malicious shell commands or steals SSH keys.
- **Mitigations:**
  1. **Zero-Trust Import Sandbox:** Every imported workflow is quarantined. The app statically parses the workflow JSON and extracts all declared permissions and action types.
  2. **Explicit Capability Grant Modal:** Before an imported workflow is activated, the user is shown a clear, human-readable Security Audit:
     - *"This workflow requests permission to run shell commands: `curl ...`"*
     - *"This workflow requests write access to: `C:/Users/...`"*
  3. **High-Risk Action Flagging:** `system.shell_exec` and destructive file actions (`file.delete_permanent`) are flagged with a prominent warning badge and require explicit biometric or password confirmation.
  4. **No Arbitrary Script Injection:** Workflows cannot execute arbitrary untyped string scripts unless the user explicitly enters Developer Mode.

### Threat 2: Path Traversal & Symlink Attacks
- **Risk:** A malicious file action specifies paths like `../../../../Windows/System32` or targets symlinks pointing to sensitive OS directories.
- **Mitigations:**
  1. All paths are resolved to their canonical, absolute paths before execution.
  2. Operating system directories (`System32`, `/System`, `/etc`) are strictly blacklisted from automated modification.
  3. Symlinks are checked before dereferencing to prevent symlink traversal loops and escapes.

### Threat 3: Clipboard Snooping & Credential Leakage
- **Risk:** Background clipboard monitoring could unintentionally capture 1Password master passwords, credit card numbers, or cryptographic private keys.
- **Mitigations:**
  1. **Strict Opt-In:** Background clipboard listening is DISABLED by default. It requires an explicit user toggle with a clear privacy explanation.
  2. **Sensitive Content Regex Scrubbing:** The clipboard listener actively detects password patterns, API keys (`sk-...`, `ghp_...`, `Bearer ...`), and credit card numbers, automatically flagging them as sensitive and excluding them from persistent history.
  3. **Encrypted Local Storage:** Any persisted clipboard history is encrypted at rest using OS-native encryption (Windows DPAPI / CryptProtectData, macOS Keychain, Android Keystore).

### Threat 4: Poisoned AI Output & Hallucinated Destructive Commands
- **Risk:** A user asks the AI: *"Clean up my system"*, and the AI hallucinates `rm -rf /` or `del /s /q C:\Windows`.
- **Mitigations:**
  1. **Architectural Separation of Planning and Execution:** The AI model is strictly an intent compiler. It has NO OS execution privileges.
  2. It can only emit valid JSON matching the strict `IWorkflow` JSON schema.
  3. Schema validation strictly rejects invalid actions, non-whitelisted commands, and unescaped wildcard deletions.
  4. All AI-generated workflows MUST be previewed and confirmed by the user before running.

---

## 2. Permission / Capability Token Matrix

Every workflow must declare its required permissions up front:

| Capability Token | Description | Security Level | Default State |
|---|---|---|---|
| `clipboard.read` | Read text/images from OS clipboard | Medium | Requires user prompt |
| `clipboard.write` | Copy generated outputs to clipboard | Low | Granted |
| `filesystem.read` | Read specific directories (Downloads, Documents) | Medium | Sandboxed |
| `filesystem.write` | Create or modify files in designated folders | High | Explicit folder permission |
| `filesystem.recycle` | Move files to OS Recycle Bin / Trash | Medium | Granted with rollback |
| `network.request` | Make outgoing HTTP/API requests | High | Domain whitelist |
| `notifications.send` | Post OS native toasts | Low | Granted |
| `system.shell_exec` | Run terminal / shell commands (Desktop only) | **CRITICAL** | Requires Developer Mode + Confirmation |
| `system.app_launch` | Launch installed applications | Medium | Granted |

---

## 3. Secret & Credential Storage Policy
- **ZERO PLAIN TEXT CREDENTIALS:** Storing API tokens, webhook secrets, or passwords in plain text JSON or unencrypted databases is strictly prohibited.
- Desktop Windows: Managed via `Windows.Security.Credentials.PasswordVault` or `CryptProtectData` (DPAPI).
- macOS: Managed via Apple Security framework / `SecKeychainAddGenericPassword`.
- Mobile: Managed via Android EncryptedSharedPreferences / AndroidKeyStore and iOS Keychain Services.
