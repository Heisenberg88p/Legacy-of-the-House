import { MONTH_NAMES } from '../data/storyData.js';
import { processMonthlyEconomy, processRenovationTicks, processTenantEvents } from './worldSystem.js';

export function startClock(store, onMonthEnd) {
  const MONTH_MS = 75000;
  const stepMs = 1000;
  return setInterval(() => {
    store.setState((s) => {
      s.clock.monthProgress += stepMs / MONTH_MS;
      if (s.clock.monthProgress >= 1) {
        s.clock.monthProgress = 0;
        s.clock.month += 1;
        s.clock.dayLabel = MONTH_NAMES[(s.clock.month - 1) % 12];
        processMonthlyEconomy(s);
        processRenovationTicks(s);
        processTenantEvents(s);
      }
    });
    const st = store.getState();
    if (st.clock.monthProgress === 0) onMonthEnd?.(st);
  }, stepMs);
}
