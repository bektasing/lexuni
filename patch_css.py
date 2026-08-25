import re

css = """@import "tailwindcss";

:root {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  line-height: 1.5;
  font-weight: 400;

  color: var(--tx);
  background-color: var(--bg);
  
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  display: flex;
  min-height: 100vh;
  min-width: 320px;
}

#root {
  width: 100%;
  margin: 0 auto;
}

@theme {
  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-surface-hover: var(--surface-hover);
  --color-surface-secondary: var(--surface-secondary);
  
  --color-tx: var(--tx);
  --color-tx-secondary: var(--tx-secondary);
  --color-tx-muted: var(--tx-muted);
  
  --color-border: var(--border);
  --color-border-strong: var(--border-strong);
  
  --color-primary: var(--primary);
  --color-primary-hover: var(--primary-hover);
  --color-primary-soft: var(--primary-soft);
  --color-primary-text: var(--primary-text);
  
  --color-success-bg: var(--success-bg);
  --color-success-tx: var(--success-tx);
  --color-success-border: var(--success-border);
  
  --color-warning-bg: var(--warning-bg);
  --color-warning-tx: var(--warning-tx);
  --color-warning-border: var(--warning-border);
  
  --color-danger-bg: var(--danger-bg);
  --color-danger-tx: var(--danger-tx);
  --color-danger-border: var(--danger-border);
  --color-danger-btn: var(--danger-btn);
  --color-danger-btn-hover: var(--danger-btn-hover);
  
  --color-nav-bg: var(--nav-bg);
  --color-nav-active: var(--nav-active);

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
}

/* Base Global Animations & Layout */
html, body, #root {
  @apply transition-colors duration-150 ease-out;
}

*, ::before, ::after {
  @apply transition-colors duration-150 ease-out;
}

/* Opt-out colors transition for specific things if needed, but Tailwind handles classes */

@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}

/* 1. Arctic (Default) */
:root {
  --bg: #f8fafc;
  --surface: #ffffff;
  --surface-hover: #f1f5f9;
  --surface-secondary: #e2e8f0;
  
  --tx: #0f172a;
  --tx-secondary: #475569;
  --tx-muted: #94a3b8;
  
  --border: #e2e8f0;
  --border-strong: #cbd5e1;
  
  --primary: #2563eb;
  --primary-hover: #1d4ed8;
  --primary-soft: #eff6ff;
  --primary-text: #1e40af;
  
  --success-bg: #ecfdf5;
  --success-tx: #047857;
  --success-border: #a7f3d0;
  
  --warning-bg: #fffbeb;
  --warning-tx: #b45309;
  --warning-border: #fde68a;
  
  --danger-bg: #fff1f2;
  --danger-tx: #be123c;
  --danger-border: #fecdd3;
  --danger-btn: #e11d48;
  --danger-btn-hover: #be123c;
  
  --nav-bg: #ffffff;
  --nav-active: #dbeafe;
}

/* 2. Midnight */
[data-theme="midnight"] {
  --bg: #0f172a;
  --surface: #1e293b;
  --surface-hover: #334155;
  --surface-secondary: #475569;
  
  --tx: #f8fafc;
  --tx-secondary: #cbd5e1;
  --tx-muted: #64748b;
  
  --border: #334155;
  --border-strong: #475569;
  
  --primary: #38bdf8;
  --primary-hover: #0ea5e9;
  --primary-soft: rgba(56, 189, 248, 0.15);
  --primary-text: #7dd3fc;
  
  --success-bg: rgba(16, 185, 129, 0.15);
  --success-tx: #34d399;
  --success-border: rgba(16, 185, 129, 0.3);
  
  --warning-bg: rgba(245, 158, 11, 0.15);
  --warning-tx: #fbbf24;
  --warning-border: rgba(245, 158, 11, 0.3);
  
  --danger-bg: rgba(225, 29, 72, 0.15);
  --danger-tx: #fb7185;
  --danger-border: rgba(225, 29, 72, 0.3);
  --danger-btn: #e11d48;
  --danger-btn-hover: #be123c;
  
  --nav-bg: #1e293b;
  --nav-active: rgba(56, 189, 248, 0.2);
}

/* 3. Ocean */
[data-theme="ocean"] {
  --bg: #ecfeff;
  --surface: #ffffff;
  --surface-hover: #cffafe;
  --surface-secondary: #a5f3fc;
  
  --tx: #083344;
  --tx-secondary: #164e63;
  --tx-muted: #0891b2;
  
  --border: #a5f3fc;
  --border-strong: #67e8f9;
  
  --primary: #0891b2;
  --primary-hover: #0e7490;
  --primary-soft: #cffafe;
  --primary-text: #155e75;
  
  --success-bg: #ecfdf5;
  --success-tx: #047857;
  --success-border: #a7f3d0;
  
  --warning-bg: #fffbeb;
  --warning-tx: #b45309;
  --warning-border: #fde68a;
  
  --danger-bg: #fff1f2;
  --danger-tx: #be123c;
  --danger-border: #fecdd3;
  --danger-btn: #e11d48;
  --danger-btn-hover: #be123c;
  
  --nav-bg: #ffffff;
  --nav-active: #a5f3fc;
}

/* 4. Forest */
[data-theme="forest"] {
  --bg: #f0fdf4;
  --surface: #ffffff;
  --surface-hover: #dcfce7;
  --surface-secondary: #bbf7d0;
  
  --tx: #14532d;
  --tx-secondary: #166534;
  --tx-muted: #22c55e;
  
  --border: #bbf7d0;
  --border-strong: #86efac;
  
  --primary: #16a34a;
  --primary-hover: #15803d;
  --primary-soft: #dcfce7;
  --primary-text: #166534;
  
  --success-bg: #ecfdf5;
  --success-tx: #047857;
  --success-border: #a7f3d0;
  
  --warning-bg: #fffbeb;
  --warning-tx: #b45309;
  --warning-border: #fde68a;
  
  --danger-bg: #fff1f2;
  --danger-tx: #be123c;
  --danger-border: #fecdd3;
  --danger-btn: #e11d48;
  --danger-btn-hover: #be123c;
  
  --nav-bg: #ffffff;
  --nav-active: #bbf7d0;
}

/* 5. Sunset */
[data-theme="sunset"] {
  --bg: #fff7ed;
  --surface: #ffffff;
  --surface-hover: #ffedd5;
  --surface-secondary: #fed7aa;
  
  --tx: #431407;
  --tx-secondary: #7c2d12;
  --tx-muted: #f97316;
  
  --border: #fed7aa;
  --border-strong: #fdba74;
  
  --primary: #ea580c;
  --primary-hover: #c2410c;
  --primary-soft: #ffedd5;
  --primary-text: #9a3412;
  
  --success-bg: #ecfdf5;
  --success-tx: #047857;
  --success-border: #a7f3d0;
  
  --warning-bg: #fffbeb;
  --warning-tx: #b45309;
  --warning-border: #fde68a;
  
  --danger-bg: #fff1f2;
  --danger-tx: #be123c;
  --danger-border: #fecdd3;
  --danger-btn: #e11d48;
  --danger-btn-hover: #be123c;
  
  --nav-bg: #ffffff;
  --nav-active: #fed7aa;
}

/* 6. Violet */
[data-theme="violet"] {
  --bg: #faf5ff;
  --surface: #ffffff;
  --surface-hover: #f3e8ff;
  --surface-secondary: #e9d5ff;
  
  --tx: #3b0764;
  --tx-secondary: #581c87;
  --tx-muted: #a855f7;
  
  --border: #e9d5ff;
  --border-strong: #d8b4fe;
  
  --primary: #9333ea;
  --primary-hover: #7e22ce;
  --primary-soft: #f3e8ff;
  --primary-text: #6b21a8;
  
  --success-bg: #ecfdf5;
  --success-tx: #047857;
  --success-border: #a7f3d0;
  
  --warning-bg: #fffbeb;
  --warning-tx: #b45309;
  --warning-border: #fde68a;
  
  --danger-bg: #fff1f2;
  --danger-tx: #be123c;
  --danger-border: #fecdd3;
  --danger-btn: #e11d48;
  --danger-btn-hover: #be123c;
  
  --nav-bg: #ffffff;
  --nav-active: #e9d5ff;
}

/* Global Micro-Interactions */
.hover-card {
  @apply transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-border-strong;
}
.tap-card {
  @apply transition-transform duration-150 ease-out active:scale-[0.985];
}
.btn-primary {
  @apply transition-all duration-150 ease-out active:scale-95;
}

/* Page Entry Animations */
.page-enter {
  @apply motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-200 ease-out;
}
"""

with open('src/index.css', 'w') as f:
    f.write(css)
