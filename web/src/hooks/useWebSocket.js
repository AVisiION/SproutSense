import { useEffect, useRef, useState } from 'react';

export function useWebSocket(onMessage) {
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      // Get the API base URL from environment or use relative path
      const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || '/api';
      
      // Convert HTTP/HTTPS to WS/WSS and replace /api with /ws
      const wsUrl = apiBaseUrl
        .replace(/^https:/, 'wss:')
        .replace(/^http:/, 'ws:')
        .replace(/\/api$/, '/ws');
      
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
        wsRef.current.close();
      }
    };
  }, [onMessage]);

  return { isConnected };
}
