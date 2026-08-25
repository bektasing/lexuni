import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Home as HomeIcon, Play, BookOpen, Import, History as HistoryIcon, Settings as SettingsIcon } from 'lucide-react';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Practice from './pages/Practice';
import Words from './pages/Words';
import ImportPage from './pages/Import';
import History from './pages/History';
import SessionDetail from './pages/SessionDetail';

import SettingsPage from './pages/Settings';

function Sidebar() {
  const navItems = [
    { to: '/', icon: HomeIcon, label: 'Home' },
    { to: '/practice', icon: Play, label: 'Practice' },
    { to: '/words', icon: BookOpen, label: 'Words' },
    { to: '/import', icon: Import, label: 'Import' },
    { to: '/history', icon: HistoryIcon, label: 'History' },
    { to: '/settings', icon: SettingsIcon, label: 'Settings' },
  ];

  return (
    <aside className="hidden sm:flex flex-col w-64 h-screen border-r border-border bg-surface fixed top-0 left-0 pt-8 px-4">
      <div className="mb-10 px-4">
        <h1 className="text-2xl font-bold tracking-tight text-tx">Lexuni</h1>
      </div>
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                isActive
                  ? 'bg-primary-soft text-primary'
                  : 'text-tx-secondary hover:bg-surface-hover hover:text-tx'
              }`
            }
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
            <Route path="/import" element={<ImportPage />} />
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
