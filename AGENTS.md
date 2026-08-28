# AGENTS.md

Before making changes:
- Read PROJECT.md first.
- Preserve existing functionality and user data.
- Never reset or delete IndexedDB data.
- Any database schema change must use a safe Dexie migration.
- Do not change backup compatibility without a strong reason.

## Product
- Lexuni is a fast personal English-Turkish vocabulary trainer.
- Arctic and Midnight are the primary visual themes.
- Mobile-first design is required.
- Mobile navigation order:
  Words → Practice → Home → History → Settings.
- Practice must support EN → TR and TR → EN.
- Wrong answers reveal the correct answer and wait for Continue.
- Correct answers auto-advance smoothly.
- Active sessions persist until explicitly finished.

## UI
- Avoid generic AI-generated SaaS dashboard aesthetics.
- Avoid excessive cards, borders, pills, and nested containers.
- Prefer typography, spacing, hierarchy, and intentional surfaces.
- Preserve the shared modal system.
- Keep all themes readable.

## Development
- Do not create temporary patch/fix Python scripts.
- Avoid unnecessary dependencies.
- Reuse existing components where appropriate.
- Update PROJECT.md when architecture or core behavior changes.

## Verification
Before finishing:
- run npm run build
- fix TypeScript errors
- check mobile layout
- check Arctic and Midnight
- verify no existing feature regressed