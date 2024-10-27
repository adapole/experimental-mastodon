import './index.css';
import './cloak-mode.css';

import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';

import { App } from './app';


createRoot(document.getElementById('app')).render(
  <HashRouter>
    <App />
  </HashRouter>
);
