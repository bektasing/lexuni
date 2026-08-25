import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { ErrorBoundary } from './ErrorBoundary.tsx';

let savedTheme = localStorage.getItem('lexuni-theme') || 'arctic';
if (savedTheme === 'light') savedTheme = 'arctic';
if (savedTheme === 'dark') savedTheme = 'midnight';

if (savedTheme !== 'arctic') {
  document.documentElement.setAttribute('data-theme', savedTheme);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
