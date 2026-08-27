import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { Home as HomeIcon, Play, BookOpen, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Practice from './pages/Practice';
import Words from './pages/Words';
import ImportPage from './pages/Import';
import History from './pages/History';
import SessionDetail from './pages/SessionDetail';

import SettingsPage from './pages/Settings';

function Sidebar() {
  const location = useLocation();
  const navItems = [
    { to: '/', icon: HomeIcon, label: 'Home' },
    { to: '/practice', icon: Play, label: 'Practice' },
    { to: '/words', icon: BookOpen, label: 'Words' },
    { to: '/history', icon: HistoryIcon, label: 'History' },
    { to: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <aside className="hidden sm:flex flex-col w-64 h-screen border-r border-border bg-nav-bg fixed top-0 left-0 pt-8 px-4">
      <div className="mb-10 px-4">
        <h1 className="text-2xl font-bold tracking-tight text-tx">Lexuni</h1>
      </div>
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={() => {
              // Robust matching for desktop sidebar too
              const path = location.pathname;
              const isMatch = item.to === '/' ? path === '/' : path.startsWith(item.to) || (item.to === '/history' && path.startsWith('/session/'));
              
              return `flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all duration-150 ${
                isMatch
                  ? 'bg-nav-active text-primary translate-x-1'
                  : 'text-tx-secondary hover:bg-surface-hover hover:text-tx'
              }`;
            }}
          >
            <item.icon size={20} strokeWidth={2.5} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-bg text-tx font-sans sm:pl-64 transition-colors">
        <Sidebar />
        <main className="max-w-2xl mx-auto w-full min-h-screen pb-20 sm:pb-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/words" element={<Words />} />
            <Route path="/words/import" element={<ImportPage />} />
            <Route path="/import" element={<Navigate to="/words/import" replace />} />
            <Route path="/history" element={<History />} />
            <Route path="/session/:id" element={<SessionDetail />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </main>
        <Navigation />
      </div>
    </Router>
  );
}
