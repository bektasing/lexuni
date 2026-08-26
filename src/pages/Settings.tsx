import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Settings as SettingsIcon, Check, Download, Upload, AlertTriangle, ExternalLink, ChevronDown, Snowflake, Sun, Moon, Terminal, MessageCircle, Battery } from 'lucide-react';
import Modal from '../components/Modal';
import { useRef } from 'react';

const THEMES = [
  { id: 'arctic', name: 'Arctic', icon: Snowflake, description: 'Clean & crisp', preview: { bg: '#f8fafc', accent: '#2563eb' } },
  { id: 'midnight', name: 'Midnight', icon: Moon, description: 'Deep navy', preview: { bg: '#0f172a', accent: '#38bdf8' } },
  { id: 'developer', name: 'Developer', icon: Terminal, description: 'Editor inspired', preview: { bg: '#181818', accent: '#61D9E8' } },
  { id: 'lingo', name: 'Lingo', icon: MessageCircle, description: 'Bright & playful', preview: { bg: '#f9fafb', accent: '#58cc02' } },
  { id: 'battery', name: 'Battery', icon: Battery, description: 'OLED dark', preview: { bg: '#000000', accent: '#9ca3af' } },
  { id: 'sunset', name: 'Sunset', icon: Sun, description: 'Warm & bold', preview: { bg: '#faf0e6', accent: '#d9534f' } },
];


function ThemeChip({ preview, compact = false }: { preview: { bg: string, accent: string }, compact?: boolean }) {
  return (
    <div 
      className={`rounded-md border border-black/10 shadow-sm overflow-hidden flex shrink-0 ${compact ? 'w-10 h-[22px]' : 'w-12 h-8'}`}
    >
      <div className="flex-1" style={{ backgroundColor: preview.bg }} />
      <div className={`${compact ? 'w-2' : 'w-3'} shrink-0`} style={{ backgroundColor: preview.accent }} />
    </div>
  );
}


export default function Settings() {
  const wordsCount = useLiveQuery(() => db.words.count());
  const groupsCount = useLiveQuery(() => db.groups.count());
  const sessionsCount = useLiveQuery(() => db.sessions.count());
  
  const [activeTheme, setActiveTheme] = useState(() => {
    let stored = localStorage.getItem('lexuni-theme') || 'arctic';
    if (['light', 'ocean', 'forest', 'violet'].includes(stored)) stored = 'arctic';
    if (stored === 'dark') stored = 'midnight';
    return stored;
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restorePreview, setRestorePreview] = useState<any>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [isThemeExpanded, setIsThemeExpanded] = useState(false);

  const handleExportBackup = async () => {
    const groups = await db.groups.toArray();
    const words = await db.words.toArray();
    const sessions = await db.sessions.toArray();
    const sessionAnswers = await db.sessionAnswers.toArray();

    const backup = {
      format: "lexuni-backup",
      version: 1,
      exportedAt: new Date().toISOString(),
      appVersion: "3.0.0",
      data: {
        groups,
        words,
        sessions,
        sessionAnswers,
        preferences: {
          theme: localStorage.getItem('lexuni-theme') || 'light'
        }
      }
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const d = new Date();
    const dateStr = d.toISOString().split('T')[0];
    const timeStr = d.toTimeString().split(' ')[0].replace(/:/g, '').substring(0, 4);
    a.download = `lexuni-backup-${dateStr}-${timeStr}.json`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);

        if (json.format !== "lexuni-backup") {
          setRestoreError("This file is not a valid Lexuni backup.");
          return;
        }
        
        if (json.version > 1) {
          setRestoreError("This backup version is not supported.");
          return;
        }

        if (!json.data || !Array.isArray(json.data.words)) {
          setRestoreError("Missing required structures in backup.");
          return;
        }

        setRestorePreview({
          backup: json,
          date: json.exportedAt,
          words: json.data.words.length,
          groups: json.data.groups?.length || 0,
          sessionsCompleted: json.data.sessions?.filter((s: any) => s.status === 'finished' || !s.status).length || 0,
          sessionsActive: json.data.sessions?.filter((s: any) => s.status === 'active').length || 0,
          theme: json.data.preferences?.theme || 'light'
        });
      } catch (err) {
        setRestoreError("This file is corrupted or not valid JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!restorePreview) return;
    const backup = restorePreview.backup;
    
    try {
      await db.transaction('rw', db.words, db.groups, db.sessions, db.sessionAnswers, async () => {
        await db.words.clear();
        await db.groups.clear();
        await db.sessions.clear();
        await db.sessionAnswers.clear();

        if (backup.data.groups?.length) await db.groups.bulkAdd(backup.data.groups);
        if (backup.data.words?.length) await db.words.bulkAdd(backup.data.words);
        if (backup.data.sessions?.length) await db.sessions.bulkAdd(backup.data.sessions);
        if (backup.data.sessionAnswers?.length) await db.sessionAnswers.bulkAdd(backup.data.sessionAnswers);
      });

      if (backup.data.preferences?.theme) {
        handleThemeChange(backup.data.preferences.theme);
      }
      
      setRestorePreview(null);
    } catch (e) {
      setRestoreError("Failed to restore data. Existing data was kept intact.");
      setRestorePreview(null);
    }
  };

  const handleThemeChange = (themeId: string) => {
    setActiveTheme(themeId);
    localStorage.setItem('lexuni-theme', themeId);
    if (themeId === 'arctic') {
      document.documentElement.removeAttribute('data-theme');
    } else {
      document.documentElement.setAttribute('data-theme', themeId);
    }
  };

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-3xl mx-auto page-enter">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-tx">Settings</h1>
        <p className="text-tx-secondary font-medium mt-1">Preferences and app info</p>
      </header>

      <section className="mb-10">
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
            {(() => {
              const active = THEMES.find(t => t.id === activeTheme);
              return active ? (
                <div className="flex items-center space-x-2">
                  <active.icon size={16} className="text-tx-secondary hidden sm:block" />
                  <ThemeChip preview={active.preview} compact />
                </div>
              ) : null;
            })()}
            <div className="text-tx-muted group-hover:text-tx transition-colors bg-surface p-1 rounded-lg border border-border">
              <ChevronDown size={20} className={`transition-transform duration-200 ${isThemeExpanded ? 'rotate-180' : ''}`} />
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
                className={`p-4 rounded-2xl border-2 text-left flex items-center space-x-4 hover-card tap-card ${
                  isActive ? 'border-primary bg-primary-soft ring-2 ring-primary-soft' : 'border-border bg-surface hover:border-border-strong hover:bg-bg'
                }`}
              >
                <div className="mr-3">
                  <theme.icon size={20} className="text-tx-secondary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-tx text-lg">{theme.name}</h3>
                  <p className="text-tx-secondary text-sm font-medium">{theme.description}</p>
                </div>
                <div className="mr-1 flex items-center">
                  <ThemeChip preview={theme.preview} />
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

      <section className="mb-10">
        <h2 className="text-xl font-bold text-tx mb-4">App Info</h2>
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden hover-card">
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

      <section>
        <h2 className="text-xl font-bold text-tx mb-4">Data Management</h2>
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden p-5 hover-card">
          <p className="text-tx-secondary font-medium mb-5 leading-relaxed">
            Export your Lexuni data to move it to another device or keep a personal backup.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExportBackup}
              className="flex-1 flex items-center justify-center space-x-2 bg-surface text-tx-secondary py-3 px-4 rounded-xl border border-border font-bold active:bg-bg hover:bg-surface-hover"
            >
              <Download size={18} />
              <span>Export All Data</span>
            </button>
            
            <input 
              type="file" 
              accept=".json"
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileSelect}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center space-x-2 bg-primary text-white py-3 px-4 rounded-xl font-bold active:bg-primary-hover shadow-sm"
            >
              <Upload size={18} />
              <span>Import Backup</span>
            </button>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-bold text-tx mb-4">Developer</h2>
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover-card">
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
      </section>

      <Modal isOpen={!!restoreError} onClose={() => setRestoreError(null)} title="Invalid Backup">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-danger-bg text-danger-tx rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <p className="text-tx font-medium">{restoreError}</p>
          <button
            onClick={() => setRestoreError(null)}
            className="w-full mt-4 px-4 py-3 bg-surface text-tx-secondary font-bold rounded-xl border border-border btn-primary"
          >
            Close
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!restorePreview} onClose={() => setRestorePreview(null)} title="Restore Lexuni Backup?">
        {restorePreview && (
          <div className="space-y-5">
            <div>
              <p className="text-tx-secondary font-medium text-sm">Backup created:</p>
              <p className="text-tx font-bold">{new Date(restorePreview.date).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            
            <div>
              <p className="text-tx-secondary font-medium text-sm mb-2">Contains:</p>
              <ul className="list-disc list-inside space-y-1 text-tx font-medium">
                <li>{restorePreview.words} words</li>
                <li>{restorePreview.groups} import groups</li>
                <li>{restorePreview.sessionsCompleted} completed sessions</li>
                {restorePreview.sessionsActive > 0 && (
                  <li className="text-primary">{restorePreview.sessionsActive} active session</li>
                )}
                <li>Theme: <span className="capitalize">{restorePreview.theme}</span></li>
              </ul>
            </div>

            <div className="bg-danger-bg p-4 rounded-xl border border-danger-border">
              <p className="text-danger-tx font-bold text-sm">Warning:</p>
              <p className="text-danger-tx font-medium text-sm mt-1">
                Restoring this backup will permanently replace all current Lexuni data on this device.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setRestorePreview(null)}
                className="flex-1 px-4 py-3 bg-surface text-tx-secondary font-bold rounded-xl border border-border active:bg-bg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                className="flex-1 px-4 py-3 bg-danger-btn text-white font-bold rounded-xl active:bg-danger-btn-hover shadow-sm"
              >
                Restore Backup
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
