# Color Palette Reference

## Main Brand Colors

| Variable | Light | Dark |
|----------|-------|------|
| **Primary Navy** | `#132F45` | `#0d1b2a` (page) / `#112233` (surface) |
| **Accent Blue** | `#32667F` | `#7aafc4` |
| **Gold/Amber** | `#EEA23A` / `#F3B940` / `#d9a300` | `#F3B940` / `#fffd18` |
| **Orange** | `#EA8B33` | `#fffd18` |

---

## Light Theme (`:root`)

| Variable | Value | Usage |
|----------|-------|-------|
| `--bg-page` | `#f0f6fa` | Page background |
| `--bg-surface` | `#ffffff` | Card/surface background |
| `--bg-sidebar` | `#132F45` | Sidebar background (navy) |
| `--bg-topbar` | `#ffffff` | Topbar background |
| `--bg-hover` | `rgba(255, 255, 255, 0.15)` | Hover overlay |
| `--bg-active` | `rgba(255, 255, 255, 0.2)` | Active overlay |
| `--bg-input` | `#ffffff` | Input background |
| `--bg-subtle` | `#f6fafd` | Subtle background variations |
| `--bg-cover-overlay` | `rgba(0, 0, 0, 0.4)` | Cover overlay |
| `--border` | `#dde8ef` | Default border |
| `--border-light` | `#edf3f7` | Lighter borders |
| `--border-sidebar` | `#1d3f57` | Sidebar borders |
| `--text-primary` | `#132F45` | Main text |
| `--text-secondary` | `#32667F` | Secondary text |
| `--text-muted` | `#405b6b` | Muted/disabled text |
| `--text-on-sidebar` | `#a0c4d8` | Text on sidebar |
| `--accent-danger` | `#cc1f1f` | Error/danger state |
| `--accent-amber` | `#1D3067` | Amber accent |
| `--accent-orange` | `#1D3067` | Orange accent |
| `--accent-gold` | `#d9a300` | Gold accent |
| `--status-green` | `#205733` | Success/green status |
| `--status-red` | `#cc1f1f` | Error/red status |

### Shadows (Light)

| Variable | Value |
|----------|-------|
| `--shadow-sm` | `0 1px 3px rgba(19,47,69,0.06)` |
| `--shadow-md` | `0 4px 12px rgba(19,47,69,0.10)` |
| `--shadow-lg` | `0 8px 24px rgba(19,47,69,0.13)` |
| `--shadow-xl` | `0 24px 60px rgba(0,0,0,0.25)` |
| `--shadow-hover` | `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)` |

---

## Dark Theme (`.dark`)

| Variable | Value | Usage |
|----------|-------|-------|
| `--bg-page` | `#0d1b2a` | Page background |
| `--bg-surface` | `#112233` | Card/surface background |
| `--bg-sidebar` | `#0a1520` | Sidebar background (darker navy) |
| `--bg-topbar` | `#112233` | Topbar background |
| `--bg-hover` | `rgba(255, 255, 255, 0.08)` | Hover overlay |
| `--bg-active` | `rgba(255, 255, 255, 0.12)` | Active overlay |
| `--bg-input` | `#1a2e42` | Input background |
| `--bg-subtle` | `#0d1b2a` | Subtle background |
| `--bg-cover-overlay` | `rgba(0, 0, 0, 0.5)` | Cover overlay |
| `--border` | `#1e3448` | Default border |
| `--border-light` | `#1a2e42` | Lighter borders |
| `--border-sidebar` | `#162840` | Sidebar borders |
| `--text-primary` | `#e2ecf4` | Main text |
| `--text-secondary` | `#7aafc4` | Secondary text |
| `--text-muted` | `#3d6880` | Muted/disabled text |
| `--text-on-sidebar` | `#5a8fa8` | Text on sidebar |
| `--accent-amber` | `#1D3067` | Amber accent |
| `--accent-orange` | `#fffd18` | Orange accent |
| `--accent-gold` | `#F3B940` | Gold accent |

### Shadows (Dark)

| Variable | Value |
|----------|-------|
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.3)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.35)` |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.4)` |
| `--shadow-xl` | `0 24px 60px rgba(0,0,0,0.5)` |

---

## Tailwind CSS Semantic Tokens

| Token | Light (HSL) | Dark (HSL) |
|-------|-------------|------------|
| `--primary` | `25 60% 30%` (gold/navy) | `210 40% 65%` (blue) |
| `--primary-foreground` | `0 0% 100%` (white) | `0 0% 100%` |
| `--secondary` | `0 0% 96%` (near white) | `210 30% 15%` (dark blue) |
| `--secondary-foreground` | `0 0% 25%` (dark gray) | `0 0% 98%` |
| `--muted` | `0 0% 96%` | `210 30% 15%` |
| `--muted-foreground` | `210 40% 50%` | `210 40% 65%` |
| `--accent` | `25 60% 30%` | `210 40% 65%` |
| `--accent-foreground` | `0 0% 100%` | `0 0% 100%` |
| `--destructive` | `0 72% 51%` (red) | `0 62% 30%` (darker red) |
| `--destructive-foreground` | `0 0% 100%` | `0 0% 98%` |
| `--ring` | `25 60% 30%` | `210 40% 65%` |
| `--radius` | `0.5rem` | `0.5rem` |

### Shadcn Token Mappings

```css
--background: var(--bg-page);
--foreground: var(--text-primary);
--card: var(--bg-surface);
--card-foreground: var(--text-primary);
--popover: var(--bg-surface);
--popover-foreground: var(--text-primary);
--input: var(--bg-input);
```

---

## Glass Effects

| Variable | Light | Dark |
|----------|-------|------|
| `--glass-bg` | `rgba(255, 255, 255, 0.7)` | `rgba(17, 34, 51, 0.7)` |
| `--glass-border` | `rgba(255, 255, 255, 0.3)` | `rgba(255, 255, 255, 0.1)` |

---

## Scrollbar Styles

```css
/* Styled scrollbar (defined in index.css) */
.styled-scroll {
  scrollbar-width: thin;
  scrollbar-color: var(--text-secondary) transparent;
}

.styled-scroll::-webkit-scrollbar {
  width: 5px;
}

.styled-scroll::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 999px;
  margin-top: 4px;
  margin-bottom: 4px;
}

.styled-scroll::-webkit-scrollbar-thumb {
  background-color: var(--text-secondary);
  border-radius: 999px;
  transition: background-color 0.2s ease;
}

.styled-scroll::-webkit-scrollbar-thumb:hover {
  background-color: var(--accent-amber);
}

/* Hidden scrollbar */
.scrollbar-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scrollbar-none::-webkit-scrollbar {
  display: none;
}
```

## Toast Styles

```javascript
// Status colors
success: "bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200"
error: "bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200"
warning: "bg-yellow-50 text-yellow-800 dark:bg-yellow-950/30 dark:text-yellow-200"
info: "bg-blue-50 text-blue-800 dark:bg-blue-950/30 dark:text-blue-200"
```

## Button Variants (Shadcn-style)

```css
/* Button variants using semantic tokens */
default: "bg-primary text-primary-foreground hover:bg-primary/90"
destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground"
secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80"
ghost: "hover:bg-accent hover:text-accent-foreground"
link: "text-primary underline-offset-4 hover:underline"

/* Sizes */
default: "h-10 px-4 py-2"
sm: "h-9 rounded-md px-3"
lg: "h-11 rounded-md px-8"
icon: "h-10 w-10"
```

## Usage Notes

- **Theme Toggle**: Uses `class` strategy via `useTheme()` hook in `src/hooks/useTheme.js`
- **CSS Variables**: Defined in `src/index.css` with `:root` for light and `.dark` for dark mode
- **Tailwind Integration**: Configured in `tailwind.config.js` for Shadcn-style semantic tokens
- **Border Radius**: Uses `0.5rem` as base, with `lg`, `md`, `sm` scales calculated