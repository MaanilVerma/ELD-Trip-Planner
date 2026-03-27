# ELD Trip Planner - Frontend

React + TypeScript + Vite frontend for the ELD Trip Planner.

## Tech Stack

- **React 19** with TypeScript
- **Vite** for dev server and bundling
- **Tailwind CSS** for styling
- **Motion** (Framer Motion) for animations
- **Leaflet + React Leaflet** for interactive maps
- **Sonner** for toast notifications
- **jsPDF** for PDF export
- **Axios** for API requests

## Getting Started

```bash
npm install
npm run dev
```

Runs on `http://localhost:5173`. API requests are proxied to `http://127.0.0.1:8000` via Vite config.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server with HMR |
| `npm run build` | TypeScript check + production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Project Structure

```
src/
├── App.tsx                          # Root layout and composition
├── main.tsx                         # Entry point
├── index.css                        # Tailwind v4 design tokens + animations
├── hooks/
│   └── useTripPlanner.ts            # API call, loading/error state, form collapse
├── constants/
│   └── animations.ts                # Shared motion transition presets
├── api/
│   └── tripApi.ts                   # Axios client (planTrip, searchLocations)
├── types/
│   └── trip.ts                      # All TypeScript interfaces
├── utils/
│   └── exportPdf.ts                 # SVG-to-PDF export (jsPDF)
└── components/
    ├── trip-form/
    │   └── TripForm.tsx             # Input form (locations, cycle, start time, shipping)
    ├── trip-summary/
    │   └── TripSummary.tsx          # Stops timeline sidebar
    ├── map/
    │   └── RouteMap.tsx             # Leaflet map with two-tone route legs (lazy loaded)
    └── log-sheet/
        ├── LogSheetViewer.tsx       # Day tabs, print, PDF export
        ├── LogSheetLightbox.tsx     # Full-screen zoom modal
        ├── DailyLogSheet.tsx        # SVG log sheet compositor
        ├── LogGrid.tsx              # 24-hour grid (hour lines, tick marks, labels)
        ├── DutyStatusLines.tsx      # Duty status lines + bracket notation
        ├── LogHeader.tsx            # FMCSA-compliant header fields
        ├── LogRemarks.tsx           # Remarks (left) + shipping docs (right)
        ├── LogTotals.tsx            # Per-status hour totals
        └── LogRecap.tsx             # 70hr/8day cycle recap section
```

## Key Data Flow

```
TripForm (user input)
  → useTripPlanner.handleSubmit()
  → tripApi.planTrip() → POST /api/trip/plan
  → App renders results:
      RouteMap    ← route coordinates + stops
      LogSheetViewer ← daily_logs[] + shippingInfo
        → DailyLogSheet (SVG per day)
            → LogHeader, LogGrid, DutyStatusLines, LogTotals, LogRemarks, LogRecap
```

Shipping info (shipper name, commodity, document number) stays client-side only — it's display-only data that doesn't affect routing or HOS calculations.

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API origin (no trailing slash) | *empty in dev — Vite proxies `/api`* |

- **Development**: Omit `VITE_API_URL`; `vite.config.ts` proxies `/api/*` to `http://127.0.0.1:8000` (override with `VITE_PROXY_TARGET` if needed).
- **Production** (`npm run build`, Vercel): **`VITE_API_URL` is required** — the build fails without it so API traffic always goes to your real backend, not the static host.

## API Proxy

Configured in `vite.config.ts`:

```
/api/* → http://127.0.0.1:8000
```
