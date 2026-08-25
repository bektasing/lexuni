import re

with open('src/main.tsx', 'r') as f:
    content = f.read()

old_theme_logic = """const savedTheme = localStorage.getItem('lexuni-theme') || 'light';
if (savedTheme !== 'light') {
  document.documentElement.setAttribute('data-theme', savedTheme);
}"""

new_theme_logic = """let savedTheme = localStorage.getItem('lexuni-theme') || 'arctic';
if (savedTheme === 'light') savedTheme = 'arctic';
if (savedTheme === 'dark') savedTheme = 'midnight';

if (savedTheme !== 'arctic') {
  document.documentElement.setAttribute('data-theme', savedTheme);
}"""

content = content.replace(old_theme_logic, new_theme_logic)

with open('src/main.tsx', 'w') as f:
    f.write(content)
