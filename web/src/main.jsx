import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);

// Signal the loading screen to dismiss once React has finished its first render.
// Double rAF ensures the browser has committed the first paint,
// then a 150 ms buffer guarantees App's initial layout is visible
// before the loader fades out — prevents white flash.
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    setTimeout(() => {
      window.dispatchEvent(new Event('sproutsense:ready'));
    }, 150);
  });
});
