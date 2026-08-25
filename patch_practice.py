import re

with open('src/pages/Practice.tsx', 'r') as f:
    content = f.read()

# Setup view
content = content.replace('className="p-4 sm:p-6 pb-24 max-w-xl mx-auto"', 'className="p-4 sm:p-6 pb-24 max-w-xl mx-auto page-enter"')

# Setup View cards
content = content.replace('className={`p-5 rounded-2xl border-2 cursor-pointer transition-colors', 'className={`p-5 rounded-2xl border-2 cursor-pointer transition-all hover-card tap-card')

# Setup View start button
content = content.replace('className="w-full mt-8 bg-primary text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 active:scale-[0.98] transition-transform shadow-lg shadow-lg"', 'className="w-full mt-8 bg-primary text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center space-x-2 btn-primary shadow-lg"')

# Practice view buttons
content = content.replace('className={`p-5 rounded-2xl font-bold text-lg text-left transition-all duration-200 flex items-center justify-between', 'className={`p-5 rounded-2xl font-bold text-lg text-left transition-all duration-200 flex items-center justify-between hover:shadow-md tap-card')
content = content.replace('className="px-4 py-2 bg-surface-hover text-tx-secondary hover:bg-surface-hover rounded-xl font-bold text-sm transition-colors"', 'className="px-4 py-2 bg-surface-hover text-tx-secondary hover:bg-border font-bold text-sm btn-primary"')

with open('src/pages/Practice.tsx', 'w') as f:
    f.write(content)
