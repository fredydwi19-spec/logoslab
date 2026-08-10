import React from 'react';
import { createRoot } from 'react-dom/client';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { LoginPage } from './pages/LoginPage';

const App = () => {
  const path = window.location.pathname;
  if (path === '/login' || path === '/app/login') {
    return <LoginPage />;
  }
  if (path === '/app' || path.startsWith('/dashboard') || path === '/app/dashboard' || path === '/') {
    return <DashboardPage />;
  }
  // Default fallback
  return <DashboardPage />;
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
