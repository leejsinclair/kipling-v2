# Instructions for AI assistants

## Scope and priorities
- Keep changes focused on the user request; avoid unrelated refactors.
- Preserve deterministic scoring behavior unless the task explicitly changes scoring rules.
- Prefer updating tests in `src/test/` with any behavior change.

## Quick start
1. If `nvm` is installed, run `nvm use`.
2. Install dependencies: `npm install`.
3. Start dev server when needed: `npm run dev`.

## Required completion gate
Before considering a task complete, run and fix failures in:

```bash
npm run verify
```

This runs, in order:
- `npm run lint`
- `npm run build`
- `npm test -- --run` (Vitest)
- `npm run test:e2e` (Playwright)

## Common environment pitfall
After `npm ci` or `npm install`, `postinstall` runs `playwright install chromium`.
If e2e still fails with a missing browser executable, run:

```bash
npx playwright install chromium
```

## Fast codebase orientation
- Product/setup overview: [README.md](README.md)
- App/runtime flow and module map: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)
- Dependency-upgrade workflow and guardrails: [.github/copilot-instructions.md](.github/copilot-instructions.md)
- Cursor parity rule: [.cursor/rules/task-completion.mdc](.cursor/rules/task-completion.mdc)

## High-value file map
- App orchestration: `src/App.jsx`
- Story scoring engine: `src/scoringEngine.js`
- Acceptance-criteria scoring: `src/criteriaScoring.js`
- Primary UI components: `src/components/`
- Tests: `src/test/`

## Task-specific guidance
- For dependency upgrades, follow [.github/copilot-instructions.md](.github/copilot-instructions.md) exactly.
- For reviews, prioritize bugs/regressions first, then summarize.
