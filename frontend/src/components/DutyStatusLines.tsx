/**
 * DutyStatusLines - Draws horizontal duty status lines and vertical transitions
 * on the FMCSA daily log grid.
 */

import type { ReactElement } from 'react';
import { GRID } from './LogGrid';
import type { LogSegment } from '../types/trip';

interface Props {
  segments: LogSegment[];
}

// Color palette per duty status — distinct, accessible, matches ELD software conventions
const STATUS_COLORS: Record<string, string> = {
  off_duty: '#64748B',            // slate gray
  sleeper_berth: '#7C3AED',       // violet
  driving: '#2563EB',             // blue
  on_duty_not_driving: '#D97706', // amber
};

function parseTime(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h + m / 60;
}

export default function DutyStatusLines({ segments }: Props) {
  const elements: ReactElement[] = [];

  segments.forEach((segment, index) => {
    const startHours = parseTime(segment.start_time);
    const endHours = parseTime(segment.end_time);

    // Handle midnight (end_time "00:00" means end of day = 24)
    const effectiveEnd = endHours === 0 && startHours > 0 ? 24 : endHours;
    if (effectiveEnd <= startHours) return;

    const x1 = GRID.timeToX(startHours);
    const x2 = GRID.timeToX(effectiveEnd);
    const y = GRID.statusToY(segment.status);
    const color = STATUS_COLORS[segment.status] || '#0F172A';

    // Horizontal line for segment duration
    elements.push(
      <line
        key={`h-${index}`}
        x1={x1} y1={y}
        x2={x2} y2={y}
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
      />
    );

    // Bracket notation for stationary on-duty-not-driving segments
    // (loading, fueling, inspections — truck doesn't move)
    if (segment.status === 'on_duty_not_driving' && (x2 - x1) > 4) {
      const bracketDrop = 8;
      elements.push(
        <path
          key={`bracket-${index}`}
          d={`M${x1},${y + 2} v${bracketDrop} h${x2 - x1} v${-bracketDrop}`}
          fill="none"
          stroke={color}
          strokeWidth={1.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={0.6}
        />
      );
    }

    // Vertical transition line to next segment
    if (index < segments.length - 1) {
      const nextSegment = segments[index + 1];
      const nextY = GRID.statusToY(nextSegment.status);

      if (y !== nextY) {
        // Transition line uses a neutral dark color
        elements.push(
          <line
            key={`v-${index}`}
            x1={x2} y1={y}
            x2={x2} y2={nextY}
            stroke="#334155"
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        );
      }
    }
  });

  return <g className="duty-status-lines">{elements}</g>;
}
