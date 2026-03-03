# SproutSense Navigation & Sidebar Guide

## Overview

SproutSense features a modern, accessible navigation system with a collapsible sidebar that follows industry best practices for web applications. This document outlines all navigation features and how to use them.

---

## Features

### 🎯 Collapsible Sidebar

The sidebar can be collapsed to provide more screen space while maintaining quick access to all navigation items.

**Desktop Behavior:**
- **Expanded State**: Shows full navigation with labels and branding
- **Collapsed State**: Shows icon-only navigation with tooltips on hover
- **Persistence**: Your preference is saved in browser localStorage

**Mobile Behavior:**
- **Default**: Sidebar is collapsed (hidden) by default on mobile devices
- **Overlay**: When opened, displays as an overlay with backdrop blur
- **Touch-Friendly**: Large tap targets optimized for mobile interaction

### ⌨️ Keyboard Shortcuts

Efficient navigation using keyboard shortcuts:

| Shortcut | Action |
|----------|--------|
| `Ctrl+B` (Windows/Linux) | Toggle sidebar |
| `Cmd+B` (Mac) | Toggle sidebar |
| `Escape` | Close sidebar (on mobile) |

**Visual Indicator**: When sidebar is expanded, a subtle hint displays the keyboard shortcut.

### ♿ Accessibility Features

Built with WCAG 2.1 AA compliance in mind:

1. **ARIA Labels**:
   - `role="navigation"` on sidebar
   - `aria-label="Main navigation"` for screen readers
   - `aria-expanded` state on toggle button
   - `aria-controls` linking toggle to sidebar

2. **Semantic HTML**:
   - Proper heading hierarchy (`<h2>`, `<h3>`)
   - Semantic `<nav>` elements
   - `<kbd>` elements for keyboard shortcuts

3. **Focus Management**:
   - Visible focus indicators
   - Logical tab order
   - Focus trap when sidebar is open (mobile)

4. **Screen Reader Support**:
   - Descriptive button labels
   - Status announcements for state changes
   - Keyboard hint marked with `role="note"`

### 🎨 Visual Feedback

**Toggle Button**:
- Ripple effect on hover
- Smooth rotation animation
- Clear icon change (menu ↔ close)
- Tooltip showing keyboard shortcut

**Sidebar Transitions**:
- Smooth width animation (400ms cubic-bezier)
- Fade in/out for labels
- Staggered icon animations
- Glassmorphism effect with backdrop blur

**Active State Indicators**:
- Gradient background on active page
- Color-coded icons (teal/green theme)
- Hover states with subtle lift effect

### 📱 Responsive Behavior

| Screen Size | Behavior |
|-------------|----------|
| **Desktop** (>768px) | Sidebar always visible, toggles between expanded/collapsed |
| **Tablet** (≤768px) | Sidebar hidden by default, opens as overlay |
| **Mobile** (<480px) | Sidebar hidden, full-screen overlay when opened |

**Automatic Adaptation**:
- Detects screen size on load and resize
- Saves collapsed state per device type
- Maintains state when switching between pages

### 🔄 State Persistence

Your sidebar preference is automatically saved:

```javascript
// Saved to localStorage
{
  "sidebarCollapsed": "true" // or "false"
}
```

**Benefits**:
- Preference persists across browser sessions
- Works across all pages in the app
- Syncs with device type (mobile stays collapsed)

---

## Navigation Structure

### Main Menu Items

1. **🏠 Home** - Landing page with features and information
2. **📊 Sensors** - Real-time sensor readings and monitoring
3. **🎛️ Controls** - Manual watering controls and automation
4. **🤖 AI** - AI-powered plant disease detection and recommendations
5. **⚙️ Config** - System configuration and settings

### Additional Controls

- **Theme Toggle** - Switch between dark/light mode
- **Connection Indicator** - Real-time WebSocket connection status

---

## Usage Examples

### Opening/Closing Sidebar

**Method 1: Click/Tap**
```
Click the menu icon (☰) in the top navbar
```

**Method 2: Keyboard**
```
Press Ctrl+B (Windows/Linux) or Cmd+B (Mac)
```

**Method 3: Mobile Overlay**
```
Tap anywhere outside the sidebar to close
```

### Navigating Between Pages

**Method 1: Click Navigation**
```
1. Open sidebar (if collapsed)
2. Click desired page icon/label
3. Page loads with smooth transition
```

**Method 2: Keyboard Navigation**
```
1. Tab to sidebar links
2. Use arrow keys to move between items
3. Press Enter to navigate
```

---

## Technical Implementation

### Technologies Used

- **React 18**: Component architecture
- **React Router v6**: Client-side routing
- **CSS Variables**: Dynamic theming
- **LocalStorage API**: State persistence
- **CSS Transitions**: Smooth animations
- **ARIA**: Accessibility standards

### Performance Optimizations

1. **useCallback**: Memoized toggle functions
2. **CSS Transitions**: Hardware-accelerated animations
3. **Debounced Resize**: Efficient window resize handling
4. **Lazy Loading**: Code splitting for routes

### Browser Support

- ✅ Chrome 90+ (full support)
- ✅ Firefox 88+ (full support)
- ✅ Safari 14+ (full support)
- ✅ Edge 90+ (full support)
- ⚠️ IE 11 (not supported, ES6+ required)

---

## Customization

### Changing Sidebar Width

Edit `App.css`:

```css
/* Expanded width */
.app-shell {
  grid-template-columns: 260px 1fr; /* default: 260px */
}

/* Collapsed width */
.app-shell.sidebar-collapsed {
  grid-template-columns: 86px 1fr; /* default: 86px */
}
```

### Modifying Keyboard Shortcut

Edit `App.jsx`:

```javascript
// Change from Ctrl+B to Ctrl+M
if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
  e.preventDefault();
  toggleSidebar();
}
```

### Adjusting Animation Speed

Edit `App.css`:

```css
.sidebar {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  /* Faster: 0.2s, Slower: 0.6s */
}
```

---

## Best Practices Implemented

### ✅ UX Design Standards

1. **Discoverability**: Toggle button prominently placed in navbar
2. **Feedback**: Visual and state changes clearly indicated
3. **Consistency**: Behavior matches user expectations (Gmail, Slack patterns)
4. **Efficiency**: Keyboard shortcuts for power users
5. **Flexibility**: Works across all device sizes

### ✅ Accessibility Standards (WCAG 2.1)

1. **Perceivable**: Clear visual indicators and screen reader support
2. **Operable**: Keyboard accessible, sufficient time for interactions
3. **Understandable**: Predictable behavior, clear labeling
4. **Robust**: Works with assistive technologies

### ✅ Performance Standards

1. **Smooth Animations**: 60fps transitions using CSS transforms
2. **No Layout Shift**: Stable layouts during state changes
3. **Fast Interactions**: < 100ms response time for toggle
4. **Efficient Storage**: Minimal localStorage usage

---

## Troubleshooting

### Sidebar Won't Toggle

**Issue**: Toggle button doesn't respond
**Solution**: Check browser console for JavaScript errors

### State Not Persisting

**Issue**: Sidebar state resets on page refresh
**Solution**: Ensure localStorage is enabled in browser settings

### Keyboard Shortcut Not Working

**Issue**: Ctrl+B doesn't toggle sidebar
**Solution**: 
- Check if another browser extension is using the same shortcut
- Try Cmd+B on Mac instead of Ctrl+B

### Mobile Overlay Not Closing

**Issue**: Can't close sidebar on mobile by tapping outside
**Solution**: Ensure JavaScript is enabled and no conflicting touch handlers

---

## Future Enhancements

Potential improvements for future versions:

- [ ] Swipe gestures for mobile sidebar control
- [ ] Customizable keyboard shortcuts
- [ ] Sidebar width adjustment (drag to resize)
- [ ] Pin/unpin specific nav items
- [ ] Recent pages history
- [ ] Search within navigation

---

## Support

For issues or questions about the navigation system:

1. Check this documentation
2. Review browser console for errors
3. Test in different browsers
4. Check for localStorage quota issues
5. Verify ARIA support in assistive technologies

---

*Last Updated: March 2, 2026*
*Version: 1.0.0*
