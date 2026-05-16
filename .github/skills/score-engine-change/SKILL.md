---
name: score-engine-change
user-invocable: true
description: >-
  Update story or acceptance-criteria scoring behavior safely. Use when changing
  scoring rules, score ranges, weighting, feedback text, or edge-case handling in
  scoring modules. Requires matching test updates and verification.
---

# Score Engine Change Skill

## Use When
- Editing scoring behavior in `src/scoringEngine.js` or `src/criteriaScoring.js`.
- Changing score weighting, validation heuristics, or feedback generation.
- Fixing regressions related to story/criteria scoring outputs.

## Workflow
1. **Confirm intent and blast radius**
   - Identify whether the task affects story scoring, criteria scoring, or both.
   - Note any impacted UI summaries and history/export behavior.

2. **Make scoring changes in module boundaries**
   - Keep calculation logic in scoring modules, not in components.
   - Preserve deterministic behavior (same input -> same score/output).
   - Prefer small, explicit rule changes over broad rewrites.

3. **Update tests first-class**
   - Add or update tests in `src/test/scoringEngine.test.js`, `src/test/criteriaScoring.test.js`, and related edge-case suites.
   - Cover boundary values, invalid/empty input, and any changed feedback messages.
   - Ensure old behavior is only removed when intentionally replaced.

4. **Run validation**
   - Run focused tests for touched scoring modules.
   - Run `npm run verify` before completion.

5. **Report clearly**
   - Summarize which scoring rule changed and why.
   - List updated tests and expected user-visible behavior differences.

## Guardrails
- Do not move scoring concerns into UI files.
- Do not adjust unrelated styling or component architecture in scoring-only tasks.
- Avoid disabling lint/test checks to pass CI; fix underlying issues.

## Related Files
- `src/scoringEngine.js`
- `src/criteriaScoring.js`
- `src/components/ScoreBreakdown.jsx`
- `src/components/CriteriaScoreBreakdown.jsx`
- `src/components/CombinedScoreSummary.jsx`
- `src/test/`
