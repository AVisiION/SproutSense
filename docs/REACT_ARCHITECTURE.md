# React Component Architecture

## Component Hierarchy

```
└── index.html
    └── #root
        └── <App />  ⚙️ Main application component
            │
            ├── <Header isConnected={boolean} />  📡 Connection status
            │
            └── <div className="dashboard">
                │
                ├── <SensorCard sensors={object} />  🌡️ Real-time readings
                │   └── Displays: moisture, temp, humidity, light
                │
                ├── <ControlCard  💧 Watering controls
                │   pumpActive={boolean}
                │   onStartWatering={function}
                │   onStopWatering={function} />
                │
                ├── <AIRecommendation />  🤖 AI insights
                │   └── Auto-fetches every 30 seconds
                │
                ├── <ConfigCard onNotification={function} />  ⚙️ Settings
                │   └── Threshold & auto-mode configuration
                │
                └── <Notification  🔔 Toast messages
                    message={string}
                    type={string}
                    onClose={function} />
```

## Data Flow Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                           App.jsx                                │
│                                                                  │
│  State:                                                          │
│  • sensors: { soilMoisture, temperature, humidity, light }      │
│  • pumpActive: boolean                                           │
│  • notification: { message, type }                               │
│                                                                  │
│  Hooks:                                                          │
│  • useWebSocket(handleWebSocketMessage)                          │
│  • useEffect → fetchData() every 5 seconds                       │
│                                                                  │
│  Methods:                                                        │
│  • handleStartWatering()                                         │
│  • handleStopWatering()                                          │
│  • showNotification(message, type)                               │
│                                                                  │
└────┬──────────────────┬───────────────┬──────────────┬──────────┘
     │                  │               │              │
     ▼                  ▼               ▼              ▼
┌─────────┐      ┌──────────┐    ┌──────────┐   ┌──────────┐
│ Header  │      │  Sensor  │    │ Control  │   │   AI     │
│         │      │   Card   │    │   Card   │   │  Recom   │
│ Props:  │      │          │    │          │   │          │
│ • is    │      │ Props:   │    │ Props:   │   │ Props:   │
│   Conn  │      │ • sensors│    │ • pump   │   │ (none)   │
│   ected │      │          │    │   Active │   │          │
│         │      │          │    │ • onStart│   │ Internal:│
└─────────┘      │          │    │ • onStop │   │ • AI API │
                 │          │    │          │   │ • auto   │
                 │          │    │          │   │   refresh│
                 └──────────┘    └──────────┘   └──────────┘
                              
     ┌────────────┐           ┌──────────────┐
     │   Config   │           │ Notification │
     │    Card    │           │              │
     │            │           │ Props:       │
     │ Props:     │           │ • message    │
     │ • onNoti   │           │ • type       │
     │   fication │           │ • onClose    │
     │            │           │              │
     │ Internal:  │           │ Auto-dismiss │
     │ • Config   │           │ after 3 sec  │
     │   API      │           └──────────────┘
     └────────────┘
```

## State Management Flow

### Sensor Update via WebSocket
```
WebSocket Event
      ↓
useWebSocket hook
      ↓
handleWebSocketMessage(data)
      ↓
setSensors(data.payload)  ← State update
      ↓
React Re-render
      ↓
<SensorCard sensors={sensors} />  ← Receives new props
      ↓
UI updates automatically
```

### User Action Flow (Start Watering)
```
User clicks "Water Now" button
      ↓
<ControlCard onStartWatering={handleStartWatering} />
      ↓
handleStartWatering() called in App
      ↓
wateringAPI.start() → POST /api/water/start
      ↓
Backend processes request
      ↓
Backend sends WebSocket event: "watering_started"
      ↓
useWebSocket receives event
      ↓
handleWebSocketMessage({ type: 'watering_started' })
      ↓
setPumpActive(true)
showNotification('Watering started', 'success')
      ↓
React Re-renders
      ↓
<ControlCard pumpActive={true} />  ← Button disabled
<Notification message="..." type="success" />  ← Shows toast
```

## React Hooks Usage

### In App.jsx
```jsx
import { useState, useEffect, useCallback } from 'react';

// State management
const [sensors, setSensors] = useState(null);
const [pumpActive, setPumpActive] = useState(false);

// WebSocket with custom hook
const { isConnected } = useWebSocket(handleWebSocketMessage);

// Auto-refresh data
useEffect(() => {
  fetchData();
  const interval = setInterval(fetchData, 5000);
  return () => clearInterval(interval); // Cleanup
}, []);

// Memoized callback for WebSocket
const handleWebSocketMessage = useCallback((data) => {
  // Handle WebSocket events
}, []);
```

### In AIRecommendation.jsx
```jsx
const [recommendation, setRecommendation] = useState(null);
const [loading, setLoading] = useState(false);

useEffect(() => {
  fetchRecommendation();
  const interval = setInterval(fetchRecommendation, 30000);
  return () => clearInterval(interval);
}, []);
```

### In ConfigCard.jsx
```jsx
const [threshold, setThreshold] = useState(30);
const [autoMode, setAutoMode] = useState(false);

useEffect(() => {
  // Load config on mount
  fetchConfig();
}, []);
```

### Custom useWebSocket Hook
```jsx
export function useWebSocket(onMessage) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    connect();
    
    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [onMessage]);

  return { isConnected };
}
```

## Component Props Interface

### Header
```typescript
interface HeaderProps {
  isConnected: boolean;
}
```

### SensorCard
```typescript
interface SensorCardProps {
  sensors: {
    soilMoisture?: number;
    temperature?: number;
    humidity?: number;
    light?: number;
  } | null;
}
```

### ControlCard
```typescript
interface ControlCardProps {
  pumpActive: boolean;
  onStartWatering: () => void;
  onStopWatering: () => void;
}
```

### AIRecommendation
```typescript
interface AIRecommendationProps {
  // No props - manages own state
}
```

### ConfigCard
```typescript
interface ConfigCardProps {
  onNotification?: (message: string, type: string) => void;
}
```

### Notification
```typescript
interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}
```

## API Integration

### Organized by Domain
```javascript
// src/utils/api.js

export const sensorAPI = {
  getLatest: async () => {...},
  getHistory: async (hours) => {...}
};

export const wateringAPI = {
  start: async (deviceId) => {...},
  stop: async (deviceId) => {...},
  getStatus: async (deviceId) => {...},
  getLogs: async (limit) => {...}
};

export const configAPI = {
  get: async (deviceId) => {...},
  update: async (deviceId, config) => {...}
};

export const aiAPI = {
  getRecommendation: async (deviceId) => {...}
};
```

### Usage in Components
```jsx
import { sensorAPI } from '../utils/api';

const response = await sensorAPI.getLatest();
const sensors = response.data || response;
setSensors(sensors);
```

## Event Handling

### Button Click Events
```jsx
<button onClick={handleStartWatering}>
  Water Now
</button>
```

### Form Input Events
```jsx
<input 
  type="number"
  value={threshold}
  onChange={(e) => setThreshold(Number(e.target.value))}
/>
```

### Checkbox Events
```jsx
<input 
  type="checkbox"
  checked={autoMode}
  onChange={(e) => setAutoMode(e.target.checked)}
/>
```

## Conditional Rendering Patterns

### Show/Hide Based on State
```jsx
{notification.message && (
  <Notification {...notification} />
)}
```

### Disable Button Based on State
```jsx
<button 
  disabled={pumpActive}
  onClick={onStartWatering}
>
  Water Now
</button>
```

### Loading States
```jsx
<button disabled={loading}>
  {loading ? 'Saving...' : 'Save Settings'}
</button>
```

### Optional Chaining for Safe Data Access
```jsx
<span>{sensors?.soilMoisture ?? '--'}%</span>
```

## Styling Strategy

### CSS Modules Approach
- Global styles in `App.css`
- CSS variables for theming
- BEM-like class naming
- No CSS-in-JS (keep it simple)

### Dynamic Classes
```jsx
<div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
  {isConnected ? '✓ Connected' : '✗ Disconnected'}
</div>
```

### Conditional Styling
```jsx
<span className={`status-indicator ${pumpActive ? 'active' : ''}`}>
  {pumpActive ? 'ON' : 'OFF'}
</span>
```

## Performance Considerations

### useCallback for Stable References
```jsx
const handleWebSocketMessage = useCallback((data) => {
  // Function won't recreate on every render
}, []);
```

### useRef for WebSocket Connection
```jsx
const wsRef = useRef(null);
// Persists across renders without causing re-renders
```

### Cleanup in useEffect
```jsx
useEffect(() => {
  const interval = setInterval(fetchData, 5000);
  return () => clearInterval(interval); // Prevents memory leaks
}, []);
```

## Error Handling

### Try-Catch in Async Functions
```jsx
const handleStartWatering = async () => {
  try {
    await wateringAPI.start();
    showNotification('Watering command sent', 'success');
  } catch (error) {
    showNotification('Failed to start watering', 'error');
  }
};
```

### WebSocket Error Handling
```jsx
ws.onerror = (error) => {
  console.error('WebSocket error:', error);
  setIsConnected(false);
};
```

---

**This architecture provides:**
- ✅ Clear separation of concerns
- ✅ Reusable components
- ✅ Predictable data flow
- ✅ Easy to test and maintain
- ✅ Scalable for future features
