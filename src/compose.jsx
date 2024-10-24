import './index.css';
import './app.css';

import { createRoot } from 'react-dom/client';
import { useEffect, useState } from 'react';

import Compose from './components/compose';
import useTitle from './utils/useTitle';

if (window.opener) {
  console = window.opener.console;
}

function App() {
  const [uiState, setUIState] = useState('default');

  const { editStatus, replyToStatus, draftStatus } = window.__COMPOSE__ || {};

  useTitle(
    editStatus
      ? 'Editing source status'
      : replyToStatus
      ? `Replying to @${
          replyToStatus.account?.acct || replyToStatus.account?.username
        }`
      : 'Compose',
  );

  useEffect(() => {
    if (uiState === 'closed') {
      try {
        window.opener.focus();
      } catch (e) {}
      window.close();
    }
  }, [uiState]);

  if (uiState === 'closed') {
    return (
      <div className="box">
        <p>You may close this page now.</p>
        <p>
          <button
            onClick={() => {
              window.close();
            }}
          >
            Close window
          </button>
        </p>
      </div>
    );
  }

  console.debug('OPEN COMPOSE');

  return (
    <Compose
      editStatus={editStatus}
      replyToStatus={replyToStatus}
      draftStatus={draftStatus}
      standalone
      hasOpener={window.opener}
      onClose={(results) => {
        const { newStatus, fn = () => {} } = results || {};
        try {
          if (newStatus) {
            window.opener.__STATES__.reloadStatusPage++;
          }
          fn();
          setUIState('closed');
        } catch (e) {}
      }}
    />
  );
}

const root = createRoot(document.getElementById('app-standalone'));
root.render(<App />);
