import { createRoot } from 'react-dom/client';
import React from 'react';
import App from './App';
import ErrorBoundary from './ErrorBoundary';

window.onerror = (msg, src, line, col, err) => {
  console.error('Renderer error:', msg, src, line, col, err);
};

window.onunhandledrejection = (e) => {
  console.error('Unhandled promise rejection:', e.reason);
};

const root = createRoot(document.getElementById('root'));
root.render(
  React.createElement(ErrorBoundary, null,
    React.createElement(App)
  )
);
