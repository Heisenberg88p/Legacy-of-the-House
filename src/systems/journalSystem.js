export function addJournalEntry(store, title, text, tag = 'Notiz') {
  store.setState((s) => {
    s.journal.unshift({ id: crypto.randomUUID(), month: s.clock.month, title, text, tag, createdAt: Date.now() });
  });
}
