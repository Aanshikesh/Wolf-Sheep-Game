// saveSystem.js - LocalStorage progress and settings management

const STORAGE_KEY = 'sheep_and_wolf_save_v1';

export function loadSaveData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return {
        playerName: data.playerName || '',
        unlockedLevels: Array.isArray(data.unlockedLevels) ? data.unlockedLevels : [1],
        completedLevels: Array.isArray(data.completedLevels) ? data.completedLevels : [],
        currentLevel: data.currentLevel || 1,
        highWeeks: data.highWeeks || {},
        levelScores: data.levelScores || {},
        soundEnabled: data.soundEnabled !== undefined ? data.soundEnabled : true,
        tacticalVision: data.tacticalVision !== undefined ? data.tacticalVision : true
      };
    }
  } catch (e) {
    console.error('Failed to load save data:', e);
  }
  return {
    playerName: '',
    unlockedLevels: [1],
    completedLevels: [],
    currentLevel: 1,
    highWeeks: {},
    levelScores: {},
    soundEnabled: true,
    tacticalVision: true
  };
}

export function saveGameData(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}

export function clearGameData() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear save data:', e);
  }
}
