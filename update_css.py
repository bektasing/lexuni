import re

with open("src/index.css", "r") as f:
    content = f.read()

# 1. Add to @theme block
theme_vars = """
  --color-session-bg: var(--session-bg);
  --color-session-border: var(--session-border);
  --color-session-accent: var(--session-accent);
  --color-session-btn: var(--session-btn);
  --color-session-btn-tx: var(--session-btn-tx);
  --color-session-btn-sec: var(--session-btn-sec);
  --color-session-btn-sec-tx: var(--session-btn-sec-tx);
  --color-session-tx: var(--session-tx);
  --color-session-muted: var(--session-muted);
"""
content = content.replace("--color-nav-active: var(--nav-active);", "--color-nav-active: var(--nav-active);\n" + theme_vars)

# 2. Add to Arctic
arctic_vars = """
  --session-bg: #e0f2fe;
  --session-border: #bae6fd;
  --session-accent: #0284c7;
  --session-btn: #0284c7;
  --session-btn-tx: #ffffff;
  --session-btn-sec: #f0f9ff;
  --session-btn-sec-tx: #0284c7;
  --session-tx: #0c4a6e;
  --session-muted: #0284c7;
"""
content = re.sub(r'(--nav-active: #bae6fd;)', r'\1\n' + arctic_vars, content)

# 3. Add to Midnight
midnight_vars = """
  --session-bg: rgba(14, 165, 233, 0.15);
  --session-border: rgba(14, 165, 233, 0.3);
  --session-accent: #0ea5e9;
  --session-btn: #0ea5e9;
  --session-btn-tx: #f8fafc;
  --session-btn-sec: #0f172a;
  --session-btn-sec-tx: #38bdf8;
  --session-tx: #f8fafc;
  --session-muted: #7dd3fc;
"""
content = re.sub(r'(--danger-btn-hover: #be123c;\n\})', midnight_vars + r'\n\1', content, count=1)

# 4. Add to Developer
dev_vars = """
  --session-bg: rgba(97, 217, 232, 0.15);
  --session-border: rgba(97, 217, 232, 0.3);
  --session-accent: #61d9e8;
  --session-btn: #61d9e8;
  --session-btn-tx: #181818;
  --session-btn-sec: #202020;
  --session-btn-sec-tx: #61d9e8;
  --session-tx: #e8e8e8;
  --session-muted: #a8a8a8;
"""
# Note: Developer uses [data-theme="developer"]
content = re.sub(r'(--danger-btn-hover: #be123c;\n\})(?=\n\n/\* 4. Lingo \*/)', dev_vars + r'\n\1', content)

# 5. Add to Lingo
lingo_vars = """
  --session-bg: #dcfce7;
  --session-border: #86efac;
  --session-accent: #22c55e;
  --session-btn: #22c55e;
  --session-btn-tx: #ffffff;
  --session-btn-sec: #f0fdf4;
  --session-btn-sec-tx: #15803d;
  --session-tx: #14532d;
  --session-muted: #166534;
"""
content = re.sub(r'(--danger-btn-hover: #be123c;\n\})(?=\n\n/\* 5. Battery \*/)', lingo_vars + r'\n\1', content)

# 6. Add to Battery
battery_vars = """
  --session-bg: rgba(74, 222, 128, 0.1);
  --session-border: rgba(74, 222, 128, 0.25);
  --session-accent: #4ade80;
  --session-btn: #4ade80;
  --session-btn-tx: #000000;
  --session-btn-sec: #0a0a0a;
  --session-btn-sec-tx: #4ade80;
  --session-tx: #e5e5e5;
  --session-muted: #a3a3a3;
"""
content = re.sub(r'(--danger-btn-hover: #991b1b;\n\})(?=\n\n/\* 6. Sunset \*/)', battery_vars + r'\n\1', content)

# 7. Add to Sunset
sunset_vars = """
  --session-bg: #ffedd5;
  --session-border: #fdba74;
  --session-accent: #ea580c;
  --session-btn: #ea580c;
  --session-btn-tx: #ffffff;
  --session-btn-sec: #ffedd5;
  --session-btn-sec-tx: #ea580c;
  --session-tx: #431407;
  --session-muted: #9a3412;
"""
content = re.sub(r'(--danger-btn-hover: #be123c;\n\})(?=\n+/\* Global Micro-Interactions \*/)', sunset_vars + r'\n\1', content)


with open("src/index.css", "w") as f:
    f.write(content)
