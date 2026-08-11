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

  if (path === '/login' || path === '/app/login') {
    return <LoginPage />;
  }
  if (path === '/app/profile' || path === '/profile') {
    return <ProfilePage />;
  }
  
  // Dashboard Routes with Layout Wrapper
  let DashboardContent = <DashboardPage />;
  
  if (path === '/dashboard/projects' || path === '/projects') {
    DashboardContent = <KetuaTimAllProjects />;
  } else if (path === '/dashboard/bank-soal/quiz') {
    DashboardContent = <BankSoalQuiz />;
  } else if (path === '/dashboard/bank-soal/ftb') {
    DashboardContent = <BankSoalFtb />;
  } else if (path === '/dashboard/bank-soal/tts') {
    DashboardContent = <BankSoalTts />;
  } else if (path === '/dashboard/games' || path === '/games') {
    DashboardContent = <DashboardGamesPage />;
  } else if (path === '/dashboard/materi-list' || path === '/materi-list') {
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
