import re

with open('PROJECT.md', 'r') as f:
    content = f.read()

# Replace "A single shared indicator pill smoothly translates (`left` / `width` interpolation)"
# with the new description.
content = content.replace("A single shared indicator pill smoothly translates (`left` / `width` interpolation) across the bottom navigation", "A single shared, symmetrical indicator pill smoothly translates (`left` percentage interpolation) across the bottom navigation")

# Update static palette preview
content = content.replace("In `Settings.tsx`, each theme defines static `preview` colors (e.g. `['#f8fafc', '#ffffff', '#2563eb', '#bfdbfe']`). This decoupling prevents preview cards from visually mutating when the global active theme changes.", "In `Settings.tsx`, each theme defines static `preview` colors (`{ bg, surface, accent }`). These render as mini dual-surface UI chips (like tiny UI swatches), replacing the old multi-dot palette. This decoupling prevents preview cards from visually mutating when the global active theme changes.")

with open('PROJECT.md', 'w') as f:
    f.write(content)
