---
description: "Use when reviewing code critically for complexity, maintainability, documentation completeness, and comment quality."
applyTo: "src/**/*.{ts,tsx},e2e/**/*.ts,**/*.{test,spec}.{ts,tsx}"
---

# Adversarial Review Guidelines

Use this guidance when asked to review code, perform PR review, or run a critical second pass.

## Review Priorities

1. Correctness and regressions.
2. Complexity and maintainability risks.
3. Documentation and comment quality.
4. Test gaps for changed behavior.

## Complexity Checks

Flag findings when code appears difficult to understand or safely modify, such as:

- Functions that are too long or handle multiple responsibilities.
- Deep nesting and heavily branching logic.
- Overly complex boolean expressions.
- Repeated logic that should be extracted.

## Documentation Checks

Flag findings when:

- Public APIs or shared components changed without doc updates.
- Non-obvious behavior, assumptions, or edge cases are undocumented.
- New config or operational behavior is not reflected in docs.

## Comment Quality Checks

Flag findings when:

- Complex code has no explanatory comments.
- Comments exist but are stale or contradict behavior.
- Comments describe what instead of why in non-trivial logic.

## Output Format

Return findings first, sorted by severity:

- Severity: critical, high, medium, low.
- Location: exact file and line.
- Why this matters: concrete risk.
- Suggested fix: specific and minimal.

If no issues are found, state that explicitly and include any residual risk.
