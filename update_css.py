import re

with open('src/index.css', 'r') as f:
    content = f.read()

theme_insert_pos = content.find("}")
if theme_insert_pos != -1:
    keyframes = """
  --animate-shake: shake 250ms ease-in-out;
  --animate-correct-pulse: subtle-pulse 300ms ease-out forwards;
  
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    20%, 60% { transform: translateX(-4px); }
    40%, 80% { transform: translateX(4px); }
  }
  
  @keyframes subtle-pulse {
    0% { transform: scale(1); }
    30% { transform: scale(1.025); }
    100% { transform: scale(1); }
  }
"""
    # Find the closing brace of @theme
    theme_end = content.find("}", content.find("@theme"))
    content = content[:theme_end] + keyframes + content[theme_end:]

with open('src/index.css', 'w') as f:
    f.write(content)
