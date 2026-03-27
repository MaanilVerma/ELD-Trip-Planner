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
├── App.tsx                     # Root layout, state management, tab routing
├── api/
│   └── tripApi.ts              # API client (planTrip, searchLocations)
├── types/
│   └── trip.ts                 # All TypeScript interfaces
├── utils/
│   └── exportPdf.ts            # SVG-to-PDF export (jsPDF)
└── components/
    ├── TripForm.tsx             # Input form (locations, cycle, start time, shipping)
    ├── RouteMap.tsx             # Leaflet map with two-tone route legs
    ├── TripSummary.tsx          # Stops timeline sidebar
    ├── LogSheetViewer.tsx       # Day tabs, print, PDF export
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
  → tripApi.planTrip() → POST /api/trip/plan
  → App stores TripPlanResponse + ShippingInfo
  → RouteMap receives route coordinates + leg1_end_index
  → LogSheetViewer receives daily_logs[] + shippingInfo
    → DailyLogSheet renders each day as SVG
      → LogHeader, LogGrid, DutyStatusLines, LogTotals, LogRemarks, LogRecap
```

Shipping info (shipper name, commodity, document number) stays client-side only -- it's display-only data that doesn't affect routing or HOS calculations.

## API Proxy

Configured in `vite.config.ts`:

```
/api/* → http://127.0.0.1:8000
```

No `VITE_API_URL` env var needed for local development. For production, set `VITE_API_URL` to your backend URL.
