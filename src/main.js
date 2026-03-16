import { createStore } from './core/store.js';
import { renderApp } from './core/sceneManager.js';
import { loadGame, saveGame } from './systems/saveSystem.js';
import { startClock } from './systems/timeSystem.js';
import { addJournalEntry } from './systems/journalSystem.js';

const root = document.getElementById('app');
const store = createStore(loadGame());

// Intro + Prolog laufen bei jedem App-Start erneut ab.
store.setState((s) => {
  s.meta.phase = 'splash';
  s.meta.prologueIndex = 0;
});

// Erste Initialisierung von Kapitel 1 (einmalig bei neuem Save).
if (!store.getState().meta.started) {
  addJournalEntry(store, 'Neuanfang im Winter', 'Die Erbschaft ist Last und Chance zugleich. Kapitel 1 beginnt im Haus meines Vaters.', 'Kapitel');
}

store.subscribe((state) => {
  saveGame(state);
  renderApp(root, store);
});

renderApp(root, store);
startClock(store);
