---
description: "Use when editing React UI, forms, or state flow in App/components. Enforce component conventions, accessibility checks, and matching test updates."
applyTo: "src/App.jsx,src/components/**/*.jsx,src/index.css,src/main.jsx"
---

# UI and Components Instructions

## Scope
- Applies to UI work in `src/App.jsx` and `src/components/`.
- Keep edits focused to the requested flow or component.

## Component Patterns
- Prefer functional React components and existing hook patterns.
- Reuse existing component boundaries before introducing new wrappers.
- Keep props explicit and minimal; avoid passing large state objects unless already established.
- Keep scoring logic in `src/scoringEngine.js` or `src/criteriaScoring.js`, not inside presentation components.

## State and Flow
- Preserve phase-driven app flow (`story` -> `criteria` -> `complete`) unless the task explicitly changes it.
- Avoid hidden coupling between form rendering and score-calculation internals.
- Keep persistence behavior consistent with local-first design and existing storage keys.

## Accessibility and UX
- Ensure labels are connected to inputs and buttons have clear accessible names.
- Preserve keyboard usability for form submission and modal interactions.
- Keep user-facing validation and feedback messages deterministic and specific.

## Styling Rules
- Follow the current Tailwind + CSS approach already present in the touched files.
- Avoid broad visual refactors when completing feature or bugfix tasks.

## Testing Requirements
- For behavior changes in UI/forms, update related tests in `src/test/`.
- Prefer targeted assertions for user-visible behavior over implementation details.
- Run at least affected tests during iteration, then run full completion checks before handoff.

## Completion Gate
- Before task completion, run `npm run verify` and fix failures.
- If Playwright browser binaries are missing, run `npx playwright install chromium` and re-run checks.
