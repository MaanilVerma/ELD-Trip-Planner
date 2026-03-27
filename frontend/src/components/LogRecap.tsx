/**
 * LogRecap - FMCSA recap section showing 70hr/8day cycle tracking.
 * Appears at the bottom of each daily log sheet.
 */

import type { RecapData } from "../types/trip";

interface Props {
  recap: RecapData;
}

const RECAP_TOP = 590;
const RECAP_HEIGHT = 70;
const COL_LEFT = 15;

const LABEL = {
  fontSize: 9,
  fill: "#64748B",
  fontFamily: "Arial, sans-serif",
} as const;

const VALUE = {
  fontSize: 13,
  fontWeight: "bold" as const,
  fill: "#0F172A",
  fontFamily: "'Courier New', monospace",
} as const;

const HEADER = {
  fontSize: 9.5,
  fontWeight: "600" as const,
  fill: "#1e3a5f",
  fontFamily: "Arial, sans-serif",
} as const;

function formatHrs(h: number): string {
  return h % 1 === 0 ? `${h}` : h.toFixed(1);
}

export default function LogRecap({ recap }: Props) {
  // Column positions for the 70hr/8day table
  const colA = 260;
  const colB = 410;
  const colC = 550;
  const rowY = RECAP_TOP + 20;

  return (
    <g className="log-recap">
      {/* Section border */}
      <rect
        x={COL_LEFT}
        y={RECAP_TOP}
        width={1020}
        height={RECAP_HEIGHT}
        fill="#F8FAFC"
        stroke="#E2E8F0"
        strokeWidth={0.5}
        rx={2}
      />

      {/* RECAP label */}
      <text
        x={COL_LEFT + 8}
        y={RECAP_TOP + 16}
        fontSize={10}
        fontWeight="bold"
        fill="#1e3a5f"
        fontFamily="Arial, sans-serif"
      >
        RECAP
      </text>
      <text x={COL_LEFT + 8} y={RECAP_TOP + 28} {...LABEL}>
        Complete at end of day
      </text>
      <text x={COL_LEFT + 8} y={RECAP_TOP + 40} {...LABEL}>
        On duty hours today
      </text>
      <text x={COL_LEFT + 8} y={RECAP_TOP + 52} {...LABEL}>
        (Total lines 3 & 4)
      </text>

      {/* Vertical separator */}
      <line
        x1={150}
        y1={RECAP_TOP + 2}
        x2={150}
        y2={RECAP_TOP + RECAP_HEIGHT - 2}
        stroke="#E2E8F0"
        strokeWidth={0.5}
      />

      {/* 70 Hour / 8 Day section header */}
      <text x={155} y={RECAP_TOP + 16} {...HEADER}>
        {recap.cycle_limit} Hour / {recap.cycle_days} Day — Drivers
      </text>

      {/* Column headers */}
      <text x={colA} y={rowY} textAnchor="middle" {...LABEL}>
        A. On Duty Hrs
      </text>
      <text x={colA} y={rowY + 11} textAnchor="middle" {...LABEL}>
        Today
      </text>

      <text x={colB} y={rowY} textAnchor="middle" {...LABEL}>
        B. Total Hrs On
      </text>
      <text x={colB} y={rowY + 11} textAnchor="middle" {...LABEL}>
        Duty Last {recap.cycle_days} Days
      </text>

      <text x={colC} y={rowY} textAnchor="middle" {...LABEL}>
        C. Hrs Available
      </text>
      <text x={colC} y={rowY + 11} textAnchor="middle" {...LABEL}>
        Tomorrow ({recap.cycle_limit} - B)
      </text>

      {/* Values */}
      <text x={colA} y={rowY + 32} textAnchor="middle" {...VALUE}>
        {formatHrs(recap.on_duty_hours_today)}
      </text>
      <text x={colB} y={rowY + 32} textAnchor="middle" {...VALUE}>
        {formatHrs(recap.total_hours_last_7_days)}
      </text>
      <text x={colC} y={rowY + 32} textAnchor="middle" {...VALUE}>
        {formatHrs(recap.hours_available_tomorrow)}
      </text>

      {/* Underlines for values */}
      {[colA, colB, colC].map((cx) => (
        <line
          key={cx}
          x1={cx - 40}
          y1={rowY + 35}
          x2={cx + 40}
          y2={rowY + 35}
          stroke="#CBD5E1"
          strokeWidth={0.5}
        />
      ))}

      {/* Vertical separators between columns */}
      {[340, 480].map((x) => (
        <line
          key={x}
          x1={x}
          y1={RECAP_TOP + 18}
          x2={x}
          y2={RECAP_TOP + RECAP_HEIGHT - 4}
          stroke="#E2E8F0"
          strokeWidth={0.3}
        />
      ))}

      {/* 34-hour restart note */}
      <line
        x1={630}
        y1={RECAP_TOP + 2}
        x2={630}
        y2={RECAP_TOP + RECAP_HEIGHT - 2}
        stroke="#E2E8F0"
        strokeWidth={0.5}
      />
      <text
        x={642}
        y={RECAP_TOP + 26}
        fontSize={9}
        fill="#64748B"
        fontFamily="Arial, sans-serif"
      >
        * If you took 34 consecutive hours off
      </text>
      <text
        x={642}
        y={RECAP_TOP + 38}
        fontSize={9}
        fill="#64748B"
        fontFamily="Arial, sans-serif"
      >
        duty you have {recap.cycle_limit} hours available.
      </text>

      {/* Hours available highlight */}
      {recap.hours_available_tomorrow <= 11 && (
        <rect
          x={colC - 40}
          y={rowY + 19}
          width={80}
          height={20}
          fill={recap.hours_available_tomorrow <= 3 ? "#FEE2E2" : "#FEF3C7"}
          rx={3}
        />
      )}
      {/* Re-render value on top of highlight */}
      {recap.hours_available_tomorrow <= 11 && (
        <text
          x={colC}
          y={rowY + 32}
          textAnchor="middle"
          fontSize={13}
          fontWeight="bold"
          fill={recap.hours_available_tomorrow <= 3 ? "#DC2626" : "#D97706"}
          fontFamily="'Courier New', monospace"
        >
          {formatHrs(recap.hours_available_tomorrow)}
        </text>
      )}
    </g>
  );
}
