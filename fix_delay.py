import re

with open('src/pages/Practice.tsx', 'r') as f:
    content = f.read()

# Fix btnClass for correct answer when wrong is selected
old_btnClass = """} else if (!isSelected && isCorrect) {
                  btnClass = "bg-emerald-500 border-emerald-500 text-white shadow-lg motion-safe:animate-correct-pulse z-10";"""
new_btnClass = """} else if (!isSelected && isCorrect) {
                  btnClass = "bg-emerald-500 border-emerald-500 text-white shadow-lg motion-safe:animate-correct-pulse z-10";"""
# Wait, let's just leave it without extra delay class, but set it in inline style!
content = content.replace(old_btnClass, new_btnClass)

# Fix style attribute of button
old_style = """style={isExiting ? {} : { animationDelay: `${i * 25}ms`, animationFillMode: 'both' }}"""
new_style = """style={isWaiting ? (!isSelected && isCorrect ? { animationDelay: '100ms' } : {}) : (isExiting ? {} : { animationDelay: `${i * 25}ms`, animationFillMode: 'both' })}"""
content = content.replace(old_style, new_style)

with open('src/pages/Practice.tsx', 'w') as f:
    f.write(content)
