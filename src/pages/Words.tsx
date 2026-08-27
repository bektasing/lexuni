import { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { Search, Plus, Edit2, Trash2, Download, X, Check, ChevronLeft, Play, Combine, AlertTriangle, Import } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Modal from '../components/Modal';
import ConfirmDialog from '../components/ConfirmDialog';

export default function Words() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const groups = useLiveQuery(() => db.groups.toArray());
  const words = useLiveQuery(() => db.words.toArray());
  const activeSessions = useLiveQuery(() => db.sessions.where('status').equals('active').toArray());
  const activeSession = activeSessions && activeSessions.length > 0 ? activeSessions[0] : null;
  
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(() => searchParams.get('groupId'));
  
  // Group List State
  const [deleteGroupConfirmId, setDeleteGroupConfirmId] = useState<string | null>(null);
  const [selectedGroupIds, setSelectedGroupIds] = useState<Set<string>>(new Set());
  const [isMerging, setIsMerging] = useState(false);
  const [mergeNameInput, setMergeNameInput] = useState('');
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);


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
        setAlertMessage('This English word already exists.');
        return;
      }
      await db.words.update(editingId, { english: en, turkish: tr });
      setEditingId(null);
    } else {
      const existing = await db.words.where('english').equalsIgnoreCase(en).first();
      if (existing) {
        setAlertMessage('This English word already exists.');
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
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await db.words.delete(id);
      setDeleteConfirmId(null);
      // Auto-delete group if it becomes empty
      if (groupWords.length === 1 && selectedGroupId) {
        await db.groups.delete(selectedGroupId);
        setSelectedGroupId(null);
        navigate('/words', { replace: true });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    if (activeSession && activeSession.groupId === id) {
      setAlertMessage('This group is currently being used by your active session. Finish the session first.');
      setDeleteGroupConfirmId(null);
      return;
    }
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await db.transaction('rw', db.words, db.groups, async () => {
        const wordsInGroup = await db.words.where({ groupId: id }).toArray();
        const wordIds = wordsInGroup.map(w => w.id);
        if (wordIds.length > 0) await db.words.bulkDelete(wordIds);
        await db.groups.delete(id);
      });
      setDeleteGroupConfirmId(null);
      setSelectedGroupIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      if (selectedGroupId === id) {
        setSelectedGroupId(null);
        navigate('/words', { replace: true });
      }
    } finally {
      setIsDeleting(false);
    }
  };



  const handleMergeGroups = async () => {
    const trimmedName = mergeNameInput.trim();
    if (!trimmedName || selectedGroupIds.size < 2) return;

    for (const id of Array.from(selectedGroupIds)) {
      if (activeSession && activeSession.groupId === id) {
        setAlertMessage('One of the selected groups is currently being used by your active session. Finish the session first.');
        setIsMerging(false);
        setSelectedGroupIds(new Set());
        setMergeNameInput('');
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

  const cancelMerge = () => {
    setIsMerging(false);
    setSelectedGroupIds(new Set());
    setMergeNameInput('');
  };

  const warningModal = (
    <Modal
      isOpen={!!alertMessage}
      onClose={() => setAlertMessage(null)}
      title="Warning"
      footer={
        <button
          type="button"
          onClick={() => setAlertMessage(null)}
          className="min-h-11 w-full rounded-xl bg-primary px-4 py-3 font-bold text-white hover:bg-primary-hover"
        >
          Done
        </button>
      }
    >
      <div className="flex gap-4">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-warning-bg text-warning-tx">
          <AlertTriangle size={22} aria-hidden="true" />
        </div>
        <p className="self-center leading-relaxed text-tx-secondary">{alertMessage}</p>
      </div>
    </Modal>
  );

  if (selectedGroupId && selectedGroup) {
    return (
      <div className="p-4 sm:p-6 pb-24 max-w-3xl mx-auto page-enter">
        <header className="mb-6 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <button 
              onClick={() => {
                setSelectedGroupId(null);
                navigate('/words', { replace: true });
              }}
              className="flex items-center space-x-1 text-tx-secondary hover:text-tx mb-2 font-medium"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
            <h1 className="text-3xl font-bold text-tx break-words">{selectedGroup.name}</h1>
            <p className="text-tx-secondary font-medium mt-1">{groupWords.length} words</p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={handleExport}
              className="p-3 bg-surface border border-border rounded-xl text-tx-secondary hover:bg-bg active:bg-surface-hover shadow-sm"
              title="Export Backup"
              aria-label="Export group"
            >
              <Download size={20} />
            </button>
            <button
              onClick={() => { setIsEditingGroup(true); setGroupNameInput(selectedGroup.name); }}
              className="p-3 bg-surface border border-border rounded-xl text-tx-secondary hover:bg-bg active:bg-surface-hover shadow-sm"
              title="Rename Group"
              aria-label="Rename group"
            >
              <Edit2 size={20} />
            </button>
            <button
              onClick={() => setDeleteGroupConfirmId(selectedGroup.id)}
              className="p-3 bg-surface border border-border rounded-xl text-danger-tx hover:bg-danger-bg active:bg-danger-bg shadow-sm"
              title="Delete Import"
              aria-label="Delete group"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </header>

        <Modal
          isOpen={isEditingGroup}
          onClose={() => setIsEditingGroup(false)}
          title="Rename Group"
          footer={
            <div className="flex flex-col-reverse gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setIsEditingGroup(false)}
                className="min-h-11 flex-1 rounded-xl border border-border bg-surface px-4 py-3 font-bold text-tx-secondary hover:bg-surface-hover"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGroupName}
                disabled={!groupNameInput.trim()}
                className="min-h-11 flex-1 rounded-xl bg-primary px-4 py-3 font-bold text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-tx-secondary mb-2">Current name:</label>
              <div className="text-tx font-medium bg-bg p-3 rounded-xl border border-border">{selectedGroup.name}</div>
            </div>
            <div>
              <label className="block text-sm font-bold text-tx-secondary mb-2">New name:</label>
              <input
                type="text"
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                className="w-full px-4 py-3 bg-bg rounded-xl outline-none focus:ring-2 focus:ring-primary border border-border"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveGroupName()}
              />
            </div>
          </div>
        </Modal>

        <div className="bg-surface p-4 rounded-2xl shadow-sm border border-border mb-6 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-muted" size={20} />
            <input
              type="text"
              placeholder="Search words..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-bg rounded-xl outline-none focus:ring-2 focus:ring-primary transition-shadow"
            />
          </div>
          <select
            value={sort}
            onChange={e => setSort(e.target.value as any)}
            className="px-4 py-3 bg-bg rounded-xl outline-none focus:ring-2 focus:ring-primary font-medium text-tx-secondary cursor-pointer"
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
            className="flex items-center justify-center space-x-2 bg-primary text-white px-5 py-3 rounded-xl font-medium active:bg-primary-hover"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Word</span>
          </button>
        </div>

        {(isAdding || editingId) && (
          <div className="bg-primary-soft border border-primary-soft p-4 rounded-2xl mb-6 shadow-inner">
            <h3 className="font-bold text-primary mb-3">{editingId ? 'Edit Word' : 'Add New Word'}</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="English"
                value={enInput}
                onChange={e => setEnInput(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary border border-border"
                autoFocus
              />
              <input
                type="text"
                placeholder="Turkish"
                value={trInput}
                onChange={e => setTrInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveWord()}
                className="flex-1 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary border border-border"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveWord}
                  className="flex-1 sm:flex-none flex items-center justify-center bg-primary text-white px-4 py-3 rounded-xl active:bg-primary-hover"
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                  }}
                  className="flex-1 sm:flex-none flex items-center justify-center bg-surface text-tx-secondary border border-border px-4 py-3 rounded-xl active:bg-bg"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {filteredAndSortedWords.map(word => (
            <div key={word.id} className="bg-surface p-4 rounded-2xl shadow-sm border border-border flex items-center justify-between group">
              <div className="flex-1">
                <div className="font-bold text-lg text-tx">{word.english}</div>
                <div className="text-tx-secondary">{word.turkish}</div>
                <div className="text-xs text-tx-muted mt-2 flex space-x-3 font-medium">
                  <span className="text-success-tx bg-success-bg px-2 py-0.5 rounded-md">✓ {word.correctCount}</span>
                  <span className="text-danger-tx bg-danger-bg px-2 py-0.5 rounded-md">✗ {word.wrongCount}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-1 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => {
                    setEditingId(word.id);
                    setEnInput(word.english);
                    setTrInput(word.turkish);
                    setIsAdding(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-2.5 text-tx-muted hover:text-primary hover:bg-primary-soft rounded-xl transition-colors"
                  aria-label={`Edit ${word.english}`}
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(word.id)}
                  className="p-2.5 text-tx-muted hover:text-danger-tx hover:bg-danger-bg rounded-xl transition-colors"
                  aria-label={`Delete ${word.english}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}

          {filteredAndSortedWords.length === 0 && (
            <div className="text-center py-12 text-tx-secondary font-medium">
              {groupWords.length === 0 ? "No words left in this group." : "No words found matching your search."}
            </div>
          )}
        </div>

        <ConfirmDialog
          isOpen={!!deleteGroupConfirmId}
          onClose={() => setDeleteGroupConfirmId(null)}
          onConfirm={() => {
            if (deleteGroupConfirmId) return handleDeleteGroup(deleteGroupConfirmId);
          }}
          title="Delete Group?"
          description={`This will permanently delete “${selectedGroup.name}” and all ${groupWords.length} words in it.`}
          confirmLabel="Delete Group"
          isPending={isDeleting}
          danger
        />

        <ConfirmDialog
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={() => {
            if (deleteConfirmId) return handleDeleteWord(deleteConfirmId);
          }}
          title="Delete Word?"
          description={`This will permanently delete “${words?.find(word => word.id === deleteConfirmId)?.english || 'this word'}”.`}
          confirmLabel="Delete Word"
          isPending={isDeleting}
          danger
        />

        {warningModal}
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
    <div className="p-4 sm:p-6 pb-24 max-w-3xl mx-auto page-enter">
      <header className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-tx">Vocabulary</h1>
          <p className="text-tx-secondary font-medium mt-1">
            {words?.length || 0} words &middot; {groups?.length || 0} imports
          </p>
        </div>
        <div className="flex gap-2">
          {!isMerging && (groups?.length || 0) > 1 && (
            <button
              onClick={() => setIsMerging(true)}
              className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-surface border border-border text-tx-secondary font-bold rounded-xl hover:bg-surface-hover btn-primary"
            >
              <Combine size={18} />
              <span>Merge</span>
            </button>
          )}
          <button
            onClick={() => navigate('/words/import')}
            className="flex-1 sm:flex-none flex items-center justify-center space-x-2 px-4 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-primary-hover btn-primary"
          >
            <Import size={18} />
            <span>Import Words</span>
          </button>
        </div>
      </header>

      {isMerging && (
        <div className="bg-primary-soft border border-primary-soft p-4 sm:p-5 rounded-2xl mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-primary text-lg">Merge Imports</h3>
            <button
              onClick={cancelMerge}
              className="p-2 bg-surface text-tx-secondary rounded-lg hover:bg-surface-hover"
              aria-label="Cancel merge"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-primary mb-4 font-medium">Select 2 or more groups to merge them together.</p>
          
          {selectedGroupIds.size >= 2 && (
            <div className="flex flex-col sm:flex-row gap-3 mb-2 animate-in fade-in slide-in-from-top-2">
              <input
                type="text"
                placeholder="New merged group name"
                value={mergeNameInput}
                onChange={e => setMergeNameInput(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary border border-primary-soft"
                autoFocus
              />
              <button
                onClick={handleMergeGroups}
                disabled={!mergeNameInput.trim()}
                className="flex-1 sm:flex-none flex items-center justify-center bg-primary text-white font-bold px-6 py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirm Merge
              </button>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4">
        {groups?.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(group => {
          const groupWordCount = words?.filter(w => w.groupId === group.id).length || 0;
          const isSelected = selectedGroupIds.has(group.id);
          
          return (
            <div 
              key={group.id} 
              className={`bg-surface p-5 rounded-2xl shadow-sm border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover-card tap-card ${isSelected ? 'border-primary ring-2 ring-primary-soft' : 'border-border'}`}
              onClick={isMerging ? () => toggleGroupSelection(group.id) : undefined}
            >
              <div className="flex items-center space-x-4 flex-1">
                {isMerging && (
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleGroupSelection(group.id)}
                    className="w-5 h-5 rounded border-border-strong text-primary focus:ring-primary cursor-pointer shrink-0"
                    onClick={e => e.stopPropagation()}
                  />
                )}
                <div className={`flex-1 ${isMerging ? 'cursor-pointer' : ''}`}>
                  <h2 className="font-bold text-lg text-tx mb-1">{group.name}</h2>
                  <p className="text-tx-secondary text-sm font-medium">{groupWordCount} words</p>
                </div>
              </div>

              {!isMerging && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      navigate(`/words?groupId=${encodeURIComponent(group.id)}`, { replace: true });
                    }}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1 px-5 py-2.5 bg-surface-hover text-tx-secondary rounded-xl font-bold btn-primary hover:bg-border"
                  >
                    View
                  </button>
                  <button
                    onClick={() => navigate(`/practice?source=group&groupId=${group.id}`)}
                    className="flex-1 sm:flex-none flex items-center justify-center space-x-1 px-5 py-2.5 bg-primary-soft text-primary rounded-xl font-bold btn-primary hover:opacity-80"
                  >
                    <Play size={16} fill="currentColor" />
                    <span>Practice</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {groups?.length === 0 && (
          <div className="text-center py-12 text-tx-secondary font-medium">
            You haven't imported any groups yet.
          </div>
        )}
      </div>

      {warningModal}
    </div>
  );
}
