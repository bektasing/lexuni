import re

import os

for file in ['src/pages/History.tsx', 'src/pages/SessionDetail.tsx']:
    if not os.path.exists(file):
        continue
    with open(file, 'r') as f:
        content = f.read()

    # Main container
    content = content.replace('className="p-4 sm:p-6 pb-24 max-w-2xl mx-auto"', 'className="p-4 sm:p-6 pb-24 max-w-2xl mx-auto page-enter"')

    # Cards
    content = content.replace('className="bg-surface p-5 rounded-2xl shadow-sm border border-border cursor-pointer hover:border-border-strong transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"', 'className="bg-surface p-5 rounded-2xl shadow-sm border border-border cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover-card tap-card"')
    content = content.replace('className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden mb-8"', 'className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden mb-8 hover-card"')

    with open(file, 'w') as f:
        f.write(content)
