import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { Home as HomeIcon, Play, BookOpen, Import, History as HistoryIcon } from 'lucide-react';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import Practice from './pages/Practice';
import Words from './pages/Words';
import ImportPage from './pages/Import';
import History from './pages/History';
import SessionDetail from './pages/SessionDetail';

function Sidebar() {
  const navItems = [
    { to: '/', icon: HomeIcon, label: 'Home' },
    { to: '/practice', icon: Play, label: 'Practice' },
    { to: '/words', icon: BookOpen, label: 'Words' },
    { to: '/import', icon: Import, label: 'Import' },
    { to: '/history', icon: HistoryIcon, label: 'History' },
  ];

  return (
    <aside className="hidden sm:flex flex-col w-64 h-screen border-r border-slate-200 bg-white fixed top-0 left-0 pt-8 px-4">
      <div className="mb-10 px-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lexuni</h1>
      </div>
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-xl font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
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
      <div className="min-h-screen bg-slate-50 text-slate-900 font-sans sm:pl-64">
        <Sidebar />
        <main className="max-w-2xl mx-auto w-full min-h-screen pb-20 sm:pb-0">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/practice" element={<Practice />} />
            <Route path="/words" element={<Words />} />
            <Route path="/import" element={<ImportPage />} />
            <Route path="/history" element={<History />} />
            <Route path="/session/:id" element={<SessionDetail />} />
          </Routes>
        </main>
        <Navigation />
      </div>
    </Router>
  );
}
