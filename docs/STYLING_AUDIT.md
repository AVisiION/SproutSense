# SproutSense Frontend Styling Audit

**Date:** April 9, 2026  
**Scope:** Complete analysis of CSS files, color definitions, theme implementation, and styling patterns

---

## 1. CSS Files & Locations

### Core Styling Files
- [apps/web/src/App.css](apps/web/src/App.css) - Main entry point, imports all stylesheets
- [apps/web/src/style.css](apps/web/src/style.css) - **Legacy v2 color system** (still active)

### Design System & Variables
- [apps/web/src/styles/variables.css](apps/web/src/styles/variables.css) - **Primary v3 system** with dark/light modes
- [apps/web/src/styles/global.css](apps/web/src/styles/global.css) - Global resets, body styles, ambient glow layers
- [apps/web/src/styles/theme-transitions.css](apps/web/src/styles/theme-transitions.css) - Theme switch animations
- [apps/web/src/styles/light-glass.css](apps/web/src/styles/light-glass.css) - Light mode overrides
- [apps/web/src/styles/typography.css](apps/web/src/styles/typography.css) - Font & text styles

### Component Styles
- [apps/web/src/styles/buttons.css](apps/web/src/styles/buttons.css) - Button variants & hover effects
- [apps/web/src/styles/card.css](apps/web/src/styles/card.css) - Base card & dashboard grid
- [apps/web/src/styles/forms.css](apps/web/src/styles/forms.css) - Input fields, selects, toggles, range sliders
- [apps/web/src/styles/sensorcard.css](apps/web/src/styles/sensorcard.css) - Sensor reading cards
- [apps/web/src/styles/controlcard.css](apps/web/src/styles/controlcard.css) - Water control cards
- [apps/web/src/styles/configcard.css](apps/web/src/styles/configcard.css) - Configuration cards
- [apps/web/src/styles/notification.css](apps/web/src/styles/notification.css) - Toast notifications
- [apps/web/src/styles/responsive.css](apps/web/src/styles/responsive.css) - Mobile/tablet media queries
- [apps/web/src/styles/AIrecommendation.css](apps/web/src/styles/AIrecommendation.css) - AI recommendation styling

### Page-Specific Styles
- [apps/web/src/pages/AIChat/AIChat.css](apps/web/src/pages/AIChat/AIChat.css) - AI chat interface
- [apps/web/src/pages/ESP32Status/ESP32StatusPage.css](apps/web/src/pages/ESP32Status/ESP32StatusPage.css) - ESP32 status page
- [apps/web/src/pages/Settings/SettingsPage.css](apps/web/src/pages/Settings/SettingsPage.css) - Settings page
- [apps/web/styles/AdminLayout.css](apps/web/styles/AdminLayout.css) - Admin dashboard layout

### Layout Styles
- [apps/web/src/components/layout/styles/Layout.css](apps/web/src/components/layout/styles/Layout.css) - Main layout container
- [apps/web/src/components/layout/styles/Sidebar.css](apps/web/src/components/layout/styles/Sidebar.css) - Sidebar navigation

---

## 2. Current Color Systems

### System v3 (PRIMARY) - variables.css
Well-structured CSS custom properties with dark/light modes.

#### Dark Mode (Default)
```css
/* ── BACKGROUNDS ── */
--bg-gradient        : linear-gradient(145deg, #020905 0%, #040e08 50%, #071510 80%, #020905 100%);
--bg-color           : #020905;
--bg-secondary       : #040e08;
--bg-tertiary        : #071510;

/* ── BRAND ACCENTS ── */
--accent-primary     : #3A8F3E;  /* Primary green */
--accent-hover       : #2F7533;
--accent-secondary   : #0A9E94;  /* Teal */
--accent-cyan        : #0A9E94;

/* ── PLANT TOKENS ── */
--plant-green        : #4EA852;
--plant-teal         : #0A9E94;
--plant-cyan         : #18BCAF;
--plant-moss         : #2F7533;
--plant-canopy       : #3A8F3E;
--plant-mint         : #7DB880;
--plant-deep         : #1F5C23;

/* ── STATUS ── */
--success-color      : #3A8F3E;
--warning-color      : #E6AC00;
--danger-color       : #CC3333;
--info-color         : #0A9E94;
--orchid-color       : #C86EC4;

/* ── TEXT ── */
--text-primary       : #C8DCC8;
--text-secondary     : rgba(170, 200, 170, 0.72);
--text-tertiary      : rgba(120, 160, 122, 0.52);
--text-muted         : rgba(85, 125, 87, 0.38);
--text-inverse       : #020905;

/* ── GLASS MORPHISM ── */
--glass-color        : rgb(0 0 0 / 3%);
--glass-color-strong : rgb(0 0 0 / 6%);
--glass-blur         : 22px;
--glass-saturate     : 160%;
--glass-border       : 1px solid rgba(255, 255, 255, 0.10);
--glass-border-strong: 1px solid rgba(58, 143, 62, 0.18);
```

#### Light Mode ([data-theme="light"])
```css
/* ── BACKGROUNDS ── */
--bg-gradient        : linear-gradient(145deg, #EBF5EC 0%, #DCF0DF 40%, #C9E6CD 70%, #EBF5EC 100%);
--bg-color           : #EBF5EC;
--bg-secondary       : #DCF0DF;
--bg-tertiary        : #C9E6CD;

/* ── BRAND ACCENTS ── */
--accent-primary     : #2E7D32;  /* Darker green */
--accent-secondary   : #00695C;  /* Darker teal */
--accent-cyan        : #00695C;

/* ── PLANT TOKENS ── */
--plant-green        : #388E3C;
--plant-teal         : #00897B;
--plant-cyan         : #00ACC1;
--plant-moss         : #43A047;
--plant-mint         : #C8E6C9;

/* ── TEXT ── */
--text-primary       : #0D1F10;  /* Dark green-tinted */
--text-secondary     : rgba(20, 55, 24, 0.80);
--text-tertiary      : rgba(30, 75, 34, 0.58);
--text-muted         : rgba(50, 100, 55, 0.44);

/* ── GLASS MORPHISM ── */
--glass-color        : rgb(0 0 0 / 3%);
--glass-blur         : 20px;
--glass-saturate     : 180%;
--glass-border       : 1px solid rgba(255, 255, 255, 0.72);
```

### System v2 (LEGACY) - style.css
Older color system still imported. Should be deprecated.

```css
/* ── Brand Cyan/Green Palette ── */
--c-cyan-500         : #06b6d4;
--c-cyan-400         : #22d3ee;
--c-green-500        : #10b981;
--c-green-400        : #22c55e;
--c-teal-500         : #14b8a6;

/* ── Semantic Tokens ── */
--plant-teal         : var(--c-teal-500);
--plant-cyan         : var(--c-cyan-400);
--plant-green        : var(--c-green-400);

/* ── Status Colors ── */
--success-color      : var(--c-green-400);  /* #22c55e */
--warning-color      : #f59e0b;
--danger-color       : #ef4444;
--info-color         : var(--c-cyan-500);   /* #06b6d4 */
```

---

## 3. Hardcoded Colors in JSX Components

### Critical Issues: Inline Styles & Magic Numbers
Multiple components use hardcoded hex colors instead of CSS variables. These should be refactored.

#### [App.jsx](apps/web/src/App.jsx)
```javascript
// Line 84-85: Aurora animation colors
const AURORA_DARK  = ['#040E09', '#00B4A6', '#66BB6A', '#020905'];
const AURORA_LIGHT = ['#EBF5EC', '#00B4A6', '#66BB6A', '#D4EDD8'];

// Line 850, 862-863, 868-869: Chart colors
color: theme === 'dark' ? '#C8DCC8' : '#132016',
primary: theme === 'dark' ? '#3A8F3E' : '#388E3C',
secondary: theme === 'dark' ? '#020905' : '#F3FBF4',
primary: theme === 'dark' ? '#CC3333' : '#C62828',
```

#### [AIChat.jsx](apps/web/src/pages/AIChat/AIChat.jsx)
```javascript
// Line 22-24: Status colors
healthy:  { color: '#22c55e', ... },  /* green */
caution:  { color: '#f59e0b', ... },  /* amber */
critical: { color: '#ef4444', ... },  /* red */
```

#### [AIRecommendation.jsx](apps/web/src/components/AIRecommendation.jsx)
```javascript
// Line 27-30: Priority colors
critical: { color: '#ef4444', ... },
high:     { color: '#f59e0b', ... },
medium:   { color: '#22d3ee', ... },
normal:   { color: '#22c55e', ... },

// Line 37: Dynamic color selection
const color = pct >= 80 ? '#22c55e' : pct >= 50 ? '#f59e0b' : '#ef4444';

// Line 124-128: Sensor metric colors
METRICS_PALETTE = [
  { key: 'soilMoisture', ... color: '#22c55e' },   /* green */
  { key: 'temperature',  ... color: '#f59e0b' },   /* amber */
  { key: 'humidity',     ... color: '#22d3ee' },   /* cyan */
  { key: 'pH',           ... color: '#a78bfa' },   /* purple */
  { key: 'light',        ... color: '#fbbf24' },   /* yellow */
]

// Line 211-212: AI analysis status
'healthy' ? '#22c55e' : 'disease' ? '#ef4444' : '#14b8a6';
```

#### [Analytics/AnalyticsPage.jsx](apps/web/src/pages/Analytics/AnalyticsPage.jsx)
```javascript
// Line 465: Hardcoded teal color
color: '#14b8a6',

// Dynamic colors for chart series with palette.moisture, palette.flow
```

#### [ConfigCard.jsx](apps/web/src/components/ConfigCard.jsx)
```javascript
// Line 255-257: Stat tile colors
<StatTile color="#22d3ee" />     /* cyan */
<StatTile color="#22c55e" />     /* green */
<StatTile color="#a78bfa" />     /* purple */
```

#### [Aurora.jsx](apps/web/src/components/background/Aurora.jsx)
```javascript
// Line 98: Default color stops
colorStops = ['#06b6d4', '#14b8a6', '#22c55e', '#06131a']
```

---

## 4. Light Mode Implementation

### Implementation Method
- **Mechanism:** CSS custom properties with `[data-theme="light"]` attribute selector
- **Activation:** Set via `document.documentElement.setAttribute('data-theme', theme)` in [App.jsx](apps/web/src/App.jsx#L336)
- **Storage:** `localStorage.getItem('theme')` persists user preference
- **Default:** Dark mode (loaded from localStorage or defaults to 'dark')

### Light Mode Files
1. **variables.css** - Complete dark/light definitions (lines 140+)
2. **light-glass.css** - Specific light mode overrides for `.card`, `.navbar`, `.sidebar`, `.modal`, form inputs
3. **global.css** - Light mode body backgrounds and ambient glow effects

### Light Mode Limitations
- ✅ Well-defined CSS variables
- ✅ Complete ambient glow system for both modes
- ✅ Glass morphism properly adjusted for light backgrounds
- ✅ Smooth transitions via View Transitions API

---

## 5. CSS Framework

### No Tailwind CSS
- **Status:** Not in use
- **Evidence:** `package.json` has no Tailwind dependency
- **Styling:** Pure CSS with custom design system

### vite.config.js Setup
```javascript
// No specialized CSS plugin configuration
// Uses @vitejs/plugin-react for CSS-in-JS support
// Manual chunk splitting for vendor libraries (React, Charts, Icons, etc.)
```

### Design System: Glassmorphism
- **Base Pattern:** `backdrop-filter: blur() + rgba() transparency + inset highlights`
- **Used For:** Cards, buttons, navbars, modals, inputs
- **Characteristics:**
  - Soft, frosted glass aesthetic
  - Multiple blur levels (8px, 14px, 18px, 20px, 22px, 28px)
  - Saturate filter (160%-190% depending on context)
  - Inset highlights for depth

---

## 6. Color-Related Issues & Inconsistencies

### 🔴 Critical Issues

1. **Dual Color Systems Active**
   - Both `variables.css` (v3, modern) and `style.css` (v2, legacy) are imported
   - v2 never fully deprecated causes potential conflicts
   - Cleanup needed: Remove v2, update all references

2. **Massive Hardcoded Colors in JSX**
   - 40+ hardcoded hex colors scattered across component files
   - Colors like `#22c55e`, `#f59e0b`, `#ef4444`, `#22d3ee` repeated across files
   - **Not responsive to theme changes** - these will appear same in light/dark
   - Missing the v3 system's sophisticated theme handling

3. **Aurora Background Colors Not Linked to Theme**
   - [App.jsx](apps/web/src/App.jsx#L84-L85) defines separate arrays for dark/light aurora
   - Good practice, but values should be CSS variables instead
   - Currently uses hex magic numbers that are hard to maintain

4. **Missing CSS Variables for Status Colors**
   - `#22c55e` (success/healthy) appears 8+ times
   - `#ef4444` (danger/critical) appears 6+ times
   - `#f59e0b` (warning/caution) appears 5+ times
   - Should be: `--status-success`, `--status-danger`, `--status-warning` variables

5. **Sensor Metric Colors Not Themed**
   - pH color (`#a78bfa`), Light color (`#fbbf24`) hardcoded in JavaScript
   - Not accessible to theme switcher
   - Creates inconsistency across different pages

### 🟡 Moderate Issues

6. **Light Mode Overrides Using !important**
   - [light-glass.css](apps/web/src/styles/light-glass.css) uses excessive `!important` flags
   - Indicates CSS specificity problems
   - Suggests need for better cascading structure

7. **Inconsistent Border Colors**
   - Some borders use `rgba(255,255,255,0.10)` (dark mode)
   - Others use `rgba(255,255,255,0.72)` (light mode)
   - All should reference `var(--glass-border)` or `var(--glass-border-strong)`

8. **Glow Effects Not CSS Variables**
   - Inline box-shadow with rgba values
   - Should use `--glow-green`, `--glow-cyan`, etc. from v3 system
   - Multiple files define their own glow values

9. **Theme Transition Complexity**
   - View Transitions API + fallback animations in [theme-transitions.css](apps/web/src/styles/theme-transitions.css)
   - Working correctly but difficult to maintain
   - Browser compatibility considerations not documented

### 🟠 Minor Issues

10. **Select Dropdown SVG Uses Hardcoded Color**
    - [forms.css](apps/web/src/styles/forms.css): `stroke='%238ab4cc'` (cyan hardcoded)
    - Should use CSS variable or `currentColor`

11. **Aurora Component Defaults**
    - [Aurora.jsx](apps/web/src/components/background/Aurora.jsx#L98) has fallback color stops
    - Should be CSS variables defined in `variables.css`

12. **Inconsistent Glassmorphism Parameters**
    - Blur ranges from 8px to 28px
    - Saturate from 160% to 190%
    - No clear hierarchy/naming convention

---

## 7. Summary Table

| Aspect | Status | Notes |
|--------|--------|-------|
| **CSS Files** | ✅ Well-organized | 14 organized files in `src/styles/` |
| **Primary System** | ✅ v3 Complete | Full variables.css with dark/light |
| **Legacy System** | ❌ Still Active | style.css should be removed |
| **Light Mode** | ✅ Implemented | Works via `[data-theme="light"]` |
| **Dark Mode** | ✅ Default | Good system, well-structured |
| **Hardcoded Colors** | ❌ **40+ instances** | Major refactoring needed |
| **Theme Responsiveness** | ⚠️  Partial | JSX colors won't change with theme |
| **CSS Framework** | ✅ Custom | No Tailwind, pure CSS |
| **Glassmorphism** | ✅ Consistent | Well-implemented throughout |
| **Contrast/Accessibility** | ⚠️ Not audited | Needs WCAG 2.1 check |
| **Documentation** | ❌ Missing | No design system guide |

---

## 8. Recommendations

### Priority 1: Remove Legacy System
```css
/* DELETE: apps/web/src/style.css */
/* Remove import from App.css */
```

### Priority 2: Extract Component Colors to CSS Variables
Create new variables in `variables.css`:
```css
--status-success   : #3A8F3E;  /* Or use --plant-green */
--status-warning   : #E6AC00;  /* Use --warning-color */
--status-danger    : #CC3333;  /* Use --danger-color */
--status-info      : #0A9E94;  /* Use --info-color */

--sensor-moisture  : #22c55e;  /* Green (or --success-color) */
--sensor-temp      : #f59e0b;  /* Amber (or --warning-color) */
--sensor-humidity  : #22d3ee;  /* Cyan */
--sensor-ph        : #a78bfa;  /* Purple/violet */
--sensor-light     : #fbbf24;  /* Yellow/gold */
```

### Priority 3: Refactor Hardcoded Colors
- Replace all inline `color: '#22c55e'` with `color: var(--status-success)`
- Update JSX files to use CSS variables or CSS classes
- Example refactor:
  ```javascript
  // Before
  <div style={{ color: '#22c55e' }}>Healthy</div>
  
  // After
  <div className="status-healthy">Healthy</div>
  /* In CSS: .status-healthy { color: var(--status-success); } */
  ```

### Priority 4: Reduce !important Usage
- Review and understand CSS cascade in `light-glass.css`
- Remove `!important` flags and fix specificity instead

### Priority 5: Document Design System
- Create design-tokens.md with all variables
- Document glassmorphism parameters
- Provide color usage guidelines

---

## File Structure Summary

```
apps/web/src/
├── styles/               (Core design system)
│   ├── variables.css     ✅ Primary system (v3)
│   ├── global.css        ✅ Resets & ambient glow
│   ├── typography.css    ✅ Type scale
│   ├── buttons.css       ✅ Button variants
│   ├── card.css          ✅ Card base
│   ├── forms.css         ⚠️  Hardcoded dropdown color
│   ├── theme-transitions.css ✅ Animation system
│   ├── light-glass.css   ⚠️  Excessive !important
│   ├── sensorcard.css    ✅ Well-scoped
│   ├── controlcard.css   ✅ Well-scoped
│   ├── configcard.css    (Not reviewed)
│   ├── notification.css  (Not reviewed)
│   ├── responsive.css    (Not reviewed)
│   ├── AIrecommendation.css (Not reviewed)
│   └── style.css         ❌ LEGACY - Remove!
├── App.jsx              ❌ 40+ hardcoded colors in JSX
├── App.css              ✅ Good import structure
└── pages/
    ├── AIChat/          ❌ Hardcoded status colors
    ├── Analytics/       ❌ Hardcoded chart colors
    └── ...
```
