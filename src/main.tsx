import React from 'react';
import { createRoot } from 'react-dom/client';
import { Dashboard } from './pages/Dashboard';
import { LoginPage } from './pages/LoginPage';

const App = () => {
  const path = window.location.pathname;
  if (path === '/login' || path === '/app/login') {
    return <LoginPage />;
  }
  if (path === '/app' || path === '/dashboard' || path === '/') {
    return <Dashboard />;
  }
  // Default fallback
  return <Dashboard />;
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
