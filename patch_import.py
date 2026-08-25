import re

with open('src/pages/Import.tsx', 'r') as f:
    content = f.read()

# Main container
content = content.replace('className="p-4 sm:p-6 pb-24 max-w-2xl mx-auto"', 'className="p-4 sm:p-6 pb-24 max-w-2xl mx-auto page-enter"')

# Cards
content = content.replace('className="bg-surface p-4 rounded-3xl shadow-sm border border-border mb-6"', 'className="bg-surface p-4 rounded-3xl shadow-sm border border-border mb-6 hover-card"')

# Buttons
content = content.replace('className="flex items-center justify-center w-full space-x-2 bg-surface/20 hover:bg-surface/30 text-white py-3 rounded-xl font-semibold transition-colors active:scale-[0.98]"', 'className="flex items-center justify-center w-full space-x-2 bg-surface/20 hover:bg-surface/30 text-white py-3 rounded-xl font-semibold btn-primary"')
content = content.replace('className="w-full mt-4 flex items-center justify-center space-x-2 bg-tx text-bg py-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:active:scale-100 active:scale-[0.98] transition-all"', 'className="w-full mt-4 flex items-center justify-center space-x-2 bg-tx text-bg py-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:active:scale-100 btn-primary"')
content = content.replace('className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg active:scale-[0.98] transition-all shadow-lg shadow-lg"', 'className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg btn-primary shadow-lg"')

with open('src/pages/Import.tsx', 'w') as f:
    f.write(content)
