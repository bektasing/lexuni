import { NavLink, useLocation } from 'react-router-dom';
import { Home, Play, BookOpen, History as HistoryIcon, Settings } from 'lucide-react';

export default function Navigation() {
  const location = useLocation();

  const navItems = [
    { id: 'words', to: '/words', icon: BookOpen, label: 'Words' },
    { id: 'practice', to: '/practice', icon: Play, label: 'Practice' },
    { id: 'home', to: '/', icon: Home, label: 'Home' },
    { id: 'history', to: '/history', icon: HistoryIcon, label: 'History' },
    { id: 'settings', to: '/settings', icon: Settings, label: 'Settings' },
  ];

  // Robust route matching
  const getActiveIndex = () => {
    const path = location.pathname;
    if (path.startsWith('/words')) return 0;
    if (path.startsWith('/practice')) return 1;
    if (path.startsWith('/history') || path.startsWith('/session/')) return 3;
    if (path.startsWith('/settings')) return 4;
    return 2; // Home default
  };


  return (
    <nav className="mobile-nav sm:hidden" aria-label="Primary navigation">
      <div className="mobile-nav-inner">
        <div 
          className="mobile-nav-indicator"
          style={{ left: `${getActiveIndex() * 20}%` }}
        >
          <div />
        </div>
        
        {navItems.map((item, i) => {
          const isActive = getActiveIndex() === i;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`mobile-nav-link ${
                isActive ? 'text-primary' : 'text-tx-secondary hover:text-tx'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div>
                <item.icon size={isActive && item.id === 'home' ? 21 : 20} strokeWidth={isActive ? 2.4 : 2.1} />
              </div>
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
