# Agile Story Builder — Storyplan

## 1. Problem Statement
Agile teams often struggle to write clear, meaningful user stories. Many stories are vague, incomplete, or lack a compelling “So that…” outcome. This app turns the process into a game, helping players learn to write strong stories through structured prompts, feedback, and scoring.

The goal is to make writing good user stories fun, repeatable, and educational.

---

## 2. Core User Stories (Meta)

### 2.1 Player Stories
- **As a player, I want** to fill in the “As a…”, “I want…”, and “So that…” fields  
  **So that** I can learn to write complete agile stories.

- **As a player, I want** to receive points based on the quality and completeness of my story  
  **So that** I can improve my skills through feedback.

- **As a player, I want** lightweight language analysis that rewards descriptive, outcome‑focused “So that…” sentences  
  **So that** I learn to articulate value clearly.

- **As a player, I want** a fun, game‑like experience with levels, streaks, and achievements  
  **So that** I stay motivated to practice.

### 2.2 Product Owner Stories
- **As a product owner, I want** to export or save well‑written stories  
  **So that** I can use them in my backlog.

---

## 3. Game Concept Overview
The app is a lightweight narrative game where players craft agile stories and earn points. The game evaluates:

- Completeness (all three fields filled)
- Clarity (simple language, no filler)
- Length (not too short, not too long)
- Descriptive value statement (“So that…” quality)
- Consistency (persona matches goal)
- Optional creativity bonus

Players progress through:
- Levels (Novice → Storyteller → Product Sage)
- Daily streaks
- Achievements (e.g., “Crystal Clear Value”, “Epic Writer”, “Concise Master”)
- Challenges (e.g., “Write a story under 20 words”, “Write a story for a given persona”)

---

## 4. Game Mechanics

### 4.1 Scoring
| Category | Points | Notes |
|---------|--------|-------|
| Completeness | +10 | All three fields filled |
| Length | +0–10 | Ideal range: 18–40 words |
| Clarity | +0–10 | Simple, direct language |
| “So that” quality | +0–20 | More descriptive = more points |
| Creativity | +0–5 | Optional bonus |
| Streak bonus | +1 per day | Encourages daily play |

### 4.2 Language Analysis
Lightweight NLP heuristics:
- Detect value‑oriented phrases (“increase”, “reduce”, “enable”, “improve”, “access”, “understand”)
- Reward specific outcomes over vague ones  
  (“So that I can save time” > “So that it’s better”)
- Penalize filler (“basically”, “kind of”, “stuff”)
- Check persona–goal alignment

### 4.3 Feedback System
After submission, the player receives:
- Score breakdown
- Short explanation (“Your value statement is strong and specific.”)
- Suggested improvement
- Badge or achievement if earned

---

## 5. App Features

### 5.1 Core Features
- Story input form (three fields)
- Real‑time word count
- NLP scoring engine
- Feedback panel
- Progression system (XP, levels)
- Achievements & badges
- Daily challenges
- Save/export stories

### 5.2 Optional Stretch Features
- Multiplayer “story battles”
- Team leaderboard
- AI‑generated personas
- AI‑generated example stories
- Story rewriting suggestions

---

## 6. Architecture Overview

### 6.1 Frontend
- Framework: React, Svelte, or Flutter (TBD)
- Components:
  - StoryForm
  - ScoreBreakdown
  - FeedbackPanel
  - AchievementsModal
  - DailyChallengeCard
  - StoryHistory

### 6.2 Backend
- Lightweight API (Node, Python, or Go)
- Endpoints:
  - `/score-story`
  - `/save-story`
  - `/achievements`
  - `/daily-challenge`
- NLP module (simple heuristics + optional ML)

### 6.3 Data Model

**Story**
- id  
- asA  
- iWant  
- soThat  
- score  
- timestamp  

**Player**
- id  
- xp  
- level  
- streak  
- achievements[]  

**Achievement**
- id  
- name  
- description  
- criteria  

---

## 7. Non‑Functional Requirements
- Fast scoring (<150ms)
- Offline‑friendly (local scoring)
- Mobile‑first UI
- Accessible (WCAG AA)
- No heavy NLP dependencies

---

## 8. AI Rules (for code generation)
- Follow the architecture and naming conventions in this plan.
- Ask for clarification if a requirement is ambiguous.
- Never invent new game mechanics without approval.
- Keep modules small and pure unless state is required.
- When generating UI, prioritize clarity and simplicity.
- When generating scoring logic, keep it deterministic.
- When generating NLP heuristics, keep them lightweight and explainable.
- Always generate tests for new modules unless told otherwise.

---

## 9. Glossary
- **User Story**: A structured requirement in agile format.
- **Persona**: The “As a…” role.
- **Value Statement**: The “So that…” outcome.
- **NLP**: Natural Language Processing, used lightly for scoring.

---

## 10. Future Extensions
- AI‑powered story rewriting
- Team mode for agile workshops
- Integration with Jira, Azure DevOps, Linear
- Story quality leaderboard for teams
