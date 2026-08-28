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
    <aside className="app-sidebar hidden sm:flex">
      <div className="sidebar-brand">
        <h1>Lexuni</h1>
        <span>Vocabulary practice</span>
      </div>
      <nav className="sidebar-nav" aria-label="Primary navigation">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={() => {
              // Robust matching for desktop sidebar too
              const path = location.pathname;
              const isMatch = item.to === '/' ? path === '/' : path.startsWith(item.to) || (item.to === '/history' && path.startsWith('/session/'));
              
              return `sidebar-link ${
                isMatch
                  ? 'sidebar-link-active'
                  : ''
              }`;
            }}
          >
            <item.icon size={19} strokeWidth={2.2} />
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
      <div className="app-frame">
        <a className="skip-link" href="#main-content">Skip to content</a>
        <Sidebar />
        <main id="main-content" className="app-main" tabIndex={-1}>
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
