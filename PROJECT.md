# Lexuni

## Overview
Lexuni is a fast, local-first English-Turkish vocabulary practice web app. It is designed to be simple, clean, mobile-first, and optimized for quick repeated use. There is no backend, authentication, or external APIs. All data is persisted locally in the user's browser via IndexedDB.

## Core Product Rules
- All vocabulary belongs to one global pool.
- No category-based study system.
- Practice uses random questions selected from the entire pool.
- Each question has 4 multiple-choice options.
- Wrong answers clearly reveal the correct answer.
- Imported words persist locally.
- Import uses Lexuni's simple custom text format.

## Tech Stack
- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Dexie.js / IndexedDB
- PWA Implementation (`vite-plugin-pwa`)

## Project Structure
- `src/components/`: Reusable UI components and navigation.
- `src/pages/`: Main application screens (Home, Practice, Words, Import).
- `src/stores/`: Zustand store for transient application state.
- `src/db/`: Dexie database configuration and models.
- `src/utils/`: Helper functions.
- `src/types/`: TypeScript definitions.

## Data Model
```ts
export type Word = {
  id: string; // unique identifier (UUID)
  english: string;
  turkish: string;
  createdAt: string; // ISO string
  correctCount: number;
  wrongCount: number;
};
```

## Import Format
```text
# Optional Title

reliable = güvenilir
deploy = yayına almak
```
- `#` comments are ignored.
- Blank lines are ignored.
- Lines without English or Turkish parts are invalid.
- Duplicates (case-insensitive on the English word) are ignored.
- Tolerates whitespace around separators `=`, `:`, or `-`.

## Practice Logic
- A question presents an English word and asks for the Turkish meaning among 4 options.
- The correct option is the word's `turkish` value.
- 3 incorrect options are drawn randomly from the rest of the vocabulary pool.
- The order of options is randomized.
- Words are not repeated consecutively.
- After a correct answer, the selected button turns green, and the next question loads after 600ms.
- After a wrong answer, the selected button turns red, the correct button turns green, and the next question loads after 1200ms.
- Word's `correctCount` or `wrongCount` is incremented accordingly.

## Local Storage
- Uses Dexie.js as a wrapper around IndexedDB.
- Database name: `LexuniDB`
- Tables: `words`
- Schema versioning is used to manage upgrades if necessary.

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
