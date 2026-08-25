import re

with open('src/pages/Words.tsx', 'r') as f:
    content = f.read()

# Main container
content = content.replace('className="p-4 sm:p-6 pb-24 max-w-3xl mx-auto"', 'className="p-4 sm:p-6 pb-24 max-w-3xl mx-auto page-enter"')

# Group cards
content = content.replace('className={`bg-surface p-5 rounded-2xl shadow-sm border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isSelected ? \'border-primary ring-2 ring-primary-soft\' : \'border-border\'}`}', 'className={`bg-surface p-5 rounded-2xl shadow-sm border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover-card tap-card ${isSelected ? \'border-primary ring-2 ring-primary-soft\' : \'border-border\'}`}')

# Buttons
content = content.replace('className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-surface border border-border text-tx-secondary font-bold rounded-xl hover:bg-surface-hover transition-colors"', 'className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-surface border border-border text-tx-secondary font-bold rounded-xl hover:bg-surface-hover btn-primary"')
content = content.replace('className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors"', 'className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover btn-primary"')

content = content.replace('className="flex-1 sm:flex-none flex items-center justify-center space-x-1 px-5 py-2.5 bg-surface-hover text-tx-secondary rounded-xl font-bold hover:bg-surface-hover"', 'className="flex-1 sm:flex-none flex items-center justify-center space-x-1 px-5 py-2.5 bg-surface-hover text-tx-secondary rounded-xl font-bold btn-primary hover:bg-border"')
content = content.replace('className="flex-1 sm:flex-none flex items-center justify-center space-x-1 px-5 py-2.5 bg-primary-soft text-primary rounded-xl font-bold hover:bg-primary-soft"', 'className="flex-1 sm:flex-none flex items-center justify-center space-x-1 px-5 py-2.5 bg-primary-soft text-primary rounded-xl font-bold btn-primary hover:opacity-80"')

with open('src/pages/Words.tsx', 'w') as f:
    f.write(content)
