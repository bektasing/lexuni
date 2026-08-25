import re

with open('src/index.css', 'r') as f:
    content = f.read()

# Remove the aggressive media query
aggressive = """@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    transition-duration: 0.01ms !important;
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
  }
}"""
content = content.replace(aggressive, "")

# Modify the global transition rules
global_trans = """/* Base Global Animations & Layout */
html, body, #root {
  @apply transition-colors duration-150 ease-out;
}

*, ::before, ::after {
  @apply transition-colors duration-150 ease-out;
}"""

new_global_trans = """/* Base Global Animations & Layout */
html, body, #root {
  @apply motion-safe:transition-colors motion-safe:duration-150 ease-out;
}

*, ::before, ::after {
  @apply motion-safe:transition-colors motion-safe:duration-150 ease-out;
}"""
content = content.replace(global_trans, new_global_trans)

# Modify hover-card and tap-card
old_hover = """/* Global Micro-Interactions */
.hover-card {
  @apply transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md hover:border-border-strong;
}
.tap-card {
  @apply transition-transform duration-150 ease-out active:scale-[0.985];
}
.btn-primary {
  @apply transition-all duration-150 ease-out active:scale-95;
}"""

new_hover = """/* Global Micro-Interactions */
.hover-card {
  @apply motion-safe:transition-all duration-200 ease-out motion-safe:hover:-translate-y-0.5 hover:shadow-md hover:border-border-strong;
}
.tap-card {
  @apply motion-safe:transition-transform duration-150 ease-out motion-safe:active:scale-[0.985];
}
.btn-primary {
  @apply motion-safe:transition-all duration-150 ease-out motion-safe:active:scale-95;
}"""
content = content.replace(old_hover, new_hover)

# For page enter in reduced motion: just simple fade
new_page_enter_media = """@media (prefers-reduced-motion: reduce) {
  .page-enter {
    animation: fade-in-only 150ms ease-out forwards;
  }
  @keyframes fade-in-only {
    from { opacity: 0; }
    to { opacity: 1; }
  }
}"""

content = content.replace("""@media (prefers-reduced-motion: reduce) {
  .page-enter {
    animation: none;
  }
}""", new_page_enter_media)

with open('src/index.css', 'w') as f:
    f.write(content)
