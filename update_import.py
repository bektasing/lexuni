import re

with open('src/pages/Import.tsx', 'r') as f:
    content = f.read()

# Add ChevronLeft to lucide-react imports if missing
if "ChevronLeft" not in content:
    content = content.replace("AlertCircle, CheckCircle2 } from 'lucide-react';", "AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react';")

# Update header
old_header = """      <header className="mb-8">
        <h1 className="text-3xl font-bold text-tx">Import Words</h1>
        <p className="text-tx-secondary font-medium mt-1">Paste your vocabulary list below.</p>
      </header>"""

new_header = """      <header className="mb-8 flex items-center space-x-4">
        <button 
          onClick={() => navigate('/words')}
          className="p-2 bg-surface hover:bg-surface-hover text-tx-secondary rounded-xl border border-border transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-tx">Import Words</h1>
          <p className="text-tx-secondary font-medium mt-1">Paste your vocabulary list below.</p>
        </div>
      </header>"""

content = content.replace(old_header, new_header)

with open('src/pages/Import.tsx', 'w') as f:
    f.write(content)
