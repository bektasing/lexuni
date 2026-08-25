import re

with open('src/components/Navigation.tsx', 'r') as f:
    content = f.read()

# We need to rewrite Navigation.tsx completely to support the sliding pill.
new_content = """import { NavLink, useLocation } from 'react-router-dom';
import { Home, Play, BookOpen, History as HistoryIcon, Settings } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';

export default function Navigation() {
  const location = useLocation();
  const navRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });

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

  useEffect(() => {
    const updateIndicator = () => {
      if (!navRef.current) return;
      const index = getActiveIndex();
      const items = Array.from(navRef.current.children) as HTMLElement[];
      const activeItem = items[index];
      
      if (activeItem) {
        // We want the indicator to cover the icon and label, basically the whole item but with some padding
        setIndicatorStyle({
          left: activeItem.offsetLeft + (activeItem.offsetWidth * 0.1),
          width: activeItem.offsetWidth * 0.8,
          opacity: 1
        });
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [location.pathname]);

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface/95 backdrop-blur-md border-t border-border pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.02)] z-50 sm:hidden">
      <div className="relative flex justify-around items-center h-[4.5rem]" ref={navRef}>
        <div 
          className="absolute top-1/2 -translate-y-1/2 h-14 bg-nav-active rounded-2xl motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out pointer-events-none"
          style={{ 
            left: indicatorStyle.left, 
            width: indicatorStyle.width,
            opacity: indicatorStyle.opacity
          }}
        />
        
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
"""

with open('src/components/Navigation.tsx', 'w') as f:
    f.write(new_content)
