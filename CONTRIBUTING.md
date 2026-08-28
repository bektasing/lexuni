# Contributing to Lexuni

Thanks for helping improve Lexuni. Changes should keep the app fast, local-first, mobile-friendly, and focused on personal English–Turkish vocabulary practice.

## Set up the project

Node.js 22.12 or newer is required; Node 24 is the recommended development version.

```bash
git clone https://github.com/bektasing/lexuni.git
cd lexuni
npm ci
npm run dev
```

Create a focused branch, make a small coherent change, and verify it locally before opening a pull request.

## Before submitting

Run the repository checks:

```bash
npm run lint
npm run build
```

For interface changes, also check a mobile viewport and both the Arctic and Midnight themes. Keep components accessible and prefer the existing shared modal and UI patterns.

Use the existing TypeScript and React style. Avoid unnecessary dependencies, broad rewrites, debug logging, and unrelated formatting churn.

## Protect local data

Lexuni persists user data in IndexedDB. Never reset or delete existing data as part of startup or routine development. Database schema changes must use a safe Dexie migration that preserves older installations.

Full JSON backups are part of the product contract. Do not change backup compatibility casually, and never commit a real Lexuni backup because it may contain private vocabulary and study history.

Update `PROJECT.md` when a change alters architecture or core product behavior.

## Issues and pull requests

Search existing issues before opening a new one. Bug reports should include reproducible steps and browser/device details, but should not include private vocabulary or backup contents. Feature requests should explain the underlying use case and stay aligned with Lexuni's focused scope.

Pull requests should explain what changed, why, and how it was tested. Keep each pull request reviewable and link any relevant issue.
