import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useNavigate } from 'react-router-dom';
import { Clock, Trash2, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

function getDateLabel(dateValue: string) {
  const date = new Date(dateValue);
  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const dayDifference = Math.round((startOfToday.getTime() - startOfDate.getTime()) / 86_400_000);

  if (dayDifference === 0) return 'Today';
  if (dayDifference === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

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

  const sortedSessions = [...sessions].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  const sessionsByDate = sortedSessions.reduce<Record<string, typeof sessions>>((groups, session) => {
    const label = getDateLabel(session.startedAt);
    (groups[label] ||= []).push(session);
    return groups;
  }, {});

  return (
    <div className="page-shell page-enter">
      <header className="page-header flex items-end justify-between gap-4">
        <div>
          <span className="eyebrow">Activity log</span>
          <h1>History</h1>
          <p>{sessions.length} {sessions.length === 1 ? 'session' : 'sessions'} completed</p>
        </div>
        
        {sessions.length > 0 && (
          <button
            onClick={() => setClearConfirm(true)}
            className="icon-button icon-button-danger"
            title="Clear All History"
            aria-label="Clear all history"
          >
            <Trash2 size={20} />
          </button>
        )}
      </header>

      {sortedSessions.length === 0 ? (
        <div className="empty-state">
          <div className="text-tx-muted mb-4">
            <Clock size={30} strokeWidth={1.8} />
          </div>
          <p>No practice history yet.</p>
        </div>
      ) : (
        <div className="history-groups">
          {Object.entries(sessionsByDate).map(([dateLabel, dateSessions]) => (
            <section key={dateLabel} className="history-group" aria-labelledby={`history-${dateLabel.replace(/\s+/g, '-').toLowerCase()}`}>
              <h2 id={`history-${dateLabel.replace(/\s+/g, '-').toLowerCase()}`} className="history-date">{dateLabel}</h2>
              <div className="history-list">
              {dateSessions.map(session => {
            const accuracy = session.totalAnswered > 0 
              ? Math.round((session.correctCount / session.totalAnswered) * 100) 
              : 0;
            
            const minutes = Math.floor(session.activeDurationSeconds / 60);
            const seconds = session.activeDurationSeconds % 60;
            const durationStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
            
            const timeStr = new Date(session.startedAt).toLocaleTimeString('en-US', {
              hour: '2-digit', minute: '2-digit'
            });

            return (
              <button
                key={session.id}
                onClick={() => navigate(`/session/${session.id}`)}
                className="history-row"
              >
                <div>
                  <time dateTime={session.startedAt}>{timeStr}</time>
                  <h3>
                    {session.sourceType === 'all' ? 'All Words' : session.groupName || 'Deleted Group'}
                  </h3>
                  <div className="history-meta">
                    <span>{session.totalAnswered} answered</span>
                    <span className={accuracy >= 80 ? 'text-success-tx' : accuracy >= 50 ? 'text-warning-tx' : 'text-danger-tx'}>{accuracy}%</span>
                    <span>{durationStr}</span>
                  </div>
                </div>
                <ChevronRight className="text-tx-muted" />
              </button>
            );
              })}
              </div>
            </section>
          ))}
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
