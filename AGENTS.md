# Instructions for AI assistants

Before considering a task **complete**, run the full verification suite and fix any failures:

```bash
npm run verify
```

That runs, in order: **`npm run lint`**, **`npm run build`**, **`npm test -- --run`** (Vitest), and **`npm run test:e2e`** (Playwright).

After **`npm ci`** or **`npm install`**, a **`postinstall`** script runs **`playwright install chromium`** so e2e has a browser. If e2e still fails with “Executable doesn’t exist”, run **`npx playwright install chromium`** once (or **`npx playwright install`** for all browsers).

The same expectations are captured for Cursor in [`.cursor/rules/task-completion.mdc`](.cursor/rules/task-completion.mdc).
