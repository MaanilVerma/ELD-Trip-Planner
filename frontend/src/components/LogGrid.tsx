/**
 * LogGrid - SVG background grid for FMCSA daily log sheet.
 * Renders the 24-hour grid with 4 status rows, hour labels, and 15-minute tick marks.
 */

// Grid layout constants
export const GRID = {
  LEFT: 130,
  RIGHT: 970,
  TOP: 180,
  ROW_HEIGHT: 58,
  get WIDTH() {
    return this.RIGHT - this.LEFT;
  },
  get BOTTOM() {
    return this.TOP + this.ROW_HEIGHT * 4;
  },
  get HEIGHT() {
    return this.ROW_HEIGHT * 4;
  },
  HOUR_WIDTH() {
    return this.WIDTH / 24;
  },

  timeToX(hours: number): number {
    return this.LEFT + (hours / 24) * this.WIDTH;
  },

  statusToY(status: string): number {
    const rowIndex: Record<string, number> = {
      off_duty: 0,
      sleeper_berth: 1,
      driving: 2,
      on_duty_not_driving: 3,
    };
    const idx = rowIndex[status] ?? 0;
    return this.TOP + idx * this.ROW_HEIGHT + this.ROW_HEIGHT / 2;
  },
};

const ROW_LABELS = [
  "1. Off Duty",
  "2. Sleeper Berth",
  "3. Driving",
  "4. On Duty\n(Not Driving)",
];

function getHourLabel(hour: number): string | null {
  if (hour === 0 || hour === 24) return null; // Midnight handled via tspan in render
  if (hour === 12) return "Noon";
  return hour > 12 ? String(hour - 12) : String(hour);
}

export default function LogGrid() {
  return (
    <g className="log-grid">
      {/* Outer border */}
      <rect
        x={GRID.LEFT}
        y={GRID.TOP}
        width={GRID.WIDTH}
        height={GRID.HEIGHT}
        fill="#fff"
        stroke="#333"
        strokeWidth={1.5}
      />

      {/* Horizontal row dividers */}
      {[1, 2, 3].map((i) => (
        <line
          key={`hline-${i}`}
          x1={GRID.LEFT}
          y1={GRID.TOP + i * GRID.ROW_HEIGHT}
          x2={GRID.RIGHT}
          y2={GRID.TOP + i * GRID.ROW_HEIGHT}
          stroke="#333"
          strokeWidth={1}
        />
      ))}

      {/* Hour lines (vertical) */}
      {Array.from({ length: 25 }, (_, i) => i).map((hour) => {
        const x = GRID.timeToX(hour);
        const isMajor = hour % 6 === 0;
        const label = getHourLabel(hour);
        const isMidnight = hour === 0 || hour === 24;
        return (
          <g key={`hour-${hour}`}>
            <line
              x1={x}
              y1={GRID.TOP}
              x2={x}
              y2={GRID.BOTTOM}
              stroke={isMajor ? "#333" : "#999"}
              strokeWidth={isMajor ? 1.5 : 0.5}
            />
            {/* Hour label at top — positioned on the hour line, matching real FMCSA form */}
            {(label || isMidnight) &&
              (isMidnight ? (
                <text
                  x={x}
                  y={GRID.TOP - 12}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#64748B"
                  fontFamily="'Courier New', monospace"
                >
                  <tspan x={x} dy="0">
                    Mid-
                  </tspan>
                  <tspan x={x} dy="10">
                    night
                  </tspan>
                </text>
              ) : (
                <text
                  x={x}
                  y={GRID.TOP - 8}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#64748B"
                  fontFamily="'Courier New', monospace"
                >
                  {label}
                </text>
              ))}
            {/* Hour label at bottom */}
            {(label || isMidnight) &&
              (isMidnight ? (
                <text
                  x={x}
                  y={GRID.BOTTOM + 8}
                  textAnchor="middle"
                  fontSize={9}
                  fill="#64748B"
                  fontFamily="'Courier New', monospace"
                >
                  <tspan x={x} dy="0">
                    Mid-
                  </tspan>
                  <tspan x={x} dy="10">
                    night
                  </tspan>
                </text>
              ) : (
                <text
                  x={x}
                  y={GRID.BOTTOM + 14}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#64748B"
                  fontFamily="'Courier New', monospace"
                >
                  {label}
                </text>
              ))}
          </g>
        );
      })}

      {/* 15-minute tick marks */}
      {Array.from({ length: 96 }, (_, i) => i).map((quarter) => {
        if (quarter % 4 === 0) return null;
        const x = GRID.LEFT + (quarter / 96) * GRID.WIDTH;
        const isHalf = quarter % 2 === 0;
        return (
          <g key={`tick-${quarter}`}>
            {/* Top ticks */}
            <line
              x1={x}
              y1={GRID.TOP}
              x2={x}
              y2={GRID.TOP + (isHalf ? 8 : 5)}
              stroke="#bbb"
              strokeWidth={0.5}
            />
            {/* Ticks in each row */}
            {[1, 2, 3].map((row) => (
              <line
                key={`tick-${quarter}-${row}`}
                x1={x}
                y1={GRID.TOP + row * GRID.ROW_HEIGHT}
                x2={x}
                y2={GRID.TOP + row * GRID.ROW_HEIGHT + (isHalf ? 6 : 4)}
                stroke="#ccc"
                strokeWidth={0.3}
              />
            ))}
          </g>
        );
      })}

      {/* Row labels on left */}
      {ROW_LABELS.map((label, i) => {
        const lines = label.split("\n");
        const y = GRID.TOP + i * GRID.ROW_HEIGHT + GRID.ROW_HEIGHT / 2;
        return (
          <text
            key={`label-${i}`}
            x={GRID.LEFT - 8}
            y={y}
            textAnchor="end"
            dominantBaseline="middle"
            fontSize={11}
            fill="#0F172A"
            fontFamily="Arial, sans-serif"
            fontWeight="600"
          >
            {lines.map((line, j) => (
              <tspan
                key={j}
                x={GRID.LEFT - 8}
                dy={j === 0 ? (lines.length > 1 ? -7 : 0) : 14}
              >
                {line}
              </tspan>
            ))}
          </text>
        );
      })}
    </g>
  );
}
