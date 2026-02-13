# Agile Story Builder — Acceptance Criteria Extension Storyplan

## 1. Purpose of This Extension
This extension adds a second phase to the Agile Story Builder game: **writing acceptance criteria** after completing a user story. The goal is to help players learn to write clear, testable, behaviour‑driven acceptance criteria using a fun, gamified workflow.

Players will:
1. Write a user story (existing feature)
2. Write acceptance criteria for that story
3. Receive scoring and feedback for both
4. Copy the combined story + acceptance criteria into Confluence or other tools

The experience should feel cohesive with the original game mechanics.

---

## 2. New Core User Stories

### 2.1 Player Stories
- **As a player, I want** to write acceptance criteria after completing my user story  
  **So that** I can learn to express testable, behaviour‑driven requirements.

- **As a player, I want** the app to score my acceptance criteria  
  **So that** I understand how clear and testable they are.

- **As a player, I want** feedback on how to improve my acceptance criteria  
  **So that** I can learn better patterns over time.

- **As a player, I want** to copy my story and acceptance criteria together  
  **So that** I can paste them directly into Confluence or my backlog tool.

- **As a player, I want** the same game mechanics (XP, streaks, achievements) to apply  
  **So that** the experience feels unified and motivating.

### 2.2 Product Owner Stories
- **As a product owner, I want** players to produce consistent, high‑quality acceptance criteria  
  **So that** the resulting stories are ready for refinement or sprint planning.

---

## 3. Acceptance Criteria Game Concept

After the player submits a user story, the game transitions into **Phase 2: Acceptance Criteria**.

The player writes 1–5 acceptance criteria using one of the supported formats:
- **Gherkin style**  
  - Given…  
  - When…  
  - Then…

- **Bullet‑point behavioural rules**  
  - “The system must…”  
  - “The user can…”  

The game evaluates:
- Structure (does it follow a known pattern?)
- Clarity (is it testable?)
- Completeness (Given/When/Then present)
- Specificity (no vague outcomes)
- Alignment with the story’s “So that…” value

Players earn:
- XP  
- Streak bonuses  
- Achievements  
- A combined “Story Quality Score”

---

## 4. Acceptance Criteria Scoring

### 4.1 Scoring Categories
| Category | Points | Notes |
|---------|--------|-------|
| Format correctness | +0–10 | Gherkin or bullet style |
| Testability | +0–15 | Clear, observable outcomes |
| Specificity | +0–10 | Avoids vague language |
| Alignment | +0–10 | Matches story’s value |
| Completeness | +0–10 | G/W/T or equivalent |
| Creativity | +0–5 | Optional bonus |
| Streak bonus | +1 per day | Same as story writing |

### 4.2 Language Analysis Heuristics
Lightweight NLP checks for:
- Presence of **Given/When/Then** or equivalent patterns
- Observable outcomes (“system displays…”, “user is able to…”)
- Avoiding vague terms (“should basically…”, “kind of works…”)
- Alignment with the story’s “So that…” value statement
- Overly long or overly short criteria

---

## 5. Feedback System

After submitting acceptance criteria, the player receives:
- A score breakdown
- A short explanation for each category
- Suggestions for improvement
- Achievement notifications
- A combined “Story + Criteria Score”

---

## 6. Export Feature

### 6.1 Export Format
The app generates a clean, copy‑ready block:

```
As a <persona>, I want <goal> so that <value>.

Acceptance Criteria:

Given …

When …

Then …
```


### 6.2 Export Requirements
- One‑click “Copy to Clipboard”
- Markdown and plain‑text friendly
- Works cleanly when pasted into Confluence, Jira, Azure DevOps, or Linear

---

## 7. Updated App Flow

1. Player writes user story  
2. Story is scored  
3. Player proceeds to acceptance criteria  
4. Criteria are scored  
5. Combined score is shown  
6. Player can copy the final output  
7. XP, streaks, and achievements update  
8. Player can start a new story or take a daily challenge

---

## 8. Updated Features

### 8.1 New Core Features
- Acceptance Criteria Editor
- Criteria Scoring Engine
- Criteria Feedback Panel
- Combined Story Export
- Criteria Achievements (e.g., “Testability Master”, “Gherkin Guru”)

### 8.2 Updated Existing Features
- Story scoring now feeds into criteria scoring
- Achievements span both phases
- Daily challenges may include criteria‑specific tasks

---

## 9. Architecture Additions

### 9.1 Frontend Components
- AcceptanceCriteriaForm
- CriteriaScoreBreakdown
- CriteriaFeedbackPanel
- StoryAndCriteriaExport
- CombinedScoreSummary

### 9.2 Backend Endpoints
- `/score-criteria`
- `/export-story`
- `/combined-score`

### 9.3 Data Model Additions

**AcceptanceCriteria**
- id  
- storyId  
- text[]  
- score  
- timestamp  

**StoryExport**
- storyId  
- storyText  
- criteriaText[]  
- exportFormat  

---

## 10. AI Rules (for code generation)
- Maintain consistency with the original Story Builder architecture.
- Keep scoring deterministic and explainable.
- Keep NLP heuristics lightweight.
- When generating UI, ensure the story and criteria phases feel unified.
- When generating export logic, ensure formatting is clean and Confluence‑friendly.
- Ask for clarification if a requirement is ambiguous.
- Always generate tests for new modules unless told otherwise.

---

## 11. Glossary
- **Acceptance Criteria**: Testable conditions that define when a story is complete.
- **Gherkin**: A structured format using Given/When/Then.
- **Export Block**: Combined story + criteria text for pasting into Confluence.

---

## 12. Future Extensions
- AI‑suggested acceptance criteria
- Criteria rewriting challenges
- Team mode for collaborative refinement
- Integration with Confluence API for direct publishing
