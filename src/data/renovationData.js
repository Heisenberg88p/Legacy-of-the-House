// Logische Ketten je Raum, ohne Level-Progression.
export const renovationChains = {
  schlafzimmer: [
    { id: 'clear', label: 'Entrümpeln', cost: 1400, duration: 1 },
    { id: 'floor', label: 'Laminat & Fußleisten', cost: 3200, duration: 1 },
    { id: 'paint', label: 'Wände & Decke streichen', cost: 2100, duration: 1 },
    { id: 'clean', label: 'Grundreinigung', cost: 850, duration: 1 },
  ],
  wohnzimmer: [
    { id: 'clear', label: 'Entrümpeln', cost: 1900, duration: 1 },
    { id: 'windows', label: 'Fenster & Tür tauschen', cost: 4400, duration: 2 },
    { id: 'paint', label: 'Wände & Decke streichen', cost: 2600, duration: 1 },
    { id: 'clean', label: 'Grundreinigung', cost: 1000, duration: 1 },
  ],
  buero: [
    { id: 'clear', label: 'Akten räumen & entsorgen', cost: 1100, duration: 1 },
    { id: 'floor', label: 'Boden erneuern', cost: 2500, duration: 1 },
    { id: 'paint', label: 'Wände ausbessern & streichen', cost: 1800, duration: 1 },
    { id: 'clean', label: 'Feinreinigung', cost: 700, duration: 1 },
  ],
  kinderzimmer: [
    { id: 'clear', label: 'Altmöbel ausbauen', cost: 900, duration: 1 },
    { id: 'floor', label: 'Laminat & Leisten', cost: 2200, duration: 1 },
    { id: 'doors', label: 'Tür und Fenster abdichten', cost: 1700, duration: 1 },
    { id: 'clean', label: 'Grundreinigung', cost: 600, duration: 1 },
  ],
};
