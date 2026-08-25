import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Search, Plus, Edit2, Trash2, Download, X, Check } from 'lucide-react';

export default function Words() {
  const words = useLiveQuery(() => db.words.toArray());
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'alphabetical' | 'mistakes'>('newest');
  
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [enInput, setEnInput] = useState('');
  const [trInput, setTrInput] = useState('');

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filteredAndSortedWords = useMemo(() => {
    if (!words) return [];
    
    let result = words.filter(w => 
      w.english.toLowerCase().includes(search.toLowerCase()) || 
      w.turkish.toLowerCase().includes(search.toLowerCase())
    );

    switch (sort) {
      case 'newest':
        result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        break;
      case 'oldest':
        result.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
        break;
      case 'alphabetical':
        result.sort((a, b) => a.english.localeCompare(b.english));
        break;
      case 'mistakes':
        result.sort((a, b) => b.wrongCount - a.wrongCount);
        break;
    }
    
    return result;
  }, [words, search, sort]);

  const handleSaveWord = async () => {
    const en = enInput.trim();
    const tr = trInput.trim();
    if (!en || !tr) return;

    if (editingId) {
      // Edit
      const existing = await db.words.where('english').equalsIgnoreCase(en).first();
      if (existing && existing.id !== editingId) {
        alert('This English word already exists.');
        return;
      }
      await db.words.update(editingId, { english: en, turkish: tr });
      setEditingId(null);
    } else {
      // Add
      const existing = await db.words.where('english').equalsIgnoreCase(en).first();
      if (existing) {
        alert('This English word already exists.');
        return;
      }
      await db.words.add({
        id: crypto.randomUUID(),
        english: en,
        turkish: tr,
        createdAt: new Date().toISOString(),
        correctCount: 0,
        wrongCount: 0
      });
      setIsAdding(false);
    }
    setEnInput('');
    setTrInput('');
  };

  const handleExport = () => {
    if (!words || words.length === 0) return;
    const content = words.map(w => `${w.english} = ${w.turkish}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lexuni-backup-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDelete = async (id: string) => {
    await db.words.delete(id);
    setDeleteConfirmId(null);
  };

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-3xl mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">All Words</h1>
          <p className="text-slate-500 font-medium mt-1">{words?.length || 0} saved</p>
        </div>
        <button
          onClick={handleExport}
          className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700 active:bg-slate-50 shadow-sm"
          title="Export Backup"
        >
          <Download size={20} />
        </button>
      </header>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search words..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          />
        </div>
        <select
          value={sort}
          onChange={e => setSort(e.target.value as any)}
          className="px-4 py-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 cursor-pointer"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="alphabetical">A-Z</option>
          <option value="mistakes">Most Mistakes</option>
        </select>
        <button
          onClick={() => {
            setIsAdding(true);
            setEditingId(null);
            setEnInput('');
            setTrInput('');
          }}
          className="flex items-center justify-center space-x-2 bg-blue-600 text-white px-5 py-3 rounded-xl font-medium active:bg-blue-700"
        >
          <Plus size={20} />
          <span className="hidden sm:inline">Add Word</span>
        </button>
      </div>

      {(isAdding || editingId) && (
        <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl mb-6 shadow-inner">
          <h3 className="font-bold text-blue-900 mb-3">{editingId ? 'Edit Word' : 'Add New Word'}</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="English"
              value={enInput}
              onChange={e => setEnInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200"
              autoFocus
            />
            <input
              type="text"
              placeholder="Turkish"
              value={trInput}
              onChange={e => setTrInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSaveWord()}
              className="flex-1 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200"
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveWord}
                className="flex-1 sm:flex-none flex items-center justify-center bg-blue-600 text-white px-4 py-3 rounded-xl active:bg-blue-700"
              >
                <Check size={20} />
              </button>
              <button
                onClick={() => {
                  setIsAdding(false);
                  setEditingId(null);
                }}
                className="flex-1 sm:flex-none flex items-center justify-center bg-white text-slate-500 border border-slate-200 px-4 py-3 rounded-xl active:bg-slate-50"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {filteredAndSortedWords.map(word => (
          <div key={word.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between group">
            <div className="flex-1">
              <div className="font-bold text-lg text-slate-900">{word.english}</div>
              <div className="text-slate-600">{word.turkish}</div>
              <div className="text-xs text-slate-400 mt-2 flex space-x-3 font-medium">
                <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">✓ {word.correctCount}</span>
                <span className="text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md">✗ {word.wrongCount}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
              {deleteConfirmId === word.id ? (
                <div className="flex items-center bg-rose-50 rounded-xl p-1">
                  <span className="text-xs text-rose-700 font-bold px-2">Sure?</span>
                  <button onClick={() => handleDelete(word.id)} className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg">
                    <Check size={18} />
                  </button>
                  <button onClick={() => setDeleteConfirmId(null)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg">
                    <X size={18} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setEditingId(word.id);
                      setEnInput(word.english);
                      setTrInput(word.turkish);
                      setIsAdding(false);
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(word.id)}
                    className="p-2.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}

        {filteredAndSortedWords.length === 0 && (
          <div className="text-center py-12 text-slate-500 font-medium">
            {words?.length === 0 ? "You haven't added any words yet." : "No words found matching your search."}
          </div>
        )}
      </div>
    </div>
  );
}
