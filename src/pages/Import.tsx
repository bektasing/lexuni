import { useState } from 'react';
import { db } from '../db/db';
import { Import as ImportIcon, Sparkles, Copy, CheckCircle2, AlertCircle, Info, ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Modal from '../components/Modal';

type ParsedWord = {
  english: string;
  turkish: string;
  original: string;
  status: 'valid' | 'duplicate' | 'invalid';
};

export default function ImportPage() {
  const [input, setInput] = useState('');
  const [preview, setPreview] = useState<ParsedWord[] | null>(null);
  const [groupName, setGroupName] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [importSuccess, setImportSuccess] = useState<{ count: number, duplicates: number, groupName: string, groupId: string } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const navigate = useNavigate();

  const handlePreview = async () => {
    if (!input.trim()) return;

    const rawLines = input.split('\n').map(l => l.trim()).filter(l => l);
    const headerLine = rawLines.find(l => l.startsWith('#'));
    
    let parsedGroupName = `Imported Words - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
    if (headerLine) {
      const cleanHeader = headerLine.replace(/^#+/, '').trim();
      if (cleanHeader) parsedGroupName = cleanHeader;
    }
    setGroupName(parsedGroupName);

    const lines = rawLines.filter(l => !l.startsWith('#'));
    const existingWords = await db.words.toArray();
    const existingSet = new Set(existingWords.map(w => w.english.toLowerCase()));

    const parsed: ParsedWord[] = [];
    const newWordsSet = new Set<string>();

    for (const line of lines) {
      let separator = '';
      if (line.includes('=')) separator = '=';
      else if (line.includes(':')) separator = ':';
      else if (line.includes('-')) separator = '-';

      if (!separator) {
        parsed.push({ english: '', turkish: '', original: line, status: 'invalid' });
        continue;
      }

      const parts = line.split(separator);
      const en = parts[0].trim();
      const tr = parts.slice(1).join(separator).trim();

      if (!en || !tr) {
        parsed.push({ english: en, turkish: tr, original: line, status: 'invalid' });
        continue;
      }

      const enLower = en.toLowerCase();
      if (existingSet.has(enLower) || newWordsSet.has(enLower)) {
        parsed.push({ english: en, turkish: tr, original: line, status: 'duplicate' });
      } else {
        newWordsSet.add(enLower);
        parsed.push({ english: en, turkish: tr, original: line, status: 'valid' });
      }
    }

    setPreview(parsed);
  };

  const handleImport = async () => {
    if (!preview || isImporting) return;
    const validWords = preview.filter(p => p.status === 'valid');
    if (validWords.length === 0) return;

    const groupId = crypto.randomUUID();
    const safeGroupName = groupName.trim() || 'Imported Words';
    setIsImporting(true);
    setImportError(null);

    try {
      const createdAt = new Date().toISOString();
      const newEntries = validWords.map(w => ({
        id: crypto.randomUUID(),
        groupId,
        english: w.english,
        turkish: w.turkish,
        createdAt,
        correctCount: 0,
        wrongCount: 0
      }));

      await db.transaction('rw', db.groups, db.words, async () => {
        await db.groups.add({ id: groupId, name: safeGroupName, createdAt });
        await db.words.bulkAdd(newEntries);
      });

      const result = {
        count: validWords.length,
        duplicates: preview.filter(p => p.status === 'duplicate').length,
        groupName: safeGroupName,
        groupId
      };

      setInput('');
      setPreview(null);
      setImportSuccess(result);
    } catch {
      setImportSuccess(null);
      setImportError('The words could not be imported. Your existing vocabulary was not changed. Please try again.');
    } finally {
      setIsImporting(false);
    }
  };

  const closeImportSuccess = () => setImportSuccess(null);

  const viewImportedGroup = () => {
    const groupId = importSuccess?.groupId;
    setImportSuccess(null);
    navigate(groupId ? `/words?groupId=${encodeURIComponent(groupId)}` : '/words');
  };

  const copyPrompt = () => {
    const prompt = `Extract useful English vocabulary from the provided image or text and translate it naturally into Turkish.

Return ONLY in this format:

# List Name

english word = Turkish meaning
english word = Turkish meaning
english word = Turkish meaning

Rules:
* One English word or useful phrase per line.
* Use = between English and Turkish.
* Do not use numbering.
* Do not use bullets.
* Do not add explanations.
* Do not use Markdown code blocks.
* Keep Turkish meanings short and natural.
* Avoid duplicates.
* Ignore extremely basic English words unless they are important in context.
* If a word has multiple common meanings, separate them using /.`;
    
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const validCount = preview?.filter(p => p.status === 'valid').length || 0;
  const duplicateCount = preview?.filter(p => p.status === 'duplicate').length || 0;
  const invalidCount = preview?.filter(p => p.status === 'invalid').length || 0;

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-2xl mx-auto page-enter">
      <header className="mb-8 flex items-center space-x-4">
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
      </header>

      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 text-white mb-8 shadow-lg shadow-lg">
        <div className="flex items-center space-x-3 mb-3">
          <Sparkles className="text-blue-200" />
          <h2 className="text-xl font-bold">AI Import Helper</h2>
        </div>
        <p className="text-blue-100 text-sm mb-5 leading-relaxed">
          Upload a screenshot or text to ChatGPT or another AI, then use this prompt to convert it into Lexuni's import format.
        </p>
        <button
          onClick={copyPrompt}
          className="flex items-center justify-center w-full space-x-2 bg-surface/20 hover:bg-surface/30 text-white py-3 rounded-xl font-semibold btn-primary"
        >
          {copied ? <CheckCircle2 size={18} /> : <Copy size={18} />}
          <span>{copied ? 'Copied!' : 'Copy AI Prompt'}</span>
        </button>
      </div>

      <div className="bg-surface p-4 rounded-3xl shadow-sm border border-border mb-6 hover-card">
        <div className="flex items-start justify-between mb-2">
          <label className="font-bold text-tx-secondary ml-2">Vocabulary List</label>
          <div className="text-xs text-tx-muted bg-surface-hover px-2 py-1 rounded font-mono">word = meaning</div>
        </div>
        <textarea
          value={input}
          onChange={e => {
            setInput(e.target.value);
            if (preview) setPreview(null);
          }}
          placeholder={"# Chapter 1\n\nreliable = güvenilir\ndeploy = yayına almak\nretrieve = geri almak"}
          className="w-full h-48 p-4 bg-bg rounded-2xl outline-none focus:ring-2 focus:ring-primary resize-none font-mono text-sm"
        ></textarea>
        
        <button
          onClick={handlePreview}
          disabled={!input.trim()}
          className="w-full mt-4 flex items-center justify-center space-x-2 bg-tx text-bg py-4 rounded-2xl font-bold text-lg disabled:opacity-50 disabled:active:scale-100 btn-primary"
        >
          <ImportIcon size={20} />
          <span>Preview Import</span>
        </button>
      </div>

      {preview && (
        <div className="bg-surface p-6 rounded-3xl shadow-sm border border-border animate-in fade-in slide-in-from-bottom-4">
          <h3 className="font-bold text-xl mb-1">Import Preview</h3>
          <p className="text-tx-secondary font-medium mb-4">Group: <span className="text-tx font-bold">{groupName}</span></p>
          
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-success-bg text-success-tx p-3 rounded-xl text-center">
              <div className="text-2xl font-black">{validCount}</div>
              <div className="text-xs font-bold uppercase mt-1">New</div>
            </div>
            <div className="bg-warning-bg text-warning-tx p-3 rounded-xl text-center">
              <div className="text-2xl font-black">{duplicateCount}</div>
              <div className="text-xs font-bold uppercase mt-1">Duplicates</div>
            </div>
            <div className="bg-danger-bg text-danger-tx p-3 rounded-xl text-center">
              <div className="text-2xl font-black">{invalidCount}</div>
              <div className="text-xs font-bold uppercase mt-1">Invalid</div>
            </div>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-2">
            {preview.map((p, i) => (
              <div key={i} className="flex items-center space-x-3 text-sm p-2 rounded-lg bg-bg">
                {p.status === 'valid' && <CheckCircle2 className="text-emerald-500 shrink-0" size={16} />}
                {p.status === 'duplicate' && <Info className="text-warning-tx shrink-0" size={16} />}
                {p.status === 'invalid' && <AlertCircle className="text-rose-500 shrink-0" size={16} />}
                
                <span className="truncate flex-1">
                  {p.status === 'invalid' ? p.original : (
                    <>
                      <span className="font-bold">{p.english}</span>
                      <span className="text-tx-muted mx-2">→</span>
                      <span>{p.turkish}</span>
                    </>
                  )}
                </span>
                
                {p.status === 'duplicate' && <span className="text-xs text-warning-tx font-medium">Exists</span>}
                {p.status === 'invalid' && <span className="text-xs text-danger-tx font-medium">Invalid format</span>}
              </div>
            ))}
          </div>

          {validCount > 0 && (
            <button
              onClick={handleImport}
              disabled={isImporting}
              className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-lg btn-primary shadow-lg disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isImporting ? 'Importing…' : `Import ${validCount} ${validCount === 1 ? 'Word' : 'Words'}`}
            </button>
          )}
        </div>
      )}

      <Modal 
        isOpen={!!importSuccess} 
        onClose={closeImportSuccess}
        title="Import Complete"
        footer={
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={viewImportedGroup}
              className="min-h-11 flex-1 rounded-xl border border-border bg-surface px-4 py-3 font-bold text-tx-secondary transition-colors hover:bg-surface-hover"
            >
              View Group
            </button>
            <button
              type="button"
              onClick={closeImportSuccess}
              className="min-h-11 flex-1 rounded-xl bg-primary px-4 py-3 font-bold text-white transition-colors hover:bg-primary-hover"
            >
              Done
            </button>
          </div>
        }
      >
        <div className="py-2 text-center">
          <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-success-bg text-success-tx">
            <CheckCircle2 size={32} aria-hidden="true" />
          </div>
          <h3 className="mb-2 text-2xl font-bold text-tx">
            {importSuccess?.count ?? 0} {(importSuccess?.count ?? 0) === 1 ? 'word' : 'words'} added
          </h3>
          {importSuccess?.groupName ? (
            <p className="mb-1 break-words font-medium text-tx-secondary">{importSuccess.groupName}</p>
          ) : null}
          {(importSuccess?.duplicates ?? 0) > 0 ? (
            <p className="mt-2 text-sm text-tx-muted">{importSuccess?.duplicates} duplicates skipped</p>
          ) : null}
        </div>
      </Modal>

      <Modal
        isOpen={!!importError}
        onClose={() => setImportError(null)}
        title="Import Failed"
        footer={
          <button
            type="button"
            onClick={() => setImportError(null)}
            className="min-h-11 w-full rounded-xl bg-primary px-4 py-3 font-bold text-white hover:bg-primary-hover"
          >
            Try Again
          </button>
        }
      >
        <div className="flex gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-danger-bg text-danger-tx">
            <AlertCircle size={22} aria-hidden="true" />
          </div>
          <p className="self-center leading-relaxed text-tx-secondary">{importError}</p>
        </div>
      </Modal>
    </div>
  );
}
