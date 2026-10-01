// verify-all-levels.js
import { LEVELS } from './src/levels.js';
import { GameSimulator, findBestMovesForWeek, testLevelSolvability } from './src/simulator.js';

console.log('====================================================');
console.log('   SHEEP & WOLF - AUTOMATED LEVEL SOLVABILITY TEST  ');
console.log('====================================================\n');

let allPassed = true;

for (const levelConfig of LEVELS) {
  process.stdout.write(`Testing Level ${levelConfig.level}: ${levelConfig.title} (Target: ${levelConfig.targetWeeks} weeks, Grid: ${levelConfig.gridSize}x${levelConfig.gridSize})... `);
  
  const result = testLevelSolvability(levelConfig, 50);

  if (result.solved) {
    console.log(`✅ SOLVABLE!`);
    console.log(`   Survived to Week ${result.finalStatus.week} / ${levelConfig.targetWeeks} (Sheep remaining: ${result.finalStatus.sheepCount}, Wolves: ${result.finalStatus.wolfCount})`);
  } else {
    console.log(`❌ FAILED! Best week reached: ${result.bestWeek} / ${levelConfig.targetWeeks}`);
    allPassed = false;
  }
}

console.log('\n====================================================');
if (allPassed) {
  console.log('🎉 ALL 6 LEVELS ARE MATHEMATICALLY VERIFIED SOLVABLE!');
} else {
  console.log('⚠️ Some levels need tuning.');
}
console.log('====================================================');
