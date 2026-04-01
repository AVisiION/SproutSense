import { useState, useRef, useEffect } from 'react';
import { AIRecommendation } from '../../components/AIRecommendation.jsx';
import './AIChat.css';

const SYSTEM_PROMPT = `You are SproutSense AI, an expert IoT plant monitoring assistant. 
You have access to real-time sensor data from an ESP32 device including soil moisture, temperature, 
humidity, light levels, and pH. Provide plant care advice, diagnose issues, and suggest optimizations.
Be concise, practical, and friendly.`;

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

const QUICK_PROMPTS = [
  { icon: 'fa-heart-pulse', label: 'Is my plant healthy right now?' },
  { icon: 'fa-faucet-drip', label: 'Should I water the plant?' },
  { icon: 'fa-vial', label: 'What does my soil pH indicate?' },
  { icon: 'fa-seedling', label: 'Optimal conditions for tomatoes?' },
  { icon: 'fa-leaf', label: 'Why are my plant leaves yellowing?' },
  { icon: 'fa-wave-square', label: 'Analyze all sensor readings' },
];

const SENSOR_META = {
  soilMoisture: { icon: 'fa-droplet', label: 'Moisture', unit: '%' },
  temperature: { icon: 'fa-temperature-half', label: 'Temp', unit: '\u00b0C' },
  humidity: { icon: 'fa-cloud-rain', label: 'Humidity', unit: '%' },
  light: { icon: 'fa-sun', label: 'Light', unit: ' lux' },
  pH: { icon: 'fa-vial', label: 'pH', unit: '' },
};

export default function AIChat({ sensors }) {
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
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sensorContext = sensors
    ? `Current sensor readings:
- Soil Moisture: ${sensors.soilMoisture ?? 'N/A'}%
- Temperature: ${sensors.temperature ?? 'N/A'}°C
- Humidity: ${sensors.humidity ?? 'N/A'}%
- Light: ${sensors.light ?? 'N/A'} lux
- pH: ${sensors.pH ?? 'N/A'}`
    : 'No sensor data currently available.';

  const sensorChips = sensors
    ? Object.entries(SENSOR_META)
        .filter(([key]) => sensors[key] !== undefined && sensors[key] !== null)
        .map(([key, meta]) => ({
          key,
          icon: meta.icon,
          text: `${meta.label} ${sensors[key]}${meta.unit}`,
        }))
    : [];

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    if (!apiKey) {
      setShowKeyPrompt(true);
      return;
    }

    const userMsg = { role: 'user', content: text, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Call backend AI endpoint
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

  return (
    <div className="ai-chat-page">
      <div className="ai-chat-topbar">
        <div className="ai-chat-header">
          <div className="ai-chat-header-left">
            <div className="ai-avatar">
              <i className="fa-solid fa-robot" aria-hidden="true" />
            </div>
            <div>
              <h1 className="ai-chat-title">SproutSense AI Assistant</h1>
              <p className="ai-chat-subtitle">
                Smart diagnostics, plant guidance, and live sensor-aware recommendations
              </p>
            </div>
          </div>

          <div className="ai-chat-header-meta">
            <span className="ai-live-pill">
              <i className="fa-solid fa-signal" aria-hidden="true" />
              Live AI
            </span>
            <span className="ai-model-pill">
              <i className="fa-solid fa-wand-magic-sparkles" aria-hidden="true" />
              Gemini
            </span>
          </div>

          <div className="ai-chat-tabs">
            <button
              className={`ai-tab${activeTab === 'chat' ? ' active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <i className="fa-solid fa-comments" aria-hidden="true" />
              Chat
            </button>
            <button
              className={`ai-tab${activeTab === 'recommend' ? ' active' : ''}`}
              onClick={() => setActiveTab('recommend')}
            >
              <i className="fa-solid fa-lightbulb" aria-hidden="true" />
              Insights
            </button>
          </div>
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
            <div className="ai-sensor-strip">
              <i className="fa-solid fa-microchip" aria-hidden="true" />
              <span className="ai-sensor-label">Live data:</span>
              {sensorChips.map((chip) => (
                <span key={chip.key} className="ai-sensor-chip">
                  <i className={`fa-solid ${chip.icon}`} aria-hidden="true" />
                  {chip.text}
                </span>
              ))}
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
      ) : (
        <div className="ai-insights-body">
          <AIRecommendation sensors={sensors} showHeader={false} />
        </div>
      )}
    </div>
  );
}
