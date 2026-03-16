// Zentraler, serialisierbarer Spielzustand.
export const initialState = {
  meta: { started: false, prologueSeen: false, chapter: 1, phase: 'splash' },
  clock: { month: 1, dayLabel: 'Januar', monthProgress: 0 },
  finance: {
    cash: 30000,
    debt: 150000,
    monthlyRent: 640,
    futureGroundRent: 0,
    monthlyCosts: 1180,
    cashflow: -540,
    netWorth: -120000,
    reputation: 50,
  },
  tenant: {
    upstairs: { name: 'Mara Vogel', satisfaction: 56, activeRequest: null, relationshipHint: false },
    ground: { listed: false, rented: false, rent: 0, applications: 0, vacancyMonths: 0 },
  },
  rooms: {
    schlafzimmer: { label: 'Schlafzimmer', unlocked: true, cinematicSeen: false, chainIndex: 0, inWork: null, done: [] },
    wohnzimmer: { label: 'Wohnzimmer', unlocked: true, cinematicSeen: false, chainIndex: 0, inWork: null, done: [] },
    buero: { label: 'Büro', unlocked: true, cinematicSeen: false, chainIndex: 0, inWork: null, done: [] },
    kinderzimmer: { label: 'Kinderzimmer', unlocked: true, cinematicSeen: false, chainIndex: 0, inWork: null, done: [] },
    garage: { label: 'Garage', unlocked: false },
    garten: { label: 'Garten', unlocked: false },
  },
  journal: [],
  flags: {
    firstCalculationDone: false,
    houseReady: false,
    listingDraftDone: false,
    bankUnlocked: false,
    bankDone: false,
    cemeteryDone: false,
    chapterEnd: false,
  },
  ui: { tab: 'haus', selectedRoom: 'schlafzimmer' },
};

export function createStore(loadState) {
  let state = loadState || structuredClone(initialState);
  const listeners = new Set();

  return {
    getState: () => state,
    setState(mutator) {
      const draft = structuredClone(state);
      mutator(draft);
      state = draft;
      listeners.forEach((l) => l(state));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}
