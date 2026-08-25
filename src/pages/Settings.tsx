import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Settings as SettingsIcon, Check, Download, Upload, AlertTriangle, ExternalLink } from 'lucide-react';
import Modal from '../components/Modal';
import { useRef } from 'react';

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

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restorePreview, setRestorePreview] = useState<any>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);

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

      <section className="mb-10">
        <h2 className="text-xl font-bold text-tx mb-4">Data Management</h2>
        <div className="bg-surface rounded-2xl border border-border shadow-sm overflow-hidden p-5">
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
      </section>

      <Modal isOpen={!!restoreError} onClose={() => setRestoreError(null)} title="Invalid Backup">
        <div className="space-y-4 text-center">
          <div className="w-16 h-16 bg-danger-bg text-danger-tx rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={32} />
          </div>
          <p className="text-tx font-medium">{restoreError}</p>
          <button
            onClick={() => setRestoreError(null)}
            className="w-full mt-4 px-4 py-3 bg-surface text-tx-secondary font-bold rounded-xl border border-border active:bg-bg"
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
