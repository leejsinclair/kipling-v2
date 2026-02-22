# 📖 Agile Story Builder

A gamified learning application that helps agile teams write better user stories through interactive practice and instant feedback.

### Story View — craft your user story and track XP & badges
![Story view with badge progress bar](https://github.com/user-attachments/assets/979e92db-3456-4590-80df-1184c2a8a257)

### Acceptance Criteria View — write and score Gherkin criteria
![Acceptance criteria view](https://github.com/user-attachments/assets/c9d8211b-0bd7-4244-8aa3-f90e0aba93f2)

### Session History — modal preview with per-criterion scores
![Session history modal preview](https://github.com/user-attachments/assets/27760dda-920a-48dc-b88e-490be0ca27d8)

## 🎯 Features

### Core Functionality
- **Story Crafting**: Three-field form for writing user stories (As a..., I want..., So that...)
- **Real-time Scoring**: Instant feedback on story quality with detailed breakdown
- **Smart Feedback**: Lightweight NLP analysis with actionable suggestions
- **Progress Tracking**: XP-based leveling system (Novice → Apprentice → Writer → Storyteller → Product Sage)
- **Badge Display**: All badges shown near XP — earned badges are highlighted, locked badges are greyed out with a tooltip describing how to earn them
- **Achievements**: Unlock badges for milestones and quality writing
- **Story History**: Track all your stories with CSV export functionality
- **Persistent Storage**: Progress and stories saved locally

### Scoring Criteria
The app evaluates user stories based on:
- **Completeness** (10 pts): All three fields filled
- **Length** (10 pts): Ideal range 18-40 words
- **Clarity** (10 pts): Simple, direct language without filler
- **Value Statement** (20 pts): Specific, outcome-focused "So that..." clause
- **Creativity** (5 pts): Unique word usage

**Maximum Score**: 55 points per story

### Game Mechanics
- **Levels**: Progress through 5 levels based on total XP
- **Achievements**: Unlock badges like "Crystal Clear Value", "Concise Master", "Epic Writer"
- **Instant Feedback**: Get suggestions for improvement after each submission

## 🌐 Live Demo

Try the app live at: [https://leejsinclair.github.io/kipling-v2/](https://leejsinclair.github.io/kipling-v2/)

## 🚀 Getting Started

### Prerequisites
- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/leejsinclair/kipling-v2.git
cd kipling-v2
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to [http://localhost:5173](http://localhost:5173)

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist` directory.

### Deploy to GitHub Pages

This project is configured to automatically deploy to GitHub Pages when changes are pushed to the `main` branch. The GitHub Actions workflow handles building and deployment.

To enable GitHub Pages for your fork:
1. Go to your repository Settings
2. Navigate to Pages (under Code and automation)
3. Under "Build and deployment", select "Source: GitHub Actions"
4. The site will be available at `https://<your-username>.github.io/kipling-v2/`

### Preview Production Build

```bash
npm run preview
```

## 🛠️ Tech Stack

- **React 19.2** - UI framework with hooks
- **Tailwind CSS 4.1** - Utility-first CSS framework
- **Vite 7.3** - Fast build tool and dev server
- **LocalStorage** - Client-side data persistence

## 📊 How It Works

1. **Write a Story**: Fill in the three fields with your user story
2. **Get Scored**: Submit to receive instant analysis and score
3. **Earn XP**: Each submission adds to your total experience points
4. **Level Up**: Progress through levels as you practice
5. **Unlock Achievements**: Earn badges for quality writing and milestones
6. **Export Stories**: Download your story history as CSV

## 🎓 Learning Outcomes

By using this app, you'll learn to:
- Write complete user stories with clear personas, goals, and outcomes
- Articulate value statements that focus on outcomes rather than features
- Use concise, direct language without filler words
- Understand what makes a high-quality agile user story

## 📝 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 👥 Community

- [Code of Conduct](.github/CODE_OF_CONDUCT.md)
- [Contributing Guide](.github/CONTRIBUTING.md)
- [Issue Templates](.github/ISSUE_TEMPLATE/)

This repository accepts issue reports only for code bugs and functional product requests.

Maintenance mode: this is a personal project with limited maintainer capacity, so issue and PR responses may be delayed or unavailable.

## 📖 Based on Story Plan

This application was built following the comprehensive story plan in `storyplan.md`, which defines:
- Game mechanics and scoring algorithms
- NLP heuristics for story evaluation
- Progression system and achievements
- Non-functional requirements (fast scoring, offline-friendly, accessible)

---

Built with ❤️ using React & Tailwind CSS • Helping teams write better user stories
