import React from 'react';
import { createRoot } from 'react-dom/client';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { KetuaTimAllProjects } from './pages/dashboard/KetuaTimAllProjects';
import { BankSoalQuiz } from './pages/dashboard/BankSoalQuiz';
import { BankSoalFtb } from './pages/dashboard/BankSoalFtb';
import { BankSoalTts } from './pages/dashboard/BankSoalTts';
import { DashboardGamesPage } from './pages/dashboard/DashboardGamesPage';

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
  if (path === '/dashboard/projects' || path === '/projects') {
    return <KetuaTimAllProjects />;
  }
  if (path === '/dashboard/bank-soal/quiz') {
    return <BankSoalQuiz />;
  }
  if (path === '/dashboard/bank-soal/ftb') {
    return <BankSoalFtb />;
  }
  if (path === '/dashboard/bank-soal/tts') {
    return <BankSoalTts />;
  }
  if (path === '/dashboard/games' || path === '/games') {
    return <DashboardGamesPage />;
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
