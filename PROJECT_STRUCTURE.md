# Project Structure Guide (for Copilot and Contributors)

## Purpose
This document provides quick context for future development sessions in `kipling-v2`.

It describes:
- where core logic lives
- how the app flow works
- where tests are
- what to validate before finishing work

## High-Level App Overview
- Stack: React + Vite + Tailwind CSS + Vitest
- App type: client-side, local-first learning tool for writing and scoring agile stories
- Main runtime entry: `src/main.jsx` -> `src/App.jsx`
- Tested Node.js version: `24.2.0`
- Terminal note: if `nvm` is available, run `nvm use` in bash terminals before npm commands

## Top-Level Layout
- `src/`: application code
- `src/components/`: UI components (forms, score panels, history, export)
- `src/scoringEngine.js`: story scoring logic
- `src/criteriaScoring.js`: acceptance criteria scoring logic
- `src/test/`: unit/component tests
- `storyplans/`: planning documents, including AI integration plan
- `README.md`: product overview and setup

## Current Product Flow
The app is orchestrated in `src/App.jsx` with a phase-driven flow:
- `story`: write and score user story
- `criteria`: write and score acceptance criteria
- `complete`: combined summary, export, history

Current major state responsibilities in `App.jsx`:
- story and criteria submission lifecycle
- score results for each phase
- XP accumulation and achievements
- session history persistence to localStorage

## Core Scoring Modules
### Story Scoring
- File: `src/scoringEngine.js`
- Public API: `scoreStory(story)`, plus helper exports such as `scoreSoThatStatement`
- Evaluates completeness, length, clarity, so-that quality, creativity

### Acceptance Criteria Scoring
- File: `src/criteriaScoring.js`
- Public API: `scoreCriteria(criteria, storyValue, selectedFormat)`
- Evaluates format, testability, specificity, alignment, completeness

## Key UI Components
- `src/components/StoryForm.jsx`: story input and submit action
- `src/components/AcceptanceCriteriaForm.jsx`: criteria input and format handling
- `src/components/ScoreBreakdown.jsx` and `src/components/FeedbackPanel.jsx`: story results
- `src/components/CriteriaScoreBreakdown.jsx` and `src/components/CriteriaFeedbackPanel.jsx`: criteria results
- `src/components/CombinedScoreSummary.jsx`: combined total
- `src/components/StoryHistory.jsx`: previous entries and reload actions
- `src/components/StoryAndCriteriaExport.jsx`: export output

## Test Structure
Tests are in `src/test/` and cover:
- form behavior
- scoring functions and edge cases
- score display panels
- history interactions

Run:
- `npm run test -- --run` for CI-like test execution
- `npm run lint` before handoff

## AI Integration Direction
See `storyplans/2.llm-intergration.md` for planned behavior.

Important planned constraints:
- user provides OpenAI key at runtime
- key is session-only (in memory), not stored in localStorage/sessionStorage/cookies
- AI features are disabled until a valid key is provided
- draft -> improve -> confirm -> final scoring flow for both story and criteria

## Safe Change Guidance
When editing:
- preserve deterministic local scoring behavior
- keep story and criteria scoring logic modular
- avoid coupling UI rendering with scoring internals
- add/update tests for behavior changes (not only snapshots)
- avoid unrelated refactors in the same change

## Typical Dev Commands
- `nvm use` (when `nvm` is installed)
- `npm install`
- `npm run dev`
- `npm run lint`
- `npm run test -- --run`
- `npm run build`

## Suggested First Read Order for New Sessions
1. `README.md`
2. `src/App.jsx`
3. `src/scoringEngine.js`
4. `src/criteriaScoring.js`
5. `storyplans/2.llm-intergration.md`
6. `src/test/` relevant files for the area being changed
