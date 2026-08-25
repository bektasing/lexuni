import Dexie, { type EntityTable } from 'dexie';
import type { Word } from '../types';

const db = new Dexie('LexuniDB') as Dexie & {
  words: EntityTable<Word, 'id'>;
};

db.version(1).stores({
  words: 'id, english, turkish, createdAt, correctCount, wrongCount'
});

export { db };
