# Design System: OPERON Precision Tokens & Components

**Document Version:** 1.0.0  
**Authors:** Agent E (Visual Design) & Agent D (UX Architecture)  
**Aesthetic Anchor:** "Apple-Level Refinement meets Precision Linux Rice"  

---

## 1. Design Token Taxonomy

### 1.1 Color Tokens (Dark Theme Baseline)
Operon uses a layered 4-tier dark neutral surface architecture:

```css
:root {
  /* Tier 0: Deep Canvas Background */
  --op-surface-0: #0a0c0e;
  
  /* Tier 1: Primary Surface (Cards, Left Navigation, Sidebar) */
  --op-surface-1: #121518;
  
  /* Tier 2: Elevated Surface (Action Rows, Modals, Flyouts) */
  --op-surface-2: #1a1e22;
  
  /* Tier 3: High-Luminance Interactive Surface (Active rows, buttons) */
  --op-surface-3: #23282e;

  /* Borders & Dividers */
  --op-border-faint: rgba(255, 255, 255, 0.05);
  --op-border-subtle: rgba(255, 255, 255, 0.10);
  --op-border-strong: rgba(255, 255, 255, 0.18);
  --op-border-focus: #38bdf8;

  /* Typography */
  --op-text-primary: #f1f5f9;
  --op-text-secondary: #94a3b8;
  --op-text-tertiary: #64748b;
  --op-text-inverse: #0f172a;

  /* Semantic Accents */
  --op-accent: #38bdf8;
  --op-accent-rgb: 56, 189, 248;
  --op-accent-hover: #0ea5e9;
  --op-accent-glow: rgba(56, 189, 248, 0.16);
  
  --op-success: #34d399;
  --op-success-glow: rgba(52, 211, 153, 0.15);
  
  --op-warning: #fbbf24;
  --op-warning-glow: rgba(251, 191, 36, 0.15);

  --op-danger: #f87171;
  --op-danger-glow: rgba(248, 113, 113, 0.15);

  /* Elevation Shadows */
  --op-shadow-overlay: 0 20px 48px -8px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08);
  --op-shadow-card: 0 4px 12px rgba(0, 0, 0, 0.45), 0 0 0 1px rgba(255, 255, 255, 0.05);
}
```

### 1.2 Multi-Theme Matrix
1. **Graphite (Default Dark):** Deep charcoal with cool slate undertones.
2. **Midnight Slate:** Subtle navy-black undertones with ice blue accents.
3. **OLED Black:** Pure `#000000` surface 0 with high-contrast sharp borders, optimized for mobile battery and OLED displays.
4. **Lunar Light:** Crisp platinum-gray light theme (`#f8fafc` canvas, `#ffffff` cards) with deep obsidian text.

---

## 2. Motion Tokens & Micro-Interactions

```css
:root {
  /* Fast Micro-Interaction (Buttons, hovers, chips) */
  --op-anim-fast: 100ms cubic-bezier(0.16, 1, 0.3, 1);
  
  /* Medium Transitions (List insertions, search filtering, panel slide) */
  --op-anim-med: 180ms cubic-bezier(0.16, 1, 0.3, 1);

  /* Modal / HUD Overlay Reveal */
  --op-anim-overlay: 220ms cubic-bezier(0.16, 1, 0.3, 1);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --op-anim-fast: 0ms !important;
    --op-anim-med: 0ms !important;
    --op-anim-overlay: 40ms linear !important;
  }
}
```

---

## 3. Core Component Catalog

### 3.1 Global Quick Command HUD (Desktop)
- Centered floating window (Width: `640px`, Max-Height: `480px`).
- Search Input: Top fixed bar, 16px text, leading search icon, trailing keyboard badge (`Esc to dismiss`).
- Filter Chips: Instant horizontal pills (`All`, `Clipboard`, `Files`, `Text`, `Dev`, `System`).
- Results List: Keyboard-navigable list items with action icon, title, description, category badge, and hotkey tag (`Enter` to run, `Tab` for options).
- Detail Inspector Pane (Expandable): Shows input/output preview, execution history, and required permissions.

### 3.2 Recipe Card
- Surface: `--op-surface-1` with 1px border `--op-border-faint`.
- Hover State: Border switches to `--op-border-subtle` with subtle 2px upward spring shift.
- Action: Direct one-click "Run" button with real-time execution spinner and success checkmark.
- Badges: Category icon, platform availability badges (`Win`, `Mac`, `Android`, `iOS`), and capability chips.

### 3.3 Execution Toast / Activity Indicator
- Floating non-intrusive pill docked to top-right or bottom-center.
- Shows real-time execution step (`"Stripping EXIF metadata: 14/20 images..."`).
- Instant undo button for reversible operations (`"Renamed 8 files • Undo"`).
