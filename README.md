# Legacy of the House — Web-App v0.1

Lokales Starten:
1. Repository öffnen
2. `python3 -m http.server 4173`
3. Browser auf `http://localhost:4173`

## Struktur
- `index.html` – Einstiegspunkt
- `styles/main.css` – mobiles, winterlich-düsteres UI + cinematic Intro/Prolog-Styling
- `src/main.js` – Bootstrap
- `src/core/store.js` – zentraler State-Store
- `src/core/sceneManager.js` – Screen-/Scene-Rendering inkl. automatischer Intro-/Prolog-Regie
- `src/data/storyData.js` – Prolog-Panels, Monologe, Storytexte
- `src/data/renovationData.js` – Renovierungsketten
- `src/systems/timeSystem.js` – Monats-Zeitmotor (75s) ohne sekündliche Voll-Re-Renders
- `src/systems/worldSystem.js` – Wirtschaft, Mieter, Bank, Vermietung, Trigger
- `src/systems/journalSystem.js` – Journal-Logik
- `src/systems/saveSystem.js` – Save/Load via localStorage

## Hinweise v0.1
- Kapitel 1 ist vollständig spielbar als fokussierter Kernloop.
- Startablauf ist filmisch: 5s SICH-STUDIOS-Intro ohne Button, danach automatischer Prolog ohne UI-Interaktion.
- Kapitel 2+ ist nur strukturell vorbereitet (nicht sichtbar).
