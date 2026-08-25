import re

with open('src/pages/Settings.tsx', 'r') as f:
    content = f.read()

# Replace chevron swap with rotating ChevronDown
old_chevron = "{isThemeExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}"
new_chevron = "<ChevronDown size={20} className={`transition-transform duration-200 ${isThemeExpanded ? 'rotate-180' : ''}`} />"
content = content.replace(old_chevron, new_chevron)

with open('src/pages/Settings.tsx', 'w') as f:
    f.write(content)
