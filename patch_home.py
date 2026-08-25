import re

with open('src/pages/Home.tsx', 'r') as f:
    content = f.read()

# Main container
content = content.replace('className="p-6 pt-12 sm:pt-16 pb-24 max-w-2xl mx-auto"', 'className="p-6 pt-12 sm:pt-16 pb-24 max-w-2xl mx-auto page-enter"')
content = content.replace('className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center"', 'className="flex flex-col items-center justify-center min-h-[80vh] p-6 text-center page-enter"')

# Cards and buttons
content = content.replace('className="bg-surface rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-border mb-8"', 'className="bg-surface rounded-3xl p-6 sm:p-8 shadow-sm border border-border mb-8 hover-card"')
content = content.replace('className="mb-8 p-5 bg-warning-bg border border-amber-200 rounded-2xl shadow-sm"', 'className="mb-8 p-5 bg-warning-bg border border-amber-200 rounded-2xl shadow-sm hover-card tap-card"')
content = content.replace('className="mb-8 p-4 bg-primary-soft border border-primary-soft rounded-2xl cursor-pointer hover:bg-primary-soft transition-colors flex items-center justify-between"', 'className="mb-8 p-4 bg-primary-soft border border-primary-soft rounded-2xl cursor-pointer hover:bg-primary-soft transition-all flex items-center justify-between hover-card tap-card"')

content = content.replace('className="bg-primary text-white px-8 py-4 rounded-2xl font-semibold text-lg flex items-center space-x-2 active:scale-95 transition-transform"', 'className="bg-primary text-white px-8 py-4 rounded-2xl font-semibold text-lg flex items-center justify-center space-x-2 btn-primary hover:bg-primary-hover hover:shadow-md"')
content = content.replace('className="py-3 bg-amber-500 text-white font-bold rounded-xl active:bg-amber-600 shadow-sm"', 'className="py-3 bg-warning-tx text-white font-bold rounded-xl btn-primary hover:shadow-md"')
content = content.replace('className="py-3 bg-surface text-warning-tx border border-amber-200 font-bold rounded-xl active:bg-amber-100"', 'className="py-3 bg-surface text-warning-tx border border-amber-200 font-bold rounded-xl btn-primary hover:bg-amber-50"')

content = content.replace('className={`flex items-center justify-center space-x-2 py-4 rounded-2xl font-bold text-lg transition-all ${', 'className={`flex items-center justify-center space-x-2 py-4 rounded-2xl font-bold text-lg transition-all ${')
# In home button logic:
content = content.replace("'bg-primary text-white hover:bg-primary-hover active:scale-[0.98] shadow-lg shadow-lg'", "'bg-primary text-white hover:bg-primary-hover btn-primary shadow-lg'")

content = content.replace('className="flex items-center justify-center space-x-2 py-3.5 bg-surface border-2 border-border text-tx-secondary rounded-2xl font-semibold active:bg-bg transition-colors"', 'className="flex items-center justify-center space-x-2 py-3.5 bg-surface border-2 border-border text-tx-secondary rounded-2xl font-semibold btn-primary hover:border-border-strong"')

with open('src/pages/Home.tsx', 'w') as f:
    f.write(content)
