# SproutSense — Frontend CSS Architecture

## Directory Overview

```
web/src/
├── styles/
│   ├── globals.css       — Resets, body, html, accessibility, theme transitions
│   ├── variables.css     — All CSS custom properties (colors, spacing, tokens)
│   └── README.md         — This file
│
├── components/
│   ├── layout/
│   │   ├── Sidebar.css   — Fixed sidebar: desktop, collapsed, mobile
│   │   └── Layout.css    — App-shell grid + content margin offset
│   ├── bits/
│   │   ├── ElasticSlider.jsx  — Re-export (react-bits animated slider)
│   │   ├── ScrollVelocity.jsx — Re-export (react-bits scroll animation)
│   │   └── GlassIcon.jsx      — Re-export (glass icon wrapper)
│   ├── ElasticSlider.jsx / .css  — Elastic slider implementation
│   ├── ScrollVelocity.jsx         — Scroll velocity animation
│   ├── GlassIcon.jsx              — SVG icon in glass container
│   ├── SensorCard.jsx             — Sensor reading card
│   ├── ControlCard.jsx            — Pump / threshold controls
│   ├── AIRecommendation.jsx       — AI watering suggestion panel
│   ├── ConfigCard.jsx             — Device config form
│   ├── Navbar.jsx                 — Top navigation bar
│   ├── Header.jsx                 — Page section header
│   └── Notification.jsx           — Toast notification
│
├── pages/
│   ├── HomePage.jsx               — Dashboard overview
│   ├── RecordsPage.jsx / .css     — Sensor history table
│   ├── AlertsPage.jsx  / .css     — Active alerts list
│   ├── InsightsPage.jsx / .css    — AI insights panel
│   ├── AnalyticsPage.jsx / .css   — Charts & trends
│   ├── SettingsPage.jsx / .css    — App settings
│   └── AIChat.jsx / .css          — Gemini AI chat
│
├── App.jsx    — Routing, sidebar logic, global state
├── App.css    — Component-level shared styles (cards, buttons, sensor grid)
├── api.js     — Axios API helpers
└── main.jsx   — Vite entry point
```

## CSS Import Order

In `main.jsx`:
```js
import './styles/variables.css';
import './styles/globals.css';
import './App.css';
```

In `App.jsx`:
```js
import './components/layout/Sidebar.css';
import './components/layout/Layout.css';
```

Each page imports its own CSS at the top of the file.

## Sidebar Fixed Behavior

- **Desktop (≥ 769px):** `position: fixed`, `width: 260px`. Main `.container` has `margin-left: 260px`.
- **Collapsed (desktop):** Sidebar shrinks to `72px`. Container gets `margin-left: 72px`.
- **Mobile (≤ 768px):** Sidebar is `position: fixed` and slides in/out with `transform: translateX`. Container has `margin-left: 0`.
