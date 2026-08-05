import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@styles/globals.css';
import App from './App';

const rootElement = document.getElementById('app');

if (!rootElement) {
  throw new Error('Root element #app not found in the document');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
