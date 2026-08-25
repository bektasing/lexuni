import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Search, Plus, Edit2, Trash2, Download, X, Check, ChevronLeft, Play, Combine } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Words() {
  const navigate = useNavigate();
  const groups = useLiveQuery(() => db.groups.toArray());
  const words = useLiveQuery(() => db.words.toArray());
  const activeSessions = useLiveQuery(() => db.sessions.where('status').equals('active').toArray());
  const activeSession = activeSessions && activeSessions.length > 0 ? activeSessions[0] : null;
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  
  // Group List State
  const [deleteGroupConfirmId, setDeleteGroupConfirmId] = useState<string | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [isMerging, setIsMerging] = useState(false);
  const [mergeNameInput, setMergeNameInput] = useState('');
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  // Word Detail State
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'newest' | 'oldest' | 'alphabetical' | 'mistakes'>('newest');
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [enInput, setEnInput] = useState('');
  const [trInput, setTrInput] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Group Edit State
  const [isEditingGroup, setIsEditingGroup] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');

  const selectedGroup = groups?.find(g => g.id === selectedGroupId);
  const groupWords = useMemo(() => {
    if (!words || !selectedGroupId) return [];
    return words.filter(w => w.groupId === selectedGroupId);
  }, [words, selectedGroupId]);

  const filteredAndSortedWords = useMemo(() => {
    let result = groupWords.filter(w => 
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
  }, [groupWords, search, sort]);

  const handleSaveWord = async () => {
    if (!selectedGroupId) return;
    const en = enInput.trim();
    const tr = trInput.trim();
    if (!en || !tr) return;

    if (editingId) {
      const existing = await db.words.where('english').equalsIgnoreCase(en).first();
      if (existing && existing.id !== editingId) {
        alert('This English word already exists.');
        return;
      }
      await db.words.update(editingId, { english: en, turkish: tr });
      setEditingId(null);
    } else {
      const existing = await db.words.where('english').equalsIgnoreCase(en).first();
      if (existing) {
        alert('This English word already exists.');
        return;
      }
      await db.words.add({
        id: crypto.randomUUID(),
        groupId: selectedGroupId,
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

  const handleSaveGroupName = async () => {
    if (!selectedGroupId) return;
    const trimmed = groupNameInput.trim();
    if (!trimmed) {
       setIsEditingGroup(false);
       return;
    }
    await db.groups.update(selectedGroupId, { name: trimmed });
    setIsEditingGroup(false);
  };

  const handleExport = () => {
    if (!groupWords || groupWords.length === 0 || !selectedGroup) return;
    const content = `# ${selectedGroup.name}\n\n` + groupWords.map(w => `${w.english} = ${w.turkish}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lexuni-backup-${selectedGroup.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDeleteWord = async (id: string) => {
    await db.words.delete(id);
    setDeleteConfirmId(null);
    // Auto-delete group if it becomes empty
    if (groupWords.length === 1 && selectedGroupId) {
      await db.groups.delete(selectedGroupId);
      setSelectedGroupId(null);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (activeSession && activeSession.groupId === id) {
      alert('This group is currently being used by your active session. Finish the session first.');
      setDeleteGroupConfirmId(null);
      return;
    }
    const wordsInGroup = await db.words.where({ groupId: id }).toArray();
    const wordIds = wordsInGroup.map(w => w.id);
    if (wordIds.length > 0) {
      await db.words.bulkDelete(wordIds);
    }
    await db.groups.delete(id);
    setDeleteGroupConfirmId(null);
    setSelectedGroupIds(prev => { const n = new Set(prev); n.delete(id); return n; });
  };

  const handleBulkDelete = async () => {
    for (const id of Array.from(selectedGroupIds)) {
      if (activeSession && activeSession.groupId === id) {
        alert('One of the selected groups is currently being used by your active session. Finish the session first.');
        setBulkDeleteConfirm(false);
        return;
      }
    }
    for (const id of Array.from(selectedGroupIds)) {
      const wordsInGroup = await db.words.where({ groupId: id }).toArray();
      const wordIds = wordsInGroup.map(w => w.id);
      if (wordIds.length > 0) {
        await db.words.bulkDelete(wordIds);
      }
      await db.groups.delete(id);
    }
    setSelectedGroupIds(new Set());
    setBulkDeleteConfirm(false);
  };

  const handleMergeGroups = async () => {
    const trimmedName = mergeNameInput.trim();
    if (!trimmedName || selectedGroupIds.size < 2) return;

    for (const id of Array.from(selectedGroupIds)) {
      if (activeSession && activeSession.groupId === id) {
        alert('One of the selected groups is currently being used by your active session. Finish the session first.');
        setIsMerging(false);
        return;
      }
    }

    const newGroupId = crypto.randomUUID();
    await db.groups.add({
      id: newGroupId,
      name: trimmedName,
      createdAt: new Date().toISOString()
    });

    const wordsToUpdate: string[] = [];
    const enSet = new Set<string>();

    for (const id of Array.from(selectedGroupIds)) {
      const wordsInGroup = await db.words.where({ groupId: id }).toArray();
      for (const w of wordsInGroup) {
        const enLower = w.english.toLowerCase();
        if (!enSet.has(enLower)) {
          enSet.add(enLower);
          wordsToUpdate.push(w.id);
        } else {
          // If it's a duplicate across groups, just delete it to prevent duplicates
          await db.words.delete(w.id);
        }
      }
    }

    for (const wordId of wordsToUpdate) {
      await db.words.update(wordId, { groupId: newGroupId });
    }

    await db.groups.bulkDelete(Array.from(selectedGroupIds));
    
    setSelectedGroupIds(new Set());
    setIsMerging(false);
    setMergeNameInput('');
  };

  if (selectedGroupId && selectedGroup) {
    return (
      <div className="p-4 sm:p-6 pb-24 max-w-3xl mx-auto">
        <header className="mb-6 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <button 
              onClick={() => setSelectedGroupId(null)}
              className="flex items-center space-x-1 text-slate-500 hover:text-slate-900 mb-2 font-medium"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
            <div className="flex items-center space-x-2">
              {isEditingGroup ? (
                <div className="flex items-center space-x-2 w-full max-w-sm">
                  <input
                    type="text"
                    value={groupNameInput}
                    onChange={(e) => setGroupNameInput(e.target.value)}
                    className="text-2xl sm:text-3xl font-bold text-slate-900 bg-white border-2 border-blue-500 rounded-lg px-2 py-1 outline-none w-full"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveGroupName()}
                  />
                  <button onClick={handleSaveGroupName} className="p-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg shrink-0">
                    <Check size={20} />
                  </button>
                  <button onClick={() => setIsEditingGroup(false)} className="p-2 text-slate-500 bg-slate-100 hover:bg-slate-200 rounded-lg shrink-0">
                    <X size={20} />
                  </button>
                </div>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-slate-900 break-words">{selectedGroup.name}</h1>
                  <button 
                    onClick={() => { setIsEditingGroup(true); setGroupNameInput(selectedGroup.name); }} 
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors shrink-0"
                    title="Edit Group Name"
                  >
                    <Edit2 size={18} />
                  </button>
                </>
              )}
            </div>
            <p className="text-slate-500 font-medium mt-1">{groupWords.length} words</p>
          </div>
          <button
            onClick={handleExport}
            className="p-3 bg-white border border-slate-200 rounded-xl text-slate-700 active:bg-slate-50 shadow-sm shrink-0"
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
                    <button onClick={() => handleDeleteWord(word.id)} className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg">
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
              {groupWords.length === 0 ? "No words left in this group." : "No words found matching your search."}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Group List View
  const toggleGroupSelection = (id: string) => {
    setSelectedGroupIds(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-3xl mx-auto">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Vocabulary</h1>
          <p className="text-slate-500 font-medium mt-1">
            {words?.length || 0} words &middot; {groups?.length || 0} imports
          </p>
        </div>
      </header>

      {isMerging ? (
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl mb-6">
          <h3 className="font-bold text-blue-900 mb-2">Merge {selectedGroupIds.size} groups</h3>
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="New group name"
              value={mergeNameInput}
              onChange={e => setMergeNameInput(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 border border-slate-200"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setIsMerging(false)}
                className="flex-1 sm:flex-none flex items-center justify-center bg-white text-slate-600 font-bold px-4 py-3 rounded-xl border border-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleMergeGroups}
                className="flex-1 sm:flex-none flex items-center justify-center bg-blue-600 text-white font-bold px-4 py-3 rounded-xl active:bg-blue-700"
              >
                Merge
              </button>
            </div>
          </div>
        </div>
      ) : bulkDeleteConfirm ? (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl mb-6">
          <h3 className="font-bold text-rose-900 mb-2">Delete {selectedGroupIds.size} groups?</h3>
          <p className="text-sm text-rose-700 mb-4 font-medium">This will permanently delete their vocabulary words. Session history will not be affected.</p>
          <div className="flex gap-3">
            <button
              onClick={() => setBulkDeleteConfirm(false)}
              className="flex items-center justify-center bg-white text-slate-600 font-bold px-4 py-3 rounded-xl border border-slate-200"
            >
              Cancel
            </button>
            <button
              onClick={handleBulkDelete}
              className="flex items-center justify-center bg-rose-600 text-white font-bold px-4 py-3 rounded-xl active:bg-rose-700"
            >
              Delete Groups
            </button>
          </div>
        </div>
      ) : selectedGroupIds.size > 0 ? (
        <div className="bg-slate-900 text-white p-4 rounded-2xl mb-6 flex items-center justify-between shadow-lg">
          <span className="font-bold">{selectedGroupIds.size} selected</span>
          <div className="flex space-x-2">
            <button
              onClick={() => {
                setMergeNameInput('');
                setIsMerging(true);
              }}
              disabled={selectedGroupIds.size < 2}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold transition-colors ${
                selectedGroupIds.size >= 2 
                  ? 'bg-blue-600 text-white hover:bg-blue-500' 
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Combine size={18} />
              <span>Merge Groups</span>
            </button>
            <button
              onClick={() => setBulkDeleteConfirm(true)}
              className="flex items-center space-x-2 px-4 py-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-500 transition-colors"
            >
              <Trash2 size={18} />
              <span className="hidden sm:inline">Delete Selected</span>
            </button>
          </div>
        </div>
      ) : null}

      <div className="space-y-4">
        {groups?.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(group => {
          const groupWordCount = words?.filter(w => w.groupId === group.id).length || 0;
          const isSelected = selectedGroupIds.has(group.id);
          
          return (
            <div key={group.id} className={`bg-white p-5 rounded-2xl shadow-sm border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isSelected ? 'border-blue-500 ring-1 ring-blue-500' : 'border-slate-200'}`}>
              <div className="flex items-center space-x-4 flex-1">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleGroupSelection(group.id)}
                  className="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                />
                <div 
                  className="flex-1 cursor-pointer" 
                  onClick={() => toggleGroupSelection(group.id)}
                >
                  <h2 className="font-bold text-lg text-slate-900 mb-1">{group.name}</h2>
                  <p className="text-slate-500 text-sm font-medium">{groupWordCount} words</p>
                </div>
              </div>

              {deleteGroupConfirmId === group.id ? (
                <div className="flex items-center space-x-2 bg-rose-50 p-3 rounded-xl">
                  <div className="flex flex-col text-xs text-rose-700 font-bold mr-2">
                    <span>Delete "{group.name}"?</span>
                    <span className="font-medium">Permanently deletes {groupWordCount} words.</span>
                  </div>
                  <button 
                    onClick={() => setDeleteGroupConfirmId(null)}
                    className="px-3 py-2 bg-white text-slate-600 font-bold rounded-lg border border-slate-200"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => handleDeleteGroup(group.id)}
                    className="px-3 py-2 bg-rose-600 text-white font-bold rounded-lg"
                  >
                    Delete Group
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-2 grid grid-cols-3 sm:flex">
                  <button
                    onClick={() => setSelectedGroupId(group.id)}
                    className="flex items-center justify-center space-x-1 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200"
                  >
                    View
                  </button>
                  <button
                    onClick={() => navigate(`/practice?source=group&groupId=${group.id}`)}
                    className="flex items-center justify-center space-x-1 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold hover:bg-blue-100"
                  >
                    <Play size={16} fill="currentColor" />
                    <span>Practice</span>
                  </button>
                  <button
                    onClick={() => setDeleteGroupConfirmId(group.id)}
                    className="flex items-center justify-center p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {groups?.length === 0 && (
          <div className="text-center py-12 text-slate-500 font-medium">
            You haven't imported any groups yet.
          </div>
        )}
      </div>
    </div>
  );
}
