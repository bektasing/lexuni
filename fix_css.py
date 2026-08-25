import re

with open('src/index.css', 'r') as f:
    content = f.read()

old_page_enter = """/* Page Entry Animations */
.page-enter {
  @apply motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 duration-200 ease-out;
}"""

new_page_enter = """/* Page Entry Animations */
@keyframes page-enter {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.page-enter {
  animation: page-enter 200ms ease-out forwards;
}
@media (prefers-reduced-motion: reduce) {
  .page-enter {
    animation: none;
  }
}"""

content = content.replace(old_page_enter, new_page_enter)

with open('src/index.css', 'w') as f:
    f.write(content)
