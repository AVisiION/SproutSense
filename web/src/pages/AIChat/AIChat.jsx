import React, { useState, useRef, useEffect } from 'react';
import { GlassIcon } from '../components/bits/GlassIcon';
import { AIRecommendation } from '../components/AIRecommendation';
import './AIChat.css';

const SYSTEM_PROMPT = `You are SproutSense AI, an expert IoT plant monitoring assistant. 
You have access to real-time sensor data from an ESP32 device including soil moisture, temperature, 
humidity, light levels, and pH. Provide plant care advice, diagnose issues, and suggest optimizations.
Be concise, practical, and friendly.`;

function TypingIndicator() {
  return (
    <div className="chat-msg assistant">
      <div className="chat-bubble typing">
        <span /><span /><span />
      </div>
    </div>
  );
}

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

  const quickPrompts = [
    'Is my plant healthy right now?',
    'Should I water the plant?',
    'What does my soil pH indicate?',
    'Optimal conditions for tomatoes?',
    'Why are my plant leaves yellowing?',
    'Analyze all sensor readings',
  ];

  const formatTime = (d) => d instanceof Date
    ? d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
    : '';

  return (
    <div className="ai-chat-page">
      {/* Header */}
      <div className="ai-chat-header">
        <div className="ai-chat-header-left">
          <div className="ai-avatar">
            <GlassIcon name="bot" />
          </div>
          <div>
            <h1 className="ai-chat-title">SproutSense AI</h1>
            <p className="ai-chat-subtitle">
              Powered by Google Gemini &mdash; Plant intelligence at your fingertips
            </p>
          </div>
        </div>
        <div className="ai-chat-tabs">
          <button
            className={`ai-tab${activeTab === 'chat' ? ' active' : ''}`}
            onClick={() => setActiveTab('chat')}
          >
            <GlassIcon name="chat" /> Chat
          </button>
          <button
            className={`ai-tab${activeTab === 'recommend' ? ' active' : ''}`}
            onClick={() => setActiveTab('recommend')}
          >
            <GlassIcon name="leaf" /> Insights
          </button>
        </div>
      </div>

      {/* API Key Prompt */}
      {showKeyPrompt && !apiKey && (
        <div className="ai-key-prompt">
          <GlassIcon name="warning" />
          <span>Gemini API key required. Add it in </span>
          <a href="/settings" className="ai-settings-link">Settings</a>
          <button className="ai-key-dismiss" onClick={() => setShowKeyPrompt(false)}>×</button>
        </div>
      )}

      {activeTab === 'chat' ? (
        <div className="ai-chat-body">
          {/* Sensor context strip */}
          {sensors && (
            <div className="ai-sensor-strip">
              <GlassIcon name="sensors" />
              <span className="ai-sensor-label">Live data:</span>
              {sensors.soilMoisture !== undefined && (
                <span className="ai-sensor-chip">Moisture {sensors.soilMoisture}%</span>
              )}
              {sensors.temperature !== undefined && (
                <span className="ai-sensor-chip">{sensors.temperature}°C</span>
              )}
              {sensors.humidity !== undefined && (
                <span className="ai-sensor-chip">Humidity {sensors.humidity}%</span>
              )}
              {sensors.light !== undefined && (
                <span className="ai-sensor-chip">{sensors.light} lux</span>
              )}
              {sensors.pH !== undefined && (
                <span className="ai-sensor-chip">pH {sensors.pH}</span>
              )}
            </div>
          )}

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role}${msg.isError ? ' error' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="chat-msg-avatar">
                    <GlassIcon name="bot" />
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

          {/* Quick prompts */}
          {messages.length <= 1 && (
            <div className="chat-quick-prompts">
              {quickPrompts.map(p => (
                <button
                  key={p}
                  className="chat-quick-btn"
                  onClick={() => { setInput(p); inputRef.current?.focus(); }}
                >
                  {p}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-area">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder={apiKey ? 'Ask about your plants...' : 'Add Gemini API key in Settings to chat...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={!apiKey}
            />
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || loading || !apiKey}
              aria-label="Send message"
            >
              <GlassIcon name="send" />
            </button>
          </div>

          {!apiKey && (
            <p className="chat-no-key-hint">
              Add your Gemini API key in <a href="/settings">Settings</a> to enable AI chat.
            </p>
          )}
        </div>
      ) : (
        <div className="ai-insights-body">
          <AIRecommendation sensors={sensors} showHeader={false} />
        </div>
      )}
    </div>
  );
}
