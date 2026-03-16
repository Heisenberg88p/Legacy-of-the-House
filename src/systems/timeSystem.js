import { MONTH_NAMES } from '../data/storyData.js';
import { processMonthlyEconomy, processRenovationTicks, processTenantEvents } from './worldSystem.js';

// Ruhiger Zeitmotor: kein Sekundentakt-Re-Render, nur Monatsereignisse.
export function startClock(store, onMonthEnd) {
  const MONTH_MS = 75000;
  let lastTick = Date.now();
  let carry = 0;

  return setInterval(() => {
    const now = Date.now();
    carry += now - lastTick;
    lastTick = now;

    if (carry < MONTH_MS) return;
    const monthsToAdvance = Math.floor(carry / MONTH_MS);
    carry %= MONTH_MS;

    store.setState((s) => {
      for (let i = 0; i < monthsToAdvance; i += 1) {
        s.clock.month += 1;
        s.clock.dayLabel = MONTH_NAMES[(s.clock.month - 1) % 12];
        processMonthlyEconomy(s);
        processRenovationTicks(s);
        processTenantEvents(s);
      }
      s.clock.monthProgress = carry / MONTH_MS;
    });

    onMonthEnd?.(store.getState());
  }, 400);
}
