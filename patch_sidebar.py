import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

old_sidebar = """    <aside className="hidden sm:flex flex-col w-64 h-screen border-r border-border bg-surface fixed top-0 left-0 pt-8 px-4">
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
    </aside>"""

new_sidebar = """    <aside className="hidden sm:flex flex-col w-64 h-screen border-r border-border bg-surface fixed top-0 left-0 pt-8 px-4">
      <div className="mb-10 px-4">
        <h1 className="text-2xl font-bold tracking-tight text-tx">Lexuni</h1>
      </div>
      <nav className="flex flex-col space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive, isPending }) => {
              // Robust matching for desktop sidebar too
              const path = window.location.pathname;
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
    </aside>"""

content = content.replace(old_sidebar, new_sidebar)
with open('src/App.tsx', 'w') as f:
    f.write(content)
