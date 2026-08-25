import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db/db';
import { useNavigate } from 'react-router-dom';
import { Clock, Trash2, Check, X, ChevronRight } from 'lucide-react';
import { useState } from 'react';

export default function History() {
  const navigate = useNavigate();
  const sessions = useLiveQuery(() => db.sessions.where('status').equals('finished').toArray());
  const [clearConfirm, setClearConfirm] = useState(false);

  const handleClearAll = async () => {
    await db.sessionAnswers.clear();
    await db.sessions.clear();
    setClearConfirm(false);
  };

  if (!sessions) return null;

  const sortedSessions = sessions.sort((a, b) => b.startedAt.localeCompare(a.startedAt));

  return (
    <div className="p-4 sm:p-6 pb-24 max-w-2xl mx-auto">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">History</h1>
          <p className="text-slate-500 font-medium mt-1">{sessions.length} sessions completed</p>
        </div>
        
        {sessions.length > 0 && (
          clearConfirm ? (
            <div className="flex items-center bg-rose-50 rounded-xl p-1">
              <span className="text-xs text-rose-700 font-bold px-2">Clear All?</span>
              <button onClick={handleClearAll} className="p-2 text-rose-600 hover:bg-rose-100 rounded-lg">
                <Check size={18} />
              </button>
              <button onClick={() => setClearConfirm(false)} className="p-2 text-slate-500 hover:bg-slate-200 rounded-lg">
                <X size={18} />
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setClearConfirm(true)}
              className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors border border-transparent hover:border-rose-100"
              title="Clear All History"
            >
              <Trash2 size={20} />
            </button>
          )
        )}
      </header>

      {sortedSessions.length === 0 ? (
        <div className="text-center py-12 text-slate-500 font-medium">
          <div className="w-20 h-20 bg-slate-100 text-slate-400 rounded-3xl flex items-center justify-center mx-auto mb-6">
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
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between cursor-pointer active:scale-[0.99] transition-transform hover:border-slate-300"
              >
                <div>
                  <div className="text-xs font-bold text-slate-400 mb-1">{dateStr}</div>
                  <h3 className="font-bold text-lg text-slate-900 mb-1">
                    {session.sourceType === 'all' ? 'All Words' : session.groupName || 'Deleted Group'}
                  </h3>
                  <div className="text-sm font-medium text-slate-500 flex space-x-3">
                    <span>{session.totalAnswered} answered</span>
                    <span>&middot;</span>
                    <span className={accuracy >= 80 ? 'text-emerald-600' : accuracy >= 50 ? 'text-amber-600' : 'text-rose-600'}>
                      {accuracy}% accuracy
                    </span>
                    <span>&middot;</span>
                    <span>{durationStr}</span>
                  </div>
                </div>
                <ChevronRight className="text-slate-300" />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
