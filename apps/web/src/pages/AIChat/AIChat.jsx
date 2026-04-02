import { useState, useRef, useEffect, lazy, Suspense } from 'react';
import { AIRecommendation } from '../../components/AIRecommendation.jsx';
import './AIChat.css';

// Lazy load InsightsPage to avoid circular dependencies
const InsightsPage = lazy(() => import('../Insights/InsightsPage.jsx'));

const SYSTEM_PROMPT = `You are SproutSense AI, an expert IoT plant monitoring assistant. 
You have access to real-time sensor data from an ESP32 device including soil moisture, temperature, 
humidity, light levels, and pH. Provide plant care advice, diagnose issues, and suggest optimizations.
Be concise, practical, and friendly.`;

const PLANT_TYPES = [
  { name: 'Tomato', icon: 'fa-leaf', optimalMoisture: '60-70%', optimalTemp: '20-25°C' },
  { name: 'Lettuce', icon: 'fa-leaf', optimalMoisture: '40-60%', optimalTemp: '15-20°C' },
  { name: 'Basil', icon: 'fa-leaf', optimalMoisture: '50-70%', optimalTemp: '20-27°C' },
  { name: 'Pepper', icon: 'fa-leaf', optimalMoisture: '60-70%', optimalTemp: '21-29°C' },
  { name: 'Spinach', icon: 'fa-leaf', optimalMoisture: '50-70%', optimalTemp: '15-20°C' },
];

const HEALTH_STATES = {
  healthy: { color: '#22c55e', icon: 'fa-heart-pulse', label: 'Healthy', threshold: null },
  caution: { color: '#f59e0b', icon: 'fa-exclamation-triangle', label: 'Needs Attention', threshold: 0.4 },
  critical: { color: '#ef4444', icon: 'fa-triangle-exclamation', label: 'Critical', threshold: 0.7 },
};

function TypingIndicator() {
  return (
    <div className="chat-msg assistant">
      <div className="chat-msg-avatar" aria-hidden="true">
        <i className="fa-solid fa-robot" />
      </div>
      <div className="chat-bubble typing">
        <span /><span /><span />
      </div>
    </div>
  );
}

function SensorBadge({ icon, label, value, unit, status }) {
  const statusColor = status ? HEALTH_STATES[status].color : 'var(--plant-cyan)';
  return (
    <div className="sensor-badge" style={{ borderColor: statusColor }}>
      <div className="sensor-badge-icon" style={{ color: statusColor }}>
        <i className={`fa-solid ${icon}`} />
      </div>
      <div className="sensor-badge-content">
        <span className="sensor-badge-label">{label}</span>
        <span className="sensor-badge-value">{value}{unit}</span>
      </div>
    </div>
  );
}

const QUICK_PROMPTS = [
  { icon: 'fa-heart-pulse', label: 'Is my plant healthy right now?' },
  { icon: 'fa-faucet-drip', label: 'Should I water the plant?' },
  { icon: 'fa-vial', label: 'What does my soil pH indicate?' },
  { icon: 'fa-seedling', label: 'Optimal conditions for this plant?' },
  { icon: 'fa-leaf', label: 'Why are my plant leaves yellowing?' },
  { icon: 'fa-wave-square', label: 'Analyze all sensor readings' },
];

const SENSOR_META = {
  soilMoisture: { icon: 'fa-droplet', label: 'Moisture', unit: '%' },
  temperature: { icon: 'fa-temperature-half', label: 'Temp', unit: '°C' },
  humidity: { icon: 'fa-cloud-rain', label: 'Humidity', unit: '%' },
  light: { icon: 'fa-sun', label: 'Light', unit: ' lux' },
  pH: { icon: 'fa-vial', label: 'pH', unit: '' },
};

// History Management Utilities
const historyManager = {
  save: (messages, sessionId) => {
    if (!sessionId) return;
    const entry = {
      timestamp: sessionId, // Use sessionId as the stable timestamp identity
      lastUpdated: Date.now(), // track when it was last updated
      messages: messages.filter(m => m.role && m.content),
    };
    let history = JSON.parse(localStorage.getItem('sproutsense_chat_history') || '[]');
    
    // Update existing session or append new one
    const existingIndex = history.findIndex(h => h.timestamp === sessionId);
    if (existingIndex >= 0) {
      history[existingIndex] = entry;
    } else {
      history.unshift(entry);
    }

    // Keep only 7 days of history
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    history = history.filter(h => h.lastUpdated > sevenDaysAgo || h.timestamp > sevenDaysAgo);
    localStorage.setItem('sproutsense_chat_history', JSON.stringify(history));
  },
  get: () => {
    try {
      const parsed = JSON.parse(localStorage.getItem('sproutsense_chat_history') || '[]');
      // Filter out invalid or corrupted entries that might have been saved incorrectly
      return parsed.filter(h => h && h.timestamp && h.messages && h.messages.length > 0);
    } catch {
      return [];
    }
  },
  clear: () => localStorage.removeItem('sproutsense_chat_history'),
};

// Sensor Health Calculation
const calculateSensorHealth = (sensors) => {
  if (!sensors) return 'healthy';
  const issues = [];
  if (sensors.soilMoisture !== undefined) {
    if (sensors.soilMoisture < 20 || sensors.soilMoisture > 90) issues.push('moisture');
  }
  if (sensors.temperature !== undefined) {
    if (sensors.temperature < 10 || sensors.temperature > 35) issues.push('temperature');
  }
  if (sensors.pH !== undefined) {
    if (sensors.pH < 5.5 || sensors.pH > 8.5) issues.push('pH');
  }
  if (issues.length >= 2) return 'critical';
  if (issues.length === 1) return 'caution';
  return 'healthy';
};

export default function AIChat({ sensors, defaultTab = 'chat' }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hello! I\'m your SproutSense AI assistant. I can analyze your plant data, answer questions about plant care, and help optimize your growing conditions. Ask me anything!',
      time: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('gemini_api_key') || '');
  const [showKeyPrompt, setShowKeyPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState(defaultTab); // Use defaultTab prop
  const [selectedPlant, setSelectedPlant] = useState(() => localStorage.getItem('selected_plant_type') || 'Tomato');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPlantSelector, setShowPlantSelector] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState(null);
  const [sessionId, setSessionId] = useState(() => Date.now());
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Offline/Online detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Save to history when messages change
  useEffect(() => {
    if (messages.length > 1) {
      historyManager.save(messages, sessionId);
      setChatHistory(historyManager.get()); // keep history tab up-to-date
    }
  }, [messages, sessionId]);

  // Load history on mount
  useEffect(() => {
    setChatHistory(historyManager.get());
  }, []);

  // Save selected plant to localStorage
  useEffect(() => {
    localStorage.setItem('selected_plant_type', selectedPlant);
  }, [selectedPlant]);

  const sensorHealth = calculateSensorHealth(sensors);
  const sensorContext = sensors
    ? `Current sensor readings:
- Soil Moisture: ${sensors.soilMoisture ?? 'N/A'}%
- Temperature: ${sensors.temperature ?? 'N/A'}°C
- Humidity: ${sensors.humidity ?? 'N/A'}%
- Light: ${sensors.light ?? 'N/A'} lux
- pH: ${sensors.pH ?? 'N/A'}
- Plant Type: ${selectedPlant}`
    : 'No sensor data currently available.';

  const sensorChips = sensors
    ? Object.entries(SENSOR_META)
        .filter(([key]) => sensors[key] !== undefined && sensors[key] !== null)
        .map(([key, meta]) => ({
          key,
          icon: meta.icon,
          text: `${meta.label} ${sensors[key]}${meta.unit}`,
          status: key === 'soilMoisture' && (sensors[key] < 20 || sensors[key] > 90) ? 'caution' : undefined,
        }))
    : [];

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!apiKey) {
      setShowKeyPrompt(true);
      return;
    }

    if (!isOnline) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: '📡 You\'re offline. AI features require an internet connection. Your chat history is saved locally.',
        time: new Date(),
        isError: true,
      }]);
      return;
    }

    const userMsg = { role: 'user', content: text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const resp = await fetch(`${import.meta.env.VITE_API_BASE_URL || '/api'}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          sensorContext,
          history: messages.slice(-8).map(m => ({ role: m.role, content: m.content })),
          apiKey,
        }),
      });

      const data = await resp.json();

      if (!resp.ok || !data.success) {
        throw new Error(data.error || data.message || `Server error ${resp.status}`);
      }

      const aiMsg = {
        role: 'assistant',
        content: data.reply || 'No response received.',
        time: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Sorry, I encountered an error: ${err.message}. Please check your API key in Settings.`,
        time: new Date(),
        isError: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    const area = inputRef.current;
    if (!area) return;
    area.style.height = 'auto';
    area.style.height = `${Math.min(area.scrollHeight, 140)}px`;
  };

  const formatTime = (d) => d instanceof Date
    ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : '';

  const formatHistoryDate = (timestamp) => {
    if (!timestamp) return 'Unknown Session';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return 'Invalid Date';
    const now = new Date();
    const diffHours = (now - date) / (1000 * 60 * 60);
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  const loadHistorySession = (historyEntry) => {
    setMessages(historyEntry.messages.map(m => ({
      ...m,
      time: new Date(m.time || Date.now()),
    })));
    setSessionId(historyEntry.timestamp); // assume this history session is the active
    setActiveTab('chat');
    setExpandedHistoryId(null);
  };

  const deleteHistorySession = (timestamp) => {
    const history = historyManager.get();
    const filtered = history.filter(h => h.timestamp !== timestamp);
    localStorage.setItem('sproutsense_chat_history', JSON.stringify(filtered));
    setChatHistory(filtered);
  };

  const clearAllHistory = () => {
    if (window.confirm("Are you sure you want to completely clear all AI chat history? This cannot be undone.")) {
      historyManager.clear();
      setChatHistory([]);
      setExpandedHistoryId(null);
    }
  };

  return (
    <div className="ai-chat-page">
      <div className="ai-chat-topbar">
        <div className="ai-chat-header">
          <div className="ai-chat-header-left">
            <div className="ai-avatar">
              <i className="fa-solid fa-brain" aria-hidden="true" />
            </div>
            <div>
              <h1 className="ai-chat-title">Intelligence Hub</h1>
              <p className="ai-chat-subtitle">AI chat, analytics & plant insights</p>
            </div>
          </div>

          <div className="ai-chat-header-middle">
            <button 
              className="ai-plant-selector"
              onClick={() => setShowPlantSelector(!showPlantSelector)}
              title="Select plant type for better recommendations"
            >
              <i className="fa-solid fa-leaf" />
              <span>{selectedPlant}</span>
              <i className={`fa-solid fa-chevron-down${showPlantSelector ? ' open' : ''}`} />
            </button>

            {showPlantSelector && (
              <div className="ai-plant-dropdown">
                {PLANT_TYPES.map(plant => (
                  <button
                    key={plant.name}
                    className={`ai-plant-option${selectedPlant === plant.name ? ' active' : ''}`}
                    onClick={() => {
                      setSelectedPlant(plant.name);
                      setShowPlantSelector(false);
                    }}
                  >
                    <i className={`fa-solid ${plant.icon}`} />
                    <div>
                      <span className="plant-name">{plant.name}</span>
                      <span className="plant-meta">{plant.optimalMoisture}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="ai-chat-header-meta">
            <div 
              className={`ai-status-pill${sensorHealth !== 'healthy' ? ` ${sensorHealth}` : ''}`}
              title={HEALTH_STATES[sensorHealth].label}
            >
              <i className={`fa-solid ${HEALTH_STATES[sensorHealth].icon}`} />
              <span>{HEALTH_STATES[sensorHealth].label}</span>
            </div>

            {!isOnline && (
              <div className="ai-offline-pill">
                <i className="fa-solid fa-wifi-slash" />
                <span>Offline Mode</span>
              </div>
            )}

            <span className={`ai-model-pill${apiKey ? '' : ' no-key'}`}>
              <i className="fa-solid fa-wand-magic-sparkles" />
              Gemini
            </span>
          </div>
        </div>

        <div className="ai-chat-tabs">
          <button
            className={`ai-tab${activeTab === 'chat' ? ' active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <i className="fa-solid fa-comments" />
            Chat
          </button>
          <button
            className={`ai-tab${activeTab === 'insights' ? ' active' : ''}`}
            onClick={() => setActiveTab('insights')}
          >
            <i className="fa-solid fa-chart-line" />
            Insights
          </button>
          <button
            className={`ai-tab${activeTab === 'history' ? ' active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <i className="fa-solid fa-history" />
            History ({chatHistory.length})
          </button>
        </div>

        {showKeyPrompt && !apiKey && (
          <div className="ai-key-prompt">
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
            <span>Gemini API key required. Add it in </span>
            <a href="/settings" className="ai-settings-link">Settings</a>
            <button className="ai-key-dismiss" onClick={() => setShowKeyPrompt(false)}>×</button>
          </div>
        )}
      </div>

      {activeTab === 'chat' ? (
        <div className="ai-chat-body">
          {sensorChips.length > 0 && (
            <div className="ai-sensor-display">
              <div className="ai-sensors-grid">
                {sensorChips.map((chip) => (
                  <SensorBadge
                    key={chip.key}
                    icon={SENSOR_META[chip.key].icon}
                    label={SENSOR_META[chip.key].label}
                    value={sensors[chip.key]}
                    unit={SENSOR_META[chip.key].unit}
                    status={chip.status}
                  />
                ))}
              </div>
            </div>
          )}

          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}${msg.isError ? ' error' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="chat-msg-avatar">
                    <i className="fa-solid fa-robot" aria-hidden="true" />
                  </div>
                )}
                <div className="chat-bubble">
                  <p className="chat-bubble-text">{msg.content}</p>
                  <span className="chat-bubble-time">{formatTime(msg.time)}</span>
                </div>
              </div>
            ))}
            {loading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>

          <div className="chat-composer">
            {messages.length <= 1 && (
              <div className="chat-quick-prompts">
                <div className="quick-prompts-label">Suggested questions:</div>
                {QUICK_PROMPTS.map((p) => (
                  <button
                    key={p.label}
                    className="chat-quick-btn"
                    onClick={() => {
                      setInput(p.label);
                      if (inputRef.current) {
                        inputRef.current.style.height = 'auto';
                        inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 140)}px`;
                      }
                      inputRef.current?.focus();
                    }}
                  >
                    <i className={`fa-solid ${p.icon}`} aria-hidden="true" />
                    {p.label}
                  </button>
                ))}
              </div>
            )}

            <div className="chat-input-area">
              <textarea
                ref={inputRef}
                id="ai-chat-input"
                className="chat-input"
                placeholder={apiKey ? 'Ask about your plants...' : 'Add Gemini API key in Settings to chat...'}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={!apiKey}
                aria-label="Ask SproutSense AI"
              />
              <button
                className="chat-send-btn"
                onClick={sendMessage}
                disabled={!input.trim() || loading || !apiKey}
                aria-label="Send message"
              >
                <i className="fa-solid fa-paper-plane" aria-hidden="true" />
              </button>
            </div>

            {!apiKey && (
              <p className="chat-no-key-hint">
                Add your Gemini API key in <a href="/settings">Settings</a> to enable AI chat.
              </p>
            )}
          </div>
        </div>
      ) : activeTab === 'history' ? (
        <div className="ai-history-body">
          {chatHistory.length === 0 ? (
            <div className="ai-empty-state">
              <i className="fa-solid fa-inbox" />
              <h3>No conversation history</h3>
              <p>Your chat history will appear here (retained for 7 days)</p>
            </div>
          ) : (
            <div className="ai-history-container">
              <div className="ai-history-toolbar">
                <h3 className="ai-history-title">Recent Conversations</h3>
                <button className="ai-history-clear-btn" onClick={clearAllHistory}>
                  <i className="fa-solid fa-trash-can" />
                  Clear All
                </button>
              </div>
              <div className="ai-history-list">
                {chatHistory.map((session, idx) => (
                  <div key={session.timestamp || idx} className="ai-history-item">
                    <button
                      className="ai-history-header"
                      onClick={() => setExpandedHistoryId(expandedHistoryId === session.timestamp ? null : session.timestamp)}
                    >
                      <div className="ai-history-info">
                        <span className="ai-history-date">{formatHistoryDate(session.timestamp)}</span>
                        <span className="ai-history-count">{(session.messages || []).filter(m => m.role === 'user').length} messages</span>
                      </div>
                      <div className="ai-history-actions">
                        <i className={`fa-solid fa-chevron-down${expandedHistoryId === session.timestamp ? ' open' : ''}`} />
                      </div>
                    </button>

                    {expandedHistoryId === session.timestamp && session.messages && (
                      <div className="ai-history-preview">
                        <div className="ai-history-messages">
                          {session.messages.slice(0, 3).map((msg, i) => (
                            <div key={i} className={`ai-history-message ${msg.role}`}>
                              <span className="ai-history-message-content">
                                {msg.content ? (msg.content.length > 100 ? msg.content.substring(0, 100) + '...' : msg.content) : '...'}
                              </span>
                            </div>
                          ))}
                          {session.messages.length > 3 && (
                            <span className="ai-history-more">+{session.messages.length - 3} more</span>
                          )}
                        </div>
                        <div className="ai-history-footer">
                          <button 
                            className="ai-history-load-btn"
                            onClick={() => loadHistorySession(session)}
                          >
                            <i className="fa-solid fa-arrow-up-right-from-square" />
                            Load Conversation
                          </button>
                          <button 
                            className="ai-history-delete-btn"
                            onClick={() => deleteHistorySession(session.timestamp)}
                            title="Delete this conversation"
                          >
                            <i className="fa-solid fa-trash-can" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'insights' ? (
        <Suspense fallback={
          <div style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: '2rem', marginBottom: '1rem' }} />
              <p>Loading insights...</p>
            </div>
          </div>
        }>
          <InsightsPage />
        </Suspense>
      ) : null}
    </div>
  );
}
