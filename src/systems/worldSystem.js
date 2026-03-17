import { renovationChains } from '../data/renovationData.js';

export function runRealityCheck(store) {
  store.setState((s) => {
    s.flags.firstCalculationDone = true;
  });
}

export function startRenovation(store, roomKey) {
  const state = store.getState();
  const room = state.rooms[roomKey];
  const next = renovationChains[roomKey][room.chainIndex];
  if (!next || room.inWork || state.finance.cash < next.cost) return { ok: false };

  store.setState((s) => {
    s.finance.cash -= next.cost;
    s.rooms[roomKey].inWork = { ...next, remaining: next.duration, status: 'in Arbeit' };
  });
  return { ok: true, action: next };
}

export function processRenovationTicks(state) {
  for (const [key, room] of Object.entries(state.rooms)) {
    if (!room.inWork) continue;
    room.inWork.remaining -= 1;
    room.inWork.status = room.inWork.remaining <= 0 ? 'fertig' : room.inWork.remaining === 1 ? 'fast fertig' : 'in Arbeit';
    if (room.inWork.remaining <= 0) {
      room.done.push(room.inWork.id);
      room.chainIndex += 1;
      room.inWork = null;
    }
  }
  const groundReady = ['schlafzimmer','wohnzimmer','buero','kinderzimmer'].every((r) => state.rooms[r].chainIndex >= renovationChains[r].length);
  if (groundReady) {
    state.flags.houseReady = true;
    state.rooms.garage.unlocked = true;
    state.rooms.garten.unlocked = true;
  }
}

export function processMonthlyEconomy(state) {
  const f = state.finance;
  const t = state.tenant;
  const totalRent = f.monthlyRent + (t.ground.rented ? t.ground.rent : 0);
  const randomPressure = 140 + Math.floor(Math.random() * 210);
  const requestPenalty = t.upstairs.activeRequest ? 120 : 0;

  f.cash += totalRent;
  f.cash -= (f.monthlyCosts + randomPressure + requestPenalty);
  f.cashflow = totalRent - (f.monthlyCosts + randomPressure + requestPenalty);
  f.netWorth = Math.round(f.cash - f.debt + 45000);

  if (!state.flags.bankUnlocked && f.cash >= f.debt * 0.1) state.flags.bankUnlocked = true;
  if (t.ground.listed && !t.ground.rented) t.ground.applications += Math.random() > 0.4 ? 1 : 0;
}

export function processTenantEvents(state) {
  if (!state.tenant.upstairs.activeRequest && Math.random() > 0.62) {
    state.tenant.upstairs.activeRequest = 'Heizkörper im Flur entlüften';
  }
}

export function satisfyTenant(store) {
  store.setState((s) => {
    if (!s.tenant.upstairs.activeRequest) return;
    s.finance.cash -= 180;
    s.tenant.upstairs.satisfaction += 6;
    s.tenant.upstairs.activeRequest = null;
  });
}

export function publishListing(store, payload) {
  store.setState((s) => {
    s.flags.listingDraftDone = true;
    s.tenant.ground.listed = true;
    s.tenant.ground.rent = Number(payload.rent) || 1080;
  });
}

export function finalizeRent(store) {
  const st = store.getState();
  if (!st.flags.houseReady || !st.tenant.ground.listed || st.tenant.ground.applications < 2) return false;
  store.setState((s) => {
    s.tenant.ground.rented = true;
  });
  return true;
}

export function runBankMeeting(store, style) {
  const repDelta = style === 'ruhig' ? 8 : style === 'dominant' ? -4 : 3;
  store.setState((s) => {
    s.flags.bankDone = true;
    s.finance.monthlyCosts -= 220;
    s.finance.reputation += repDelta;
  });
}

export function finishChapter(store) {
  store.setState((s) => {
    s.flags.cemeteryDone = true;
    s.tenant.upstairs.relationshipHint = true;
    s.flags.chapterEnd = true;
  });
}
