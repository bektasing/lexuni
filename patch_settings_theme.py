import re

with open('src/pages/Settings.tsx', 'r') as f:
    content = f.read()

# Add ChevronDown, ChevronUp to imports
if "ChevronDown" not in content:
    content = content.replace("ExternalLink } from 'lucide-react';", "ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';")

# Add state
if "const [isThemeExpanded, setIsThemeExpanded]" not in content:
    content = content.replace("const [restoreError, setRestoreError] = useState<string | null>(null);", "const [restoreError, setRestoreError] = useState<string | null>(null);\n  const [isThemeExpanded, setIsThemeExpanded] = useState(false);")

# Update App Theme section
old_theme_section = """      <section className="mb-10">
        <h2 className="text-xl font-bold text-tx mb-4 flex items-center space-x-2">
          <SettingsIcon size={20} />
          <span>App Theme</span>
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {THEMES.map((theme) => {
            const isActive = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center space-x-4 ${
                  isActive ? 'border-primary bg-primary-soft ring-2 ring-primary-soft' : 'border-border bg-surface hover:border-border-strong hover:bg-bg'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex shrink-0 shadow-inner overflow-hidden border border-border ${theme.color}`}>
                  <div className="w-1/2 h-full bg-transparent"></div>
                  <div className={`w-1/2 h-full ${theme.accent} opacity-90`}></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-tx text-lg">{theme.name}</h3>
                  <p className="text-tx-secondary text-sm font-medium">{theme.description}</p>
                </div>
                {isActive && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shrink-0">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>"""

new_theme_section = """      <section className="mb-10">
        <div 
          className="flex items-center justify-between cursor-pointer group mb-4"
          onClick={() => setIsThemeExpanded(!isThemeExpanded)}
        >
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-tx flex items-center space-x-2">
              <SettingsIcon size={20} />
              <span>App Theme</span>
            </h2>
          </div>
          <div className="flex items-center space-x-3">
            <span className="text-tx-secondary font-bold text-sm bg-surface px-3 py-1 rounded-lg border border-border">
              {THEMES.find(t => t.id === activeTheme)?.name || 'Default'}
            </span>
            <div className="text-tx-muted group-hover:text-tx transition-colors bg-surface p-1 rounded-lg border border-border">
              {isThemeExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </div>
          </div>
        </div>
        
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-300 origin-top overflow-hidden ${isThemeExpanded ? 'opacity-100 max-h-[1000px] mt-4' : 'opacity-0 max-h-0'}`}>
          {THEMES.map((theme) => {
            const isActive = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center space-x-4 ${
                  isActive ? 'border-primary bg-primary-soft ring-2 ring-primary-soft' : 'border-border bg-surface hover:border-border-strong hover:bg-bg'
                }`}
              >
                <div className={`w-12 h-12 rounded-xl flex shrink-0 shadow-inner overflow-hidden border border-border ${theme.color}`}>
                  <div className="w-1/2 h-full bg-transparent"></div>
                  <div className={`w-1/2 h-full ${theme.accent} opacity-90`}></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-tx text-lg">{theme.name}</h3>
                  <p className="text-tx-secondary text-sm font-medium">{theme.description}</p>
                </div>
                {isActive && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center text-white shrink-0">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>"""

content = content.replace(old_theme_section, new_theme_section)

# Reorder Settings to: App Theme, App Info, Data Management, Developer
# Currently it is: App Theme, Data Management, App Info, Developer
data_management = """      <section className="mb-10">
        <h2 className="text-xl font-bold text-tx mb-4">Data Management</h2>"""
app_info = """      <section>
        <h2 className="text-xl font-bold text-tx mb-4">App Info</h2>"""

# Let's extract the sections and reorder them.
# It's easier to just find the entire sections.
# Data Management ends with </section>
# App Info ends with </section>
def extract_section(content, start_tag):
    start = content.find(start_tag)
    end = content.find("</section>", start) + 10
    return content[start:end], start, end

dm_content, dm_start, dm_end = extract_section(content, data_management)
ai_content, ai_start, ai_end = extract_section(content, app_info)

# Replace ai_content to have mb-10
ai_content = ai_content.replace("<section>", '<section className="mb-10">')
dm_content = dm_content.replace('<section className="mb-10">', '<section>')

# Since Data Management comes first in the file, we swap them
content = content[:dm_start] + ai_content + "\n\n" + dm_content + content[ai_end:]

with open('src/pages/Settings.tsx', 'w') as f:
    f.write(content)
