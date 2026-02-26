# TNI AU Aircrew SPA (Frontend-only)

Aplikasi Single Page App untuk operasional penerbang TNI AU berbasis React + TypeScript + TailwindCSS.

## Menjalankan

```bash
npm install
npm run dev
```

## Arsitektur Folder

- `src/components` : komponen reusable dan layout (Sidebar/Topbar/Table/Modal/Badge/Toast/Timeline)
- `src/pages` : halaman fitur berdasarkan route
- `src/contexts` : state global Context + Reducer + persistence localStorage
- `src/data` : mock data generator realistis
- `src/utils` : helper tanggal, export CSV/PDF
- `src/types` : tipe domain aplikasi

## Route utama

- `/` Dashboard Readiness
- `/logbook` E-Logbook (functional)
- `/orm` ORM Risk Assessment (functional)
- `/training` Training & Currency Tracker (functional)
- `/profile`, `/schedule`, `/weather`, `/notam`, `/duty-rest`, `/safety`, `/incident-workspace`, `/documents`, `/checklist`, `/medical`, `/fatigue`, `/inventory`, `/maintenance`, `/messaging`, `/reports`, `/admin`

## Fitur inti

- Role-based UI (mock login + role switch)
- Global search bar
- Keyboard shortcuts (`Ctrl/Cmd+K`, `Alt+1`, `Alt+2`, `Alt+3`)
- Dark/Light mode
- Audit log lokal untuk aksi create/update
- Export CSV/PDF client-side
- Offline-first dasar via service worker + localStorage persistence
- Mock dataset: profile, logbook (40), schedule (15), NOTAM (10), training (10), incident (10)
