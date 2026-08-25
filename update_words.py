import re

with open('src/pages/Words.tsx', 'r') as f:
    content = f.read()

# Add Import to imports
content = content.replace("Combine, AlertTriangle } from 'lucide-react';", "Combine, AlertTriangle, Import } from 'lucide-react';")

# Replace header
old_header = """      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-tx">Vocabulary</h1>
          <p className="text-tx-secondary font-medium mt-1">
            {words?.length || 0} words &middot; {groups?.length || 0} imports
          </p>
        </div>
        {!isMerging && (groups?.length || 0) > 1 && (
          <button
            onClick={() => setIsMerging(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-soft text-primary font-bold rounded-xl hover:bg-primary-soft transition-colors"
          >
            <Combine size={18} />
            <span className="hidden sm:inline">Merge Imports</span>
          </button>
        )}
      </header>"""

new_header = """      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-tx">Vocabulary</h1>
          <p className="text-tx-secondary font-medium mt-1">
            {words?.length || 0} words &middot; {groups?.length || 0} imports
          </p>
        </div>
        <div className="flex gap-2">
          {!isMerging && (groups?.length || 0) > 1 && (
            <button
              onClick={() => setIsMerging(true)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-surface border border-border text-tx-secondary font-bold rounded-xl hover:bg-surface-hover transition-colors"
            >
              <Combine size={18} />
              <span>Merge</span>
            </button>
          )}
          <button
            onClick={() => navigate('/words/import')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover transition-colors"
          >
            <Import size={18} />
            <span>Import Words</span>
          </button>
        </div>
      </header>"""

content = content.replace(old_header, new_header)

with open('src/pages/Words.tsx', 'w') as f:
    f.write(content)
