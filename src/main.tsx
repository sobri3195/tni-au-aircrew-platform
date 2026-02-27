import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { AppProvider } from './contexts/AppContext';

const EXTENSION_SCRIPT_PARSE_ERROR = "Unexpected token 'export'";

window.addEventListener('error', (event) => {
  const isExtensionParseError = event.filename?.includes('webpage_content_reporter.js') && event.message.includes(EXTENSION_SCRIPT_PARSE_ERROR);

  if (isExtensionParseError) {
    event.preventDefault();
  }
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js?v=3').then((registration) => registration.update()).catch(() => {
      // noop
    });
  });
}
