import re

with open('src/pages/Words.tsx', 'r') as f:
    content = f.read()

# Add Modal import
content = content.replace("import { useNavigate } from 'react-router-dom';", "import { useNavigate } from 'react-router-dom';\nimport Modal from '../components/Modal';")

# Replace header edit inline with new Modal approach
header_start = content.find('<header className="mb-6 flex items-start justify-between">')
header_end = content.find('</header>', header_start) + 9

new_header = """<header className="mb-6 flex items-start justify-between">
          <div className="flex-1 pr-4">
            <button 
              onClick={() => setSelectedGroupId(null)}
              className="flex items-center space-x-1 text-tx-secondary hover:text-tx mb-2 font-medium"
            >
              <ChevronLeft size={20} />
              <span>Back</span>
            </button>
            <h1 className="text-3xl font-bold text-tx break-words">{selectedGroup.name}</h1>
            <p className="text-tx-secondary font-medium mt-1">{groupWords.length} words</p>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            {deleteGroupConfirmId === selectedGroup.id ? (
              <div className="flex items-center space-x-2 bg-danger-bg p-2 rounded-xl border border-danger-border">
                <button 
                  onClick={() => setDeleteGroupConfirmId(null)}
                  className="px-3 py-1.5 bg-surface text-tx-secondary font-bold rounded-lg border border-border text-sm"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => handleDeleteGroup(selectedGroup.id)}
                  className="px-3 py-1.5 bg-danger-btn text-white font-bold rounded-lg text-sm"
                >
                  Confirm Delete
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={handleExport}
                  className="p-3 bg-surface border border-border rounded-xl text-tx-secondary hover:bg-bg active:bg-surface-hover shadow-sm"
                  title="Export Backup"
                >
                  <Download size={20} />
                </button>
                <button
                  onClick={() => { setIsEditingGroup(true); setGroupNameInput(selectedGroup.name); }}
                  className="p-3 bg-surface border border-border rounded-xl text-tx-secondary hover:bg-bg active:bg-surface-hover shadow-sm"
                  title="Rename Group"
                >
                  <Edit2 size={20} />
                </button>
                <button
                  onClick={() => setDeleteGroupConfirmId(selectedGroup.id)}
                  className="p-3 bg-surface border border-border rounded-xl text-danger-tx hover:bg-danger-bg active:bg-rose-100 shadow-sm"
                  title="Delete Import"
                >
                  <Trash2 size={20} />
                </button>
              </>
            )}
          </div>
        </header>

        <Modal isOpen={isEditingGroup} onClose={() => setIsEditingGroup(false)} title="Rename Group">
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
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setIsEditingGroup(false)}
                className="flex-1 px-4 py-3 bg-surface text-tx-secondary font-bold rounded-xl border border-border active:bg-bg"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveGroupName}
                disabled={!groupNameInput.trim()}
                className="flex-1 px-4 py-3 bg-primary text-white font-bold rounded-xl disabled:opacity-50 active:bg-primary-hover"
              >
                Save
              </button>
            </div>
          </div>
        </Modal>"""

content = content[:header_start] + new_header + content[header_end:]

# Fix active:bg-rose-100 to active:bg-danger-bg
content = content.replace("active:bg-rose-100", "active:bg-danger-bg")

with open('src/pages/Words.tsx', 'w') as f:
    f.write(content)
