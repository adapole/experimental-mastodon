import './app.css';

import { Appage } from './pages/appage';

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

function App() {
  return (
    <Appage />
  );
}

export { App };
