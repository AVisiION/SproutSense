# AI Assistant Redesign - Quick Reference

## Key Features Summary

### ✅ What's New
1. **Conversation History Tab**
   - 7-day retention (auto-cleanup)
   - Collapsible sessions with preview
   - Load/delete functionality
   - Persistent localStorage

2. **Plant Type Selector**
   - 5 plant types: Tomato, Lettuce, Basil, Pepper, Spinach
   - Plant-specific info (optimal moisture/temp)
   - Persists to localStorage
   - Included in AI context

3. **Sensor Health Status**
   - Green: Healthy
   - Orange: Needs attention
   - Red: Critical with pulsing animation
   - Calculated from multiple factors

4. **Offline Support**
   - Auto-detection via `navigator.onLine`
   - Graceful fallback messages
   - Visual offline indicator
   - History still accessible

5. **Modern UI/UX**
   - Responsive grid design (5→3→2→1 columns)
   - Smooth animations and transitions
   - Glassmorphism design system
   - Improved color contrast

---

## File Structure

```
AIChat.jsx (275+ lines)
├── Constants
│   ├── PLANT_TYPES (5 plant species)
│   ├── HEALTH_STATES (3 status levels)
│   ├── QUICK_PROMPTS (6 suggested questions)
│   └── SENSOR_META (5 sensor types)
├── Utilities
│   ├── historyManager { save, get, clear }
│   └── calculateSensorHealth({ sensors })
├── Components
│   ├── TypingIndicator()
│   ├── SensorBadge()
│   └── AIChat() [Main Component]
│       ├── State (messages, input, history, etc.)
│       ├── Effects (scroll, offline, history)
│       ├── Methods (sendMessage, handlers, etc.)
│       └── JSX (3 tabs: chat, insights, history)
└── Exports
    └── Default: AIChat

AIChat.css (1000+ lines)
├── CSS Variables (--plant-teal, etc.)
├── Layout
│   ├── .ai-chat-page
│   ├── .ai-chat-topbar
│   ├── .ai-chat-body
│   ├── .ai-history-body
│   └── .ai-insights-body
├── Components
│   ├── Plant Selector (.ai-plant-selector/dropdown)
│   ├── Sensor Badges (.sensor-badge grid)
│   ├── Status Pill (.ai-status-pill)
│   ├── Chat Messages (.chat-msg)
│   ├── History List (.ai-history-list/item)
│   └── Input Area (.chat-input-area)
├── Animations
│   ├── @keyframes slideDown
│   ├── @keyframes fadeIn
│   ├── @keyframes pulse
│   └── @keyframes typingDot
└── Responsive
    ├── @media (≥1200px) - Desktop
    ├── @media (768-1199px) - Tablet
    ├── @media (640-767px) - Mobile
    └── @media (<640px) - Small Mobile
```

---

## Component API

### AIChat Component Props
```javascript
<AIChat 
  sensors={{           // Current sensor readings
    soilMoisture: 65,
    temperature: 22,
    humidity: 55,
    light: 800,
    pH: 6.8
  }}
/>
```

### State Variables
```javascript
// Chat & Messages
const [messages, setMessages] = useState([])     // Conversation
const [input, setInput] = useState('')           // User input
const [loading, setLoading] = useState(false)    // Loading state

// History
const [chatHistory, setChatHistory] = useState([])  // All sessions
const [expandedHistoryId, setExpandedHistoryId] = null  // Current expand

// Plant & Settings
const [selectedPlant, setSelectedPlant] = useState()    // Plant type
const [apiKey, setApiKey] = useState()                  // Gemini API key

// Status
const [isOnline, setIsOnline] = useState(true)      // Network state
const [activeTab, setActiveTab] = useState('chat')  // Current tab
```

---

## Key Functions

### historyManager
```javascript
// Save conversation (auto-called after each message)
historyManager.save(messages)

// Get all 7-day history
const history = historyManager.get()  // Returns array of sessions

// Clear all history manually
historyManager.clear()
```

### calculateSensorHealth
```javascript
// Calculate health status from sensors
const health = calculateSensorHealth(sensors)
// Returns: 'healthy' | 'caution' | 'critical'

// Used for:
// - Status pill color coding
// - UI indicator animation
// - AI context awareness
```

### Message Sending
```javascript
const sendMessage = async () => {
  // 1. Validate input and API key
  // 2. Check online status
  // 3. Add user message
  // 4. Call backend AI endpoint
  // 5. Add AI response
  // 6. Auto-save to history
  // 7. Handle errors gracefully
}
```

---

## CSS Class Hierarchy

### Main Structure
```css
.ai-chat-page (container)
  ├── .ai-chat-topbar (header)
  │   ├── .ai-chat-header (flex row)
  │   │   ├── .ai-chat-header-left (branding)
  │   │   ├── .ai-chat-header-middle (plant selector)
  │   │   └── .ai-chat-header-meta (status pills)
  │   └── .ai-chat-tabs (tab buttons)
  │
  ├── .ai-chat-body (chat area) [ACTIVE TAB]
  │   ├── .ai-sensor-display (sensor grid)
  │   │   └── .ai-sensors-grid (responsive grid)
  │   │       └── .sensor-badge (individual sensor)
  │   ├── .chat-messages (message list)
  │   │   ├── .chat-msg (individual message)
  │   │   └── .TypingIndicator (when loading)
  │   └── .chat-composer (input area)
  │       ├── .chat-quick-prompts (suggestions)
  │       └── .chat-input-area (input + send)
  │
  ├── .ai-history-body (history panel) [ACTIVE TAB]
  │   └── .ai-history-list (collapsible sessions)
  │       └── .ai-history-item (session card)
  │
  └── .ai-insights-body (recommendations) [ACTIVE TAB]
      └── <AIRecommendation /> (existing component)
```

---

## Responsive Breakpoints

| Breakpoint | Width | Columns | Use Case |
|-----------|-------|---------|----------|
| Desktop | ≥1200px | 5 | Large monitors |
| Large Tablet | 768-1199px | 3 | iPads, large tablets |
| Small Tablet | 640-767px | 2 | Small tablets, landscape mobile |
| Mobile | <640px | 1 | Smartphones |

### Grid Template Changes
```css
/* Desktop: max 5 sensors visible */
grid-template-columns: repeat(5, 1fr)

/* Tablet: 3 columns */
grid-template-columns: repeat(3, 1fr)

/* Mobile: 2 columns */
grid-template-columns: repeat(2, 1fr)

/* Small Mobile: full width */
grid-template-columns: 1fr
```

---

## LocalStorage Schema

### Plant Type
```javascript
localStorage.getItem('selected_plant_type')  // Returns: "Tomato"
```

### Chat History
```javascript
localStorage.getItem('sproutsense_chat_history')
// Returns:
[
  {
    timestamp: 1743667200000,
    messages: [
      { role: 'user', content: '...', time: '2026-04-02T...' },
      { role: 'assistant', content: '...', time: '2026-04-02T...' }
    ]
  },
  // ... more sessions (up to 7 days)
]
```

### Auto-Cleanup
- Sessions older than 7 days automatically removed
- Runs on every `historyManager.save()` call
- `sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000`

---

## API Integration

### Backend Endpoint
```javascript
POST /api/ai/chat
Content-Type: application/json

{
  message: string,              // User message
  sensorContext: string,        // Current sensor values
  history: Array<{              // Chat history
    role: 'user' | 'assistant',
    content: string
  }>,
  apiKey: string               // Gemini API key
}
```

### Response Format
```javascript
{
  success: boolean,
  reply: string,              // AI response
  error?: string             // If not successful
}
```

---

## Common Tasks

### Add a New Plant Type
```javascript
// In PLANT_TYPES array:
const PLANT_TYPES = [
  // ... existing plants
  { 
    name: 'Cucumber', 
    icon: 'fa-leaf', 
    optimalMoisture: '60-70%', 
    optimalTemp: '18-25°C' 
  },
]
```

### Change Health Status Colors
```javascript
// In HEALTH_STATES object:
const HEALTH_STATES = {
  healthy: { color: '#22c55e', ... },    // Green
  caution: { color: '#f59e0b', ... },    // Orange
  critical: { color: '#ef4444', ... },   // Red
}
```

### Modify History Retention
```javascript
// In calculateSensorHealth, change:
const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
// To:
const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
```

### Change Sensor Thresholds
```javascript
// In calculateSensorHealth:
if (sensors.soilMoisture < 20 || sensors.soilMoisture > 90) issues.push('moisture');
// Adjust these numbers based on plant requirements
```

---

## Performance Tips

1. **History Cleanup**: Runs automatically, but can be manual if needed
2. **Message Rendering**: Use React fragments with keys for large lists
3. **CSS Animations**: Hardware-accelerated with `transform` and `opacity`
4. **Sensor Updates**: Batched updates in single render cycle
5. **LocalStorage**: Kept under 5MB with automatic cleanup

---

## Debugging

### Check History
```javascript
JSON.parse(localStorage.getItem('sproutsense_chat_history'))
```

### Check Selected Plant
```javascript
localStorage.getItem('selected_plant_type')
```

### Monitor Online Status
```javascript
import { useEffect, useState } from 'react';
const [online, setOnline] = useState(navigator.onLine);
// Listen to events...
```

### Sensor Health Calculation
```javascript
console.log(calculateSensorHealth(sensors));
// Returns: 'healthy' | 'caution' | 'critical'
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0 | 2026-04-02 | Complete redesign with history, plant selector, offline support |
| 1.0 | 2026-03-15 | Initial AI chat implementation |

---

**Last Updated**: April 2, 2026  
**Component**: AIChat.jsx & AIChat.css  
**Status**: ✅ Production Ready
