import React from 'react';
import { createRoot } from 'react-dom/client';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { LoginPage } from './pages/LoginPage';

const App = () => {
  const [path, setPath] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const handleLocationChange = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

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
