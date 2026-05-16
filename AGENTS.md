# AGENTS

Behavioral contract for coding agents. Refer to [.github/copilot-instructions.md](.github/copilot-instructions.md) and [.github/instructions](.github/instructions) for task-specific guidance.

## Core Standards

- Keep React/TypeScript quality intact; preserve architecture and boundaries.
- Make focused, localized changes; update tests when behavior changes.
- Never commit secrets or bypass checks.
- **Verification:** `npm run verify` (lint → build → test → e2e)

## Awesome-Copilot Imports (Whitelist)

- `agents/typescript-mcp-expert.agent.md`
- `instructions/typescript-mcp-server.instructions.md`
- `instructions/code-review-generic.instructions.md`
- `skills/javascript-typescript-jest/SKILL.md`

❌ **Exclude:** Ruby, Go, PHP, Java, C#, Terraform, cloud stacks, or anything unlisted.

## Safety Guardrails

**Tool Guardian** blocks dangerous operations at pre-execution. See [awesome-copilot/docs/GUARDRAILS.md](https://github.com/github/awesome-copilot/blob/main/docs/GUARDRAILS.md) for blocked patterns. Override: `SKIP_TOOL_GUARD=true`.

## Code Review

For code review tasks: apply [adversarial-review.instructions.md](.github/instructions/adversarial-review.instructions.md) + use [adversarial-reviewer.agent.md](.github/agents/adversarial-reviewer.agent.md).

## Definition of Complete

All checks pass (`npm run verify`) + acceptance criteria satisfied.

## Essential Files

- [.github/copilot-instructions.md](.github/copilot-instructions.md)
- [.github/instructions/coding-standards.instructions.md](.github/instructions/coding-standards.instructions.md) — Function docs, why-comments for 5+ line blocks
- [.github/instructions/adversarial-review.instructions.md](.github/instructions/adversarial-review.instructions.md)
- [.github/instructions/dependency-upgrades.instructions.md](.github/instructions/dependency-upgrades.instructions.md) — Systematic node module updates
- [.github/agents/adversarial-reviewer.agent.md](.github/agents/adversarial-reviewer.agent.md)
- [.github/agents/project-maintainer.agent.md](.github/agents/project-maintainer.agent.md)
- [.github/hooks.json](.github/hooks.json) — Tool guardian config
