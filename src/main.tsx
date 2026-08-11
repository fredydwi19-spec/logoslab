import React from 'react';
import { createRoot } from 'react-dom/client';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardMateriPage } from './pages/dashboard/DashboardMateriPage';
import { KetuaTimAllProjects } from './pages/dashboard/KetuaTimAllProjects';
import { BankSoalQuiz } from './pages/dashboard/BankSoalQuiz';
import { BankSoalFtb } from './pages/dashboard/BankSoalFtb';
import { BankSoalTts } from './pages/dashboard/BankSoalTts';
import { DashboardGamesPage } from './pages/dashboard/DashboardGamesPage';
import { ProfilePage } from './pages/ProfilePage';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';

const DashboardLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="flex flex-col min-h-screen">
    <Navbar />
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-slate-50">
        {children}
      </main>
    </div>
  </div>
);

const App = () => {
  const [path, setPath] = React.useState(window.location.pathname);

  React.useEffect(() => {
    const handleLocationChange = () => setPath(window.location.pathname);
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  let cleanPath = path.toLowerCase();
  if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
    cleanPath = cleanPath.slice(0, -1);
  }

  if (cleanPath === '/' || cleanPath === '/login' || cleanPath === '/app/login') {
    return <LoginPage />;
  }
  if (cleanPath === '/app/profile' || cleanPath === '/profile') {
    return <ProfilePage />;
  }
  
  const dashboardWhitelist = [
    '/dashboard/projects', '/projects',
    '/dashboard/bank-soal/quiz',
    '/dashboard/bank-soal/ftb',
    '/dashboard/bank-soal/tts',
    '/dashboard/games', '/games',
    '/dashboard/materi-list', '/materi-list',
    '/dashboard/ketua',
    '/dashboard/game',
    '/dashboard/materi',
    '/dashboard/pakar',
    '/dashboard/user'
  ];

  if (!dashboardWhitelist.includes(cleanPath)) {
    window.location.replace('/dashboard/ketua');
    return null;
  }
  
  // Dashboard Routes with Layout Wrapper
  let DashboardContent = null;
  
  if (cleanPath === '/dashboard/projects' || cleanPath === '/projects') {
    DashboardContent = <KetuaTimAllProjects />;
  } else if (cleanPath === '/dashboard/bank-soal/quiz') {
    DashboardContent = <BankSoalQuiz />;
  } else if (cleanPath === '/dashboard/bank-soal/ftb') {
    DashboardContent = <BankSoalFtb />;
  } else if (cleanPath === '/dashboard/bank-soal/tts') {
    DashboardContent = <BankSoalTts />;
  } else if (cleanPath === '/dashboard/games' || cleanPath === '/games') {
    DashboardContent = <DashboardGamesPage />;
  } else if (cleanPath === '/dashboard/materi-list' || cleanPath === '/materi-list') {
    DashboardContent = <DashboardMateriPage />;
  }

  return (
    <DashboardLayout>
      {DashboardContent}
    </DashboardLayout>
  );
};

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = createRoot(rootElement);
  root.render(<App />);
}
