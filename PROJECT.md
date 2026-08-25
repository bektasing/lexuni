# Lexuni

## Overview
Lexuni is a fast, local-first English-Turkish vocabulary practice web app. It is designed to be simple, clean, mobile-first, and optimized for quick repeated use. There is no backend, authentication, or external APIs. All data is persisted locally in the user's browser via IndexedDB.

## Core Product Rules
- Vocabulary is organized into simple import groups.
- Groups represent import batches and can be merged.
- Bulk deletion is supported for groups.
- Practice uses random bidirectional questions (English ↔ Turkish).
- Each question has 4 multiple-choice options.
- Wrong answers clearly reveal the correct answer and are reinforced later in the cycle.
- A shuffle-bag algorithm prevents excessive repetition and ensures fair coverage.
- Practice happens within Study Sessions that persist until explicitly finished.
- Only one session can be active at a time.
- Time spent away from the Practice screen automatically pauses the session timer.
- Imported words and session history persist locally.
- Import uses Lexuni's simple custom text format with `# Group Name`.

## Tech Stack
- React
- TypeScript
- Vite
- Tailwind CSS v4
- Zustand (used minimally)
- Dexie.js / IndexedDB
- PWA Implementation (`vite-plugin-pwa`)

## Project Structure
- `src/components/`: Reusable UI components and navigation.
- `src/pages/`: Main application screens (Home, Practice, Words, Import, History, SessionDetail).
- `src/db/`: Dexie database configuration and models (Words, Groups, Sessions).
- `src/types/`: TypeScript definitions.

## Data Model
```ts
export type WordGroup = {
  id: string;
  name: string;
  createdAt: string;
};

export type Word = {
  id: string;
  groupId: string;
  english: string;
  turkish: string;
  createdAt: string;
  correctCount: number;
  wrongCount: number;
};

export type StudySession = {
  id: string;
  status: "active" | "finished";
  sourceType: "all" | "group";
  groupId?: string;
  groupName?: string;
  startedAt: string;
  finishedAt?: string;
  totalAnswered: number;
  correctCount: number;
  wrongCount: number;
  activeDurationSeconds: number;
  
  questionQueue: string[];
  reinforcementQueue: string[];
  
  currentWordId?: string;
  currentDirection?: "en-tr" | "tr-en";
  currentOptions?: string[];
  
  lastWordId?: string;
};
```

## Practice Logic
- A session exists until the user explicitly finishes it.
- Bidirectional: mixes English → Turkish and Turkish → English questions randomly.
- A shuffle-bag queue guarantees every word is tested before heavy repetition.
- 3 incorrect options are drawn randomly from the active vocabulary pool, keeping the UI exactly at 4 options.
- Wrong answers inject the failed word slightly later in the queue (reinforcement).
- Real practice duration is paused automatically when the user leaves the Practice screen.
- Active sessions are protected against group deletion/merging until they are finished.

## Local Storage
- Uses Dexie.js as a wrapper around IndexedDB.
- Database name: `LexuniDB`
- Tables: `words`, `groups`, `sessions`, `sessionAnswers`
- Schema versioning (V3): Migrated existing sessions by defaulting status to 'finished', introduced `activeDurationSeconds`, queues, and `status`.

## Commands
```bash
npm install
npm run dev
npm run build
npm run preview
```

## Current Features
- Import vocabulary from text.
- AI import prompt generator.
- List all words with search, sorting, and delete/edit.
- Practice mode with multiple-choice questions.
- Home dashboard with statistics.
- Export to `.txt` backup file.
- PWA installable.

## Future Ideas
- Turkish → English mode
- Mistake-focused practice
- Spaced repetition
- Cloud sync (optional, keeping local-first focus)

## Development Rules
- Preserve the simple product scope.
- Avoid unnecessary dependencies.
- Keep all words in one global pool.
- Maintain IndexedDB backward compatibility where reasonable.
- Update `PROJECT.md` when architecture or core behavior changes.
