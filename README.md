# 🐑 Sheep & Wolf 🐺 — Ecosystem Strategy Game

An interactive, grid-based ecosystem simulation and strategic puzzle game built with modern Vanilla JavaScript, CSS3, and HTML5.

Player balances the delicate food chain between **Sheep 🐑**, **Wolves 🐺**, and lush **Grass 🌱** across 6 challenging levels.

---

## 🌟 Features

- **6 Distinct Levels with Guaranteed Solvability:**
  - **Level 1 (9x9):** 10 Grass, 5 Sheep, 1 Wolf — 15 Weeks Target
  - **Level 2 (9x9):** 12 Grass, 6 Sheep, 2 Wolves — 25 Weeks Target
  - **Level 3 (9x9):** 14 Grass, 7 Sheep, 7 Wolves — 25 Weeks Target
  - **Level 4 (5x5):** 16 Grass, 8 Sheep, 4 Wolves — 30 Weeks Target (Scored)
  - **Level 5 (5x5):** 16 Grass, 8 Sheep, 5 Wolves — 30 Weeks Target (Scored)
  - **Level 6 (5x5):** 16 Grass, 8 Sheep, 6 Wolves — 30 Weeks Target (Grand Championship Scored)
- **Ecosystem Mechanics:**
  - **Autonomous Grid Filling:** Sheep actively disperse to neighboring empty cells (no 2 sheep occupy the same tile).
  - **Single-Sheep Reproduction:** Each grass patch sustains a sheep and prompts newborn offspring to move into adjacent vacant tiles.
  - **Permanent Feeding Grounds:** Grass patches remain permanent lush feeding areas.
  - **Wolf Hunting AI:** Wolves chase closest sheep with hunger countdowns and strategic movement.
  - **Tactical Vision Overlay:** Visualizes wolf threat zones and paths.
  - **Weekly Turn Animations:** Smooth step-by-step motion with multi-entity badge rendering and sound effects.
- **Grand Scoring:** Cumulative surviving sheep score across Levels 4, 5, and 6.
- **Level 6 Birthday Celebration:** Special celebratory screen with player name, random loving birthday wishes, confetti, and Web Audio synthesized Happy Birthday melody.
- **Progress Saving:** LocalStorage persistence for unlocked levels, high weeks, and scores.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v16 or higher)

### Run Locally
```bash
# Clone the repository
git clone https://github.com/<your-username>/<repo-name>.git

# Navigate to project folder
cd "sheep  game"

# Start the local server
npm start
```

Open your browser at `http://localhost:3000/`.

---

## 🛠️ Tech Stack
- **Frontend:** Vanilla HTML5, CSS3 (Modern Glassmorphism & Custom Properties), ES6+ Modules
- **Audio:** Web Audio API Procedural Synthesizer (Zero external dependencies)
- **Server:** Lightweight Node.js HTTP static server

---

## 💖 Credits
Made with ❤️ by **Aanshikesh Rawat**
