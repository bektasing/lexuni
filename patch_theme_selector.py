import re

with open('src/pages/Settings.tsx', 'r') as f:
    content = f.read()

# 1. Update THEMES structure
old_themes = re.search(r"const THEMES = \[.*?\];", content, re.DOTALL).group(0)
new_themes = """const THEMES = [
  { id: 'arctic', name: 'Arctic', description: 'Clean default', preview: { bg: '#f8fafc', surface: '#ffffff', accent: '#2563eb' } },
  { id: 'midnight', name: 'Midnight', description: 'Deep contrast', preview: { bg: '#0f172a', surface: '#1e293b', accent: '#38bdf8' } },
  { id: 'ocean', name: 'Ocean', description: 'Calm & fresh', preview: { bg: '#ecfeff', surface: '#ffffff', accent: '#0891b2' } },
  { id: 'forest', name: 'Forest', description: 'Natural green', preview: { bg: '#f0fdf4', surface: '#ffffff', accent: '#16a34a' } },
  { id: 'sunset', name: 'Sunset', description: 'Warm amber', preview: { bg: '#fff7ed', surface: '#ffffff', accent: '#ea580c' } },
  { id: 'violet', name: 'Violet', description: 'Creative plum', preview: { bg: '#faf5ff', surface: '#ffffff', accent: '#9333ea' } },
];

function ThemeChip({ preview, compact = false }: { preview: { bg: string, surface: string, accent: string }, compact?: boolean }) {
  return (
    <div 
      className={`rounded-md border border-black/10 shadow-sm overflow-hidden flex shrink-0 ${compact ? 'w-10 h-[22px]' : 'w-14 h-8'}`}
    >
      <div className="flex-1" style={{ backgroundColor: preview.bg }} />
      <div className="flex-1" style={{ backgroundColor: preview.surface }} />
      <div className={`${compact ? 'w-1.5' : 'w-2'} shrink-0`} style={{ backgroundColor: preview.accent }} />
    </div>
  );
}
"""
content = content.replace(old_themes, new_themes)

# 2. Update collapsed preview
old_collapsed = """          <div className="flex items-center space-x-3">
            <div className="flex space-x-0.5 bg-surface px-2 py-1.5 rounded-lg border border-border shadow-sm">
              {THEMES.find(t => t.id === activeTheme)?.preview.map((color, i) => (
                <div key={i} className="w-4 h-4 rounded-full border border-black/10" style={{ backgroundColor: color }}></div>
              ))}
            </div>
            <div className="text-tx-muted group-hover:text-tx transition-colors bg-surface p-1 rounded-lg border border-border">
              <ChevronDown size={20} className={`transition-transform duration-200 ${isThemeExpanded ? 'rotate-180' : ''}`} />
            </div>
          </div>"""

new_collapsed = """          <div className="flex items-center space-x-3">
            {(() => {
              const active = THEMES.find(t => t.id === activeTheme);
              return active ? <ThemeChip preview={active.preview} compact /> : null;
            })()}
            <div className="text-tx-muted group-hover:text-tx transition-colors bg-surface p-1 rounded-lg border border-border">
              <ChevronDown size={20} className={`transition-transform duration-200 ${isThemeExpanded ? 'rotate-180' : ''}`} />
            </div>
          </div>"""
content = content.replace(old_collapsed, new_collapsed)

# 3. Update expanded button preview
old_expanded = """                <div className="flex space-x-0.5 mr-2 shrink-0 bg-surface p-2 rounded-xl border border-border shadow-sm">
                  {theme.preview.map((color, i) => (
                    <div key={i} className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: color }}></div>
                  ))}
                </div>"""

new_expanded = """                <div className="mr-2">
                  <ThemeChip preview={theme.preview} />
                </div>"""
content = content.replace(old_expanded, new_expanded)

with open('src/pages/Settings.tsx', 'w') as f:
    f.write(content)
