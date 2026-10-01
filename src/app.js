// app.js - Enhanced Main Game Controller with Placement Phase, Multi-Entity Stacking & Step-by-Step Turn Animations

import { LEVELS } from './levels.js';
import { GameEngine } from './gameEngine.js';
import { soundManager } from './sound.js';
import { launchConfetti } from './confetti.js';
import { loadSaveData, saveGameData, clearGameData } from './saveSystem.js';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const BIRTHDAY_QUOTES = [
  "“May your special day be filled with boundless joy, wonderful memories, and all the love your heart can hold. You make the world brighter every single day! Happy Birthday!”",
  "“On this beautiful day, may the universe shower you with love, happiness, and peace. You are truly one of a kind, and you deserve all the magic life has to offer. Happy Birthday!”",
  "“Count your life by smiles, not tears. Count your age by friends, not years. Wishing you the happiest of birthdays, filled with endless blessings, laughter, and love!”",
  "“May today mark the beginning of a year full of wonderful surprises, warm hugs, and cherished memories. Thank you for being the amazing, inspiring person you are. Happiest Birthday!”",
  "“Wishing you a day as radiant as your smile, as warm as your heart, and as special as you are to everyone around you. Happy Birthday with all my love!”",
  "“Some people make the world brighter, warmer, and kinder just by being in it — and you are one of them. May your birthday be as uniquely wonderful as you are. Happy Birthday!”"
];

class SheepAndWolfApp {
  constructor() {
    this.saveData = loadSaveData();
    soundManager.enabled = this.saveData.soundEnabled;

    this.currentLevelIndex = (this.saveData.currentLevel || 1) - 1;
    this.engine = new GameEngine(LEVELS[this.currentLevelIndex]);

    this.activeModal = null; // 'rules' | 'levelSelect' | 'restartConfirm'
    this.activeRulesTab = 'overview';
    this.tacticalVision = this.saveData.tacticalVision !== false;

    // Simulation playback state
    this.isAutoPlaying = false;
    this.simSpeed = 1; // 1 | 2 | 3
    this.autoPlayTimer = null;

    this.appEl = document.getElementById('app');

    this.initEventListeners();
    this.render();
  }

  initEventListeners() {
    // Keyboard shortcuts
    window.addEventListener('keydown', (e) => {
      if (this.activeModal) {
        if (e.key === 'Escape') {
          this.closeModal();
          this.render();
        }
        return;
      }

      // Space or Enter to End Week (during simulation phase)
      if (e.key === ' ' || e.key === 'Enter') {
        if (!this.engine.isSetupPhase && !this.engine.isAnimating && !this.engine.gameOver && !this.engine.gameWon) {
          e.preventDefault();
          this.handleStepWeek();
        }
      }

      // Arrow keys / WASD for moving selected sheep
      if (!this.engine.isSetupPhase && this.engine.selectedSheepId && !this.engine.isAnimating && !this.engine.gameOver && !this.engine.gameWon) {
        const s = this.engine.sheep.find(x => x.id === this.engine.selectedSheepId);
        if (!s) return;

        let dr = 0, dc = 0;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') dr = -1;
        else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') dr = 1;
        else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') dc = -1;
        else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') dc = 1;

        if (dr !== 0 || dc !== 0) {
          e.preventDefault();
          const targetR = s.r + dr;
          const targetC = s.c + dc;
          this.engine.planSheepMove(s.id, targetR, targetC);
          this.render();
        }
      }
    });
  }

  handleStartGame(name) {
    if (!name || !name.trim()) return;
    this.saveData.playerName = name.trim();
    saveGameData(this.saveData);
    soundManager.init();
    soundManager.playTone(500, 'triangle', 0.2, 0.3, 0.01);
    this.render();
  }

  // --- ANIMATED TURN EXECUTION ---
  async handleStepWeek() {
    if (this.engine.isAnimating || this.engine.gameOver || this.engine.gameWon) return;

    this.engine.isAnimating = true;
    soundManager.init();

    const speed = this.simSpeed;

    // Save snapshot for potential undo
    this.engine.history.push(this.engine.saveSnapshot());
    if (this.engine.history.length > 5) this.engine.history.shift();

    // 1. Sheep Move Phase
    this.engine.executeSheepMovePhase();
    this.render();
    await sleep(280 / speed);

    // 2. Grazing Phase
    this.engine.executeGrazingPhase();
    this.render();
    await sleep(300 / speed);

    // 3. Breeding Phase
    this.engine.executeBreedingPhase();
    this.render();
    await sleep(320 / speed);

    // 4. Wolf Movement Phase
    this.engine.executeWolfMovePhase();
    this.render();
    await sleep(280 / speed);

    // 5. Wolf Hunt / Eat Phase
    this.engine.executeWolfHuntPhase();
    this.render();
    await sleep(320 / speed);

    // 6. Resolution & Grass Growth Phase
    this.engine.executeResolvePhase();
    this.engine.isAnimating = false;

    // Check Win
    if (this.engine.gameWon) {
      this.isAutoPlaying = false;
      launchConfetti();
      const currentLvl = LEVELS[this.currentLevelIndex].level;
      if (currentLvl === 6) {
        soundManager.playBirthdayTune();
      }
      if (!this.saveData.completedLevels.includes(currentLvl)) {
        this.saveData.completedLevels.push(currentLvl);
      }
      const nextLvl = currentLvl + 1;
      if (nextLvl <= 6 && !this.saveData.unlockedLevels.includes(nextLvl)) {
        this.saveData.unlockedLevels.push(nextLvl);
      }

      // Record score for levels 4, 5, 6: total number of sheep left at the end of weeks!
      if (currentLvl >= 4 && currentLvl <= 6) {
        if (!this.saveData.levelScores) this.saveData.levelScores = {};
        const sheepLeft = this.engine.sheep.length;
        this.saveData.levelScores[currentLvl] = Math.max(this.saveData.levelScores[currentLvl] || 0, sheepLeft);
      }

      saveGameData(this.saveData);
    } else if (this.engine.gameOver) {
      this.isAutoPlaying = false;
    }

    this.render();

    // Continue Auto-Play loop if active
    if (this.isAutoPlaying && !this.engine.gameOver && !this.engine.gameWon) {
      this.autoPlayTimer = setTimeout(() => {
        this.handleStepWeek();
      }, 400 / speed);
    }
  }

  toggleAutoPlay() {
    if (this.isAutoPlaying) {
      this.isAutoPlaying = false;
      if (this.autoPlayTimer) clearTimeout(this.autoPlayTimer);
      this.render();
    } else {
      if (this.engine.gameOver || this.engine.gameWon) return;
      this.isAutoPlaying = true;
      this.render();
      this.handleStepWeek();
    }
  }

  setSimSpeed(speed) {
    this.simSpeed = speed;
    this.render();
  }

  handleSelectLevel(lvlNum) {
    if (!this.saveData.unlockedLevels.includes(lvlNum)) return;
    this.isAutoPlaying = false;
    if (this.autoPlayTimer) clearTimeout(this.autoPlayTimer);

    this.currentLevelIndex = lvlNum - 1;
    this.saveData.currentLevel = lvlNum;
    saveGameData(this.saveData);

    // Start with empty grid in setup phase
    this.engine = new GameEngine(LEVELS[this.currentLevelIndex]);
    this.closeModal();
    this.render();
  }

  handleRestartLevel() {
    this.isAutoPlaying = false;
    if (this.autoPlayTimer) clearTimeout(this.autoPlayTimer);
    this.engine = new GameEngine(LEVELS[this.currentLevelIndex]);
    this.closeModal();
    this.render();
  }

  handleReturnToSetup() {
    this.isAutoPlaying = false;
    if (this.autoPlayTimer) clearTimeout(this.autoPlayTimer);
    this.engine.isSetupPhase = true;
    this.render();
  }

  handleNextLevel() {
    if (this.currentLevelIndex + 1 < LEVELS.length) {
      this.handleSelectLevel(this.currentLevelIndex + 2);
    } else {
      this.closeModal();
      this.render();
    }
  }

  openModal(modalName) {
    this.isAutoPlaying = false;
    if (this.autoPlayTimer) clearTimeout(this.autoPlayTimer);
    this.activeModal = modalName;
    this.render();
  }

  closeModal() {
    this.activeModal = null;
    this.render();
  }

  toggleSound() {
    soundManager.init();
    soundManager.enabled = !soundManager.enabled;
    this.saveData.soundEnabled = soundManager.enabled;
    saveGameData(this.saveData);
    if (soundManager.enabled) {
      soundManager.playTone(520, 'sine', 0.15, 0.3, 0.01);
    }
    this.render();
  }

  toggleTacticalVision() {
    this.tacticalVision = !this.tacticalVision;
    this.saveData.tacticalVision = this.tacticalVision;
    saveGameData(this.saveData);
    this.render();
  }

  handleResetAllProgress() {
    this.saveData.unlockedLevels = [1];
    this.saveData.completedLevels = [];
    this.saveData.currentLevel = 1;
    this.saveData.highWeeks = {};
    this.saveData.levelScores = {};
    saveGameData(this.saveData);

    this.currentLevelIndex = 0;
    this.engine = new GameEngine(LEVELS[0]);
    this.closeModal();
    soundManager.playTone(320, 'sine', 0.15, 0.25, 0.01);
    this.render();
  }

  // --- RENDER METHODS ---

  render() {
    this.appEl.innerHTML = '';

    // Top Navigation
    this.appEl.appendChild(this.renderTopBar());

    // Landing Screen if no player name
    if (!this.saveData.playerName) {
      this.appEl.appendChild(this.renderLandingScreen());
      this.appEl.appendChild(this.renderFooter());
      return;
    }

    // Main Game View
    this.appEl.appendChild(this.renderGameLayout());

    // Modals
    if (this.activeModal) {
      this.appEl.appendChild(this.renderModal());
    } else if (this.engine.gameOver && !this.engine.isAnimating) {
      this.appEl.appendChild(this.renderGameOverModal());
    } else if (this.engine.gameWon && !this.engine.isAnimating) {
      this.appEl.appendChild(this.renderWinModal());
    }

    // Footer
    this.appEl.appendChild(this.renderFooter());
  }

  renderFooter() {
    const footer = document.createElement('footer');
    footer.className = 'app-footer';
    footer.innerHTML = `
      <div class="footer-content">
        Made with <span class="heart-pulse">❤️</span> <span class="footer-author">Aanshikesh Rawat</span>
      </div>
    `;
    return footer;
  }

  renderTopBar() {
    const bar = document.createElement('header');
    bar.className = 'top-bar';

    const brand = document.createElement('div');
    brand.className = 'brand';
    brand.innerHTML = `<span class="brand-icon">🐑</span> <span>Sheep &amp; Wolf</span> <span class="brand-icon">🐺</span>`;

    const center = document.createElement('div');
    if (this.saveData.playerName) {
      center.className = 'player-welcome';
      const l4 = this.saveData.levelScores?.[4] || 0;
      const l5 = this.saveData.levelScores?.[5] || 0;
      const l6 = this.saveData.levelScores?.[6] || 0;
      const grandTotal = l4 + l5 + l6;

      let scorePill = '';
      if (grandTotal > 0) {
        scorePill = `<span class="score-indicator-badge" style="margin-left: 8px;" title="Levels 4–6 Total Surviving Sheep">🏆 L4–6 Score: <strong>${grandTotal}</strong> 🐑</span>`;
      }

      center.innerHTML = `Welcome, <span class="player-name-badge">${this.escapeHtml(this.saveData.playerName)}</span>! ${scorePill}`;
    }

    const actions = document.createElement('div');
    actions.className = 'nav-actions';

    if (this.saveData.playerName) {
      const lvlSelectBtn = document.createElement('button');
      lvlSelectBtn.className = 'btn';
      lvlSelectBtn.innerHTML = `🗺️ Level Select`;
      lvlSelectBtn.onclick = () => this.openModal('levelSelect');

      const rulesBtn = document.createElement('button');
      rulesBtn.className = 'btn';
      rulesBtn.innerHTML = `📖 Rules`;
      rulesBtn.onclick = () => this.openModal('rules');

      const restartBtn = document.createElement('button');
      restartBtn.className = 'btn';
      restartBtn.innerHTML = `🔄 Reset Level`;
      restartBtn.onclick = () => this.openModal('restartConfirm');

      actions.appendChild(lvlSelectBtn);
      actions.appendChild(rulesBtn);
      actions.appendChild(restartBtn);
    }

    const soundBtn = document.createElement('button');
    soundBtn.className = 'btn btn-icon-only';
    soundBtn.title = soundManager.enabled ? 'Mute Sound' : 'Unmute Sound';
    soundBtn.innerHTML = soundManager.enabled ? '🔊' : '🔇';
    soundBtn.onclick = () => this.toggleSound();
    actions.appendChild(soundBtn);

    bar.appendChild(brand);
    bar.appendChild(center);
    bar.appendChild(actions);
    return bar;
  }

  renderLandingScreen() {
    const container = document.createElement('main');
    container.className = 'landing-container';

    const card = document.createElement('div');
    card.className = 'landing-card';

    card.innerHTML = `
      <h1 class="landing-title">🐑 SHEEP &amp; WOLF 🐺</h1>
      <p class="landing-subtitle">“Balance the ecosystem. Survive the weeks.”</p>
      
      <div class="landing-input-group">
        <label class="landing-label" for="playerNameInput">What is your name?</label>
        <input type="text" id="playerNameInput" class="landing-input" placeholder="Enter your name" maxlength="25" autofocus />
      </div>

      <button id="startBtn" class="btn btn-action-cta" style="width: 100%;">
        Start Game →
      </button>

      <div class="landing-features">
        <div class="feature-pill">
          <div class="feature-icon">🌱</div>
          <div class="feature-title">Ecosystem Creator</div>
          <div class="feature-desc">Place species on the empty grid</div>
        </div>
        <div class="feature-pill">
          <div class="feature-icon">✨</div>
          <div class="feature-title">Co-ordinate Sharing</div>
          <div class="feature-desc">Sheep, wolf &amp; grass on same tile</div>
        </div>
        <div class="feature-pill">
          <div class="feature-icon">🎬</div>
          <div class="feature-title">Fully Animated</div>
          <div class="feature-desc">Watch grazing, breeding &amp; hunting</div>
        </div>
      </div>
    `;

    const input = card.querySelector('#playerNameInput');
    const startBtn = card.querySelector('#startBtn');

    const submit = () => {
      const val = input.value.trim();
      if (val) this.handleStartGame(val);
      else input.focus();
    };

    startBtn.onclick = submit;
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });

    container.appendChild(card);
    return container;
  }

  renderGameLayout() {
    const layout = document.createElement('main');
    layout.className = 'game-layout';

    // Left Column: Meadow Board Section
    const boardSection = document.createElement('section');
    boardSection.className = 'board-section';

    // Level HUD
    const hud = document.createElement('div');
    hud.className = 'level-hud';

    const lvlConfig = LEVELS[this.currentLevelIndex];
    hud.innerHTML = `
      <div class="level-badge-container">
        <span class="level-number-tag">Level ${lvlConfig.level}</span>
        <span class="level-title-text">${lvlConfig.title}</span>
        <span class="phase-indicator-badge">
          ${this.engine.isSetupPhase ? '🛠️ Setup Phase' : '🌿 Simulation Phase'}
        </span>
        ${lvlConfig.isScoredLevel ? `<span class="score-indicator-badge" title="Total surviving sheep count is your score for Levels 4, 5 & 6">⭐ Score: <strong>${this.engine.sheep.length}</strong> 🐑</span>` : ''}
      </div>
      <div class="week-display">
        <span class="week-label">Week</span>
        <span class="week-numbers">${this.engine.week} / ${this.engine.targetWeeks}</span>
      </div>
    `;
    boardSection.appendChild(hud);

    // Week Progress Bar
    const progressContainer = document.createElement('div');
    progressContainer.className = 'week-progress-container';
    const percent = Math.min(100, Math.round(((this.engine.week - 1) / this.engine.targetWeeks) * 100));
    progressContainer.innerHTML = `<div class="week-progress-bar" style="width: ${percent}%;"></div>`;
    boardSection.appendChild(progressContainer);

    // SETUP PHASE TOOLBAR (If in placement mode)
    if (this.engine.isSetupPhase) {
      boardSection.appendChild(this.renderSetupToolbar());
    } else {
      // SPECIES STATS BAR (During simulation)
      boardSection.appendChild(this.renderSpeciesBar());
    }

    // Grid Container (with multi-entity coordinate stacking)
    const gridEl = this.renderGrid();
    boardSection.appendChild(gridEl);

    // ACTION CONTROLS BAR
    boardSection.appendChild(this.renderActionControls());

    layout.appendChild(boardSection);

    // Right Column: Sidebar
    const sidebar = document.createElement('aside');
    sidebar.className = 'sidebar-panel';

    // Wolf Hunger Monitors
    const wolfCard = document.createElement('div');
    wolfCard.className = 'panel-card';
    wolfCard.innerHTML = `<h3 class="panel-title"><span>🐺 Wolf Hunger Monitors</span></h3>`;

    const wolfList = document.createElement('div');
    wolfList.className = 'wolf-monitor-list';

    if (this.engine.wolves.length === 0) {
      wolfList.innerHTML = `<div style="font-size: 0.8rem; color: var(--color-text-muted); text-align: center; padding: 8px;">Place wolves on the grid to monitor hunger.</div>`;
    } else {
      this.engine.wolves.forEach((w) => {
        const item = document.createElement('div');
        item.className = `wolf-monitor-item ${w.hunger >= 2 ? 'danger-hunger' : ''}`;

        let dotsHtml = '';
        for (let i = 0; i < 3; i++) {
          const isFilled = i < w.hunger;
          const isCritical = isFilled && w.hunger >= 2;
          dotsHtml += `<div class="hunger-dot ${isFilled ? 'filled' : ''} ${isCritical ? 'critical' : ''}"></div>`;
        }

        item.innerHTML = `
          <div class="wolf-identity">
            <span>🐺</span> <span>${w.name} (${w.r}, ${w.c})</span>
          </div>
          <div class="wolf-hunger-bar-wrapper">
            <div class="hunger-dots">${dotsHtml}</div>
            <span class="hunger-score" style="color: ${w.hunger >= 2 ? 'var(--color-danger)' : w.hunger === 1 ? 'var(--color-warning)' : 'var(--color-primary-light)'}">
              ${w.hunger} / 3
            </span>
          </div>
        `;
        wolfList.appendChild(item);
      });
    }

    wolfCard.appendChild(wolfList);
    sidebar.appendChild(wolfCard);

    // Tactical Tip
    const tipCard = document.createElement('div');
    tipCard.className = 'panel-card';
    tipCard.innerHTML = `
      <div class="tip-banner">
        ${lvlConfig.tip}
      </div>
    `;
    sidebar.appendChild(tipCard);

    // Event Log
    const logCard = document.createElement('div');
    logCard.className = 'panel-card';
    logCard.innerHTML = `<h3 class="panel-title"><span>📜 Ecosystem Log</span></h3>`;

    const logList = document.createElement('div');
    logList.className = 'event-log-container';
    this.engine.eventLogs.forEach(entry => {
      const logDiv = document.createElement('div');
      logDiv.className = `log-item ${entry.type || ''}`;
      logDiv.textContent = entry.text;
      logList.appendChild(logDiv);
    });

    logCard.appendChild(logList);
    sidebar.appendChild(logCard);

    layout.appendChild(sidebar);
    return layout;
  }

  renderSetupToolbar() {
    const toolbar = document.createElement('div');
    toolbar.className = 'setup-toolbar';

    const header = document.createElement('div');
    header.className = 'setup-toolbar-header';
    header.innerHTML = `
      <span class="setup-instructions">
        👉 Click grid cells to place. <strong>Each cell holds at most 1 sheep (2 sheep cannot share a tile). Sheep &amp; wolf can share grass!</strong>
      </span>
    `;

    const brushesRow = document.createElement('div');
    brushesRow.className = 'setup-brushes-container';

    const brushes = [
      { id: 'sheep', icon: '🐑', label: 'Sheep', count: this.engine.inventory.sheep },
      { id: 'wolf', icon: '🐺', label: 'Wolf', count: this.engine.inventory.wolves },
      { id: 'grass', icon: '🌱', label: 'Grass', count: this.engine.inventory.grass },
      { id: 'eraser', icon: '❌', label: 'Remove', count: null }
    ];

    brushes.forEach(b => {
      const btn = document.createElement('button');
      btn.className = `brush-btn ${this.engine.activeBrush === b.id ? 'active' : ''}`;
      btn.innerHTML = `
        <span>${b.icon}</span>
        <span>${b.label}</span>
        ${b.count !== null ? `<span class="brush-count-badge">${b.count}</span>` : ''}
      `;
      btn.onclick = () => {
        this.engine.activeBrush = b.id;
        soundManager.playTone(420, 'sine', 0.08, 0.2, 0.01);
        this.render();
      };
      brushesRow.appendChild(btn);
    });

    const actionsRow = document.createElement('div');
    actionsRow.className = 'setup-actions-row';

    const leftBtns = document.createElement('div');
    leftBtns.style.display = 'flex';
    leftBtns.style.gap = '8px';

    const presetBtn = document.createElement('button');
    presetBtn.className = 'btn';
    presetBtn.innerHTML = `💡 Load Solvable Preset`;
    presetBtn.title = 'Load the mathematically verified winning layout';
    presetBtn.onclick = () => {
      this.engine.loadPreset();
      this.render();
    };

    const clearBtn = document.createElement('button');
    clearBtn.className = 'btn btn-danger';
    clearBtn.innerHTML = `🧹 Clear Grid`;
    clearBtn.title = 'Remove all placed entities back to inventory';
    clearBtn.onclick = () => {
      this.engine.clearBoard();
      this.render();
    };

    leftBtns.appendChild(presetBtn);
    leftBtns.appendChild(clearBtn);

    const startSimBtn = document.createElement('button');
    startSimBtn.className = 'btn btn-action-cta';
    startSimBtn.disabled = !this.engine.canStartSimulation();
    startSimBtn.innerHTML = `▶ Start Simulation →`;
    startSimBtn.onclick = () => {
      if (this.engine.startSimulation()) {
        this.render();
      }
    };

    actionsRow.appendChild(leftBtns);
    actionsRow.appendChild(startSimBtn);

    toolbar.appendChild(header);
    toolbar.appendChild(brushesRow);
    toolbar.appendChild(actionsRow);
    return toolbar;
  }

  renderSpeciesBar() {
    const speciesBar = document.createElement('div');
    speciesBar.className = 'species-bar';
    const aliveGrassCount = Object.keys(this.engine.grass).length;

    speciesBar.innerHTML = `
      <div class="species-card">
        <span class="species-card-icon">🐑</span>
        <div class="species-card-info">
          <span class="species-card-label">Sheep</span>
          <span class="species-card-count">${this.engine.sheep.length}</span>
        </div>
      </div>
      <div class="species-card">
        <span class="species-card-icon">🐺</span>
        <div class="species-card-info">
          <span class="species-card-label">Wolves</span>
          <span class="species-card-count">${this.engine.wolves.length}</span>
        </div>
      </div>
      <div class="species-card">
        <span class="species-card-icon">🌱</span>
        <div class="species-card-info">
          <span class="species-card-label">Grass (Unlimited)</span>
          <span class="species-card-count">${aliveGrassCount}</span>
        </div>
      </div>
    `;
    return speciesBar;
  }

  renderGrid() {
    const grid = document.createElement('div');
    grid.className = `grid-container ${this.engine.gridSize === 9 ? 'grid-9x9' : 'grid-5x5'}`;

    const threatCells = (!this.engine.isSetupPhase && this.tacticalVision) ? this.engine.getWolfThreatCells() : new Map();
    const validMoves = (!this.engine.isSetupPhase && this.engine.selectedSheepId) ? this.engine.getValidMovesForSheep(this.engine.selectedSheepId) : [];

    for (let r = 0; r < this.engine.gridSize; r++) {
      for (let c = 0; c < this.engine.gridSize; c++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.dataset.r = r;
        tile.dataset.c = c;

        const cellKey = `${r},${c}`;
        const hasGrass = this.engine.isGrass(r, c);

        // Tile background styling
        if (hasGrass) {
          tile.classList.add('has-grass');
        }

        // Threat highlight
        if (threatCells.has(cellKey)) {
          tile.classList.add('danger-zone');
        }

        // Query ALL entities on this coordinate (Multi-Entity Support!)
        const sheepOnTile = this.engine.getAllSheepAt(r, c);
        const wolvesOnTile = this.engine.getAllWolvesAt(r, c);

        // Check if selected sheep is here
        const isSelected = sheepOnTile.some(s => s.id === this.engine.selectedSheepId);
        if (isSelected) {
          tile.classList.add('selected');
        }

        // Move target highlight
        const isValidTarget = validMoves.some(v => v.r === r && v.c === c);
        if (isValidTarget) {
          tile.classList.add('valid-target');
        }

        // --- RENDER ENTITIES INSIDE TILE ---

        // 1. Grass backdrop icon (unlimited grass in region - never disappears!)
        if (hasGrass) {
          const grassIcon = document.createElement('span');
          grassIcon.className = 'grass-backdrop';
          grassIcon.textContent = '🌱';
          tile.appendChild(grassIcon);
        }

        // 2. Animal container (holds sheep and/or wolves side-by-side or stacked!)
        if (sheepOnTile.length > 0 || wolvesOnTile.length > 0) {
          const wrapper = document.createElement('div');
          wrapper.className = 'cell-entities-wrapper';

          // Render Sheep
          if (sheepOnTile.length > 0) {
            const firstSheep = sheepOnTile[0];
            const sheepSprite = document.createElement('div');
            sheepSprite.className = 'entity-sprite sheep';

            // Animation classes based on active phase
            if (this.engine.currentPhase === 'sheep_move') sheepSprite.classList.add('anim-hop');
            if (this.engine.currentPhase === 'eat' && hasGrass) sheepSprite.classList.add('anim-graze');

            sheepSprite.innerHTML = `
              🐑
              <span class="badge-energy">⚡${firstSheep.energy}</span>
            `;

            // If grazing just happened, show floating +⚡
            if (this.engine.currentPhase === 'eat' && this.engine.lastGrazedPositions.some(p => p.r === r && p.c === c)) {
              const energyPop = document.createElement('div');
              energyPop.className = 'anim-energy-pop';
              energyPop.textContent = '+⚡5';
              tile.appendChild(energyPop);
            }

            // If single-sheep reproduction occurred, show floating heart over parent and newborn lamb in adjacent cell
            const isParentHere = this.engine.lastBreedingEvents && this.engine.lastBreedingEvents.some(e => e.parent && e.parent.r === r && e.parent.c === c);
            const isLambHere = this.engine.lastBreedingEvents && this.engine.lastBreedingEvents.some(e => e.lamb && e.lamb.r === r && e.lamb.c === c);

            if (this.engine.currentPhase === 'breed') {
              if (isParentHere) {
                const heart = document.createElement('div');
                heart.className = 'anim-heart';
                heart.textContent = '💖';
                tile.appendChild(heart);
                sheepSprite.classList.add('anim-reproduce-parent');
              }
              if (isLambHere) {
                const babyBadge = document.createElement('div');
                babyBadge.className = 'anim-lamb-born';
                babyBadge.textContent = '✨👶';
                tile.appendChild(babyBadge);
                sheepSprite.classList.add('anim-hop');
              }
            }

            // Planned move arrow
            if (firstSheep.plannedMove && (firstSheep.plannedMove.r !== r || firstSheep.plannedMove.c !== c)) {
              const dr = firstSheep.plannedMove.r - r;
              const dc = firstSheep.plannedMove.c - c;
              let arrow = '•';
              if (dr === -1) arrow = '↑';
              else if (dr === 1) arrow = '↓';
              else if (dc === -1) arrow = '←';
              else if (dc === 1) arrow = '→';
              const arrowEl = document.createElement('span');
              arrowEl.className = 'move-plan-arrow';
              arrowEl.textContent = arrow;
              tile.appendChild(arrowEl);
            }

            wrapper.appendChild(sheepSprite);
          }

          // Render Wolf
          if (wolvesOnTile.length > 0) {
            const firstWolf = wolvesOnTile[0];
            const wolfSprite = document.createElement('div');
            wolfSprite.className = 'entity-sprite wolf';

            if (this.engine.currentPhase === 'hunt' && sheepOnTile.length > 0) {
              wolfSprite.classList.add('anim-pounce');
            }

            wolfSprite.innerHTML = `
              🐺
              <span class="badge-hunger">${firstWolf.hunger}/3</span>
              ${wolvesOnTile.length > 1 ? `<span class="badge-multi-count">×${wolvesOnTile.length}</span>` : ''}
            `;

            // If hunted on this tile, show cloud explosion puff
            if (this.engine.currentPhase === 'hunt' && this.engine.lastHuntedEvents.some(h => h.r === r && h.c === c)) {
              const puff = document.createElement('div');
              puff.className = 'anim-hunt-puff';
              puff.textContent = '💥';
              tile.appendChild(puff);
            }

            wrapper.appendChild(wolfSprite);
          }

          tile.appendChild(wrapper);
        }

        // --- TILE CLICK HANDLING ---
        tile.onclick = () => {
          if (this.engine.isAnimating) return;

          // 1. SETUP PHASE CLICK
          if (this.engine.isSetupPhase) {
            this.engine.handleTileClickSetup(r, c);
            this.render();
            return;
          }

          // 2. SIMULATION PHASE CLICK
          // If sheep on tile, select it
          if (sheepOnTile.length > 0) {
            this.engine.selectedSheepId = sheepOnTile[0].id;
            soundManager.playTone(360, 'sine', 0.1, 0.25, 0.01);
            this.render();
            return;
          }

          // If valid target clicked for selected sheep
          if (this.engine.selectedSheepId && isValidTarget) {
            this.engine.planSheepMove(this.engine.selectedSheepId, r, c);
            this.render();
            return;
          }

          // Deselect
          this.engine.selectedSheepId = null;
          this.render();
        };

        grid.appendChild(tile);
      }
    }

    return grid;
  }

  renderActionControls() {
    const actions = document.createElement('div');
    actions.className = 'board-actions';

    if (this.engine.isSetupPhase) {
      // In Setup phase, controls are inside the setup toolbar
      return actions;
    }

    // Simulation Phase Controls
    const leftActions = document.createElement('div');
    leftActions.className = 'left-actions';

    const editSetupBtn = document.createElement('button');
    editSetupBtn.className = 'btn';
    editSetupBtn.innerHTML = `🛠️ Edit Setup`;
    editSetupBtn.title = 'Return to placement mode to reposition species';
    editSetupBtn.disabled = this.engine.isAnimating;
    editSetupBtn.onclick = () => this.handleReturnToSetup();

    const undoWeekBtn = document.createElement('button');
    undoWeekBtn.className = 'btn';
    undoWeekBtn.innerHTML = `⏪ Undo Week`;
    undoWeekBtn.title = 'Rewind 1 week';
    undoWeekBtn.disabled = this.engine.history.length === 0 || this.engine.isAnimating;
    undoWeekBtn.onclick = () => {
      if (this.engine.undoWeek()) this.render();
    };

    const visionBtn = document.createElement('button');
    visionBtn.className = `btn ${this.tacticalVision ? 'btn-primary' : ''}`;
    visionBtn.innerHTML = `👁️ Threats`;
    visionBtn.title = 'Toggle predator danger zone overlay';
    visionBtn.disabled = this.engine.isAnimating;
    visionBtn.onclick = () => this.toggleTacticalVision();

    leftActions.appendChild(editSetupBtn);
    leftActions.appendChild(undoWeekBtn);
    leftActions.appendChild(visionBtn);

    // Right Playback & Step Controls
    const rightActions = document.createElement('div');
    rightActions.className = 'right-actions';

    // Speed Selector (1x, 2x, 3x)
    const speedGroup = document.createElement('div');
    speedGroup.className = 'simulation-playback-group';
    [1, 2, 3].forEach(s => {
      const spdBtn = document.createElement('button');
      spdBtn.className = `speed-toggle-btn ${this.simSpeed === s ? 'active' : ''}`;
      spdBtn.textContent = `${s}x`;
      spdBtn.onclick = () => this.setSimSpeed(s);
      speedGroup.appendChild(spdBtn);
    });

    // Auto-Play Toggle
    const autoPlayBtn = document.createElement('button');
    autoPlayBtn.className = `btn ${this.isAutoPlaying ? 'btn-primary' : ''}`;
    autoPlayBtn.innerHTML = this.isAutoPlaying ? `⏸ Pause` : `▶ Auto-Play`;
    autoPlayBtn.onclick = () => this.toggleAutoPlay();

    // Step Week Button
    const stepWeekBtn = document.createElement('button');
    stepWeekBtn.className = 'btn btn-action-cta';
    stepWeekBtn.disabled = this.engine.isAnimating;
    stepWeekBtn.innerHTML = `STEP WEEK →`;
    stepWeekBtn.title = 'Execute turn (Shortcut: Space or Enter)';
    stepWeekBtn.onclick = () => this.handleStepWeek();

    rightActions.appendChild(speedGroup);
    rightActions.appendChild(autoPlayBtn);
    rightActions.appendChild(stepWeekBtn);

    actions.appendChild(leftActions);
    actions.appendChild(rightActions);
    return actions;
  }

  // Modals
  renderModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.onclick = (e) => {
      if (e.target === overlay) this.closeModal();
    };

    const content = document.createElement('div');
    content.className = 'modal-content';

    if (this.activeModal === 'rules') {
      content.appendChild(this.renderRulesModalContent());
    } else if (this.activeModal === 'levelSelect') {
      content.appendChild(this.renderLevelSelectModalContent());
    } else if (this.activeModal === 'restartConfirm') {
      content.appendChild(this.renderRestartConfirmContent());
    } else if (this.activeModal === 'resetAllConfirm') {
      content.appendChild(this.renderResetAllConfirmContent());
    }

    overlay.appendChild(content);
    return overlay;
  }

  renderRulesModalContent() {
    const wrap = document.createElement('div');

    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <h2 class="modal-title">📖 Ecosystem Rules</h2>
      <button class="modal-close-btn" id="closeModalBtn">&times;</button>
    `;
    header.querySelector('#closeModalBtn').onclick = () => this.closeModal();
    wrap.appendChild(header);

    const tabs = document.createElement('div');
    tabs.className = 'rules-tabs';
    const tabList = [
      { id: 'overview', label: 'Overview' },
      { id: 'placement', label: '🛠️ Placement' },
      { id: 'sheep', label: '🐑 Sheep' },
      { id: 'wolves', label: '🐺 Wolves' },
      { id: 'grass', label: '🌱 Grass' }
    ];

    tabList.forEach(t => {
      const btn = document.createElement('button');
      btn.className = `rules-tab-btn ${this.activeRulesTab === t.id ? 'active' : ''}`;
      btn.textContent = t.label;
      btn.onclick = () => {
        this.activeRulesTab = t.id;
        this.render();
      };
      tabs.appendChild(btn);
    });
    wrap.appendChild(tabs);

    const body = document.createElement('div');
    body.className = 'rules-section';

    if (this.activeRulesTab === 'overview') {
      body.innerHTML = `
        <h4>Objective</h4>
        <p>Maintain balance between sheep, wolves, and grass so that <strong>ALL species survive for the target number of weeks</strong>.</p>
        
        <div class="rules-highlight-box">
          🏆 <strong>Winning:</strong> Survive to the target week with at least 1 Sheep and 1 Wolf alive!
          <br/><br/>
          💀 <strong>Losing:</strong> If Sheep become extinct OR Wolves starve to death, the level fails.
        </div>

        <h4>Weekly Animated Phases</h4>
        <ul>
          <li><strong>1. Sheep Move:</strong> Sheep hop to their target coordinates.</li>
          <li><strong>2. Grazing:</strong> Sheep on grass graze to restore energy to full (⚡5). Grass is unlimited and stays in place!</li>
          <li><strong>3. Single Sheep Reproduction:</strong> Each well-fed sheep (⚡ 2+) reproduces a new lamb into an adjacent grid cell!</li>
          <li><strong>4. Wolf Prowl:</strong> Wolves stalk nearest sheep using intelligent pathfinding.</li>
          <li><strong>5. Hunting:</strong> Wolves on sheep coordinates eat sheep, resetting hunger to 0.</li>
          <li><strong>6. Resolution:</strong> Sheep not on grass lose 1 energy; starved animals are removed.</li>
        </ul>
      `;
    } else if (this.activeRulesTab === 'placement') {
      body.innerHTML = `
        <h4>🛠️ Setup &amp; Placement Phase</h4>
        <ul>
          <li>Every level starts with an <strong>empty grid</strong>.</li>
          <li>Select 🐑 Sheep, 🐺 Wolf, or 🌱 Grass from the placement toolbar and click tiles to place them.</li>
          <li><strong>No 2 Sheep on Same Tile:</strong> Each sheep must occupy its own unique cell (2 sheep cannot be placed at the same coordinate).</li>
          <li><strong>Species Co-existence:</strong> Sheep, grass, and wolves are allowed to occupy the same tile!</li>
          <li>Click <strong>💡 Load Solvable Preset</strong> anytime to inspect a verified winning configuration!</li>
        </ul>
      `;
    } else if (this.activeRulesTab === 'sheep') {
      body.innerHTML = `
        <h4>🐑 Sheep Behavior &amp; Grid Dispersal</h4>
        <ul>
          <li><strong>Energy:</strong> Starts at 4 (max 5). Consumes 1 energy per week when not grazing. Dies if energy reaches 0.</li>
          <li><strong>Grazing:</strong> Stepping on or remaining on a grass tile instantly restores energy to max 5!</li>
          <li><strong>Filling the Grid:</strong> Sheep (including newborn reproduced sheep) actively move to adjacent cells each week to graze, avoid predators, and fill the meadow rather than staying in one spot!</li>
          <li><strong>Unique Tile Rule:</strong> Two sheep can NEVER occupy the same tile. Each sheep always maintains its own separate cell.</li>
          <li><strong>Manual Controls:</strong> You can click any sheep to plan a custom move, or let them roam autonomously.</li>
        </ul>

        <h4>💖 Single Sheep Reproduction</h4>
        <p>A single well-fed sheep can reproduce on its own!</p>
        <ul>
          <li>Any sheep with at least <strong>⚡ 2 Energy</strong> reproduces independently (no mating pair needed).</li>
          <li>The newborn lamb springs directly into an <strong>unoccupied adjacent grid cell</strong> to disperse across the meadow.</li>
          <li>The parent sheep expends 1 energy and rests for a short cooldown before reproducing again.</li>
        </ul>
      `;
    } else if (this.activeRulesTab === 'wolves') {
      body.innerHTML = `
        <h4>🐺 Wolf Hunting &amp; Starvation</h4>
        <ul>
          <li>Wolves move 1 cell per week toward the nearest reachable sheep using BFS pathfinding.</li>
          <li>If on the same coordinate as a sheep, the wolf consumes it!</li>
        </ul>

        <div class="rules-highlight-box">
          ⚠️ <strong>Critical Starvation Rule:</strong>
          <br/>
          If a wolf does not eat a sheep within <strong>3 moves/weeks</strong>, it dies!
          <br/><br/>
          • Whenever a wolf eats a sheep: <code>Hunger counter → 0</code><br/>
          • Whenever a wolf moves without eating: <code>Hunger counter + 1</code><br/>
          • If <code>Hunger counter reaches 3</code>: <strong>The wolf dies of starvation!</strong>
        </div>

        <p><strong>Tactical Strategy:</strong> You must sacrifice or guide an excess sheep into the wolf's path every 2–3 weeks to keep it fed, while breeding enough sheep to maintain the herd!</p>
      `;
    } else if (this.activeRulesTab === 'grass') {
      body.innerHTML = `
        <h4>🌱 Unlimited Grass &amp; Pastures</h4>
        <ul>
          <li><strong>Permanent Grass:</strong> Grass never gets lost or consumed! There is unlimited grass in the region.</li>
          <li>When sheep graze a grass tile, it permanently remains in place so sheep can graze whenever they need.</li>
          <li>Stepping on or standing on a grass tile instantly restores sheep energy to maximum (⚡ 5) so they can reproduce and stay healthy!</li>
        </ul>
      `;
    }

    wrap.appendChild(body);
    return wrap;
  }

  renderLevelSelectModalContent() {
    const wrap = document.createElement('div');

    const header = document.createElement('div');
    header.className = 'modal-header';
    header.innerHTML = `
      <h2 class="modal-title">🗺️ Select Level</h2>
      <button class="modal-close-btn" id="closeModalBtn">&times;</button>
    `;
    header.querySelector('#closeModalBtn').onclick = () => this.closeModal();
    wrap.appendChild(header);

    // Grand Championship Banner if any scores exist
    const l4 = this.saveData.levelScores?.[4] || 0;
    const l5 = this.saveData.levelScores?.[5] || 0;
    const l6 = this.saveData.levelScores?.[6] || 0;
    const grandTotal = l4 + l5 + l6;

    if (grandTotal > 0 || this.saveData.completedLevels.includes(4)) {
      const banner = document.createElement('div');
      banner.className = 'grand-score-banner';
      banner.innerHTML = `
        <div class="grand-score-banner-title">🏆 Levels 4–6 Master Championship Score</div>
        <div class="grand-score-banner-total">${grandTotal} <span style="font-size: 0.9rem; font-weight: normal; color: var(--color-text-muted);">Total Surviving Sheep</span></div>
        <div style="font-size: 0.8rem; margin-top: 4px; color: var(--color-primary-light);">
          Level 4: <strong>${l4 || '-'}</strong> 🐑 &nbsp;|&nbsp; 
          Level 5: <strong>${l5 || '-'}</strong> 🐑 &nbsp;|&nbsp; 
          Level 6: <strong>${l6 || '-'}</strong> 🐑
        </div>
      `;
      wrap.appendChild(banner);
    }

    const grid = document.createElement('div');
    grid.className = 'level-select-grid';

    LEVELS.forEach(lvl => {
      const isUnlocked = this.saveData.unlockedLevels.includes(lvl.level);
      const isCompleted = this.saveData.completedLevels.includes(lvl.level);
      const isActive = lvl.level === LEVELS[this.currentLevelIndex].level;
      const score = this.saveData.levelScores?.[lvl.level];

      const btn = document.createElement('div');
      btn.className = `level-card-btn ${!isUnlocked ? 'locked' : ''} ${isActive ? 'active' : ''}`;

      btn.innerHTML = `
        <div class="level-card-header">
          <span>Level ${lvl.level}: ${lvl.title}</span>
          <span class="level-status-icon">${isCompleted ? '✓' : isUnlocked ? '🔓' : '🔒'}</span>
        </div>
        <div class="level-card-meta">Grid: ${lvl.gridSize}×${lvl.gridSize} | Sheep: ${lvl.inventory.sheep} | Wolves: ${lvl.inventory.wolves}</div>
        <div class="level-card-target">🎯 Target: Survive ${lvl.targetWeeks} weeks</div>
        ${lvl.isScoredLevel && score !== undefined ? `<div class="level-card-score">⭐ Surviving Sheep Score: <strong>${score}</strong> 🐑</div>` : ''}
        ${lvl.isScoredLevel && score === undefined ? `<div class="level-card-score" style="color: var(--color-text-muted);">⭐ Scored Level (Survive for Sheep Score)</div>` : ''}
      `;

      if (isUnlocked) {
        btn.onclick = () => this.handleSelectLevel(lvl.level);
      }

      grid.appendChild(btn);
    });

    wrap.appendChild(grid);

    // Settings & Reset Progress in Level Select
    const footer = document.createElement('div');
    footer.style.marginTop = '20px';
    footer.style.paddingTop = '14px';
    footer.style.borderTop = '1px solid var(--border-glass)';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'space-between';
    footer.style.alignItems = 'center';

    const resetBtn = document.createElement('button');
    resetBtn.className = 'btn btn-danger';
    resetBtn.innerHTML = `⚠️ Reset All Progress`;
    resetBtn.onclick = () => {
      this.openModal('resetAllConfirm');
    };

    footer.appendChild(resetBtn);
    wrap.appendChild(footer);

    return wrap;
  }

  renderResetAllConfirmContent() {
    const wrap = document.createElement('div');
    wrap.className = 'result-modal';

    wrap.innerHTML = `
      <div class="result-icon">⚠️</div>
      <h2 class="result-title" style="color: var(--color-danger);">Reset All Progress?</h2>
      <p class="result-subtitle">
        Are you sure you want to reset all completed levels, scores, and unlock progress back to Level 1?
      </p>
      
      <div class="modal-actions">
        <button id="cancelResetAllBtn" class="btn">Cancel</button>
        <button id="confirmResetAllBtn" class="btn btn-danger">Yes, Reset All Progress</button>
      </div>
    `;

    wrap.querySelector('#cancelResetAllBtn').onclick = () => {
      this.openModal('levelSelect');
    };
    wrap.querySelector('#confirmResetAllBtn').onclick = () => {
      this.handleResetAllProgress();
    };
    return wrap;
  }

  renderRestartConfirmContent() {
    const wrap = document.createElement('div');
    wrap.className = 'result-modal';

    wrap.innerHTML = `
      <div class="result-icon">🔄</div>
      <h2 class="result-title">Reset Level?</h2>
      <p class="result-subtitle">Start over from the empty grid on Level ${LEVELS[this.currentLevelIndex].level}?</p>
      
      <div class="modal-actions">
        <button id="cancelRestartBtn" class="btn">Cancel</button>
        <button id="confirmRestartBtn" class="btn btn-primary">Reset Grid</button>
      </div>
    `;

    wrap.querySelector('#cancelRestartBtn').onclick = () => this.closeModal();
    wrap.querySelector('#confirmRestartBtn').onclick = () => this.handleRestartLevel();
    return wrap;
  }

  renderGameOverModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const card = document.createElement('div');
    card.className = 'modal-content result-modal';

    const isSheepExtinct = this.engine.sheep.length === 0;

    card.innerHTML = `
      <div class="result-icon">${isSheepExtinct ? '🐑' : '🐺'}</div>
      <h2 class="result-title" style="color: var(--color-danger);">${isSheepExtinct ? 'SHEEP EXTINCT' : 'WOLVES EXTINCT'}</h2>
      <p class="result-subtitle">${this.escapeHtml(this.engine.lossReason)}</p>

      <div class="result-stats-card">
        <div class="result-stat-item">
          <span class="result-stat-num">${this.engine.week - 1} / ${this.engine.targetWeeks}</span>
          <span class="result-stat-label">Weeks Survived</span>
        </div>
        <div class="result-stat-item">
          <span class="result-stat-num">${this.engine.sheep.length}</span>
          <span class="result-stat-label">Sheep</span>
        </div>
        <div class="result-stat-item">
          <span class="result-stat-num">${this.engine.wolves.length}</span>
          <span class="result-stat-label">Wolves</span>
        </div>
      </div>

      <div class="modal-actions">
        <button id="retryBtn" class="btn btn-action-cta">Retry Level</button>
        <button id="editPlacementBtn" class="btn">Edit Placement</button>
        <button id="selectLvlBtn" class="btn">Level Selection</button>
      </div>
    `;

    card.querySelector('#retryBtn').onclick = () => this.handleRestartLevel();
    card.querySelector('#editPlacementBtn').onclick = () => {
      this.closeModal();
      this.handleReturnToSetup();
    };
    card.querySelector('#selectLvlBtn').onclick = () => this.openModal('levelSelect');

    overlay.appendChild(card);
    return overlay;
  }

  renderWinModal() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const card = document.createElement('div');
    card.className = 'modal-content result-modal';

    const currentLvl = LEVELS[this.currentLevelIndex].level;
    const isFinalLevel = currentLvl === 6;
    const sheepLeft = this.engine.sheep.length;

    // Ensure score recorded
    if (currentLvl >= 4 && currentLvl <= 6) {
      if (!this.saveData.levelScores) this.saveData.levelScores = {};
      this.saveData.levelScores[currentLvl] = Math.max(this.saveData.levelScores[currentLvl] || 0, sheepLeft);
      saveGameData(this.saveData);
    }

    const l4Score = this.saveData.levelScores?.[4] || (currentLvl === 4 ? sheepLeft : 0);
    const l5Score = this.saveData.levelScores?.[5] || (currentLvl === 5 ? sheepLeft : 0);
    const l6Score = this.saveData.levelScores?.[6] || (currentLvl === 6 ? sheepLeft : 0);
    const grandTotalScore = l4Score + l5Score + l6Score;

    if (isFinalLevel) {
      const randomQuote = BIRTHDAY_QUOTES[Math.floor(Math.random() * BIRTHDAY_QUOTES.length)];

      card.className = 'modal-content result-modal birthday-modal-content';
      card.innerHTML = `
        <div class="birthday-confetti-icons">🎈 🎂 🎁 💖 🎉</div>
        <div class="birthday-badge">🎂 SPECIAL BIRTHDAY CELEBRATION 🎂</div>
        
        <h2 class="birthday-title">
          Happy Birthday, <span class="birthday-user-name">${this.escapeHtml(this.saveData.playerName)}</span>!
        </h2>
        
        <p class="birthday-subtitle">
          🌟 You balanced the entire ecosystem and conquered all 6 levels! 🌟
        </p>

        <!-- LOVING BIRTHDAY QUOTE CARD -->
        <div class="birthday-quote-card">
          <div class="quote-sparkles">✨ 💖 ✨</div>
          <div class="birthday-quote-text" id="birthdayQuoteText">${randomQuote}</div>
          <div class="quote-card-footer">
            <span>Wishing you endless happiness &amp; radiant joy today and always!</span>
            <button id="refreshQuoteBtn" class="btn-refresh-quote" type="button">🔀 Another Wish</button>
          </div>
        </div>

        <!-- GRAND CHAMPIONSHIP SCORE CARD FOR LAST 3 LEVELS (4, 5 & 6) -->
        <div class="grand-score-card">
          <div class="grand-score-badge">🌟 GRAND CHAMPIONSHIP SCORE (LEVELS 4–6) 🌟</div>
          <div class="grand-score-total-num">${grandTotalScore}</div>
          <div class="grand-score-total-label">Total Surviving Sheep across Levels 4, 5 &amp; 6</div>
          <div class="grand-score-breakdown-row">
            <div class="score-sub-box">
              <span class="sub-box-title">Level 4</span>
              <span class="sub-box-val">${l4Score} 🐑</span>
            </div>
            <div class="score-sub-plus">+</div>
            <div class="score-sub-box">
              <span class="sub-box-title">Level 5</span>
              <span class="sub-box-val">${l5Score} 🐑</span>
            </div>
            <div class="score-sub-plus">+</div>
            <div class="score-sub-box highlight">
              <span class="sub-box-title">Level 6</span>
              <span class="sub-box-val">${l6Score} 🐑</span>
            </div>
          </div>
        </div>

        <div class="result-stats-card">
          <div class="result-stat-item">
            <span class="result-stat-num">6 / 6</span>
            <span class="result-stat-label">Levels Cleared</span>
          </div>
          <div class="result-stat-item">
            <span class="result-stat-num">${this.engine.sheep.length}</span>
            <span class="result-stat-label">L6 Sheep Left</span>
          </div>
          <div class="result-stat-item">
            <span class="result-stat-num">${this.engine.wolves.length}</span>
            <span class="result-stat-label">L6 Wolves Alive</span>
          </div>
        </div>

        <div class="modal-actions" style="margin-top: 16px;">
          <button id="playAgainBtn" class="btn btn-action-cta">Play Again (Level 1)</button>
          <button id="levelSelectWinBtn" class="btn">Level Selection</button>
        </div>
      `;

      const quoteEl = card.querySelector('#birthdayQuoteText');
      const refreshBtn = card.querySelector('#refreshQuoteBtn');
      if (refreshBtn && quoteEl) {
        refreshBtn.onclick = () => {
          let nextQuote = BIRTHDAY_QUOTES[Math.floor(Math.random() * BIRTHDAY_QUOTES.length)];
          while (nextQuote === quoteEl.textContent && BIRTHDAY_QUOTES.length > 1) {
            nextQuote = BIRTHDAY_QUOTES[Math.floor(Math.random() * BIRTHDAY_QUOTES.length)];
          }
          quoteEl.textContent = nextQuote;
          soundManager.playTone(600, 'sine', 0.1, 0.2, 0.01);
        };
      }

      card.querySelector('#playAgainBtn').onclick = () => this.handleSelectLevel(1);
      card.querySelector('#levelSelectWinBtn').onclick = () => this.openModal('levelSelect');
    } else {
      card.innerHTML = `
        <div class="result-icon">🎉</div>
        <h2 class="result-title">LEVEL ${currentLvl} COMPLETE!</h2>
        <p class="result-subtitle">
          Excellent work, <strong>${this.escapeHtml(this.saveData.playerName)}</strong>!
          <br/>You maintained the ecosystem for all ${this.engine.targetWeeks} weeks.
        </p>

        ${currentLvl === 4 || currentLvl === 5 ? `
          <div class="level-score-feature-card">
            <div class="feature-score-header">
              <span class="score-trophy-icon">🏆</span>
              <span>Level ${currentLvl} Surviving Sheep Score</span>
            </div>
            <div class="feature-score-num">${sheepLeft} <span style="font-size: 1.2rem;">🐑 Sheep Left</span></div>
            <div class="feature-score-note">
              ${currentLvl === 4 
                ? '🌟 Master Trial started! Complete Levels 5 and 6 to get your combined Grand Championship Score!' 
                : `📊 Levels 4 + 5 Total so far: <strong>${l4Score + l5Score} Sheep</strong> (Finish Level 6 for Grand Total!)`
              }
            </div>
          </div>
        ` : ''}

        <div class="result-stats-card">
          <div class="result-stat-item">
            <span class="result-stat-num">${this.engine.sheep.length}</span>
            <span class="result-stat-label">Sheep Survived</span>
          </div>
          <div class="result-stat-item">
            <span class="result-stat-num">${this.engine.wolves.length}</span>
            <span class="result-stat-label">Wolves Survived</span>
          </div>
          <div class="result-stat-item">
            <span class="result-stat-num">${this.engine.targetWeeks}</span>
            <span class="result-stat-label">Target Met</span>
          </div>
        </div>

        <p style="color: var(--color-accent); font-weight: 700; margin-bottom: 20px;">
          ⭐ Level ${currentLvl + 1} Unlocked!
        </p>

        <div class="modal-actions">
          <button id="nextLevelBtn" class="btn btn-action-cta">Next Level →</button>
          <button id="levelSelectWinBtn" class="btn">Level Selection</button>
        </div>
      `;
      card.querySelector('#nextLevelBtn').onclick = () => this.handleNextLevel();
      card.querySelector('#levelSelectWinBtn').onclick = () => this.openModal('levelSelect');
    }

    overlay.appendChild(card);
    return overlay;
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  window.gameApp = new SheepAndWolfApp();
});
