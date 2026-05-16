---
description: "Use when determining whether a feature, fix, or PR is complete."
applyTo: "**/*"
---

# Completion Criteria

Use this checklist before declaring work complete.

## Functional Completion

- Requested behavior is implemented end-to-end.
- Existing behavior outside scope is unchanged.
- Error states for touched flows are handled.

## Quality Gates

- Full verification passes: `npm run verify`
- If only targeted checks are run, they must match the change scope and all pass.

## Final Rule

Do not mark work complete unless required checks pass.
