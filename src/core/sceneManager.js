import { prologuePanels, roomCinematics, endingMonologue } from '../data/storyData.js';
import { renovationChains } from '../data/renovationData.js';
import { addJournalEntry } from '../systems/journalSystem.js';
import { runRealityCheck, startRenovation, satisfyTenant, publishListing, finalizeRent, runBankMeeting, finishChapter } from '../systems/worldSystem.js';

const cinematicTimers = {
  splashStarted: false,
  prologueStarted: false,
  pendingTimeouts: [],
};

function setCinematicViewportLock(enabled) {
  document.documentElement.classList.toggle('cinematic-lock', enabled);
  document.body.classList.toggle('cinematic-lock', enabled);
}

export function renderApp(root, store) {
  const state = store.getState();

  if (state.meta.phase === 'splash') {
    setCinematicViewportLock(true);
    renderSplash(root);
    startSplashAutoplay(store);
    return;
  }

  if (state.meta.phase === 'prologue') {
    setCinematicViewportLock(true);
    renderPrologue(root, state.meta.prologueIndex || 0);
    startPrologueAutoplay(store);
    return;
  }

  setCinematicViewportLock(false);

  if (state.meta.phase === 'chapterEnd') {
    renderChapterEnd(root, state);
    return;
  }

  root.className = 'snow game-hub';
  root.innerHTML = `
    <main class="hub-shell fade-in">
      <section class="hub-stage">
        <div class="hub-sky"></div>
        <div class="hub-atmo hub-atmo-back"></div>
        <div class="hub-house" aria-label="Haus-Hub">
          ${renderHouseZones(state)}
        </div>
        <div class="hub-atmo hub-atmo-front"></div>
        <div class="hub-statusline" aria-label="Kapitelstatus">
          <span>Cash <strong>${fmt(state.finance.cash)} €</strong></span>
          <span>Cashflow <strong>${fmt(state.finance.cashflow)} € / Monat</strong></span>
          <span>Darlehen <strong>${fmt(state.finance.debt)} €</strong></span>
          <span>Monat <strong>${state.clock.month}</strong> · ${state.clock.dayLabel}</span>
        </div>
      </section>

      <nav class="hub-nav" aria-label="Hauptbereiche">
        <button class="btn tab ${state.ui.tab === 'haus' ? 'primary' : ''}" data-tab="haus">Haus / Räume</button>
        <button class="btn tab ${state.ui.tab === 'journal' ? 'primary' : ''}" data-tab="journal">Journal</button>
        <button class="btn tab ${state.ui.tab === 'finanzen' ? 'primary' : ''}" data-tab="finanzen">Finanzen</button>
        <button class="btn tab ${state.ui.tab === 'story' ? 'primary' : ''}" data-tab="story">Ereignisse</button>
      </nav>

      <section class="hub-panel">
        ${renderTab(state)}
      </section>
    </main>
  `;

  root.querySelectorAll('[data-tab]').forEach((b) => b.onclick = () => store.setState((s) => { s.ui.tab = b.dataset.tab; }));
  wireActions(root, store, state);
}

function clearCinematicTimers() {
  cinematicTimers.pendingTimeouts.forEach((id) => clearTimeout(id));
  cinematicTimers.pendingTimeouts = [];
}

function startSplashAutoplay(store) {
  if (cinematicTimers.splashStarted) return;
  clearCinematicTimers();
  cinematicTimers.splashStarted = true;
  cinematicTimers.prologueStarted = false;

  const splashTimer = setTimeout(() => {
    store.setState((s) => {
      s.meta.phase = 'prologue';
      s.meta.prologueIndex = 0;
      s.meta.started = true;
    });
  }, 5000);
  cinematicTimers.pendingTimeouts.push(splashTimer);
}

function startPrologueAutoplay(store) {
  if (cinematicTimers.prologueStarted) return;
  clearCinematicTimers();
  cinematicTimers.prologueStarted = true;

  const panelDuration = 5000;
  const totalDuration = panelDuration * prologuePanels.length;

  for (let i = 1; i < prologuePanels.length; i += 1) {
    const t = setTimeout(() => {
      store.setState((s) => { s.meta.prologueIndex = i; });
    }, panelDuration * i);
    cinematicTimers.pendingTimeouts.push(t);
  }

  const endTimer = setTimeout(() => {
    addJournalEntry(store, 'Prolog', 'Die Nachricht vom Tod des Vaters und der Brief mit 30.000 €, Haus und 150.000 € Schulden.');
    store.setState((s) => {
      s.meta.phase = 'game';
      s.meta.prologueSeen = true;
      s.meta.prologueIndex = 0;
    });
    cinematicTimers.splashStarted = false;
    cinematicTimers.prologueStarted = false;
    clearCinematicTimers();
  }, totalDuration + 1200);

  cinematicTimers.pendingTimeouts.push(endTimer);
}

function renderSplash(root) {
  root.className = 'splash-atmo';
  root.innerHTML = `
    <section class="intro-cinematic">
      <div class="intro-grain"></div>
      <h1>SICH STUDIOS</h1>
    </section>
  `;
}

function renderPrologue(root, idx) {
  const panel = prologuePanels[idx] ?? prologuePanels[0];
  root.className = 'prologue-stage';
  root.innerHTML = `
    <section class="prologue-cinematic fade-cinematic">
      <div class="prologue-bg" style="background-image:url('${panel.image}')"></div>
      <div class="prologue-text">
        <p style="white-space:pre-line">${panel.text}</p>
      </div>
    </section>
  `;
}

function renderTab(state) {
  if (state.ui.tab === 'journal') {
    return `<div class="card list">${state.journal.length ? state.journal.map((j) => `<div class="row"><small>${j.tag} · Monat ${j.month}</small><h3>${j.title}</h3><p>${j.text}</p></div>`).join('') : '<p class="muted">Noch keine Einträge.</p>'}</div>`;
  }
  if (state.ui.tab === 'finanzen') return renderFinanceTab(state);
  if (state.ui.tab === 'story') return renderStoryTab(state);
  return renderHouseTab(state);
}

function renderHouseZones(state) {
  const r = state.rooms;
  return `
    <button class="room-zone zone-schlafzimmer ${r.schlafzimmer.unlocked ? '' : 'locked'}" data-room="schlafzimmer" ${r.schlafzimmer.unlocked ? '' : 'disabled'}>
      <strong>Schlafzimmer</strong><small>${roomHint(r.schlafzimmer)}</small>
    </button>
    <button class="room-zone zone-wohnzimmer ${r.wohnzimmer.unlocked ? '' : 'locked'}" data-room="wohnzimmer" ${r.wohnzimmer.unlocked ? '' : 'disabled'}>
      <strong>Wohnzimmer</strong><small>${roomHint(r.wohnzimmer)}</small>
    </button>
    <button class="room-zone zone-buero ${r.buero.unlocked ? '' : 'locked'}" data-room="buero" ${r.buero.unlocked ? '' : 'disabled'}>
      <strong>Büro</strong><small>${roomHint(r.buero)}</small>
    </button>
    <button class="room-zone zone-kinderzimmer ${r.kinderzimmer.unlocked ? '' : 'locked'}" data-room="kinderzimmer" ${r.kinderzimmer.unlocked ? '' : 'disabled'}>
      <strong>Kinderzimmer</strong><small>${roomHint(r.kinderzimmer)}</small>
    </button>
    <button class="room-zone zone-garage locked" data-room="garage" disabled>
      <strong>Garage</strong><small>gesperrt</small>
    </button>
    <button class="room-zone zone-garten locked" data-room="garten" disabled>
      <strong>Garten</strong><small>gesperrt</small>
    </button>
  `;
}

function renderHouseTab(state) {
  const selected = state.rooms[state.ui.selectedRoom] || state.rooms.schlafzimmer;
  return `
    <article class="card fade-in hub-card">
      <small class="muted">Haus / Räume</small>
      <h2>Das Haus als Mittelpunkt</h2>
      <p class="note">Wähle einen Bereich direkt in der Hausbühne oben. Die aktive Auswahl wird hier vertieft.</p>
      <div class="room-strip">
        <div class="room-chip">Aktiv: <strong>${selected.label}</strong></div>
        <div class="room-chip">Fortschritt: <strong>${selected.done.length}</strong> Maßnahmen</div>
        <div class="room-chip">Status: <strong>${selected.inWork ? selected.inWork.status : 'ruhig'}</strong></div>
      </div>
      ${renderRoomActions(state)}
    </article>`;
}

function renderRoomActions(state) {
  const key = state.ui.selectedRoom;
  const room = state.rooms[key];
  if (!room?.unlocked) return '<p class="muted">Dieser Bereich wird freigeschaltet, wenn die Erdgeschosswohnung fertig ist.</p>';
  const chain = renovationChains[key];
  if (!chain) return '<p class="muted">Dieser Bereich hat in v0.1 noch keine Aktionen.</p>';
  const next = chain[room.chainIndex];
  return `
    <p class="note">Fortschritt: ${room.done.length}/${chain.length} Maßnahmen</p>
    ${room.inWork ? `<p class="progress">Aktuell: ${room.inWork.label} — ${room.inWork.status}</p>` : ''}
    ${next ? `<div class="row"><strong>${next.label}</strong><p>Kosten: ${fmt(next.cost)} €</p><button class="btn" data-action="renovate" data-room="${key}">Beauftragen</button></div>` : '<p class="muted">Raum abgeschlossen.</p>'}
  `;
}

function roomHint(room) {
  if (!room.unlocked) return 'gesperrt';
  if (room.inWork) return room.inWork.status;
  return `Abgeschlossen: ${room.done?.length || 0}`;
}

function renderFinanceTab(state) {
  return `
    <div class="card list fade-in hub-card">
      <div class="row">
        <h3>Finanzlage</h3>
        <p>Cash: <strong>${fmt(state.finance.cash)} €</strong></p>
        <p>Cashflow / Monat: <strong>${fmt(state.finance.cashflow)} €</strong></p>
        <p>Restdarlehen: <strong>${fmt(state.finance.debt)} €</strong></p>
        <p>Rufwert: <strong>${state.finance.reputation}</strong></p>
      </div>
      <div class="row">
        <h3>Monatlicher Druck</h3>
        <p>Der Monatslauf bleibt ruhig, aber jede Entscheidung wirkt auf Liquidität und Fortschritt.</p>
        <p class="note">Nächster Meilenstein: 10% Liquidität für den Banktermin (${fmt(state.finance.debt * 0.1)} €).</p>
      </div>
    </div>`;
}

function renderStoryTab(state) {
  return `
    <div class="card list fade-in hub-card">
      <div class="row">
        <h3>Ereignisse / Story</h3>
        <p class="note">Anstehende Entscheidungen, Trigger und Kapitelmomente.</p>
      </div>
      <div class="row">
        <h3>Wirtschaftlicher Reality-Check</h3>
        <p>Negativer Start-Cashflow zwingt zur Renovierung + Vermietung des Erdgeschosses.</p>
        <button class="btn" data-action="calc" ${state.flags.firstCalculationDone ? 'disabled' : ''}>Berechnung durchführen</button>
      </div>
      <div class="row">
        <h3>Mieterin oben</h3>
        <p>Zufriedenheit: ${state.tenant.upstairs.satisfaction}</p>
        <p>${state.tenant.upstairs.activeRequest || 'Derzeit keine Anfrage.'}</p>
        <button class="btn" data-action="tenant" ${state.tenant.upstairs.activeRequest ? '' : 'disabled'}>Anliegen erledigen (180 €)</button>
      </div>
      <div class="row">
        <h3>Inserat Erdgeschoss</h3>
        ${state.flags.houseReady ? listingForm(state) : '<p class="muted">Freischaltung nach vollständiger Renovierung aller vier Räume.</p>'}
      </div>
      <div class="row">
        <h3>Bankgespräch</h3>
        <p>Freigabe bei 10% Liquidität: ${fmt(state.finance.debt * 0.1)} €</p>
        ${state.flags.bankUnlocked ? bankChoices(state) : '<p class="muted">Noch nicht verfügbar.</p>'}
      </div>
      <div class="row">
        <h3>Kapitelabschluss</h3>
        <p class="note">Voraussetzung: Haus vermietet + Banktermin abgeschlossen.</p>
        <button class="btn primary" data-action="cemetery" ${(state.tenant.ground.rented && state.flags.bankDone && !state.flags.chapterEnd) ? '' : 'disabled'}>Zur Beerdigung</button>
      </div>
    </div>`;
}

function listingForm(state) {
  if (!state.tenant.ground.listed) {
    return `<div class="list"><input id="obj" value="Erdgeschoss, 4 Zimmer + Garten"/><input id="rent" type="number" value="1180"/><textarea id="pics">winter-fassade.jpg, wohnzimmer_nachher.jpg</textarea><button class="btn" data-action="list">Inserieren</button></div>`;
  }
  return `<p>Inserat aktiv. Interessenten: ${state.tenant.ground.applications}</p><button class="btn" data-action="rent" ${state.tenant.ground.rented ? 'disabled' : ''}>Mietvertrag abschließen</button>${state.tenant.ground.rented ? '<p class="progress">Vermietet.</p>' : ''}`;
}

function bankChoices(state) {
  if (state.flags.bankDone) return '<p class="progress">Termin abgeschlossen. Rate wurde tragbarer.</p>';
  return `
    <p>Antwortstil wählen:</p>
    <button class="btn choice" data-action="bank" data-style="ruhig">Ruhig strategisch</button>
    <button class="btn choice" data-action="bank" data-style="dominant">Dominant verhandeln</button>
    <button class="btn choice" data-action="bank" data-style="defensiv">Defensiv vorsichtig</button>`;
}

function wireActions(root, store, state) {
  root.querySelectorAll('[data-room]').forEach((el) => el.onclick = () => enterRoom(store, el.dataset.room));
  root.querySelectorAll('[data-action="calc"]').forEach((el) => el.onclick = () => {
    runRealityCheck(store);
    addJournalEntry(store, 'Realitätsmoment', 'Meine Berechnung zeigt: Ohne Vermietung des Erdgeschosses rutsche ich innerhalb weniger Monate in den Abgrund.');
  });
  root.querySelectorAll('[data-action="renovate"]').forEach((el) => el.onclick = () => {
    const result = startRenovation(store, el.dataset.room);
    if (result.ok) addJournalEntry(store, 'Maßnahme beauftragt', `${state.rooms[el.dataset.room].label}: ${result.action.label}.`, 'Renovierung');
  });
  root.querySelectorAll('[data-action="tenant"]').forEach((el) => el.onclick = () => {
    satisfyTenant(store);
    addJournalEntry(store, 'Mieteranliegen gelöst', 'Kleine Reparatur erledigt, das Verhältnis bleibt ruhig.', 'Mieter');
  });
  root.querySelectorAll('[data-action="list"]').forEach((el) => el.onclick = () => {
    publishListing(store, {
      obj: root.querySelector('#obj').value,
      rent: root.querySelector('#rent').value,
      pics: root.querySelector('#pics').value,
    });
    addJournalEntry(store, 'Inserat veröffentlicht', 'Ich habe das Erdgeschoss online gestellt, bevor alles perfekt ist, um Leerstand zu vermeiden.', 'Vermietung');
  });
  root.querySelectorAll('[data-action="rent"]').forEach((el) => el.onclick = () => {
    if (finalizeRent(store)) addJournalEntry(store, 'Erste Vermietung', 'Das Erdgeschoss ist vermietet. Zum ersten Mal wirkt das Haus wieder tragfähig.', 'Vermietung');
  });
  root.querySelectorAll('[data-action="bank"]').forEach((el) => el.onclick = () => {
    runBankMeeting(store, el.dataset.style);
    addJournalEntry(store, 'Banktermin', 'Der Berater kannte meinen Vater. Er gab mir eine Chance — unter Beobachtung.', 'Bank');
  });
  root.querySelectorAll('[data-action="cemetery"]').forEach((el) => el.onclick = () => {
    finishChapter(store);
    addJournalEntry(store, 'Beerdigung', 'Winter, Erde, Stille. Mara war da. Zwischen uns begann etwas, noch ohne Namen.', 'Friedhof');
    addJournalEntry(store, 'Versprechen', endingMonologue, 'Monolog');
    store.setState((s) => { s.meta.phase = 'chapterEnd'; });
  });
}

function enterRoom(store, roomKey) {
  const st = store.getState();
  store.setState((s) => { s.ui.selectedRoom = roomKey; });
  const room = st.rooms[roomKey];
  if (room.unlocked && !room.cinematicSeen && roomCinematics[roomKey]) {
    addJournalEntry(store, `${room.label} — Erinnerung`, roomCinematics[roomKey], 'Gedanke');
    store.setState((s) => { s.rooms[roomKey].cinematicSeen = true; });
  }
}

function renderChapterEnd(root, state) {
  root.className = 'snow';
  root.innerHTML = `
    <div class="card fade-in" style="margin-top: 18dvh; text-align:center;">
      <small>Kapitel abgeschlossen</small>
      <h2>Kapitel 1 – Der Anfang im Schatten</h2>
      <p class="note">Nicht gewonnen. Nur überlebt.</p>
      <div class="list" style="margin-top:10px; text-align:left;">
        <div class="row">Net Worth: ${fmt(state.finance.netWorth)} €</div>
        <div class="row">Cashflow: ${fmt(state.finance.cashflow)} € / Monat</div>
        <div class="row">Restdarlehen: ${fmt(state.finance.debt)} €</div>
        <div class="row">Rufwert: ${state.finance.reputation}</div>
      </div>
      <p style="margin-top: 10px;">Jetzt beginnt mein Weg.</p>
    </div>`;
}

function fmt(n) { return new Intl.NumberFormat('de-DE').format(Math.round(n)); }
