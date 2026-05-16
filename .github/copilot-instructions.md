# Copilot Instructions

These instructions guide GitHub Copilot behavior in this repository.

## Scope

Applies to all coding tasks in this workspace.

## Before Coding

- Read [AGENTS.md](../AGENTS.md).
- Load applicable files in [.github/instructions](instructions).
- For dependency updates, also apply [.github/instructions/dependency-upgrades.instructions.md](instructions/dependency-upgrades.instructions.md).
- For code review tasks, apply [.github/instructions/adversarial-review.instructions.md](instructions/adversarial-review.instructions.md) and use [.github/agents/adversarial-reviewer.agent.md](agents/adversarial-reviewer.agent.md).
- If reusing awesome-copilot content, follow the whitelist in [AGENTS.md](../AGENTS.md) only.

## Implementation Expectations

- Keep edits minimal and localized.
- Match existing naming, style, and architecture.
- Avoid changing unrelated files.
- Add or update tests when behavior changes.

## Validation Expectations

- Preferred full check for completion: `npm run verify`
- Minimum checks by change type:
  - Style/lint-sensitive edits: `npm run lint`
  - Logic changes: `npm test -- --run`
  - Build/system changes: `npm run build`
  - UI flow changes: `npm run test:e2e`

## Done Criteria

A task is complete only when relevant checks and acceptance criteria pass.

## Safety Guardrails

This repository uses **Tool Guardian** to intercept and block dangerous operations before execution. See [AGENTS.md](../AGENTS.md) for the blocked patterns and override instructions.
