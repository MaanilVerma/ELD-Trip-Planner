# ELD Trip Planner - Verification Test Cases

> For each cleanup item in CLEANUP-TRACKER.md, here's exactly what to input and what to expect.
> You need **zero domain knowledge** - just follow the steps and check the expected output.

---

## Setup

- Backend running: `http://127.0.0.1:8000`
- Frontend running: `http://localhost:5173`

---

## Standard Test Inputs

Use these 3 trip configurations across the test cases:

### Trip A: Short Trip (~6 hrs driving)
| Field | Value |
|-------|-------|
| Current Location | Dallas, TX |
| Pickup Location | Oklahoma City, OK |
| Dropoff Location | Amarillo, TX |
| Cycle Used | 0 |
| Start Time | 8:00 AM |

### Trip B: Long Trip (~22 hrs driving, multi-day)
| Field | Value |
|-------|-------|
| Current Location | Dallas, TX |
| Pickup Location | Oklahoma City, OK |
| Dropoff Location | Los Angeles, CA |
| Cycle Used | 20 |
| Start Time | 6:00 AM |

### Trip C: Cycle-Heavy Trip (triggers 34-hr restart)
| Field | Value |
|-------|-------|
| Current Location | New York, NY |
| Pickup Location | Philadelphia, PA |
| Dropoff Location | Los Angeles, CA |
| Cycle Used | 55 |
| Start Time | 8:00 AM |

---

## Test Cases by Cleanup Item

---

### #2: FMCSA Header Fields
**Input**: Trip A
**Where to look**: Click "ELD Logs" tab, look at the top of the log sheet.

**Expected output** (check each):
- [ ] **Date** appears split as three separate fields: `(MONTH) 03 (DAY) 27 (YEAR) 2026`
- [ ] **"TOTAL MILES DRIVING TODAY"** label with a number (should be ~400-500)
- [ ] **"VEHICLE NUMBERS"** label with "N/A" underneath
- [ ] **"DRIVER'S DAILY LOG"** title bar in dark blue at very top
- [ ] **"(ONE CALENDAR DAY - 24 HOURS)"** centered subtitle
- [ ] **"ORIGINAL - Submit to carrier within 13 days"** on the right
- [ ] **"DUPLICATE - Driver retains possession for 8 days"** below it
- [ ] **"NAME OF CARRIER OR CARRIERS"** showing "ELD Trip Planner"
- [ ] **"DRIVER'S SIGNATURE IN FULL"** with italic "- signature on file -"
- [ ] **"NAME OF CO-DRIVER"** showing "None"
- [ ] **"24-HOUR PERIOD STARTING:"** showing "Midnight"
- [ ] **"MAIN OFFICE ADDRESS"** showing "N/A"
- [ ] **"From:"** showing a city name (e.g., "Dallas, TX" or similar)
- [ ] **"To:"** showing a different city name
- [ ] **"SHIPPING DOC / COMMODITY:"** showing "N/A" (unless you filled in shipping)

---

### #3: Recap Section
**Input**: Trip B (Cycle Used = 20)
**Where to look**: Bottom of each log sheet, below the Remarks section.

**Expected output**:
- [ ] A table section labeled with the 70hr/8day cycle info
- [ ] **Row A** "On-duty hours today" - a number (driving + on-duty hours for that day)
- [ ] **Row B** "Total hours on duty last 8 days" - Day 1 should show ~20 + Day 1's on-duty hours. Day 2 should be higher (cumulative).
- [ ] **Row C** "Hours available tomorrow" = 70 minus Row B
- [ ] If hours available is **<= 11**, the number should appear in **yellow**
- [ ] If hours available is **<= 3**, the number should appear in **red**
- [ ] A note about "34-hour restart resets cycle to 0"

**Quick math check for Day 1**: If the driver drives ~10 hrs + 2 hrs on-duty = ~12 hrs total. Row B = 20 + 12 = ~32. Row C = 70 - 32 = ~38.

---

### #4: 34-Hour Restart Logic
**Input**: Trip C (Cycle Used = 55)
**Where to look**: The stops timeline on the left panel, and the daily log sheets.

**Expected output**:
- [ ] Within the first 1-2 days, the driver will use up ~15 remaining cycle hours (70 - 55 = 15)
- [ ] After that, instead of just a 10-hour rest, you should see a **"34-hour restart"** stop in the timeline
- [ ] On the log sheet covering the restart, you'll see a long **Sleeper Berth** block (~33 hrs) plus a short off-duty block (~1 hr)
- [ ] After the restart, the Recap section Row B should **reset close to 0** (only counting post-restart hours)
- [ ] Driving resumes normally after the restart

**How to verify**: Look at the Recap section. Before the restart, Row C (hours available) should be near 0. After the restart day, Row C should jump back up near 70.

---

### #5: Post-Trip Inspection
**Input**: Trip A
**Where to look**: The **last** daily log sheet (the day the trip ends), in the Remarks section.

**Expected output**:
- [ ] After "Dropoff / Unloading" remark, there should be a **"Post-trip inspection"** remark
- [ ] On the grid, between the dropoff on-duty block and the final off-duty block, there should be a short **On Duty (Not Driving)** segment (~15 min, one tick mark wide)
- [ ] This 15-min segment should be visible as a small horizontal line on **row 4** (On Duty Not Driving)

---

### #6: Remarks / Shipping Documents Section
**Input**: Trip A
**Where to look**: Below the grid on any log sheet - the "REMARKS" area.

**Expected output**:
- [ ] The remarks section is **split into two halves** with a vertical divider line
- [ ] **Left side** titled "REMARKS" - shows time + duty status changes with locations (e.g., "08:00 - Pre-trip inspection, Dallas, TX")
- [ ] **Right side** titled "SHIPPING DOCUMENTS" with:
  - [ ] "DVL or Manifest No.: N/A" (with an underline)
  - [ ] "Shipper & Commodity: N/A" (with an underline)
  - [ ] Small italic instructional text about entering place names

---

### #7: Configurable Start Time
**Test 1**:
- **Input**: Trip A, but change **Start Time** to **5:00 AM**
- **Expected**: First remark on Day 1 log should start at "05:00" (not "08:00"). The on-duty/driving blocks on the grid should begin around the 5 AM mark.

**Test 2**:
- **Input**: Trip A, keep **Start Time** at default **8:00 AM**
- **Expected**: First remark starts at "08:00". Blocks begin at the 8 AM mark.

**Where to look**: The remarks section (left side) - check the first time entry. Also visually confirm on the grid where the first colored line starts.

---

### #8: Hour Label Positioning
**Input**: Any trip
**Where to look**: The numbers above and below the 24-hour grid on any log sheet.

**Expected output**:
- [ ] Hour numbers (1, 2, 3... 11, Noon, 1, 2... 11) are positioned **directly above the vertical lines**, not centered between them
- [ ] **"Mid-night"** appears as two lines (Mid- / night) at both the **left edge** (hour 0) and **right edge** (hour 24) of the grid
- [ ] Same labels repeated below the grid
- [ ] "Noon" appears at the center vertical line (hour 12)

**How to verify**: Pick any number (e.g., "6") and check if it's directly above a vertical line. It should NOT be floating in the middle of the space between two lines.

---

### #9: Bracket Notation for Stationary On-Duty
**Input**: Trip A
**Where to look**: On the grid, row 4 (On Duty Not Driving) - look at the pickup and dropoff segments.

**Expected output**:
- [ ] Below the horizontal on-duty-not-driving line segments (pickup, dropoff, fueling, inspections), there are small **cup-shaped bracket marks** (like a "U" or curly bracket) hanging down
- [ ] These brackets indicate "the truck didn't move" during that time
- [ ] The brackets should be visible on pickup (1-hr block) and dropoff (1-hr block) segments
- [ ] Very tiny segments (pre-trip, post-trip at 15 min) may or may not have visible brackets depending on size

---

### #10: Map Leg Colors
**Input**: Trip B
**Where to look**: The "Route Map" tab (should be the default view after planning).

**Expected output**:
- [ ] The route line is drawn in **two different styles**:
  - **Leg 1** (Current Location -> Pickup): **Solid blue line** (#2563EB / bright blue)
  - **Leg 2** (Pickup -> Dropoff): **Dashed dark navy line** (#1E3A5F / darker blue, dashed)
- [ ] The transition point between the two styles should be at/near the Pickup marker
- [ ] Both legs should follow the road (not straight lines)

---

### #11: Odometer / Total Mileage
**Input**: Trip B (multi-day trip)
**Where to look**: Log sheet header, second row, after the "TOTAL MILES DRIVING TODAY" field.

**Expected output**:
- [ ] **"ODOMETER START"** field with a number (cumulative miles at start of that day)
- [ ] **"ODOMETER END"** field with a higher number (cumulative miles at end of that day)
- [ ] Day 1: ODOMETER START should be **0** (or close to 0)
- [ ] Day 1: ODOMETER END should roughly equal "TOTAL MILES DRIVING TODAY"
- [ ] Day 2: ODOMETER START should roughly equal Day 1's ODOMETER END
- [ ] Day 2: ODOMETER END - ODOMETER START should roughly equal Day 2's TOTAL MILES DRIVING TODAY

**Quick check**: The odometer values should always increase across days. They represent cumulative trip distance, not just daily.

---

### #12: PDF Export
**Input**: Trip B (so you get multiple days)
**Where to look**: "ELD Logs" tab - look for a "PDF" button near the top.

**Expected output**:
- [ ] A **"PDF"** button exists (near/next to a Print button)
- [ ] Clicking it shows a brief loading spinner
- [ ] A PDF file downloads (named something like `eld-logs.pdf` or similar)
- [ ] Open the PDF - it should contain **one page per daily log** (same number as the tabs shown)
- [ ] Each page shows the complete log sheet: header, grid with duty status lines, remarks, totals, recap
- [ ] The PDF should be in **landscape** orientation
- [ ] Text should be readable (not blurry) - it renders at 2x resolution

---

### #13: Shipping Documents in Form
**Input**: Trip A, but expand "Shipping Documents" and fill in:
| Field | Value |
|-------|-------|
| Shipper Name | Acme Freight Co. |
| Commodity | Electronics |
| DVL / Manifest No. | DVL-2026-0042 |

**Where to look**:
1. The form itself (the collapsible section)
2. The log sheet header (row 4, right side)
3. The log sheet remarks section (right side)

**Expected output**:
- [ ] In the form: A small arrow/chevron labeled "Shipping Documents (Optional)" - clicking it reveals 3 input fields
- [ ] **Log Header**: "SHIPPING DOC / COMMODITY:" should show **"DVL-2026-0042"** (not "N/A")
- [ ] **Remarks right side**:
  - "DVL or Manifest No.: **DVL-2026-0042**"
  - "Shipper & Commodity: **Acme Freight Co. — Electronics**"

**Test without shipping**: Run Trip A without filling in shipping fields. All those spots should show **"N/A"**.

---

### #14: Print All Daily Logs
**Input**: Trip B (multi-day trip, should produce 3+ daily logs)
**Where to look**: Browser print preview (Ctrl+P / Cmd+P).

**Expected output**:
- [ ] While viewing the ELD Logs tab, press **Ctrl+P** (or Cmd+P on Mac)
- [ ] In print preview, you should see **ALL daily logs** (not just the currently selected day tab)
- [ ] Each day's log should start on a **new page** (page breaks between days)
- [ ] The form, map, tabs, and navigation should NOT appear in print (only the logs)

**Also test PDF**: Click the PDF button with a multi-day trip - the PDF should also contain ALL days.

---

## Quick Smoke Test (All Features in One Go)

Use this single test to verify everything at once:

| Field | Value |
|-------|-------|
| Current Location | Chicago, IL |
| Pickup Location | Indianapolis, IN |
| Dropoff Location | Miami, FL |
| Cycle Used | 45 |
| Start Time | 6:00 AM |
| Shipper Name | FastFreight LLC |
| Commodity | Auto Parts |
| DVL / Manifest No. | MFT-88421 |

This trip is ~1,200 miles, ~19 hrs driving. With 45 hrs cycle used, only 25 hrs remain before needing a 34-hr restart. Should produce 3-4 daily logs.

**Checklist**:
- [ ] Map shows two-tone route (solid blue leg 1, dashed navy leg 2)
- [ ] Multiple stop markers on map (rest, fuel, etc.)
- [ ] 3-4 daily log tabs appear
- [ ] Each log header shows date, miles, odometer start/end, from/to cities
- [ ] Shipping fields show "MFT-88421" and "FastFreight LLC - Auto Parts"
- [ ] Grid has hour labels ON the lines, "Mid-night" at both edges
- [ ] Driving lines (row 3) are colored, on-duty segments (row 4) have bracket marks
- [ ] Remarks split: left = duty changes, right = shipping docs filled in
- [ ] Recap at bottom shows cycle tracking (total should start at 45 + day's hours)
- [ ] Post-trip inspection visible on final day after dropoff
- [ ] PDF export downloads all days in landscape
- [ ] Ctrl+P print preview shows all days with page breaks
- [ ] Changing start time to 10:00 AM and re-running shifts all blocks right by 4 hours
