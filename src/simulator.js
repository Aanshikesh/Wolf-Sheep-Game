// test-solver.js
// Automated verification and solver for Sheep & Wolf ecosystem levels

class GameSimulator {
  constructor(config) {
    this.gridSize = config.gridSize;
    this.targetWeeks = config.targetWeeks;
    this.maxSheep = config.maxSheep || (config.gridSize === 9 ? 12 : 7);
    this.grassRegrowTime = config.grassRegrowTime || 3;
    this.sheepMaxEnergy = 5;
    this.sheepBreedingMinEnergy = 2;
    this.sheepBreedingCooldown = 1;
    this.wolfStarveThreshold = 3;

    // Deep clone initial state
    this.week = 1;
    this.sheep = config.sheepPositions.map((p, idx) => ({
      id: `s_${idx + 1}`,
      r: p.r,
      c: p.c,
      energy: p.energy || 4,
      cooldown: 0,
      hasMoved: false
    }));

    this.wolves = config.wolfPositions.map((p, idx) => ({
      id: `w_${idx + 1}`,
      r: p.r,
      c: p.c,
      hunger: p.hunger || 0
    }));

    this.grass = {};
    config.grassPositions.forEach(p => {
      this.grass[`${p.r},${p.c}`] = { regrowTimer: 0 };
    });

    this.sheepIdCounter = this.sheep.length + 1;
  }

  isGrass(r, c) {
    const key = `${r},${c}`;
    return !!this.grass[key];
  }

  isInBounds(r, c) {
    return r >= 0 && r < this.gridSize && c >= 0 && c < this.gridSize;
  }

  getSheepAt(r, c) {
    return this.sheep.find(s => s.r === r && s.c === c);
  }

  getWolfAt(r, c) {
    return this.wolves.find(w => w.r === r && w.c === c);
  }

  // BFS distance and path
  findBfsPath(startR, startC, targetPredicate, blockedPredicate) {
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

  // Execute 1 week with given sheep moves
  // sheepMoves: Map of sheepId -> { r, c }
  step(sheepMoves = new Map()) {
    // 1. Process sheep movement
    for (const s of this.sheep) {
      if (sheepMoves.has(s.id)) {
        const target = sheepMoves.get(s.id);
        if (this.isInBounds(target.r, target.c)) {
          s.r = target.r;
          s.c = target.c;
        }
      }
    }

    // 2. Sheep consume grass (unlimited grass, remains permanently in place)
    for (const s of this.sheep) {
      const key = `${s.r},${s.c}`;
      if (this.grass[key]) {
        s.energy = this.sheepMaxEnergy;
      }
    }

    // 3. Process single sheep reproduction (reproduce lamb into adjacent grid cell)
    if (this.sheep.length < this.maxSheep) {
      const newLambs = [];
      const dirs = [
        { r: -1, c: 0 },
        { r: 1, c: 0 },
        { r: 0, c: -1 },
        { r: 0, c: 1 }
      ];

      for (const s of this.sheep) {
        if (this.sheep.length + newLambs.length >= this.maxSheep) break;
        if (s.energy >= this.sheepBreedingMinEnergy && s.cooldown <= 0) {
          const adjCells = [];
          for (const d of dirs) {
            const nr = s.r + d.r;
            const nc = s.c + d.c;
            if (this.isInBounds(nr, nc)) {
              // 2 sheep cannot be at the same place!
              const hasSheep = this.sheep.some(other => other.r === nr && other.c === nc) || newLambs.some(l => l.r === nr && l.c === nc);
              if (!hasSheep) {
                adjCells.push({ r: nr, c: nc });
              }
            }
          }

          // If immediate adjacent cells are all occupied by sheep, expand outward to fill available grid cells!
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

            newLambs.push({
              id: `s_${this.sheepIdCounter++}`,
              r: spawnCell.r,
              c: spawnCell.c,
              energy: 4,
              cooldown: this.sheepBreedingCooldown,
              hasMoved: false,
              isNew: true
            });
          }
        }
      }
      this.sheep.push(...newLambs);
    }

    // 4 & 5. Wolves move toward nearest sheep & hunt
    const sheepEaten = new Set();
    for (const w of this.wolves) {
      if (this.sheep.length === 0) {
        w.hunger++;
        continue;
      }

      // Find nearest sheep by BFS
      const targetPred = (r, c) => this.sheep.some(s => s.r === r && s.c === c && !sheepEaten.has(s.id));
      const blockedPred = (r, c) => this.wolves.some(otherW => otherW.id !== w.id && otherW.r === r && otherW.c === c);

      const path = this.findBfsPath(w.r, w.c, targetPred, blockedPred);

      if (path && path.length > 1) {
        // Step 1 tile
        const nextStep = path[1];
        w.r = nextStep.r;
        w.c = nextStep.c;

        // Check if wolf reached a sheep
        const targetSheep = this.sheep.find(s => s.r === w.r && s.c === w.c && !sheepEaten.has(s.id));
        if (targetSheep) {
          sheepEaten.add(targetSheep.id);
          w.hunger = 0; // Reset hunger
        } else {
          w.hunger++;
        }
      } else {
        w.hunger++;
      }
    }

    // Remove eaten sheep
    this.sheep = this.sheep.filter(s => !sheepEaten.has(s.id));

    // 6. Update hunger & energy
    for (const s of this.sheep) {
      const key = `${s.r},${s.c}`;
      if (!this.grass[key]) {
        s.energy--;
      }
      if (s.cooldown > 0) s.cooldown--;
    }

    // 7. Remove dead animals
    this.wolves = this.wolves.filter(w => w.hunger < this.wolfStarveThreshold);
    this.sheep = this.sheep.filter(s => s.energy > 0);

    // 8. Grass remains permanently (unlimited grass!)
    // 9. Increase week counter
    this.week++;

    // Check Win/Loss
    const won = this.week > this.targetWeeks && this.sheep.length > 0 && this.wolves.length > 0;
    const lost = this.sheep.length === 0 || this.wolves.length === 0;

    return { won, lost, week: this.week, sheepCount: this.sheep.length, wolfCount: this.wolves.length };
  }
}

// Strategic AI heuristic player for testing solvability
function findBestMovesForWeek(sim, jitter = 0) {
  const moves = new Map();
  const dirs = [
    { r: 0, c: 0 }, // stay
    { r: -1, c: 0 },
    { r: 1, c: 0 },
    { r: 0, c: -1 },
    { r: 0, c: 1 }
  ];

  const occupiedCells = new Set();
  const assignedDecoy = new Map(); // wolfId -> sheepId

  // Assign one decoy sheep per wolf
  // Decoy sheep stays at distance 2 when wolf hunger is 0 or 1.
  // When wolf hunger is 2, decoy sheep moves to distance 1 (so wolf can eat it this turn).
  for (const w of sim.wolves) {
    if (sim.sheep.length >= 2) {
      // Find closest sheep that isn't already assigned
      let bestSheep = null;
      let minDist = Infinity;
      for (const s of sim.sheep) {
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

  // 1. Move decoy sheep
  for (const [wId, sId] of assignedDecoy) {
    const w = sim.wolves.find(wolf => wolf.id === wId);
    const s = sim.sheep.find(sheep => sheep.id === sId);
    if (!w || !s) continue;

    const targetDist = (w.hunger >= 2 || (w.hunger >= 1 && sim.sheep.length >= 5)) ? 1 : 2;

    let bestMove = { r: s.r, c: s.c };
    let bestScore = -Infinity;

    for (const d of dirs) {
      const nr = s.r + d.r;
      const nc = s.c + d.c;
      if (!sim.isInBounds(nr, nc)) continue;
      const key = `${nr},${nc}`;
      if (occupiedCells.has(key)) continue;

      const distToWolf = Math.abs(nr - w.r) + Math.abs(nc - w.c);
      let score = -Math.abs(distToWolf - targetDist) * 50;

      // When wolf is starving (hunger >= 2), distance 1 is absolute top priority!
      if (w.hunger >= 2 && distToWolf === 1) {
        score += 1000;
      }

      // Prefer grass if available
      if (sim.isGrass(nr, nc) && s.energy <= 3) {
        score += 30;
      }

      if (jitter > 0) {
        score += (Math.random() - 0.5) * jitter;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = { r: nr, c: nc };
      }
    }

    moves.set(s.id, bestMove);
    occupiedCells.add(`${bestMove.r},${bestMove.c}`);
  }

  // 2. Move remaining sheep (breeders and grazers)
  for (const s of sim.sheep) {
    if (moves.has(s.id)) continue;

    let bestMove = { r: s.r, c: s.c };
    let bestScore = -Infinity;

    for (const d of dirs) {
      const nr = s.r + d.r;
      const nc = s.c + d.c;
      if (!sim.isInBounds(nr, nc)) continue;
      const key = `${nr},${nc}`;
      if (occupiedCells.has(key)) continue;

      let score = 0;

      // Distance to wolves (keep safe distance >= 3)
      let minWolfDist = Infinity;
      for (const w of sim.wolves) {
        const dist = Math.abs(nr - w.r) + Math.abs(nc - w.c);
        if (dist < minWolfDist) minWolfDist = dist;
      }

      if (minWolfDist <= 1) score -= 500;
      else if (minWolfDist === 2) score -= 200;
      else score += Math.min(minWolfDist, 5) * 10;

      // Single sheep reproduction incentive: seek grass to keep energy high for reproduction
      if (sim.isGrass(nr, nc)) {
        if (s.energy <= 2) score += 280;
        else if (s.energy <= 3) score += 160;
        else if (s.cooldown <= 1) score += 100;
        else score += 30;
      }

      if (jitter > 0) {
        score += (Math.random() - 0.5) * jitter;
      }

      if (score > bestScore) {
        bestScore = score;
        bestMove = { r: nr, c: nc };
      }
    }

    moves.set(s.id, bestMove);
    occupiedCells.add(`${bestMove.r},${bestMove.c}`);
  }

  return moves;
}

// Run simulation on level config
function testLevelSolvability(config, maxTries = 100) {
  let solved = false;
  let bestWeek = 0;
  let finalStatus = null;

  for (let attempt = 0; attempt < maxTries; attempt++) {
    const sim = new GameSimulator(config);
    let won = false;
    let lost = false;
    const jitter = attempt === 0 ? 0 : 25; // First try deterministic, then try jittered

    while (!won && !lost && sim.week <= config.targetWeeks + 1) {
      const moves = findBestMovesForWeek(sim, jitter);
      const res = sim.step(moves);
      won = res.won;
      lost = res.lost;
      if (res.week > bestWeek) bestWeek = res.week;
      if (won) {
        solved = true;
        finalStatus = { attempt, week: res.week, sheepCount: res.sheepCount, wolfCount: res.wolfCount };
        break;
      }
    }

    if (solved) break;
  }

  return { solved, bestWeek, targetWeeks: config.targetWeeks, finalStatus };
}

// Export for testing
export { GameSimulator, findBestMovesForWeek, testLevelSolvability };
