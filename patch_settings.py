import re

with open('src/pages/Settings.tsx', 'r') as f:
    content = f.read()

# Add ExternalLink to lucide-react imports
if "ExternalLink" not in content:
    content = content.replace("AlertTriangle } from 'lucide-react';", "AlertTriangle, ExternalLink } from 'lucide-react';")

# Add Developer section
app_info_end = content.find("</section>", content.find(">App Info</h2>")) + 10

dev_section = """

      <section className="mt-10">
        <h2 className="text-xl font-bold text-tx mb-4">Developer</h2>
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-tx text-lg">Hamza Bektaş</h3>
            <p className="text-tx-secondary font-medium">Developer of Lexuni</p>
          </div>
          <a
            href="https://hamzabektas.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 bg-surface text-tx-secondary hover:text-tx py-3 px-5 rounded-xl border border-border font-bold active:bg-bg hover:bg-surface-hover transition-colors"
          >
            <span>Visit Website</span>
            <ExternalLink size={18} />
          </a>
        </div>
      </section>"""

content = content[:app_info_end] + dev_section + content[app_info_end:]

with open('src/pages/Settings.tsx', 'w') as f:
    f.write(content)
