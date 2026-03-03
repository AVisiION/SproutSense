import React from 'react';

export function Header({ isConnected }) {
  return (
    <header>
      <h1>🌱 Smart Watering System</h1>
      <div className={`status ${isConnected ? 'connected' : 'disconnected'}`}>
        {isConnected ? '✓ Connected' : '✗ Disconnected'}
      </div>
    </header>
  );
}
