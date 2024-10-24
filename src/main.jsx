import './index.css';
import './cloak-mode.css';

import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import { App } from './app';

if (import.meta.env.DEV) {
  // Remove Preact-specific debug import
}

// AbortSignal.timeout polyfill
if ('AbortSignal' in window) {
  AbortSignal.timeout =
    AbortSignal.timeout ||
    ((duration) => {
      const controller = new AbortController();
      setTimeout(() => controller.abort(), duration);
      return controller.signal;
    });
}

const root = createRoot(document.getElementById('app'));
root.render(
  <HashRouter>
    <App />
  </HashRouter>
);

// Storage cleanup
setTimeout(() => {
  try {
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('iconify')) {
        localStorage.removeItem(key);
      }
    });
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('iconify')) {
        sessionStorage.removeItem(key);
      }
    });

    // Clean up old settings key
    localStorage.removeItem('settings:boostsCarousel');
  } catch (e) {}
}, 5000);

window.__CLOAK__ = () => {
  document.body.classList.toggle('cloak');
};
