import { useEffect, useRef, useState } from 'react';

function resolveWebSocketUrl() {
  const explicitWsUrl = String(import.meta.env.VITE_WS_URL || '').trim();
  if (explicitWsUrl) {
    if (/^(ws|wss):\/\//i.test(explicitWsUrl)) {
      return explicitWsUrl;
    }
    if (/^(localhost|127\.0\.0\.1)(:\d+)?(\/.*)?$/i.test(explicitWsUrl)) {
      return `ws://${explicitWsUrl}`;
    }
    return explicitWsUrl;
  }

  const apiBaseUrl = String(import.meta.env.VITE_API_BASE_URL || '/api').trim();
  const normalizedApiPath = apiBaseUrl.replace(/\/api\/?$/, '/ws');

  if (/^https?:\/\//i.test(normalizedApiPath)) {
    return normalizedApiPath
      .replace(/^https:/i, 'wss:')
      .replace(/^http:/i, 'ws:');
  }

  if (normalizedApiPath.startsWith('/')) {
    const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${wsProtocol}//${window.location.host}${normalizedApiPath}`;
  }

  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${window.location.host}/ws`;
}

export function useWebSocket(onMessage) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      const wsUrl = resolveWebSocketUrl();
      
      console.log('Connecting to WebSocket:', wsUrl);
      wsRef.current = new WebSocket(wsUrl);
      
      wsRef.current.onopen = () => {
        console.log('✅ WebSocket connected');
        setIsConnected(true);
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) {
            onMessage(data);
          }
        } catch (error) {
          console.error('WebSocket message error:', error);
        }
      };
      
      wsRef.current.onclose = () => {
        console.log('❌ WebSocket disconnected. Reconnecting...');
        setIsConnected(false);
        
        // Reconnect after 3 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          connect();
        }, 3000);
      };
      
      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
    };

    connect();

    // Cleanup on unmount
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        // Prevent onclose event from firing and looping a reconnection when we intentionally destroy the hook
        wsRef.current.onclose = null;
        wsRef.current.close();
      }
    };
  }, [onMessage]);

  return { isConnected };
}
