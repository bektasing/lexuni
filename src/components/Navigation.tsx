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
    <nav className="fixed bottom-0 left-0 right-0 bg-nav-bg/95 backdrop-blur-md border-t border-border pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.02)] z-50 sm:hidden">
      <div className="relative flex justify-around items-center h-[4.5rem]">
        <div 
          className="absolute top-1/2 -translate-y-1/2 h-14 w-1/5 motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out pointer-events-none flex items-center justify-center"
          style={{ left: `${getActiveIndex() * 20}%` }}
        >
          <div className="w-[85%] max-w-[72px] h-full bg-nav-active rounded-[1.25rem]" />
        </div>
        
        {navItems.map((item, i) => {
          const isActive = getActiveIndex() === i;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={`relative z-10 flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors duration-200 ${
                isActive ? 'text-primary' : 'text-tx-secondary hover:text-tx'
              }`}
            >
              <div className="flex items-center justify-center p-1">
                <item.icon size={isActive && item.id === 'home' ? 22 : 20} strokeWidth={2.5} />
              </div>
              <span className="text-[10px] font-bold">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
