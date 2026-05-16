---
description: "Use when editing TypeScript, React UI, Vite app code, Playwright tests, or Vitest tests."
applyTo: "src/**/*.{ts,tsx},e2e/**/*.ts,**/*.{test,spec}.{ts,tsx}"
---

# Coding Standards

## Safety and Scope

- Make focused changes for the requested task only.
- Avoid broad rewrites outside the task scope.
- Preserve backward compatibility unless explicitly asked to break it.

## Comments (Required)

- Add JSDoc/TSDoc comment blocks to all exported functions and components.
- Use "why" comments (not "what") for code blocks **exceeding 5 lines**.
- Good: `// Why: Separate game state from UI state to isolate testability`
- Bad: `// Check if value is valid and update state`

## TypeScript and React

- Keep type safety intact and avoid unnecessary any usage.
- Reuse existing UI and state-management patterns.
- Keep components predictable and testable.

## Testing

- Update or add tests when behavior changes.
- Do not disable lint/test checks to make CI pass.

## Prohibited Changes

- Do not commit secrets, credentials, or large generated artifacts.
- Do not make unrelated refactors.
