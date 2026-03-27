/**
 * LogHeader - FMCSA-compliant header for the Driver's Daily Log.
 * Matches the official DOT form layout with all required fields.
 */

import type { ShippingInfo } from '../../types/trip';

interface Props {
  date: string;
  dayNumber: number;
  totalMiles: number;
  startOdometer: number;
  endOdometer: number;
  fromLocation: string;
  toLocation: string;
  shippingInfo: ShippingInfo;
}

const LABEL_STYLE = {
  fontSize: 9,
  fill: "#64748B",
  fontFamily: "Arial, sans-serif",
} as const;

const VALUE_STYLE = {
  fontSize: 11,
  fontWeight: "600" as const,
  fill: "#0F172A",
  fontFamily: "'Courier New', monospace",
} as const;

function FieldUnderline({ x, y, width }: { x: number; y: number; width: number }) {
  return <line x1={x} y1={y} x2={x + width} y2={y} stroke="#CBD5E1" strokeWidth={0.5} />;
}

export default function LogHeader({ date, dayNumber, totalMiles, startOdometer, endOdometer, fromLocation, toLocation, shippingInfo }: Props) {
  const formattedDate = new Date(date + "T00:00:00").toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  // Split date parts for (MONTH) (DAY) (YEAR) layout
  const [month, day, year] = formattedDate.split("/");

  return (
    <g className="log-header">
      {/* === Row 1: Title bar === */}
      <rect x={0} y={0} width={1050} height={32} fill="#1e3a5f" rx={3} />
      <text x={20} y={21} fontSize={13} fontWeight="bold" fill="white" fontFamily="Arial, sans-serif">
        DRIVER'S DAILY LOG
      </text>
      <text x={500} y={21} textAnchor="middle" fontSize={10.5} fill="white" fontFamily="Arial, sans-serif">
        (ONE CALENDAR DAY — 24 HOURS)
      </text>
      <text x={750} y={14} fontSize={7.5} fill="rgba(255,255,255,0.7)" fontFamily="Arial, sans-serif">
        ORIGINAL — Submit to carrier within 13 days
      </text>
      <text x={750} y={25} fontSize={7.5} fill="rgba(255,255,255,0.7)" fontFamily="Arial, sans-serif">
        DUPLICATE — Driver retains possession for 8 days
      </text>
      <text x={1035} y={21} textAnchor="end" fontSize={9} fill="rgba(255,255,255,0.5)" fontFamily="Arial, sans-serif">
        Day {dayNumber}
      </text>

      {/* === Row 2: Date, Miles, Odometer, Vehicle === */}
      <g>
        {/* Date fields */}
        <text x={20} y={55} {...LABEL_STYLE}>(MONTH)</text>
        <text x={62} y={55} {...VALUE_STYLE}>{month}</text>
        <FieldUnderline x={57} y={57} width={32} />

        <text x={100} y={55} {...LABEL_STYLE}>(DAY)</text>
        <text x={130} y={55} {...VALUE_STYLE}>{day}</text>
        <FieldUnderline x={125} y={57} width={28} />

        <text x={168} y={55} {...LABEL_STYLE}>(YEAR)</text>
        <text x={205} y={55} {...VALUE_STYLE}>{year}</text>
        <FieldUnderline x={200} y={57} width={45} />

        {/* Total Miles */}
        <text x={275} y={55} {...LABEL_STYLE}>(TOTAL MILES DRIVING TODAY)</text>
        <text x={425} y={55} {...VALUE_STYLE}>{totalMiles}</text>
        <FieldUnderline x={420} y={57} width={55} />

        {/* Odometer — spaced apart to prevent overlap */}
        <text x={490} y={47} {...LABEL_STYLE}>ODOMETER START</text>
        <text x={490} y={57} {...VALUE_STYLE}>{startOdometer}</text>
        <FieldUnderline x={485} y={59} width={65} />

        <text x={620} y={47} {...LABEL_STYLE}>ODOMETER END</text>
        <text x={620} y={57} {...VALUE_STYLE}>{endOdometer}</text>
        <FieldUnderline x={615} y={59} width={65} />

        {/* Vehicle Numbers */}
        <text x={735} y={47} {...LABEL_STYLE}>VEHICLE NUMBERS — (SHOW EACH UNIT)</text>
        <text x={735} y={59} {...VALUE_STYLE}>N/A</text>
        <FieldUnderline x={730} y={61} width={130} />
      </g>

      {/* === Row 3: Carrier, Signature, Co-Driver === */}
      <g>
        {/* Name of Carrier */}
        <text x={20} y={80} {...LABEL_STYLE}>(NAME OF CARRIER OR CARRIERS)</text>
        <text x={20} y={94} {...VALUE_STYLE}>ELD Trip Planner</text>
        <FieldUnderline x={15} y={96} width={210} />

        {/* Driver Signature + certification */}
        <text x={250} y={76} fontSize={7} fill="#94A3B8" fontFamily="Arial, sans-serif">
          I certify that these entries are true and correct:
        </text>
        <text x={250} y={84} {...LABEL_STYLE}>(DRIVER'S SIGNATURE IN FULL)</text>
        <text x={250} y={94} fontSize={11} fill="#94A3B8" fontFamily="'Brush Script MT', 'Segoe Script', cursive" fontStyle="italic">
          — signature on file —
        </text>
        <FieldUnderline x={245} y={96} width={230} />

        {/* Co-Driver */}
        <text x={520} y={80} {...LABEL_STYLE}>(NAME OF CO-DRIVER)</text>
        <text x={520} y={94} {...VALUE_STYLE}>None</text>
        <FieldUnderline x={515} y={96} width={150} />

        {/* 24-hour period */}
        <text x={790} y={80} {...LABEL_STYLE}>24-HOUR PERIOD STARTING:</text>
        <text x={790} y={94} {...VALUE_STYLE}>Midnight</text>
      </g>

      {/* === Row 4: Address, From/To, Shipping === */}
      <g>
        {/* Clip paths to prevent long location text from overlapping */}
        <defs>
          <clipPath id="clip-from-loc">
            <rect x={298} y={98} width={148} height={24} />
          </clipPath>
          <clipPath id="clip-to-loc">
            <rect x={496} y={98} width={155} height={24} />
          </clipPath>
        </defs>

        {/* Main Office Address */}
        <text x={20} y={114} {...LABEL_STYLE}>(MAIN OFFICE ADDRESS)</text>
        <text x={150} y={114} {...VALUE_STYLE}>N/A</text>
        <FieldUnderline x={145} y={116} width={100} />

        {/* From / To — clipped to prevent overflow */}
        <text x={268} y={114} {...LABEL_STYLE}>From:</text>
        <text clipPath="url(#clip-from-loc)" x={300} y={114} {...VALUE_STYLE}>{fromLocation || "N/A"}</text>
        <FieldUnderline x={298} y={116} width={148} />

        <text x={470} y={114} {...LABEL_STYLE}>To:</text>
        <text clipPath="url(#clip-to-loc)" x={498} y={114} {...VALUE_STYLE}>{toLocation || "N/A"}</text>
        <FieldUnderline x={496} y={116} width={155} />

        {/* Shipping / Commodity */}
        <text x={680} y={114} {...LABEL_STYLE}>SHIPPING DOC / COMMODITY:</text>
        <text x={850} y={114} {...VALUE_STYLE}>
          {shippingInfo.documentNumber || shippingInfo.commodity || 'N/A'}
        </text>
        <FieldUnderline x={845} y={116} width={120} />
      </g>

      {/* Thin separator before grid */}
      <line x1={0} y1={130} x2={1050} y2={130} stroke="#E2E8F0" strokeWidth={0.5} />

      {/* DOT subtitle */}
      <text x={525} y={148} textAnchor="middle" fontSize={8} fill="#94A3B8" fontFamily="Arial, sans-serif">
        U.S. DEPARTMENT OF TRANSPORTATION — FEDERAL MOTOR CARRIER SAFETY ADMINISTRATION
      </text>
    </g>
  );
}
