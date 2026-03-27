/**
 * LogTotals - Hours summary per duty status row.
 */

import { GRID } from "./LogGrid";
import type { StatusTotals } from "../../types/trip";

interface Props {
  totals: StatusTotals;
}

const TOTALS_CENTER = 1010; // Center of the totals column (970–1050)

function formatHours(h: number): string {
  const hours = Math.floor(h);
  const minutes = Math.round((h - hours) * 60);
  return `${hours}:${minutes.toString().padStart(2, "0")}`;
}

export default function LogTotals({ totals }: Props) {
  const TOTALS_Y = GRID.BOTTOM;
  const statuses = [
    { key: "off_duty", label: "Off Duty" },
    { key: "sleeper_berth", label: "Sleeper" },
    { key: "driving", label: "Driving" },
    { key: "on_duty_not_driving", label: "On Duty" },
  ] as const;

  const total =
    totals.off_duty +
    totals.sleeper_berth +
    totals.driving +
    totals.on_duty_not_driving;

  return (
    <g className="log-totals">
      {/* Column header */}
      <text
        x={TOTALS_CENTER}
        y={GRID.TOP - 2}
        textAnchor="middle"
        fontSize={9.5}
        fontWeight="bold"
        fill="#0F172A"
        fontFamily="Arial, sans-serif"
      >
        Total
      </text>
      <text
        x={TOTALS_CENTER}
        y={GRID.TOP + 12}
        textAnchor="middle"
        fontSize={9.5}
        fontWeight="bold"
        fill="#0F172A"
        fontFamily="Arial, sans-serif"
      >
        Hours
      </text>

      {/* Per-row totals */}
      {statuses.map((s, i) => {
        const val = totals[s.key];
        const y = GRID.TOP + i * GRID.ROW_HEIGHT + GRID.ROW_HEIGHT / 2;
        return (
          <text
            key={s.key}
            x={TOTALS_CENTER}
            y={y + 1}
            textAnchor="middle"
            fontSize={14}
            fontWeight="bold"
            fill="#0F172A"
            dominantBaseline="middle"
            fontFamily="'Courier New', monospace"
          >
            {formatHours(val)}
          </text>
        );
      })}

      {/* Grand total separator */}
      <line
        x1={GRID.RIGHT + 5}
        y1={TOTALS_Y + 3}
        x2={1045}
        y2={TOTALS_Y + 3}
        stroke="#333"
        strokeWidth={1}
      />
      {/* Grand total value */}
      <text
        x={TOTALS_CENTER}
        y={TOTALS_Y + 20}
        textAnchor="middle"
        fontSize={15}
        fontWeight="bold"
        fill="#1e3a5f"
        fontFamily="'Courier New', monospace"
      >
        {formatHours(total)}
      </text>
    </g>
  );
}
