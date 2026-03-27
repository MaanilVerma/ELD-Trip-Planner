# ELD Trip Planner

A full-stack web application that plans truck driver routes with **FMCSA-compliant Hours of Service (HOS)** regulations and generates **daily ELD log sheets**.

Built with **Django** (backend) and **React** (frontend).

---

## Features

- **Route Planning**: Enter current location, pickup, and dropoff to get a complete route
- **HOS Compliance Engine**: Automatically calculates mandatory stops based on FMCSA regulations:
  - 11-Hour Driving Limit
  - 14-Hour Driving Window
  - 30-Minute Rest Break (after 8 hrs driving)
  - 10-Hour Off-Duty between shifts
  - 70-Hour/8-Day rolling cycle limit
  - 34-Hour Restart (resets cycle when 70-hr limit is reached)
  - Pre-trip and post-trip inspections (15 min on-duty)
  - Fuel stops every 1,000 miles
  - 1 hour pickup/dropoff (on-duty not driving)
- **Interactive Map**: Route visualization with color-coded stop markers using Leaflet + OpenStreetMap
  - Hover over markers to see stop details (arrival, departure, duration, miles)
  - Two-tone route: solid blue (current -> pickup), dashed orange (pickup -> dropoff)
- **Daily Log Sheets**: SVG-rendered FMCSA-style driver's daily logs with:
  - Full FMCSA-compliant header (date, miles, odometer, vehicle, carrier, signature, co-driver, from/to, shipping docs)
  - 24-hour grid with 15-minute increments and hour labels on boundary lines
  - Horizontal duty status lines (Off Duty, Sleeper Berth, Driving, On Duty Not Driving)
  - Bracket notation for stationary on-duty segments
  - Vertical transition lines between status changes
  - Split remarks section: duty status changes (left) + shipping documents (right)
  - Per-status hour totals (summing to 24 hours)
  - 70hr/8day Recap section with cycle tracking, hours available, and color-coded warnings
- **PDF Export**: Download all daily logs as a multi-page landscape PDF
- **Print Support**: Ctrl+P prints all daily logs with page breaks (not just the active tab)
- **Configurable Start Time**: Choose departure hour (12 AM - 11 PM)
- **Shipping Documents**: Optional shipper name, commodity, and DVL/manifest number displayed on logs
- **Location Autocomplete**: Powered by Nominatim/OpenStreetMap geocoding

---

## Tech Stack

| Layer         | Technology                            |
| ------------- | ------------------------------------- |
| Backend       | Django 5.1, Django REST Framework     |
| Frontend      | React 19, TypeScript, Vite            |
| Styling       | Tailwind CSS                          |
| Animations    | Motion (Framer Motion)                |
| Toasts        | Sonner                                |
| PDF Export    | jsPDF                                 |
| Maps          | Leaflet, React Leaflet, OpenStreetMap |
| Routing       | OpenRouteService (haversine fallback)  |
| Geocoding     | Nominatim (OpenStreetMap)             |
| Log Rendering | Inline SVG                            |

---

## Prerequisites

- **Python 3.10+**
- **Node.js 18+**
- **npm 9+**

---

## How to Run

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd auto-project
```

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up routing API key (free, no credit card)
# 1. Sign up at https://openrouteservice.org/dev/#/signup
# 2. Copy your API key and add it to backend/.env:
echo "ORS_API_KEY=your_key_here" > .env

# Run the development server
python manage.py runserver 8000
```

The backend API will be available at `http://127.0.0.1:8000/api/`.

> **Note**: Without the `ORS_API_KEY`, the app falls back to a haversine-based straight-line estimate (1.3x distance, 55 mph avg). Real road routing requires the API key.

### 3. Frontend Setup

```bash
# Open a new terminal, navigate to frontend
cd frontend

# Install dependencies
npm install

# Run the development server
npm run dev
```

The frontend will be available at `http://localhost:5173/`.

> The Vite dev server automatically proxies `/api` requests to the Django backend at port 8000.

### 4. Using the App

1. Open `http://localhost:5173` in your browser
2. Enter **Current Location** (e.g., "Dallas, TX")
3. Enter **Pickup Location** (e.g., "Oklahoma City, OK")
4. Enter **Dropoff Location** (e.g., "Los Angeles, CA")
5. Set **Current Cycle Used** (hours already used in 70hr/8-day cycle)
6. Optionally change **Start Time** (defaults to 8:00 AM)
7. Optionally expand **Shipping Documents** and fill in shipper/commodity/manifest details
8. Click **Plan Trip**
9. View the route on the **Route Map** tab (two-tone legs with stop markers)
10. Switch to **ELD Logs** tab to view daily log sheets
11. Use the **PDF** button to export all logs, or **Ctrl+P** to print

---

## API Endpoints

### `POST /api/trip/plan`

Plans a trip with HOS-compliant stops and generates daily log sheets.

**Request Body:**

```json
{
  "current_location": "Dallas, TX",
  "pickup_location": "Oklahoma City, OK",
  "dropoff_location": "Los Angeles, CA",
  "current_cycle_used": 10.0,
  "start_hour": 8
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `current_location` | string | Yes | Driver's current location |
| `pickup_location` | string | Yes | Cargo pickup location |
| `dropoff_location` | string | Yes | Cargo dropoff location |
| `current_cycle_used` | float | Yes | Hours already used in 70hr/8-day cycle (0-70) |
| `start_hour` | int | No | Departure hour (0-23, default: 8) |

**Response:** Route data, stops array, and daily log sheets.

### `GET /api/locations/search?q=<query>`

Returns location autocomplete suggestions.

---

## Deployment

See **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** for a complete step-by-step guide.

**TL;DR**: Frontend on **Vercel** (free), Backend on **Render** (free).

| Service | Platform | Key Env Vars |
|---------|----------|-------------|
| Frontend | Vercel | `VITE_API_URL` (backend URL) |
| Backend | Render | `DJANGO_SECRET_KEY`, `DEBUG=False`, `ORS_API_KEY`, `CORS_ALLOWED_ORIGINS` |

---

## Project Structure

```
auto-project/
├── backend/
│   ├── config/                     # Django project settings
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   ├── trip_planner/               # Main Django app
│   │   ├── views.py                # API endpoints
│   │   ├── serializers.py          # Request validation
│   │   ├── urls.py                 # URL routing
│   │   └── services/
│   │       ├── geocoding_service.py    # Nominatim geocoding
│   │       ├── routing_service.py      # ORS routing + haversine fallback
│   │       ├── hos_engine.py           # HOS compliance engine (core)
│   │       └── log_sheet_service.py    # Daily log generation + recap
│   ├── manage.py
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                 # Main application layout
│   │   ├── api/tripApi.ts          # API client
│   │   ├── types/trip.ts           # TypeScript interfaces
│   │   ├── utils/
│   │   │   └── exportPdf.ts        # SVG → PDF export utility
│   │   └── components/
│   │       ├── TripForm.tsx        # Input form with autocomplete
│   │       ├── RouteMap.tsx        # Leaflet map with route (two-tone legs)
│   │       ├── TripSummary.tsx     # Stops timeline
│   │       ├── LogSheetViewer.tsx  # Paginated log viewer + PDF/Print
│   │       ├── DailyLogSheet.tsx   # Full log sheet (SVG)
│   │       ├── LogGrid.tsx         # 24-hour grid background
│   │       ├── DutyStatusLines.tsx # Status lines + bracket notation
│   │       ├── LogHeader.tsx       # FMCSA-compliant header
│   │       ├── LogRemarks.tsx      # Remarks + shipping documents
│   │       ├── LogTotals.tsx       # Hours summary
│   │       └── LogRecap.tsx        # 70hr/8day cycle recap
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json
│
├── docs/
│   ├── CLEANUP-TRACKER.md          # Audit & gap tracker
│   ├── TEST-CASES.md               # Manual verification test cases
│   ├── DEPLOYMENT.md               # Step-by-step deployment guide
└── README.md
```

---

## FMCSA HOS Rules Implemented

| Rule                   | Description                                                 |
| ---------------------- | ----------------------------------------------------------- |
| 11-Hour Driving Limit  | Max 11 hours of driving after 10 consecutive hours off duty |
| 14-Hour Driving Window | Cannot drive beyond 14th hour after coming on duty          |
| 30-Minute Rest Break   | Required after 8 cumulative hours of driving                |
| 10-Hour Off-Duty       | Minimum rest between duty periods                           |
| 70-Hour/8-Day Limit    | Cannot drive after 70 hours on-duty in rolling 8 days       |
| 34-Hour Restart        | Resets 70hr cycle to 0 when cycle limit is reached          |
| Pre/Post-Trip Inspect  | 15 minutes on-duty before first drive and after final drop  |
| Fuel Stop              | At least once every 1,000 miles                             |
| Pickup/Dropoff         | 1 hour each, recorded as on-duty not driving                |
| 15-Min ELD Rounding    | All times rounded to nearest 15 minutes per ELD standard    |

**Assumptions**: Property-carrying driver, no adverse driving conditions, no sleeper berth split provisions.

---

## PROPRIETARY SOFTWARE LICENSE

**Copyright (c) 2026. All Rights Reserved.**

This software and all associated source code, documentation, designs, algorithms, and intellectual property contained within this repository are the **exclusive proprietary property** of the author(s).

### TERMS AND CONDITIONS

1. **NO LICENSE GRANTED**: No license, express or implied, is granted to any person or entity to use, copy, modify, merge, publish, distribute, sublicense, sell, reproduce, or create derivative works from this software or any portion thereof.

2. **PROHIBITION OF USE**: Any unauthorized use, reproduction, distribution, modification, reverse engineering, decompilation, disassembly, or creation of derivative works of this software, in whole or in part, is **strictly prohibited** and constitutes a violation of applicable copyright and intellectual property laws.

3. **VIEWING ONLY**: Access to this repository is provided solely for viewing and evaluation purposes related to the assessment for which it was submitted. This access does **not** constitute a license to use the code.

4. **FINANCIAL PENALTIES**: Any unauthorized use, reproduction, or distribution of this software or any portion thereof, including but not limited to incorporating this code into commercial or non-commercial products, services, or projects, shall subject the violating party to:
   - **Liquidated damages of $500,000 USD per instance** of unauthorized use, reproduction, or distribution
   - **Additional damages of $100,000 USD per day** for each day the unauthorized use continues after written notice
   - **Reimbursement of all legal fees**, court costs, and expenses incurred in enforcement
   - **Disgorgement of all profits** derived from the unauthorized use of this software

5. **INJUNCTIVE RELIEF**: The author reserves the right to seek immediate injunctive relief, including temporary restraining orders and preliminary injunctions, to prevent ongoing or threatened violations.

6. **SEVERABILITY**: If any provision of this license is held to be unenforceable, the remaining provisions shall continue in full force and effect.

7. **GOVERNING LAW**: This license shall be governed by and construed in accordance with the laws of the United States and the state in which the author resides, without regard to conflict of law principles.

**By accessing, viewing, downloading, cloning, forking, or otherwise obtaining a copy of this software, you acknowledge that you have read, understood, and agree to be bound by these terms.**

Any inquiries regarding licensing or authorized use should be directed to the repository owner.
