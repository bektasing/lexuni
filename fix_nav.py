import re

with open('src/components/Navigation.tsx', 'r') as f:
    content = f.read()

# Remove useEffect, useState, useRef
content = re.sub(r"import { useEffect, useState, useRef } from 'react';\n", "", content)
content = content.replace("  const navRef = useRef<HTMLDivElement>(null);\n  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0, opacity: 0 });\n", "")

use_effect_block = re.search(r"  useEffect\(\(\) => \{.*?  \}, \[location\.pathname\]\);\n", content, re.DOTALL)
if use_effect_block:
    content = content.replace(use_effect_block.group(0), "")

# Update the render part
old_render = """      <div className="relative flex justify-around items-center h-[4.5rem]" ref={navRef}>
        <div 
          className="absolute top-1/2 -translate-y-1/2 h-14 bg-nav-active rounded-2xl motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out pointer-events-none"
          style={{ 
            left: indicatorStyle.left, 
            width: indicatorStyle.width,
            opacity: indicatorStyle.opacity
          }}
        />"""

new_render = """      <div className="relative flex justify-around items-center h-[4.5rem]">
        <div 
          className="absolute top-1/2 -translate-y-1/2 h-14 w-1/5 motion-safe:transition-all motion-safe:duration-200 motion-safe:ease-out pointer-events-none flex items-center justify-center"
          style={{ left: `${getActiveIndex() * 20}%` }}
        >
          <div className="w-[85%] h-full bg-nav-active rounded-[1.25rem]" />
        </div>"""

content = content.replace(old_render, new_render)

with open('src/components/Navigation.tsx', 'w') as f:
    f.write(content)
