const KEY = 'legacy-house-v0_1';

export function loadGame() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function saveGame(state) {
  localStorage.setItem(KEY, JSON.stringify(state));
}

export function resetGame() {
  localStorage.removeItem(KEY);
}
