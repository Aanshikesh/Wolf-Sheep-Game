// gameEngine.js - Core state and simulation engine with Placement Phase, Multi-Entity Stacking & Phased Animations

import { soundManager } from './sound.js';

export class GameEngine {
  constructor(levelConfig) {
    this.config = levelConfig;
    this.reset(true); // start in setup/placement phase with empty grid
  }

  reset(startInSetup = true) {
    this.gridSize = this.config.gridSize;
    this.targetWeeks = this.config.targetWeeks;
    this.maxSheep = this.config.maxSheep || (this.gridSize === 9 ? 12 : 8);
    this.grassRegrowTime = this.config.grassRegrowTime || 3;
    this.sheepMaxEnergy = 5;
    this.sheepBreedingMinEnergy = 2;
    this.sheepBreedingCooldown = 1;
    this.wolfStarveThreshold = 3;

    this.isSetupPhase = startInSetup;
    this.week = 1;
    this.gameOver = false;
    this.gameWon = false;
    this.lossReason = '';
    this.history = [];

    // Animation state
    this.isAnimating = false;
    this.currentPhase = 'idle'; // 'idle' | 'sheep_move' | 'eat' | 'breed' | 'wolf_move' | 'hunt' | 'resolve'
    this.lastGrazedPositions = []; // [{ r, c }]
    this.lastBreedingEvents = [];  // [{ parent1, parent2, lamb }]
    this.lastHuntedEvents = [];    // [{ wolfId, r, c }]
    this.lastDeaths = [];          // [{ type: 'wolf'|'sheep', r, c }]

    // Inventory of items to place
    this.inventory = {
      sheep: this.config.inventory ? this.config.inventory.sheep : this.config.sheepPositions.length,
      wolves: this.config.inventory ? this.config.inventory.wolves : this.config.wolfPositions.length,
      grass: this.config.inventory ? this.config.inventory.grass : this.config.grassPositions.length
    };

    // Grid starts empty in setup phase!
    this.sheep = [];
    this.wolves = [];
    this.grass = {};

    this.sheepIdCounter = 1;
    this.wolfIdCounter = 1;
    this.selectedSheepId = null;
    this.activeBrush = 'sheep'; // 'sheep' | 'wolf' | 'grass' | 'eraser'

    this.eventLogs = [
      { type: 'info', text: `Level ${this.config.level}: ${this.config.title}. Place your ecosystem on the grid, or load the verified preset!` }
    ];
  }

  // --- PLACEMENT PHASE METHODS ---

  loadPreset() {
    const preset = this.config.preset || {
      sheepPositions: this.config.sheepPositions,
      wolfPositions: this.config.wolfPositions,
      grassPositions: this.config.grassPositions
    };

    this.sheep = preset.sheepPositions.map((p, idx) => ({
      id: `s_${idx + 1}`,
      r: p.r,
      c: p.c,
      energy: p.energy || 4,
      cooldown: 0,
      plannedMove: null
    }));

    this.wolves = preset.wolfPositions.map((p, idx) => ({
      id: `w_${idx + 1}`,
      name: `Wolf ${idx + 1}`,
      r: p.r,
      c: p.c,
      hunger: p.hunger || 0
    }));

    this.grass = {};
    preset.grassPositions.forEach(p => {
      this.grass[`${p.r},${p.c}`] = { regrowTimer: 0 };
    });

    this.sheepIdCounter = this.sheep.length + 1;
    this.wolfIdCounter = this.wolves.length + 1;

    // Placed everything from inventory
    this.inventory.sheep = 0;
    this.inventory.wolves = 0;
    this.inventory.grass = 0;

    soundManager.playTone(480, 'triangle', 0.15, 0.3, 0.01);
  }

  clearBoard() {
    this.sheep = [];
    this.wolves = [];
    this.grass = {};
    this.inventory = {
      sheep: this.config.inventory ? this.config.inventory.sheep : this.config.sheepPositions.length,
      wolves: this.config.inventory ? this.config.inventory.wolves : this.config.wolfPositions.length,
      grass: this.config.inventory ? this.config.inventory.grass : this.config.grassPositions.length
    };
    this.sheepIdCounter = 1;
    this.wolfIdCounter = 1;
    soundManager.playTone(280, 'sine', 0.15, 0.2, 0.01);
  }

  // User click on tile during setup phase
  handleTileClickSetup(r, c) {
    if (!this.isInBounds(r, c)) return;
    const key = `${r},${c}`;

    if (this.activeBrush === 'grass') {
      if (this.grass[key]) {
        // Remove grass
        delete this.grass[key];
        this.inventory.grass++;
        soundManager.playTone(300, 'sine', 0.08, 0.2, 0.01);
      } else if (this.inventory.grass > 0) {
        // Place grass (can co-exist with sheep and wolf!)
        this.grass[key] = { regrowTimer: 0 };
        this.inventory.grass--;
        soundManager.playMunch();
      }
    } else if (this.activeBrush === 'sheep') {
      // 2 sheep cannot be at the same place!
      const existingSheepIdx = this.sheep.findIndex(s => s.r === r && s.c === c);
      if (existingSheepIdx !== -1) {
        // Already a sheep here -> remove it back to inventory
        this.sheep.splice(existingSheepIdx, 1);
        this.inventory.sheep++;
        soundManager.playTone(280, 'sine', 0.08, 0.2, 0.01);
      } else if (this.inventory.sheep > 0) {
        // Place single sheep (can co-exist with grass and wolf, but not another sheep!)
        this.sheep.push({
          id: `s_${this.sheepIdCounter++}`,
          r,
          c,
          energy: 4,
          cooldown: 0,
          plannedMove: null
        });
        this.inventory.sheep--;
        soundManager.playSheepBleat();
      }
    } else if (this.activeBrush === 'wolf') {
      const existingWolfIdx = this.wolves.findIndex(w => w.r === r && w.c === c);
      if (this.inventory.wolves > 0) {
        // Place wolf (can co-exist with grass and sheep!)
        this.wolves.push({
          id: `w_${this.wolfIdCounter}`,
          name: `Wolf ${this.wolfIdCounter++}`,
          r,
          c,
          hunger: 0
        });
        this.inventory.wolves--;
        soundManager.playWolfSound();
      } else if (existingWolfIdx !== -1) {
        // Remove wolf
        this.wolves.splice(existingWolfIdx, 1);
        this.inventory.wolves++;
        soundManager.playTone(240, 'sine', 0.08, 0.2, 0.01);
      }
    } else if (this.activeBrush === 'eraser') {
      // Remove any entity on this tile
      let removed = false;
      const sheepOnTile = this.sheep.filter(s => s.r === r && s.c === c);
      if (sheepOnTile.length > 0) {
        this.sheep = this.sheep.filter(s => !(s.r === r && s.c === c));
        this.inventory.sheep += sheepOnTile.length;
        removed = true;
      }
      const wolvesOnTile = this.wolves.filter(w => w.r === r && w.c === c);
      if (wolvesOnTile.length > 0) {
        this.wolves = this.wolves.filter(w => !(w.r === r && w.c === c));
        this.inventory.wolves += wolvesOnTile.length;
        removed = true;
      }
      if (this.grass[key]) {
        delete this.grass[key];
        this.inventory.grass++;
        removed = true;
      }
      if (removed) {
        soundManager.playTone(220, 'sine', 0.1, 0.2, 0.01);
      }
    }
  }

  canStartSimulation() {
    // Requires at least 1 sheep, all required wolves, and some grass
    return this.sheep.length >= 1 && this.wolves.length >= 1;
  }

  startSimulation() {
    if (!this.canStartSimulation()) return false;
    this.isSetupPhase = false;
    this.week = 1;
    this.gameOver = false;
    this.gameWon = false;
    this.history = [];
    this.eventLogs.unshift({
      type: 'info',
      text: `🚀 Ecosystem Simulation started! Week 1 / ${this.targetWeeks}.`
    });
    soundManager.playTone(520, 'triangle', 0.2, 0.35, 0.01);
    return true;
  }

  // --- GAMEPLAY METHODS & MULTI-ENTITY QUERIES ---

  isInBounds(r, c) {
    return r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize;
  }

  isGrass(r, c) {
    const key = `${r},${c}`;
    return !!this.grass[key];
  }

  // Return ALL sheep on tile (multi-entity coordinate support!)
  getAllSheepAt(r, c) {
    return this.sheep.filter(s => {
      const pos = s.plannedMove || { r: s.r, c: s.c };
      return pos.r === r && pos.c === c;
    });
  }

  // Return ALL wolves on tile
  getAllWolvesAt(r, c) {
    return this.wolves.filter(w => w.r === r && w.c === c);
  }

  // Get valid moves for a sheep: can move to ANY in-bounds adjacent tile (including grass, sheep, or wolf!)
  getValidMovesForSheep(sheepId) {
    const s = this.sheep.find(sheep => sheep.id === sheepId);
    if (!s) return [];

    const dirs = [
      { r: 0, c: 0, label: 'Stay' },
      { r: -1, c: 0, label: 'Up' },
      { r: 1, c: 0, label: 'Down' },
      { r: 0, c: -1, label: 'Left' },
      { r: 0, c: 1, label: 'Right' }
    ];

    const valid = [];
    for (const d of dirs) {
      const nr = s.r + d.r;
      const nc = s.c + d.c;
      if (this.isInBounds(nr, nc)) {
        // 2 sheep cannot be at the same place!
        const hasOtherSheep = this.sheep.some(other => {
          if (other.id === s.id) return false;
          const pos = other.plannedMove || { r: other.r, c: other.c };
          return pos.r === nr && pos.c === nc;
        });

        if (!hasOtherSheep) {
          valid.push({ r: nr, c: nc, isStay: d.r === 0 && d.c === 0 });
        }
      }
    }
    return valid;
  }

  planSheepMove(sheepId, targetR, targetC) {
    const s = this.sheep.find(sheep => sheep.id === sheepId);
    if (!s) return false;

    const valid = this.getValidMovesForSheep(sheepId);
    const isValid = valid.some(v => v.r === targetR && v.c === targetC);
    if (isValid) {
      s.plannedMove = { r: targetR, c: targetC };
      soundManager.playTone(400, 'sine', 0.1, 0.2, 0.01);
      return true;
    }
    return false;
  }

  clearPlannedMoves() {
    this.sheep.forEach(s => {
      s.plannedMove = null;
    });
  }

  // BFS Pathfinding for Wolves
  findBfsPath(startR, startC, targetPredicate, blockedPredicate = () => false) {
    const queue = [[{ r: startR, c: startC }]];
    const visited = new Set([`${startR},${startC}`]);

    const dirs = [
      { r: -1, c: 0 },
      { r: 1, c: 0 },
      { r: 0, c: -1 },
      { r: 0, c: 1 }
    ];

    while (queue.length > 0) {
      const path = queue.shift();
      const curr = path[path.length - 1];

      if (targetPredicate(curr.r, curr.c)) {
        return path;
      }

      for (const d of dirs) {
        const nr = curr.r + d.r;
        const nc = curr.c + d.c;
        const key = `${nr},${nc}`;

        if (this.isInBounds(nr, nc) && !visited.has(key)) {
          visited.add(key);
          if (!blockedPredicate(nr, nc)) {
            queue.push([...path, { r: nr, c: nc }]);
          }
        }
      }
    }
    return null;
  }

  // Wolf threat range for overlay
  getWolfThreatCells() {
    const threats = new Map();
    const dirs = [{ r: 0, c: 0 }, { r: -1, c: 0 }, { r: 1, c: 0 }, { r: 0, c: -1 }, { r: 0, c: 1 }];

    for (const w of this.wolves) {
      for (const d of dirs) {
        const nr = w.r + d.r;
        const nc = w.c + d.c;
        if (this.isInBounds(nr, nc)) {
          const key = `${nr},${nc}`;
          threats.set(key, { wolfId: w.id, hunger: w.hunger });
        }
      }
    }
    return threats;
  }

  // Snapshot for undo
  saveSnapshot() {
    return JSON.stringify({
      week: this.week,
      sheep: this.sheep,
      wolves: this.wolves,
      grass: this.grass,
      sheepIdCounter: this.sheepIdCounter,
      eventLogs: this.eventLogs
    });
  }

  loadSnapshot(json) {
    const data = JSON.parse(json);
    this.week = data.week;
    this.sheep = data.sheep;
    this.wolves = data.wolves;
    this.grass = data.grass;
    this.sheepIdCounter = data.sheepIdCounter;
    this.eventLogs = data.eventLogs;
    this.selectedSheepId = null;
    this.gameOver = false;
    this.gameWon = false;
    this.currentPhase = 'idle';
  }

  undoWeek() {
    if (this.history.length === 0) return false;
    const prev = this.history.pop();
    this.loadSnapshot(prev);
    soundManager.playTone(300, 'sine', 0.15, 0.2, 0.01);
    return true;
  }

  // --- PHASED TURN EXECUTION FOR FULL ANIMATION ---

  // Phase 1: Sheep Move (Both Player-Planned and Autonomous Dispersal)
  executeSheepMovePhase() {
    this.currentPhase = 'sheep_move';
    this.lastMovedSheep = [];

    // STRICT: Track destinations claimed this turn so 2 sheep are NEVER on the same cell
    const claimedDestinations = new Set();

    // 1. Honor manual player-planned moves first
    for (const s of this.sheep) {
      if (s.plannedMove) {
        const destKey = `${s.plannedMove.r},${s.plannedMove.c}`;
        if (this.isInBounds(s.plannedMove.r, s.plannedMove.c) && !claimedDestinations.has(destKey)) {
          s.r = s.plannedMove.r;
          s.c = s.plannedMove.c;
          claimedDestinations.add(destKey);
          this.lastMovedSheep.push({ id: s.id, to: { r: s.r, c: s.c } });
        }
        s.plannedMove = null;
      }
    }

    // 2. Identify decoy sheep if any wolf is in danger of starving (hunger >= 2)
    const assignedDecoy = new Map(); // wolfId -> sheepId
    for (const w of this.wolves) {
      if (this.sheep.length >= 2) {
        let bestSheep = null;
        let minDist = Infinity;
        for (const s of this.sheep) {
          if (claimedDestinations.has(`${s.r},${s.c}`)) continue;
          if ([...assignedDecoy.values()].includes(s.id)) continue;
          const d = Math.abs(s.r - w.r) + Math.abs(s.c - w.c);
          if (d < minDist) {
            minDist = d;
            bestSheep = s;
          }
        }
        if (bestSheep) {
          assignedDecoy.set(w.id, bestSheep.id);
        }
      }
    }

    const dirs = [
      { r: -1, c: 0 },
      { r: 1, c: 0 },
      { r: 0, c: -1 },
      { r: 0, c: 1 },
      { r: 0, c: 0 } // stay is allowed only if no good adjacent move or surrounded
    ];

    const pickAutonomousMove = (s, decoyWolf = null) => {
      let bestMove = null;
      let bestScore = -Infinity;

      for (const d of dirs) {
        const nr = s.r + d.r;
        const nc = s.c + d.c;
        const key = `${nr},${nc}`;

        if (!this.isInBounds(nr, nc)) continue;
        if (claimedDestinations.has(key)) continue; // 2 sheep cannot be at same place!

        const isStay = (d.r === 0 && d.c === 0);
        let score = 0;

        if (decoyWolf) {
          const distToWolf = Math.abs(nr - decoyWolf.r) + Math.abs(nc - decoyWolf.c);
          const targetDist = (decoyWolf.hunger >= 2 || (decoyWolf.hunger >= 1 && this.sheep.length >= 5)) ? 1 : 2;
          score = -Math.abs(distToWolf - targetDist) * 50;
          if (decoyWolf.hunger >= 2 && distToWolf === 1) {
            score += 1000;
          }
          if (this.isGrass(nr, nc) && s.energy <= 3) {
            score += 40;
          }
        } else {
          // General sheep: disperse to adjacent cell, seek grass, avoid wolves
          let minWolfDist = Infinity;
          for (const w of this.wolves) {
            const dist = Math.abs(nr - w.r) + Math.abs(nc - w.c);
            if (dist < minWolfDist) minWolfDist = dist;
          }

          if (minWolfDist <= 1) score -= 600;
          else if (minWolfDist === 2) score -= 220;
          else score += Math.min(minWolfDist, 6) * 15;

          // Fresh grass gives energy to breed
          if (this.isGrass(nr, nc)) {
            if (s.energy <= 2) score += 300;
            else if (s.energy <= 3) score += 180;
            else if (s.cooldown <= 1) score += 120;
            else score += 50;
          }

          // User explicit request: "the reproduced sheep should move to adjacent cell to fill the grid not stay there only"
          // Strong preference to move to adjacent cell rather than stay!
          if (!isStay) {
            score += 45;
          } else {
            score -= 15;
          }

          // Dispersal: bonus for empty space to spread across the grid
          let neighborSheep = 0;
          for (const other of this.sheep) {
            if (other.id !== s.id) {
              const od = Math.abs(nr - other.r) + Math.abs(nc - other.c);
              if (od <= 1) neighborSheep++;
            }
          }
          score -= neighborSheep * 20;
        }

        if (score > bestScore) {
          bestScore = score;
          bestMove = { r: nr, c: nc, isStay };
        }
      }

      // Fallback if trapped
      if (!bestMove) {
        if (!claimedDestinations.has(`${s.r},${s.c}`)) {
          bestMove = { r: s.r, c: s.c, isStay: true };
        } else {
          for (const d of dirs) {
            const nr = s.r + d.r;
            const nc = s.c + d.c;
            const key = `${nr},${nc}`;
            if (this.isInBounds(nr, nc) && !claimedDestinations.has(key)) {
              bestMove = { r: nr, c: nc, isStay: false };
              break;
            }
          }
        }
      }

      return bestMove;
    };

    // 3. Move decoy sheep
    for (const [wId, sId] of assignedDecoy) {
      const s = this.sheep.find(sheep => sheep.id === sId);
      const w = this.wolves.find(wolf => wolf.id === wId);
      if (s && w && !this.lastMovedSheep.some(m => m.id === s.id)) {
        const move = pickAutonomousMove(s, w);
        if (move) {
          s.r = move.r;
          s.c = move.c;
          claimedDestinations.add(`${move.r},${move.c}`);
          this.lastMovedSheep.push({ id: s.id, to: move });
        }
      }
    }

    // 4. Move all other sheep to adjacent cells
    for (const s of this.sheep) {
      if (this.lastMovedSheep.some(m => m.id === s.id)) continue;
      const move = pickAutonomousMove(s, null);
      if (move) {
        s.r = move.r;
        s.c = move.c;
        claimedDestinations.add(`${move.r},${move.c}`);
        this.lastMovedSheep.push({ id: s.id, to: move });
      } else {
        claimedDestinations.add(`${s.r},${s.c}`);
      }
    }

    // 5. ABSOLUTE INVARIANT ENFORCEMENT: No two sheep can ever be at the same place
    const seenLocations = new Set();
    for (const s of this.sheep) {
      const locKey = `${s.r},${s.c}`;
      if (seenLocations.has(locKey)) {
        // Relocate collision to nearest free cell
        for (let rad = 1; rad < this.gridSize; rad++) {
          let relocated = false;
          for (let dr = -rad; dr <= rad; dr++) {
            for (let dc = -rad; dc <= rad; dc++) {
              if (Math.abs(dr) + Math.abs(dc) === rad) {
                const nr = s.r + dr;
                const nc = s.c + dc;
                const newLoc = `${nr},${nc}`;
                if (this.isInBounds(nr, nc) && !seenLocations.has(newLoc)) {
                  s.r = nr;
                  s.c = nc;
                  seenLocations.add(newLoc);
                  relocated = true;
                  break;
                }
              }
            }
            if (relocated) break;
          }
          if (relocated) break;
        }
      } else {
        seenLocations.add(locKey);
      }
    }
  }

  // Phase 2: Grass Grazing (Grass never gets lost - unlimited grass in region)
  executeGrazingPhase() {
    this.currentPhase = 'eat';
    this.lastGrazedPositions = [];
    let grazedCount = 0;

    for (const s of this.sheep) {
      const key = `${s.r},${s.c}`;
      if (this.grass[key]) {
        s.energy = this.sheepMaxEnergy;
        // Grass NEVER gets lost! It remains permanently in its place (unlimited grass)
        this.grass[key].regrowTimer = 0;
        this.lastGrazedPositions.push({ r: s.r, c: s.c, sheepId: s.id });
        grazedCount++;
      }
    }
    if (grazedCount > 0) {
      soundManager.playMunch();
      this.eventLogs.unshift({
        type: 'grass',
        text: `🌱 ${grazedCount} sheep grazed fresh grass! Energy restored to full ⚡5.`
      });
    }
    return grazedCount;
  }

  // Phase 3: Single Sheep Reproduction into adjacent grid cell
  executeBreedingPhase() {
    this.currentPhase = 'breed';
    this.lastBreedingEvents = [];
    const newLambs = [];
    const dirs = [
      { r: -1, c: 0 },
      { r: 1, c: 0 },
      { r: 0, c: -1 },
      { r: 0, c: 1 }
    ];

    if (this.sheep.length < this.maxSheep) {
      for (const s of this.sheep) {
        if (this.sheep.length + newLambs.length >= this.maxSheep) break;
        if (s.energy >= this.sheepBreedingMinEnergy && s.cooldown <= 0) {
          // Find all in-bounds adjacent cells that DO NOT have another sheep (2 sheep cannot be at same place)
          const adjCells = [];
          for (const d of dirs) {
            const nr = s.r + d.r;
            const nc = s.c + d.c;
            if (this.isInBounds(nr, nc)) {
              const hasSheep = this.sheep.some(other => other.r === nr && other.c === nc) || newLambs.some(l => l.r === nr && l.c === nc);
              if (!hasSheep) {
                adjCells.push({ r: nr, c: nc });
              }
            }
          }

          // If immediate adjacent cells are occupied, search outward to fill grid!
          if (adjCells.length === 0) {
            for (let dist = 2; dist <= 4; dist++) {
              for (let dr = -dist; dr <= dist; dr++) {
                for (let dc = -dist; dc <= dist; dc++) {
                  if (Math.abs(dr) + Math.abs(dc) === dist) {
                    const nr = s.r + dr;
                    const nc = s.c + dc;
                    if (this.isInBounds(nr, nc)) {
                      const hasSheep = this.sheep.some(other => other.r === nr && other.c === nc) || newLambs.some(l => l.r === nr && l.c === nc);
                      if (!hasSheep) {
                        adjCells.push({ r: nr, c: nc });
                      }
                    }
                  }
                }
              }
              if (adjCells.length > 0) break;
            }
          }

          if (adjCells.length > 0) {
            // Sort adjacent cells: prefer grass and cells without wolves
            adjCells.sort((a, b) => {
              const wolfA = this.wolves.some(w => w.r === a.r && w.c === a.c) ? 1 : 0;
              const wolfB = this.wolves.some(w => w.r === b.r && w.c === b.c) ? 1 : 0;
              if (wolfA !== wolfB) return wolfA - wolfB;
              const grassA = this.isGrass(a.r, a.c) ? 1 : 0;
              const grassB = this.isGrass(b.r, b.c) ? 1 : 0;
              return grassB - grassA;
            });

            const spawnCell = adjCells[0];

            s.cooldown = this.sheepBreedingCooldown;
            s.energy = Math.max(1, s.energy - 1);

            const lamb = {
              id: `s_${this.sheepIdCounter++}`,
              r: spawnCell.r,
              c: spawnCell.c,
              energy: 4,
              cooldown: this.sheepBreedingCooldown,
              plannedMove: null,
              isNew: true,
              parentPos: { r: s.r, c: s.c }
            };

            newLambs.push(lamb);
            this.lastBreedingEvents.push({ parent: s, lamb, spawnCell });

            this.eventLogs.unshift({
              type: 'breed',
              text: `💖 Sheep ${s.id} at (${s.r}, ${s.c}) reproduced a lamb into adjacent cell (${spawnCell.r}, ${spawnCell.c})!`
            });
          }
        }
      }
    }

    if (newLambs.length > 0) {
      soundManager.playBreeding();
      this.sheep.push(...newLambs);
    }
    return newLambs.length;
  }

  // Phase 4: Wolf Movement
  executeWolfMovePhase() {
    this.currentPhase = 'wolf_move';

    for (const w of this.wolves) {
      if (this.sheep.length === 0) continue;

      // Nearest sheep target predicate
      const targetPred = (r, c) => this.sheep.some(s => s.r === r && s.c === c);

      // Find BFS path
      const path = this.findBfsPath(w.r, w.c, targetPred);

      if (path && path.length > 1) {
        // Step 1 tile along path
        const nextStep = path[1];
        w.r = nextStep.r;
        w.c = nextStep.c;
      }
    }
    soundManager.playWolfSound();
  }

  // Phase 5: Wolf Hunting / Eating
  executeWolfHuntPhase() {
    this.currentPhase = 'hunt';
    this.lastHuntedEvents = [];
    const eatenSheepIds = new Set();

    for (const w of this.wolves) {
      // Check if wolf is on same tile as any sheep!
      const targetSheep = this.sheep.find(s => s.r === w.r && s.c === w.c && !eatenSheepIds.has(s.id));

      if (targetSheep) {
        eatenSheepIds.add(targetSheep.id);
        w.hunger = 0; // Hunger reset
        this.lastHuntedEvents.push({ wolfId: w.id, r: w.r, c: w.c, sheepId: targetSheep.id });
        this.eventLogs.unshift({
          type: 'hunt',
          text: `🐺 ${w.name} hunted a sheep at (${w.r}, ${w.c})! Hunger reset to 0/3.`
        });
      } else {
        w.hunger++;
        this.eventLogs.unshift({
          type: 'prowl',
          text: `🐺 ${w.name} prowls without food. Hunger: ${w.hunger}/3.`
        });
      }
    }

    if (eatenSheepIds.size > 0) {
      soundManager.playWolfEat();
      this.sheep = this.sheep.filter(s => !eatenSheepIds.has(s.id));
    }
    return eatenSheepIds.size;
  }

  // Phase 6: Resolution & Grass Regrowth
  executeResolvePhase() {
    this.currentPhase = 'resolve';
    this.lastDeaths = [];

    // Energy decrease for sheep not on grass
    for (const s of this.sheep) {
      const key = `${s.r},${s.c}`;
      if (!this.grass[key]) {
        s.energy--;
      }
      if (s.cooldown > 0) s.cooldown--;
      s.isNew = false;
    }

    // Wolf deaths (hunger >= 3)
    const deadWolves = this.wolves.filter(w => w.hunger >= this.wolfStarveThreshold);
    deadWolves.forEach(w => {
      this.lastDeaths.push({ type: 'wolf', id: w.id, r: w.r, c: w.c });
      this.eventLogs.unshift({
        type: 'death',
        text: `💀 ${w.name} starved to death after 3 weeks without food!`
      });
    });
    this.wolves = this.wolves.filter(w => w.hunger < this.wolfStarveThreshold);

    // Sheep deaths (energy <= 0)
    const deadSheep = this.sheep.filter(s => s.energy <= 0);
    deadSheep.forEach(s => {
      this.lastDeaths.push({ type: 'sheep', id: s.id, r: s.r, c: s.c });
    });
    if (deadSheep.length > 0) {
      this.eventLogs.unshift({
        type: 'death',
        text: `💀 ${deadSheep.length} sheep died of starvation/exhaustion!`
      });
      this.sheep = this.sheep.filter(s => s.energy > 0);
    }

    // Grass remains permanently in place (unlimited grass!)
    for (const key in this.grass) {
      this.grass[key].regrowTimer = 0;
    }

    // Advance week counter
    this.week++;
    this.selectedSheepId = null;

    // Check Win/Loss
    if (this.sheep.length === 0) {
      this.gameOver = true;
      this.lossReason = '🐑 SHEEP EXTINCT! The ecosystem has collapsed without herbivores.';
      soundManager.playGameOver();
    } else if (this.wolves.length === 0) {
      this.gameOver = true;
      this.lossReason = '🐺 WOLVES EXTINCT! The predators could not survive.';
      soundManager.playGameOver();
    } else if (this.week > this.targetWeeks) {
      this.gameWon = true;
      soundManager.playWinFanfare();
    }

    this.currentPhase = 'idle';
  }
}
