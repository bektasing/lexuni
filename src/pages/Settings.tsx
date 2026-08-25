import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Settings as SettingsIcon, Check } from 'lucide-react';

const THEMES = [
  { id: 'light', name: 'Light', description: 'Clean default', color: 'bg-[#f8fafc]', accent: 'bg-[#2563eb]' },
  { id: 'dark', name: 'Dark', description: 'Deep contrast', color: 'bg-[#020617]', accent: 'bg-[#3b82f6]' },
  { id: 'ocean', name: 'Ocean', description: 'Calm & fresh', color: 'bg-[#f0f9ff]', accent: 'bg-[#0891b2]' },
  { id: 'forest', name: 'Forest', description: 'Natural green', color: 'bg-[#fafaf9]', accent: 'bg-[#0d9488]' },
  { id: 'sunset', name: 'Sunset', description: 'Warm amber', color: 'bg-[#fff7ed]', accent: 'bg-[#d97706]' },
];

export default function Settings() {
  const wordsCount = useLiveQuery(() => db.words.count());
  const groupsCount = useLiveQuery(() => db.groups.count());
  const sessionsCount = useLiveQuery(() => db.sessions.count());
  
  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('lexuni-theme') || 'light';
  });

  const handleThemeChange = (themeId: string) => {
    setActiveTheme(themeId);
    localStorage.setItem('lexuni-theme', themeId);
    if (themeId === 'light') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeId);
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-3xl mx-auto">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-tx">Settings</h1>
        <p className="text-tx-secondary font-medium mt-1">Preferences and app info</p>
      </header>

      <section className="mb-10">
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
      </section>

      <section>
        <h2 className="text-xl font-bold text-tx mb-4">App Info</h2>
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden">
          <div className="p-4 flex items-center justify-between border-b border-border">
            <span className="font-bold text-tx-secondary">Vocabulary Size</span>
            <span className="text-tx-secondary font-medium">{wordsCount ?? '-'} words</span>
          </div>
          <div className="p-4 flex items-center justify-between border-b border-border">
            <span className="font-bold text-tx-secondary">Import Groups</span>
            <span className="text-tx-secondary font-medium">{groupsCount ?? '-'} groups</span>
          </div>
          <div className="p-4 flex items-center justify-between border-b border-border">
            <span className="font-bold text-tx-secondary">Total Sessions</span>
            <span className="text-tx-secondary font-medium">{sessionsCount ?? '-'} sessions</span>
          </div>
          <div className="p-4 flex items-center justify-between bg-bg">
            <span className="font-bold text-tx-secondary">Lexuni Version</span>
            <span className="text-tx-secondary font-medium">3.0.0</span>
          </div>
        </div>
      </section>
    </div>
  );
}
