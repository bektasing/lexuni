import re

with open('src/components/Navigation.tsx', 'r') as f:
    content = f.read()

new_nav_items = """  const navItems = [
    { to: '/words', icon: BookOpen, label: 'Words' },
    { to: '/practice', icon: Play, label: 'Practice' },
    { to: '/', icon: Home, label: 'Home', isHome: true },
    { to: '/history', icon: HistoryIcon, label: 'History' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];"""

content = re.sub(r"  const navItems = \[.*?\];", new_nav_items, content, flags=re.DOTALL)

# Remove Import from imports
content = content.replace("import { Home, Play, BookOpen, Import, History as HistoryIcon, Settings } from 'lucide-react';", "import { Home, Play, BookOpen, History as HistoryIcon, Settings } from 'lucide-react';")

# Update render
new_render = """      <div className="flex justify-around items-center h-[4.5rem]">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-primary' : 'text-tx-secondary hover:text-tx'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`flex items-center justify-center transition-all ${item.isHome ? 'bg-primary-soft p-2.5 rounded-2xl' : 'p-1'} ${isActive && item.isHome ? 'bg-primary text-white shadow-sm ring-2 ring-primary-soft' : ''}`}>
                  <item.icon size={item.isHome ? 22 : 20} strokeWidth={2.5} />
                </div>
                <span className="text-[10px] font-bold">{item.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>"""

content = re.sub(r'      <div className="flex justify-around items-center h-16">.*?      </div>', new_render, content, flags=re.DOTALL)

with open('src/components/Navigation.tsx', 'w') as f:
    f.write(content)
