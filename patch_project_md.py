import re

with open('PROJECT.md', 'a') as f:
    f.write("""

## Theming and Motion (v3.1)

### Theme Architecture
Lexuni supports 6 high-quality, distinct themes using a strict CSS variable semantic token system (`index.css`):
1. **Arctic (Default)** - Clean neutral light theme, strong blue accent.
2. **Midnight** - Premium dark theme, deep navy background with electric blue accent.
3. **Ocean** - Cool aquatic cyan/teal.
4. **Forest** - Muted sage / natural green.
5. **Sunset** - Warm ivory and amber/orange.
6. **Violet** - Soft lavender and deep plum with violet accents.

Each theme guarantees readability by redefining colors like `--bg`, `--surface`, `--tx`, `--primary`, and `--nav-active`. Semantic learning feedback colors (`--success-*`, `--danger-*`) remain globally consistent across all themes to preserve learning integrity.

### Static Palette Previews
In `Settings.tsx`, each theme defines static `preview` colors (e.g. `['#f8fafc', '#ffffff', '#2563eb', '#bfdbfe']`). This decoupling prevents preview cards from visually mutating when the global active theme changes.

### Motion & Micro-Interactions
The app utilizes lightweight, premium motion:
- **Mobile Navigation**: A single shared indicator pill smoothly translates (`left` / `width` interpolation) across the bottom navigation to follow the active tab, avoiding flicker.
- **Micro-Interactions**: Global utility classes (`.hover-card`, `.tap-card`, `.btn-primary`) handle subtle `translateY` hover lifts and tap `scale(0.98)` interactions.
- **Page Entrances**: A fast `.page-enter` animation fades and slides content up slightly when navigating major routes.
- **Reduced Motion**: All animations strictly respect OS-level `prefers-reduced-motion: reduce` settings using Tailwind's `motion-safe:` modifier or simplified keyframe fallbacks.
""")
