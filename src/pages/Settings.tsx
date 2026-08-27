import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Settings as SettingsIcon, Check, Download, Upload, AlertTriangle, ExternalLink, ChevronDown, Snowflake, Sun, Moon, Terminal, MessageCircle, Battery } from 'lucide-react';
import Modal from '../components/Modal';
import { useRef } from 'react';

const THEMES = [
  { id: 'arctic', name: 'Arctic', icon: Snowflake, description: 'Clean & crisp', preview: { bg: '#e0f2fe', accent: '#0284c7' } },
  { id: 'midnight', name: 'Midnight', icon: Moon, description: 'Deep navy', preview: { bg: '#020617', accent: '#0ea5e9' } },
  { id: 'developer', name: 'Developer', icon: Terminal, description: 'Editor inspired', preview: { bg: '#181818', accent: '#61D9E8' } },
  { id: 'lingo', name: 'Lingo', icon: MessageCircle, description: 'Bright & playful', preview: { bg: '#f0fdf4', accent: '#22c55e' } },
  { id: 'battery', name: 'Battery', icon: Battery, description: 'OLED dark', preview: { bg: '#000000', accent: '#4ade80' } },
  { id: 'sunset', name: 'Sunset', icon: Sun, description: 'Warm & bold', preview: { bg: '#fff7ed', accent: '#ea580c' } },
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
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreSuccess, setRestoreSuccess] = useState(false);
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

    setRestorePreview(null);
    setRestoreError(null);
    setRestoreSuccess(false);

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
      } catch {
        setRestoreError("This file is corrupted or not valid JSON.");
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleConfirmRestore = async () => {
    if (!restorePreview || isRestoring) return;
    setIsRestoring(true);
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
      setRestoreSuccess(true);
    } catch {
      setRestoreError("Could not restore this backup. Your current data was not changed.");
      setRestorePreview(null);
    } finally {
      setIsRestoring(false);
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
    <div className="page-shell page-enter">
      <header className="page-header">
        <h1>Settings</h1>
        <p>Preferences and app info</p>
      </header>

      <section className="settings-section">
        <button
          type="button"
          className="settings-section-head"
          onClick={() => setIsThemeExpanded(!isThemeExpanded)}
          aria-expanded={isThemeExpanded}
        >
          <div className="flex items-center space-x-2">
            <h2>
              <SettingsIcon size={18} />
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
            <div className="text-tx-muted group-hover:text-tx transition-colors">
              <ChevronDown size={20} className={`transition-transform duration-200 ${isThemeExpanded ? 'rotate-180' : ''}`} />
            </div>
          </div>
        </button>
        
        <div className={`theme-options ${isThemeExpanded ? 'theme-options-open' : ''}`}>
          {THEMES.map((theme) => {
            const isActive = activeTheme === theme.id;
            return (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme.id)}
                className={`theme-option ${isActive ? 'theme-option-active' : ''}`}
              >
                <div className="mr-3">
                  <theme.icon size={20} className="text-tx-secondary" />
                </div>
                <div className="flex-1">
                  <h3>{theme.name}</h3>
                  <p>{theme.description}</p>
                </div>
                <div className="mr-1 flex items-center">
                  <ThemeChip preview={theme.preview} />
                </div>
                {isActive && (
                  <div className="theme-check">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-title">App Info</h2>
        <div className="settings-group">
          <div className="settings-row">
            <span className="font-bold text-tx-secondary">Vocabulary Size</span>
            <span className="text-tx-secondary font-medium">{wordsCount ?? '-'} words</span>
          </div>
          <div className="settings-row">
            <span className="font-bold text-tx-secondary">Import Groups</span>
            <span className="text-tx-secondary font-medium">{groupsCount ?? '-'} groups</span>
          </div>
          <div className="settings-row">
            <span className="font-bold text-tx-secondary">Total Sessions</span>
            <span className="text-tx-secondary font-medium">{sessionsCount ?? '-'} sessions</span>
          </div>
          <div className="settings-row">
            <span className="font-bold text-tx-secondary">Lexuni Version</span>
            <span className="text-tx-secondary font-medium">3.0.0</span>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-title">Data Management</h2>
        <div className="settings-content">
          <p className="text-tx-secondary font-medium mb-5 leading-relaxed">
            Export your Lexuni data to move it to another device or keep a personal backup.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExportBackup}
              className="button button-secondary flex-1"
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
              className="button button-primary flex-1"
            >
              <Upload size={18} />
              <span>Import Backup</span>
            </button>
          </div>
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-title">Developer</h2>
        <div className="settings-content flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-tx text-lg">Hamza Bektaş</h3>
            <p className="text-tx-secondary font-medium">Developer of Lexuni</p>
          </div>
          <a
            href="https://hamzabektas.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="button button-secondary flex-1 sm:flex-none"
          >
            <span>Visit Website</span>
            <ExternalLink size={18} />
          </a>
        </div>
      </section>

      <Modal
        isOpen={!!restoreError}
        onClose={() => setRestoreError(null)}
        title="Restore Error"
        footer={
          <button
            type="button"
            onClick={() => setRestoreError(null)}
            className="min-h-11 w-full rounded-xl bg-primary px-4 py-3 font-bold text-white hover:bg-primary-hover"
          >
            Done
          </button>
        }
      >
        <div className="space-y-4 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-danger-bg text-danger-tx">
            <AlertTriangle size={32} aria-hidden="true" />
          </div>
          <p className="text-tx font-medium">{restoreError}</p>
        </div>
      </Modal>

      <Modal
        isOpen={!!restorePreview}
        onClose={() => { if (!isRestoring) setRestorePreview(null); }}
        title="Restore Lexuni Backup?"
        dismissible={!isRestoring}
        footer={
          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => setRestorePreview(null)}
              disabled={isRestoring}
              autoFocus
              className="min-h-11 flex-1 rounded-xl border border-border bg-surface px-4 py-3 font-bold text-tx-secondary transition-colors hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmRestore}
              disabled={isRestoring}
              className="min-h-11 flex-1 rounded-xl bg-danger-btn px-4 py-3 font-bold text-white shadow-sm transition-colors hover:bg-danger-btn-hover disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRestoring ? 'Restoring…' : 'Restore Backup'}
            </button>
          </div>
        }
      >
        <div className="space-y-5">
          <div>
            <p className="text-sm font-medium text-tx-secondary">Backup created:</p>
            <p className="break-words font-bold text-tx">
              {restorePreview?.date
                ? new Date(restorePreview.date).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                : 'Unknown date'}
            </p>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-tx-secondary">Contains:</p>
            <ul className="list-inside list-disc space-y-1 font-medium text-tx">
              <li>{restorePreview?.words ?? 0} words</li>
              <li>{restorePreview?.groups ?? 0} import groups</li>
              <li>{restorePreview?.sessionsCompleted ?? 0} completed sessions</li>
              {(restorePreview?.sessionsActive ?? 0) > 0 ? (
                <li className="text-primary">{restorePreview?.sessionsActive} active session</li>
              ) : null}
              <li>Theme: <span className="capitalize">{restorePreview?.theme || 'default'}</span></li>
            </ul>
          </div>

          <div className="rounded-xl border border-danger-border bg-danger-bg p-4">
            <p className="text-sm font-bold text-danger-tx">Warning:</p>
            <p className="mt-1 text-sm font-medium text-danger-tx">
              Restoring this backup will permanently replace all current Lexuni data on this device.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={restoreSuccess}
        onClose={() => setRestoreSuccess(false)}
        title="Restore Complete"
        footer={
          <button
            type="button"
            onClick={() => setRestoreSuccess(false)}
            className="min-h-11 w-full rounded-xl bg-primary px-4 py-3 font-bold text-white transition-colors hover:bg-primary-hover"
          >
            Done
          </button>
        }
      >
        <div className="py-2 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success-bg text-success-tx">
            <Check size={32} strokeWidth={3} aria-hidden="true" />
          </div>
          <p className="mb-2 text-lg font-bold text-tx">Backup restored successfully.</p>
          <p className="text-sm text-tx-secondary">Your vocabulary, groups, and sessions have been updated.</p>
        </div>
      </Modal>
    </div>
  );
}
