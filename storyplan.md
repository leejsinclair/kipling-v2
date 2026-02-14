# Agile Story Builder — Theme Switcher Storyplan

## 1. Purpose
This feature adds a **Theme Switcher** to the Agile Story Builder app, allowing players to choose between **Light**, **Dark**, **Mixed**, and **System** themes. The goal is to improve accessibility, comfort, and personalisation while maintaining the playful, game‑like feel of the app.

The theme system should integrate seamlessly with existing UI components and game mechanics.

---

## 2. Core User Stories

### 2.1 Player Stories
- **As a player, I want** to switch between light, dark, mixed, and system themes  
  **So that** I can use the app in a way that feels comfortable for my eyes and environment.

- **As a player, I want** the theme to persist between sessions  
  **So that** I don’t have to reset it every time I open the app.

- **As a player, I want** the theme switcher to feel like part of the game  
  **So that** the experience remains cohesive and fun.

- **As a player, I want** visual feedback when I change themes  
  **So that** I immediately understand the effect of my choice.

### 2.2 Accessibility Stories
- **As a visually sensitive user, I want** a dark or mixed theme  
  **So that** I can reduce eye strain.

- **As a system‑aligned user, I want** the app to follow my OS theme  
  **So that** the UI feels consistent with my device.

---

## 3. Theme Definitions

### 3.1 Light Theme
- Bright, clean UI  
- High contrast  
- Ideal for daylight use  
- Friendly, energetic colour palette  

### 3.2 Dark Theme
- Low‑light friendly  
- Reduced glare  
- Muted, calm palette  
- Works well with neon or accent colours for game elements  

### 3.3 Mixed Theme
A hybrid theme designed to feel playful and unique to the Agile Story Builder:
- Light panels with dark chrome  
- Dark backgrounds with light cards  
- Colourful accents for game elements (XP, achievements, streaks)  
- Ideal for players who want contrast without full dark mode  

### 3.4 System Theme
- Automatically follows OS preference  
- Updates dynamically if the system theme changes  

---

## 4. Game Mechanics Integration

### 4.1 XP & Achievements
Introduce small, fun rewards tied to theme usage:
- **Achievement: “Theme Explorer”** — Try all four themes  
- **Achievement: “Night Owl”** — Use dark theme for 5 sessions  
- **Achievement: “Chameleon”** — Switch themes 10 times  
- **XP Bonus** for first time switching themes  

### 4.2 Daily Challenges (Optional)
- “Write a story in dark mode”  
- “Switch to mixed mode and complete acceptance criteria”  

### 4.3 Visual Feedback
- Smooth transitions (fade, slide, or colour blend)  
- Animated icon for theme switching  
- Subtle sound cue (optional and toggleable)  

---

## 5. UI/UX Requirements

### 5.1 Theme Switcher Placement
- Accessible from the main menu or top‑right toolbar  
- Icon‑based (sun/moon/mixed/system)  
- Dropdown or modal selector  

### 5.2 Persistence
- Store theme preference locally (localStorage or equivalent)  
- System theme updates automatically when OS changes  

### 5.3 Accessibility
- Ensure WCAG AA contrast compliance  
- Avoid overly saturated colours in mixed mode  
- Provide a “revert to default” option  

---

## 6. Architecture Overview

### 6.1 Frontend Components
- `ThemeSwitcher`  
- `ThemeProvider`  
- `ThemePreviewCard`  
- Updated global stylesheets or theme tokens  

### 6.2 Backend
No backend changes required unless storing preferences server‑side (optional).

### 6.3 Data Model Additions
**PlayerSettings**
- id  
- themePreference (light | dark | mixed | system)  
- lastUpdated  

---

## 7. Technical Requirements

### 7.1 Implementation Approach
- Use CSS variables or a theme token system  
- Provide four theme maps  
- Wrap the app in a `ThemeProvider`  
- Detect system theme via `prefers-color-scheme`  

### 7.2 Mixed Theme Logic
- Combine light and dark palettes  
- Use accent colours for game elements  
- Ensure readability across all components  

### 7.3 Animation Requirements
- 150–300ms transitions  
- GPU‑friendly (opacity, transform, colour variables)  

---

## 8. AI Rules (for code generation)
- Follow the theme definitions and naming conventions in this plan.  
- Keep theme logic modular and easy to extend.  
- Avoid hard‑coding colours; use tokens or variables.  
- Ensure all UI components respond correctly to theme changes.  
- Ask for clarification if a theme behaviour is ambiguous.  
- Generate tests for theme switching and persistence.  

---

## 9. Glossary
- **Theme**: A set of colours, backgrounds, and UI styles.  
- **Mixed Theme**: A hybrid theme combining light and dark elements.  
- **System Theme**: A theme that follows the OS preference.  
- **ThemeProvider**: A wrapper component that applies theme tokens.  

---

## 10. Future Extensions
- Player‑created custom themes  
- Seasonal themes (Halloween, retro, neon, etc.)  
- Animated backgrounds tied to XP level  
- Team‑based theme presets for workshops  
