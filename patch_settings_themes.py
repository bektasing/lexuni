import re

with open('src/pages/Settings.tsx', 'r') as f:
    content = f.read()

# Replace THEMES
old_themes = re.search(r"const THEMES = \[.*?\];", content, re.DOTALL).group(0)
new_themes = """const THEMES = [
  { id: 'arctic', name: 'Arctic', description: 'Clean default', preview: ['#f8fafc', '#ffffff', '#2563eb', '#bfdbfe'] },
  { id: 'midnight', name: 'Midnight', description: 'Deep contrast', preview: ['#0f172a', '#1e293b', '#38bdf8', '#0ea5e9'] },
  { id: 'ocean', name: 'Ocean', description: 'Calm & fresh', preview: ['#ecfeff', '#ffffff', '#0891b2', '#cffafe'] },
  { id: 'forest', name: 'Forest', description: 'Natural green', preview: ['#f0fdf4', '#ffffff', '#16a34a', '#dcfce7'] },
  { id: 'sunset', name: 'Sunset', description: 'Warm amber', preview: ['#fff7ed', '#ffffff', '#ea580c', '#ffedd5'] },
  { id: 'violet', name: 'Violet', description: 'Creative plum', preview: ['#faf5ff', '#ffffff', '#9333ea', '#f3e8ff'] },
];"""
content = content.replace(old_themes, new_themes)

# Find the collapsed preview logic
old_collapsed_preview = """          <div className="flex items-center space-x-3">
            <span className="text-tx-secondary font-bold text-sm bg-surface px-3 py-1 rounded-lg border border-border">
              {THEMES.find(t => t.id === activeTheme)?.name || 'Default'}
            </span>"""
new_collapsed_preview = """          <div className="flex items-center space-x-3">
            <div className="flex space-x-0.5 bg-surface px-2 py-1.5 rounded-lg border border-border shadow-sm">
              {THEMES.find(t => t.id === activeTheme)?.preview.map((color, i) => (
                <div key={i} className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: color }}></div>
              ))}
            </div>"""
content = content.replace(old_collapsed_preview, new_collapsed_preview)

# Find the expanded options map
old_expanded_button = """                <div className={`w-12 h-12 rounded-xl flex shrink-0 shadow-inner overflow-hidden border border-border ${theme.color}`}>
                  <div className="w-1/2 h-full bg-transparent"></div>
                  <div className={`w-1/2 h-full ${theme.accent} opacity-90`}></div>
                </div>"""
new_expanded_button = """                <div className="flex space-x-0.5 mr-2 shrink-0 bg-surface p-2 rounded-xl border border-border shadow-sm">
                  {theme.preview.map((color, i) => (
                    <div key={i} className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: color }}></div>
                  ))}
                </div>"""
content = content.replace(old_expanded_button, new_expanded_button)

# Also apply classes page-enter to the main container
content = content.replace('className="p-4 sm:p-6 pb-24 max-w-3xl mx-auto"', 'className="p-4 sm:p-6 pb-24 max-w-3xl mx-auto page-enter"')

# Apply hover-card tap-card to elements in settings
content = content.replace('className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden p-5"', 'className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden p-5 hover-card"')
content = content.replace('className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden"', 'className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden hover-card"')
content = content.replace('className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"', 'className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover-card"')

# Apply to Theme button
content = content.replace('className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center space-x-4', 'className={`p-4 rounded-2xl border-2 text-left flex items-center space-x-4 hover-card tap-card')

# Modal animation in Settings
content = content.replace('className="w-full mt-4 px-4 py-3 bg-surface text-tx-secondary font-bold rounded-xl border border-border active:bg-bg"', 'className="w-full mt-4 px-4 py-3 bg-surface text-tx-secondary font-bold rounded-xl border border-border btn-primary"')

with open('src/pages/Settings.tsx', 'w') as f:
    f.write(content)
