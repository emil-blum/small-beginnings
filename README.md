# Small Beginnings

A small, calm app for meeting tasks while they are still small and tending practices a little at a time.
Dishes in the sink harden the longer they wait; herbs on the windowsill grow a ring each time you water them.

Installable web app (PWA): works offline, saves on the device (IndexedDB). No accounts, no server.

## Run
```bash
npm install
npm run dev      # local dev server (also on your LAN, for testing on a phone)
npm test         # unit tests for the rules in src/model.js
npm run build    # production build into dist/
```

## Where things live
- `src/model.js` — all the rules (dates, effort, due, rings, choose-for-me, backup). Pure functions, tested.
- `src/strings.js` — every word the app shows. Rename things here.
- `src/storage.js` — saving (IndexedDB). The only file to change for a native shell.
- `src/draw.js` — the plates (canvas).
- `src/main.js` — rendering and wiring.
- `reference/` — the v3 prototype, kept as the behavioural reference.

Each device keeps its own data. Use Week → Copy backup to keep a copy or move to another device.
