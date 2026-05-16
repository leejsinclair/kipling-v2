---
name: lint-js-ts
user-invocable: true
description: >-
  Lint JavaScript and TypeScript code using project-relevant tools (ESLint, etc),
  auto-fix where possible, and resolve remaining issues using best practices.
  Ensures code quality and consistency before PRs or releases.
---

# Lint JavaScript/TypeScript Skill

## Workflow

1. **Run Lint**
   - Execute the project lint command (e.g., `npm run lint`).
   - Capture and summarize all reported issues.

2. **Auto-fix**
   - If the linter supports auto-fix (e.g., `npm run lint -- --fix`), run it.
   - Re-run lint to verify remaining issues.

3. **Manual Resolution**
   - For unresolved issues, review each error/warning.
   - Apply best-practice fixes (prefer refactor over disable).
   - Avoid disabling rules unless justified (document why if needed).

4. **Validate**
   - Ensure `npm run lint` passes with no errors.
   - Optionally, run tests to confirm no regressions.

## Decision Points
- If auto-fix is not available, skip to manual resolution.
- If a rule is controversial or unclear, consult team or project lead.
- If a fix would introduce breaking changes, escalate for review.

## Completion Criteria
- Lint passes with no errors or only justified, documented exceptions.
- Code changes follow project and language best practices.
- No new test failures introduced by lint fixes.

## Example Prompts
- "Lint all JS/TS files and fix issues."
- "Resolve ESLint errors in this project."
- "Prepare code for PR by running lint and fixing warnings."

## Related Customizations
- Pre-commit hooks for linting
- Auto-formatting skills (Prettier, etc)
- Project-specific lint rule documentation
