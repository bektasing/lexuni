# Lexuni

Lexuni is a fast, local-first English-Turkish vocabulary practice web app. It's designed for simple, quick, repeated use on mobile devices to help users learn and retain vocabulary effectively.

## Features

- **Import Groups**: Organize words by their import batch for contextual learning.
- **Study Sessions**: Track your practice history, duration, and specific mistakes.
- **Global Vocabulary Pool**: Practice all words together or focus on specific groups.
- **Fast Practice Mode**: 4-option multiple-choice questions with immediate visual feedback.
- **Smart Import**: Easily paste vocabulary lists in a simple text format.
- **AI Helper**: Built-in prompts for converting screenshots or text into importable vocabulary.
- **Local-First Privacy**: No backend, no accounts. All data stays in your browser via IndexedDB.
- **PWA Support**: Installable on iOS/Android home screens for an app-like experience.
- **Easy Export**: Backup and restore your vocabulary groups via simple `.txt` files.

## Tech Stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Zustand
- Dexie.js (IndexedDB)
- PWA Support (`vite-plugin-pwa`)

## Getting Started

Lexuni runs entirely in the browser. You don't need a database or backend server.

1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd lexuni
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

## Import Format Example

You can easily import lists of words using this format:

```text
# Development Terms

scalable = ölçeklenebilir
retrieve = geri almak
reluctant = isteksiz
```

## Project Status

This is a completed v1 of the application focusing on core features and simplicity.

*Privacy Note: Since Lexuni is a local-first application, all of your vocabulary data is stored only in your local browser storage. Clearing your browser data will wipe your vocabulary unless you export it first.*
