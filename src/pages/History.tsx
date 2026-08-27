import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useNavigate } from 'react-router-dom';
import { Clock, Trash2, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

export default function History() {
  const navigate = useNavigate();
  const sessions = useLiveQuery(() => db.sessions.where('status').equals('finished').toArray());
  const [clearConfirm, setClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleClearAll = async () => {
    if (isClearing) return;
    setIsClearing(true);
    try {
      await db.transaction('rw', db.sessionAnswers, db.sessions, async () => {
        await db.sessionAnswers.clear();
        await db.sessions.clear();
      });
      setClearConfirm(false);
    } finally {
      setIsClearing(false);
    }
  };

  if (!sessions) return null;

  const sortedSessions = sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-2xl mx-auto page-enter">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-tx">History</h1>
          <p className="text-tx-secondary font-medium mt-1">{sessions.length} sessions completed</p>
        </div>
        
        {sessions.length > 0 && (
          <button
            onClick={() => setClearConfirm(true)}
            className="p-3 text-tx-muted hover:text-danger-tx hover:bg-danger-bg rounded-xl transition-colors border border-transparent hover:border-danger-border"
            title="Clear All History"
            aria-label="Clear all history"
          >
            <Trash2 size={20} />
          </button>
        )}
      </header>

      {sortedSessions.length === 0 ? (
        <div className="text-center py-12 text-tx-secondary font-medium">
          <div className="w-20 h-20 bg-surface-hover text-tx-muted rounded-3xl flex items-center justify-center mx-auto mb-6">
            <Clock size={40} strokeWidth={2} />
          </div>
          <p>No practice history yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedSessions.map(session => {
            const accuracy = session.totalAnswered > 0 
              ? Math.round((session.correctCount / session.totalAnswered) * 100) 
              : 0;
            
            const minutes = Math.floor(session.activeDurationSeconds / 60);
            const seconds = session.activeDurationSeconds % 60;
            const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
            
            const dateStr = new Date(session.startedAt).toLocaleString('en-US', {
              month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            });

            return (
              <div 
                key={session.id}
                onClick={() => navigate(`/session/${session.id}`)}
                className="bg-surface p-4 rounded-2xl shadow-sm border border-border flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform hover:border-border-strong"
              >
                <div>
                  <div className="text-xs font-bold text-tx-muted mb-1">{dateStr}</div>
                  <h3 className="font-bold text-lg text-tx mb-1">
                    {session.sourceType === 'all' ? 'All Words' : session.groupName || 'Deleted Group'}
                  </h3>
                  <div className="text-sm font-medium text-tx-secondary flex space-x-3">
                    <span>{session.totalAnswered} answered</span>
                    <span>&middot;</span>
                    <span className={accuracy >= 80 ? 'text-success-tx' : accuracy >= 50 ? 'text-warning-tx' : 'text-danger-tx'}>
                      {accuracy}% accuracy
                    </span>
                    <span>&middot;</span>
                    <span>{durationStr}</span>
                  </div>
                </div>
                <ChevronRight className="text-tx-muted" />
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        isOpen={clearConfirm}
        onClose={() => setClearConfirm(false)}
        onConfirm={handleClearAll}
        title="Clear History?"
        description="This will permanently delete every completed session and its answer history. Your words and groups will remain."
        confirmLabel="Clear History"
        isPending={isClearing}
        danger
      />
    </div>
  );
}
