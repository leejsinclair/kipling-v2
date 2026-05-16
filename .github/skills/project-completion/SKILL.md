---
name: project-completion
description: "Use when evaluating if work is complete, applying definition of done, or checking merge readiness. Keywords: done, complete, acceptance criteria, ready to merge."
---

# Project Completion Skill

Use this skill when deciding whether work is complete.

## Trigger Phrases

- definition of done
- acceptance criteria
- complete this task
- is this ready to merge

## Steps

1. List all explicit requirements.
2. Verify each requirement has implementation evidence.
3. Run required validations for changed areas.
4. Return pass/fail plus actionable blockers.

## Required Validation Commands

- `npm run verify`
- Or targeted checks that match scope: `npm run lint`, `npm run build`, `npm test -- --run`, `npm run test:e2e`
