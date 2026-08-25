import Dexie, { type EntityTable } from 'dexie';
import type { Word, WordGroup, StudySession, SessionAnswer } from '../types';

const db = new Dexie('LexuniDB') as Dexie & {
  words: EntityTable<Word, 'id'>;
  groups: EntityTable<WordGroup, 'id'>;
  sessions: EntityTable<StudySession, 'id'>;
  sessionAnswers: EntityTable<SessionAnswer, 'id'>;
};

db.version(1).stores({
  words: 'id, english, turkish, createdAt, correctCount, wrongCount'
});

db.version(2).stores({
  words: 'id, groupId, english, turkish, createdAt, correctCount, wrongCount',
  groups: 'id, createdAt',
  sessions: 'id, sourceType, startedAt, finishedAt',
  sessionAnswers: 'id, sessionId, correct'
}).upgrade(async trans => {
  // Migration for V1 -> V2
  // Create a legacy group for existing words that don't have a groupId
  const existingWords = await trans.table('words').toArray();
  
  if (existingWords.length > 0) {
    const hasUngrouped = existingWords.some(w => !w.groupId);
    if (hasUngrouped) {
      const legacyGroupId = crypto.randomUUID();
      await trans.table('groups').add({
        id: legacyGroupId,
        name: 'Existing Words',
        createdAt: new Date().toISOString()
      });
      
      for (const word of existingWords) {
        if (!word.groupId) {
          await trans.table('words').update(word.id, { groupId: legacyGroupId });
        }
      }
    }
  }
});

db.version(3).stores({
  words: 'id, groupId, english, turkish, createdAt, correctCount, wrongCount',
  groups: 'id, createdAt',
  sessions: 'id, status, sourceType, startedAt, finishedAt',
  sessionAnswers: 'id, sessionId, correct'
}).upgrade(async trans => {
  const existingSessions = await trans.table('sessions').toArray();
  for (const session of existingSessions) {
    if (!session.status) {
      await trans.table('sessions').update(session.id, { 
        status: 'finished',
        activeDurationSeconds: session.durationSeconds || 0,
        questionQueue: [],
        reinforcementQueue: []
      });
    }
  }
});

export { db };
