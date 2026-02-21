# Copilot Instructions: Dependency Upgrades

These instructions apply when updating npm dependencies in this repository.

## Goals

- Keep updates safe and incremental.
- Prefer non-breaking upgrades first.
- Preserve passing lint/tests after every upgrade step.
- Leave a clear summary of what changed and why.

## Upgrade Workflow (Required)

1. **Start with discovery**
   - Run `npm outdated`.
   - Group updates into:
     - safe (`Current -> Wanted`)
     - major (`Wanted -> Latest`)

2. **Apply safe updates first**
   - Run `npm update`.
   - Re-check with `npm outdated`.

3. **Validate immediately**
   - Run `npm run lint`.
   - Run `npm run test -- --run`.

4. **Security check**
   - Run `npm audit --json`.
   - If vulnerabilities remain, identify exact dependency chain and fix availability.

5. **Major upgrades (only when needed or requested)**
   - Upgrade one tool-family at a time (example: ESLint stack together).
   - Prefer explicit installs (example: `npm install -D eslint@^10 @eslint/js@^10`).
   - Re-run lint/tests/audit after each major step.

## Guardrails

- Do **not** use `npm audit fix --force` by default.
- Do **not** use `--force` for installs unless:
  - vulnerability cannot be fixed otherwise, and
  - user has approved major upgrade path.
- If using `--force`, explain the peer-dependency conflict and verify with lint + tests.
- Do not change unrelated code while fixing dependency updates.

## Known Project Notes

- This repo uses Vite + React + ESLint flat config.
- Lint must pass with `npm run lint` after upgrades.
- Test baseline is Vitest (`npm run test -- --run`).
- If ESLint major upgrades introduce new rule failures, prefer minimal code changes over rule disablement.

## Handoff Format

When done, report:

- updated packages (safe vs major)
- files changed (`package.json`, `package-lock.json`, and any code touched)
- lint/test/audit status
- any temporary compatibility caveats (for example, peer range lag)
