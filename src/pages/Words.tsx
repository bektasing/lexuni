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
          className="button button-primary button-block"
        >
          Done
        </button>
      }
    >
      <div className="dialog-message">
        <div className="dialog-message-icon dialog-message-icon-warning">
          <AlertTriangle size={22} aria-hidden="true" />
        </div>
        <p>{alertMessage}</p>
      </div>
    </Modal>
  );

  if (selectedGroupId && selectedGroup) {
    return (
      <div className="page-shell page-enter">
        <header className="page-header flex items-start justify-between gap-4">
          <div className="flex-1 pr-4">
            <button 
              onClick={() => {
                setSelectedGroupId(null);
                navigate('/words', { replace: true });
              }}
              className="text-action mb-3 -ml-1"
            >
              <ChevronLeft size={20} />
              <span>Vocabulary</span>
            </button>
            <span className="eyebrow">Import group</span>
            <h1 className="break-words">{selectedGroup.name}</h1>
            <p>{groupWords.length} words</p>
          </div>
          <div className="group-detail-actions">
            <button
              onClick={handleExport}
              className="button button-quiet group-detail-action"
              title="Export Backup"
              aria-label="Export group"
            >
              <Download size={18} /><span>Export</span>
            </button>
            <button
              onClick={() => { setIsEditingGroup(true); setGroupNameInput(selectedGroup.name); }}
              className="button button-quiet group-detail-action"
              title="Rename Group"
              aria-label="Rename group"
            >
              <Edit2 size={18} /><span>Rename</span>
            </button>
            <button
              onClick={() => setDeleteGroupConfirmId(selectedGroup.id)}
              className="button button-quiet button-quiet-danger group-detail-action"
              title="Delete Import"
              aria-label="Delete group"
            >
              <Trash2 size={18} /><span>Delete</span>
            </button>
          </div>
        </header>

        <Modal
          isOpen={isEditingGroup}
          onClose={() => setIsEditingGroup(false)}
          title="Rename Group"
          footer={
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setIsEditingGroup(false)}
                className="button button-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGroupName}
                disabled={!groupNameInput.trim()}
                className="button button-primary"
              >
                Save
              </button>
            </div>
          }
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-tx-secondary mb-2">Current name:</label>
              <div className="field readonly-field">{selectedGroup.name}</div>
            </div>
            <div>
              <label htmlFor="rename-group" className="block text-sm font-bold text-tx-secondary mb-2">New name:</label>
              <input
                id="rename-group"
                type="text"
                value={groupNameInput}
                onChange={(e) => setGroupNameInput(e.target.value)}
                className="field"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && handleSaveGroupName()}
              />
            </div>
          </div>
        </Modal>

        <div className="word-toolbar">
          <div className="relative flex-1">
            <label htmlFor="word-search" className="sr-only">Search this group</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-tx-muted" size={20} aria-hidden="true" />
            <input
              id="word-search"
              type="text"
              placeholder="Search words..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="field pl-10"
            />
          </div>
          <select
            aria-label="Sort words"
            value={sort}
            onChange={e => setSort(e.target.value as any)}
            className="field sm:w-auto font-medium text-tx-secondary cursor-pointer"
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
            className="button button-primary"
            aria-label="Add word"
          >
            <Plus size={20} />
            <span className="hidden sm:inline">Add Word</span>
          </button>
        </div>

        {(isAdding || editingId) && (
          <div className="inline-editor">
            <h3>{editingId ? 'Edit Word' : 'Add New Word'}</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="English"
                value={enInput}
                onChange={e => setEnInput(e.target.value)}
                className="field flex-1"
                autoFocus
              />
              <input
                type="text"
                placeholder="Turkish"
                value={trInput}
                onChange={e => setTrInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSaveWord()}
                className="field flex-1"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveWord}
                  className="button button-primary flex-1 sm:flex-none"
                  aria-label={editingId ? 'Save word changes' : 'Add word'}
                >
                  <Check size={20} />
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setEditingId(null);
                  }}
                  className="button button-secondary flex-1 sm:flex-none"
                  aria-label="Cancel word editor"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="word-list">
          {filteredAndSortedWords.map(word => (
            <div key={word.id} className="word-row group">
              <div className="word-copy">
                <div className="word-primary">{word.english}</div>
                <div className="word-translation">{word.turkish}</div>
              </div>
              <div className="word-trailing">
                <div className="word-stats" aria-label={`${word.correctCount} correct, ${word.wrongCount} wrong`}>
                  <span className="text-success-tx"><strong>{word.correctCount}</strong> ✓</span>
                  <span className="text-danger-tx"><strong>{word.wrongCount}</strong> ×</span>
                </div>
              <div className="word-actions">
                <button
                  onClick={() => {
                    setEditingId(word.id);
                    setEnInput(word.english);
                    setTrInput(word.turkish);
                    setIsAdding(false);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="icon-button"
                  aria-label={`Edit ${word.english}`}
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(word.id)}
                  className="icon-button icon-button-danger"
                  aria-label={`Delete ${word.english}`}
                >
                  <Trash2 size={18} />
                </button>
              </div>
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
    <div className="page-shell page-enter">
      <header className="page-header flex flex-col sm:flex-row sm:items-end justify-between gap-5">
        <div>
          <span className="eyebrow">Your library</span>
          <h1>Vocabulary</h1>
          <p>
            {words?.length || 0} {(words?.length || 0) === 1 ? 'word' : 'words'} &middot; {groups?.length || 0} {(groups?.length || 0) === 1 ? 'import' : 'imports'}
          </p>
        </div>
        <div className="flex gap-2">
          {!isMerging && (groups?.length || 0) > 1 && (
            <button
              onClick={() => setIsMerging(true)}
              className="button button-secondary"
            >
              <Combine size={18} />
              <span>Merge</span>
            </button>
          )}
          <button
            onClick={() => navigate('/words/import')}
            className="button button-primary"
          >
            <Import size={18} />
            <span>Import</span>
          </button>
        </div>
      </header>

      {isMerging && (
        <div className="inline-editor mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-primary text-lg">Merge Imports</h3>
            <button
              onClick={cancelMerge}
              className="icon-button"
              aria-label="Cancel merge"
            >
              <X size={20} />
            </button>
          </div>
          <p className="text-sm text-primary mb-4 font-medium">Select 2 or more groups to merge them together.</p>
          
          {selectedGroupIds.size >= 2 && (
            <div className="merge-ready">
              <label htmlFor="merge-group-name" className="sr-only">Merged group name</label>
              <input
                id="merge-group-name"
                type="text"
                placeholder="New merged group name"
                value={mergeNameInput}
                onChange={e => setMergeNameInput(e.target.value)}
                className="field"
                autoFocus
              />
              <button
                onClick={handleMergeGroups}
                disabled={!mergeNameInput.trim()}
                className="button button-primary"
              >
                Confirm Merge
              </button>
            </div>
          )}
        </div>
      )}

      <div className="group-list">
        {[...(groups ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(group => {
          const groupWordCount = words?.filter(w => w.groupId === group.id).length || 0;
          const isSelected = selectedGroupIds.has(group.id);
          
          return (
            <div
              key={group.id} 
              className={`group-row ${isSelected ? 'group-row-selected' : ''}`}
              onClick={isMerging ? () => toggleGroupSelection(group.id) : undefined}
              onKeyDown={isMerging ? event => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  toggleGroupSelection(group.id);
                }
              } : undefined}
              role={isMerging ? 'checkbox' : undefined}
              aria-checked={isMerging ? isSelected : undefined}
              tabIndex={isMerging ? 0 : undefined}
            >
              <div className="group-row-content">
                {isMerging && (
                  <input
                    type="checkbox"
                    aria-label={`Select ${group.name}`}
                    checked={isSelected}
                    onChange={() => toggleGroupSelection(group.id)}
                    className="w-5 h-5 rounded border-border-strong text-primary focus:ring-primary cursor-pointer shrink-0"
                    onClick={e => e.stopPropagation()}
                  />
                )}
                {isMerging ? (
                  <div className="group-row-copy"><h2>{group.name}</h2><p>{groupWordCount} words</p></div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(group.id);
                      navigate(`/words?groupId=${encodeURIComponent(group.id)}`, { replace: true });
                    }}
                    className="group-row-main"
                    aria-label={`Open ${group.name}`}
                  >
                    <span className="group-row-copy"><strong>{group.name}</strong><small>{groupWordCount} words</small></span>
                    <span className="group-row-open" aria-hidden="true">Open →</span>
                  </button>
                )}
              </div>

              {!isMerging && (
                <div className="group-row-actions">
                  <button
                    onClick={() => navigate(`/practice?source=group&groupId=${group.id}`)}
                    disabled={groupWordCount < 4}
                    className="button button-quiet group-practice"
                    title={groupWordCount < 4 ? 'At least four words are required' : `Practice ${group.name}`}
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
