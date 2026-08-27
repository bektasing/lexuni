# Lexuni

## Overview
Lexuni is a fast, local-first English-Turkish vocabulary practice web app. It is designed to be simple, clean, mobile-first, and optimized for quick repeated use. There is no backend, authentication, or external APIs. All data is persisted locally in the user's browser via IndexedDB.

## Core Product Rules
- Vocabulary is organized into simple import groups.
- Groups represent import batches and can be merged via "Merge Imports" top-level button.
- Bulk deletion is supported via multi-select modes, but hidden in standard group lists for cleanliness.
- Practice uses random bidirectional questions (English ↔ Turkish).
- Each question has 4 multiple-choice options.
- Correct answers highlight in green and automatically advance after a very brief pause (~400ms).
- Wrong answers clearly reveal the correct answer in green, highlight the wrong selection in red, and require a deliberate "Tap to Continue" interaction before proceeding.
- Wrong answers are reinforced later in the cycle.
- A shuffle-bag algorithm prevents excessive repetition and ensures fair coverage.
- Practice happens within Study Sessions that persist until explicitly finished.
- Only one session can be active at a time.
- Time spent away from the Practice screen automatically pauses the session timer.
- App styling supports a robust 5-color local-first Theme System (Light, Dark, Ocean, Forest, Sunset).
- Imported words, session history, and selected theme persist locally.
- Import uses Lexuni's simple custom text format with `# Group Name`.

## Tech Stack
- React
- TypeScript
- Vite
- Tailwind CSS v4 (Using custom `@theme` semantic tokens like `--color-bg`, `--color-surface`, `--color-primary` in `index.css`)
- Zustand (used minimally)
- Dexie.js / IndexedDB
- PWA Implementation (`vite-plugin-pwa`)

## Project Structure
- `src/components/`: Reusable UI components and navigation.
- `src/pages/`: Main application screens (Home, Practice, Words, Import, History, SessionDetail, Settings).
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
  selectedOptionId?: string;
  
  lastWordId?: string;
};
```

## Practice Logic
- A session exists until the user explicitly finishes it.
- Bidirectional: mixes English → Turkish and Turkish → English questions randomly.
- A shuffle-bag queue guarantees every word is tested before heavy repetition.
- 3 incorrect options are drawn randomly from the active vocabulary pool, keeping the UI exactly at 4 options.
- Correct answers: smooth UI feedback + auto-advance.
- Wrong answers: stops timer + visual correction + deliberate user progression.
- Wrong answers inject the failed word slightly later in the queue (reinforcement).
- Real practice duration is paused automatically when the user leaves the Practice screen or pauses for a wrong answer.
- Active sessions are protected against group deletion/merging until they are finished.

## Local Storage
- Uses Dexie.js as a wrapper around IndexedDB.
- Uses `localStorage` for visual preferences (e.g. `lexuni-theme`).
- Database name: `LexuniDB`
- Tables: `words`, `groups`, `sessions`, `sessionAnswers`
- Schema versioning (V3): Migrated existing sessions by defaulting status to 'finished', introduced `activeDurationSeconds`, queues, and `status`.

## Full Backup System
- Entire Dexie database and `localStorage` preferences can be exported to a single `.json` file (`lexuni-backup-*`).
- Backup files store format schema and app version.
- Restoring a backup completely replaces the local database safely within a Dexie transaction.
- Restore is completely local (no server sync).
- Active sessions survive backup and restore seamlessly.

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
- Groups renaming via simple modal UI.
- Practice mode with multiple-choice questions.
- Home dashboard with statistics.
- Export to `.txt` vocabulary backup file.
- Full Manual JSON Backup & Restore (portable persistent sessions, queues, stats, preferences).
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


## Theming and Motion (v3.1)

### Theme Architecture
Lexuni supports 6 highly distinct themes using a strict CSS variable semantic token system (`index.css`):
1. **Arctic (Default)** - Icy blue. Pale icy background, cool blue accents, crisp identity.
2. **Midnight** - Deep navy. Rich atmospheric dark blue, cyan accents.
3. **Developer** - Code editor charcoal. Charcoal surfaces, cyan accents, syntax-inspired details.
4. **Lingo** - Green energetic. Pale green background, bold vibrant green accents, fresh and playful.
5. **Battery** - OLED black. True black background, restrained muted green accent, dark cards.
6. **Sunset** - Terracotta warm. Warm sand/peach background, beige/clay cards, burnt orange accent.

Each theme guarantees readability by redefining colors like `--bg`, `--surface`, `--tx`, `--primary`, and `--nav-active`. Semantic learning feedback colors (`--success-*`, `--danger-*`) remain globally consistent across all themes to preserve learning integrity. Special highly-visible components like the Home screen "Session in Progress" panel use dedicated semantic tokens (e.g., `--session-bg`, `--session-btn`) to maintain theme-native visual hierarchy.

### Static Palette Previews
In `Settings.tsx`, each theme defines static `preview` colors (`{ bg, accent }`). These render as clean, 2-color mini UI chips alongside a simple Lucide icon, completely replacing the old messy multi-dot palettes. Persisted preferences from legacy themes (Ocean, Forest, Violet) safely auto-migrate to Arctic on startup.

### Motion & Micro-Interactions
The app utilizes lightweight, premium motion:
- **Mobile Navigation**: A single shared, symmetrical indicator pill smoothly translates (`left` percentage interpolation) across the bottom navigation to follow the active tab, avoiding flicker.
- **Micro-Interactions**: Global utility classes (`.hover-card`, `.tap-card`, `.btn-primary`) handle subtle `translateY` hover lifts and tap `scale(0.98)` interactions.
- **Page Entrances**: A fast `.page-enter` animation fades and slides content up slightly when navigating major routes.
- **Reduced Motion**: All animations strictly respect OS-level `prefers-reduced-motion: reduce` settings using Tailwind's `motion-safe:` modifier or simplified keyframe fallbacks.
