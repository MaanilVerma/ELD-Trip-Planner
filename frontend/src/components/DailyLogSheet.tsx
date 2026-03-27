/**
 * DailyLogSheet - Complete FMCSA-style daily log sheet rendered as SVG.
 * Composes LogGrid, DutyStatusLines, LogHeader, LogRemarks, LogTotals, and LogRecap.
 */

import LogGrid from "./LogGrid";
import DutyStatusLines from "./DutyStatusLines";
import LogHeader from "./LogHeader";
import LogRemarks from "./LogRemarks";
import LogTotals from "./LogTotals";
import LogRecap from "./LogRecap";
import type { DailyLog, ShippingInfo } from "../types/trip";

interface Props {
  logDay: DailyLog;
  shippingInfo: ShippingInfo;
}

export default function DailyLogSheet({ logDay, shippingInfo }: Props) {
  return (
    <div
      className="log-sheet-container animate-fade-in bg-surface border border-border rounded-xl
                    shadow-card overflow-hidden"
    >
      <svg
        viewBox="0 0 1050 680"
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        style={{ fontFamily: "'Courier New', monospace" }}
      >
        <LogHeader
          date={logDay.date}
          dayNumber={logDay.day_number}
          totalMiles={logDay.total_miles_today}
          startOdometer={logDay.start_odometer}
          endOdometer={logDay.end_odometer}
          fromLocation={logDay.from_location}
          toLocation={logDay.to_location}
          shippingInfo={shippingInfo}
        />
        <LogGrid />
        <DutyStatusLines segments={logDay.segments} />
        <LogTotals totals={logDay.totals} />
        <LogRemarks remarks={logDay.remarks} shippingInfo={shippingInfo} />
        <LogRecap recap={logDay.recap} />
      </svg>
    </div>
  );
}
