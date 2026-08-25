import re

with open('src/pages/Settings.tsx', 'r') as f:
    content = f.read()

old_init = """  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('lexuni-theme') || 'light';
  });"""

new_init = """  const [activeTheme, setActiveTheme] = useState(() => {
    let stored = localStorage.getItem('lexuni-theme') || 'arctic';
    if (stored === 'light') stored = 'arctic';
    if (stored === 'dark') stored = 'midnight';
    return stored;
  });"""

content = content.replace(old_init, new_init)

old_handle = """    if (themeId === 'light') {"""
new_handle = """    if (themeId === 'arctic') {"""
content = content.replace(old_handle, new_handle)

with open('src/pages/Settings.tsx', 'w') as f:
    f.write(content)
