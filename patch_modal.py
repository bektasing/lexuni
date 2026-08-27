import re

with open("src/pages/Settings.tsx", "r") as f:
    content = f.read()

# Pattern to replace the restore preview modal
pattern = re.compile(r'<Modal isOpen=\{\!\!restorePreview\}.*?</Modal>', re.DOTALL)

replacement = """<Modal 
        isOpen={!!restorePreview} 
        onClose={() => { if (!isRestoring) setRestorePreview(null); }} 
        title="Restore Lexuni Backup?"
        footer={
          <div className="flex gap-3">
            <button
              onClick={() => setRestorePreview(null)}
              disabled={isRestoring}
              className="flex-1 px-4 py-3 bg-surface text-tx-secondary font-bold rounded-xl border border-border hover:bg-surface-hover active:bg-bg disabled:opacity-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRestore}
              disabled={isRestoring}
              className="flex-1 px-4 py-3 bg-danger-btn text-white font-bold rounded-xl active:bg-danger-btn-hover shadow-sm disabled:opacity-50 transition-colors"
            >
              {isRestoring ? 'Restoring...' : 'Restore Backup'}
            </button>
          </div>
        }
      >
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
          </div>
        )}
      </Modal>

      <Modal isOpen={restoreSuccess} onClose={() => setRestoreSuccess(false)} title="Restore Complete">
        <div className="flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-success-bg text-success-tx rounded-full flex items-center justify-center mb-4">
            <Check size={32} strokeWidth={3} />
          </div>
          <p className="text-tx font-bold text-lg mb-2">Backup restored successfully.</p>
          <p className="text-tx-secondary text-sm">Your vocabulary, groups, and sessions have been updated.</p>
        </div>
        <div className="mt-6 flex justify-center">
           <button onClick={() => setRestoreSuccess(false)} className="w-full py-3 bg-primary text-white font-bold rounded-xl active:bg-primary-hover hover:shadow-md shadow-sm transition-all btn-primary">
             Done
           </button>
        </div>
      </Modal>"""

new_content = pattern.sub(replacement, content)

with open("src/pages/Settings.tsx", "w") as f:
    f.write(new_content)
