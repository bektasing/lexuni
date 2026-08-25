import re

# Update PROJECT.md
with open('PROJECT.md', 'r') as f:
    project_content = f.read()

features_insert_pos = project_content.find("## Current Features")
if features_insert_pos != -1:
    old_features = "## Current Features\n- Import vocabulary from text.\n- AI import prompt generator.\n- List all words with search, sorting, and delete/edit.\n- Practice mode with multiple-choice questions.\n- Home dashboard with statistics.\n- Export to `.txt` backup file.\n- PWA installable."
    new_features = """## Current Features
- Import vocabulary from text.
- AI import prompt generator.
- List all words with search, sorting, and delete/edit.
- Groups renaming via simple modal UI.
- Practice mode with multiple-choice questions.
- Home dashboard with statistics.
- Export to `.txt` vocabulary backup file.
- Full Manual JSON Backup & Restore (portable persistent sessions, queues, stats, preferences).
- PWA installable."""
    project_content = project_content.replace(old_features, new_features)

storage_insert_pos = project_content.find("## Local Storage")
storage_end_pos = project_content.find("## Commands")
if storage_insert_pos != -1:
    old_storage = project_content[storage_insert_pos:storage_end_pos]
    new_storage = """## Local Storage
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

"""
    project_content = project_content.replace(old_storage, new_storage)

with open('PROJECT.md', 'w') as f:
    f.write(project_content)

# Update README.md
with open('README.md', 'r') as f:
    readme_content = f.read()

features_insert = """- **Import Groups**: Organize words by their import batch for contextual learning. Merge multiple groups together easily.
- **Study Sessions**: Track your practice history, duration, and specific mistakes. Sessions persist across browser reloads.
- **Global Vocabulary Pool**: Practice all words together or focus on specific groups.
- **Bidirectional Practice**: Questions automatically mix English → Turkish and Turkish → English.
- **Smart Practice Flow**: Correct answers are fast and fluid. Wrong answers pause for visual correction and reinforcement.
- **5 App Themes**: Choose from Light, Dark, Ocean, Forest, and Sunset themes in the Settings page.
- **Smart Import**: Easily paste vocabulary lists in a simple text format.
- **AI Helper**: Built-in prompts for converting screenshots or text into importable vocabulary.
- **Local-First Privacy**: No backend, no accounts. All data stays in your browser via IndexedDB.
- **PWA Support**: Installable on iOS/Android home screens for an app-like experience.
- **Easy Export**: Backup and restore your vocabulary groups via simple `.txt` files."""

new_features_insert = """- **Import Groups**: Organize, rename, or merge vocabulary batches easily.
- **Study Sessions**: Track your practice history, duration, and specific mistakes. Sessions persist across browser reloads.
- **Global Vocabulary Pool**: Practice all words together or focus on specific groups.
- **Bidirectional Practice**: Questions automatically mix English → Turkish and Turkish → English.
- **Smart Practice Flow**: Correct answers are fast and fluid. Wrong answers pause for visual correction and reinforcement.
- **5 App Themes**: Choose from Light, Dark, Ocean, Forest, and Sunset themes in the Settings page.
- **Smart Import**: Easily paste vocabulary lists in a simple text format.
- **AI Helper**: Built-in prompts for converting screenshots or text into importable vocabulary.
- **Local-First Privacy**: No backend, no accounts. All data stays in your browser via IndexedDB.
- **Portable Backups**: Export your entire progress and vocabulary to a single JSON file and manually restore it on any device.
- **PWA Support**: Installable on iOS/Android home screens for an app-like experience."""

readme_content = readme_content.replace(features_insert, new_features_insert)

with open('README.md', 'w') as f:
    f.write(readme_content)
