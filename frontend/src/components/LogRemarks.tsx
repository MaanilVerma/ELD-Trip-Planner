/**
 * LogRemarks - Remarks and Shipping Documents section of the FMCSA daily log.
 * Split layout: left for duty status remarks, right for shipping info.
 */

import type { Remark, ShippingInfo } from "../types/trip";

interface Props {
  remarks: Remark[];
  shippingInfo: ShippingInfo;
}

const REMARKS_TOP = 456;
const REMARKS_HEIGHT = 125;
const LINE_HEIGHT = 14;
const SPLIT_X = 700; // Divider between remarks and shipping docs

export default function LogRemarks({ remarks, shippingInfo }: Props) {
  const maxRemarks = Math.floor(REMARKS_HEIGHT / LINE_HEIGHT) - 1;
  const displayRemarks = remarks.slice(0, maxRemarks);

  return (
    <g className="log-remarks">
      {/* Full container box */}
      <rect
        x={15}
        y={REMARKS_TOP}
        width={1020}
        height={REMARKS_HEIGHT}
        fill="#F8FAFC"
        stroke="#E2E8F0"
        strokeWidth={0.5}
        rx={2}
      />

      {/* === Left: Remarks === */}
      <text
        x={20}
        y={REMARKS_TOP + 14}
        fontSize={10}
        fontWeight="bold"
        fill="#1e3a5f"
        fontFamily="Arial, sans-serif"
      >
        REMARKS
      </text>

      {displayRemarks.map((remark, i) => (
        <text
          key={i}
          x={25}
          y={REMARKS_TOP + 30 + i * LINE_HEIGHT}
          fontSize={9}
          fill="#334155"
          fontFamily="'Courier New', monospace"
        >
          {remark.time} — {remark.text}
        </text>
      ))}

      {remarks.length === 0 && (
        <text
          x={25}
          y={REMARKS_TOP + 32}
          fontSize={9.5}
          fill="#999"
          fontStyle="italic"
          fontFamily="Arial, sans-serif"
        >
          No duty status changes recorded
        </text>
      )}

      {/* === Divider === */}
      <line
        x1={SPLIT_X}
        y1={REMARKS_TOP + 2}
        x2={SPLIT_X}
        y2={REMARKS_TOP + REMARKS_HEIGHT - 2}
        stroke="#E2E8F0"
        strokeWidth={0.5}
      />

      {/* === Right: Shipping Documents === */}
      <text
        x={SPLIT_X + 10}
        y={REMARKS_TOP + 14}
        fontSize={10}
        fontWeight="bold"
        fill="#1e3a5f"
        fontFamily="Arial, sans-serif"
      >
        SHIPPING DOCUMENTS
      </text>

      <text
        x={SPLIT_X + 10}
        y={REMARKS_TOP + 32}
        fontSize={8.5}
        fill="#64748B"
        fontFamily="Arial, sans-serif"
      >
        DVL or Manifest No.:
      </text>
      <text
        x={SPLIT_X + 140}
        y={REMARKS_TOP + 32}
        fontSize={10}
        fill="#0F172A"
        fontFamily="'Courier New', monospace"
      >
        {shippingInfo.documentNumber || "N/A"}
      </text>
      <line
        x1={SPLIT_X + 138}
        y1={REMARKS_TOP + 34}
        x2={SPLIT_X + 260}
        y2={REMARKS_TOP + 34}
        stroke="#CBD5E1"
        strokeWidth={0.4}
      />

      <text
        x={SPLIT_X + 10}
        y={REMARKS_TOP + 52}
        fontSize={8.5}
        fill="#64748B"
        fontFamily="Arial, sans-serif"
      >
        Shipper & Commodity:
      </text>
      <text
        x={SPLIT_X + 140}
        y={REMARKS_TOP + 52}
        fontSize={10}
        fill="#0F172A"
        fontFamily="'Courier New', monospace"
      >
        {[shippingInfo.shipperName, shippingInfo.commodity]
          .filter(Boolean)
          .join(" — ") || "N/A"}
      </text>
      <line
        x1={SPLIT_X + 138}
        y1={REMARKS_TOP + 54}
        x2={SPLIT_X + 335}
        y2={REMARKS_TOP + 54}
        stroke="#CBD5E1"
        strokeWidth={0.4}
      />

      {/* Instruction text */}
      <text
        x={SPLIT_X + 10}
        y={REMARKS_TOP + 76}
        fontSize={8}
        fill="#94A3B8"
        fontStyle="italic"
        fontFamily="Arial, sans-serif"
      >
        Enter name of place you reported and
      </text>
      <text
        x={SPLIT_X + 10}
        y={REMARKS_TOP + 87}
        fontSize={8}
        fill="#94A3B8"
        fontStyle="italic"
        fontFamily="Arial, sans-serif"
      >
        released from work and where each
      </text>
      <text
        x={SPLIT_X + 10}
        y={REMARKS_TOP + 98}
        fontSize={8}
        fill="#94A3B8"
        fontStyle="italic"
        fontFamily="Arial, sans-serif"
      >
        change of duty occurred.
      </text>
    </g>
  );
}
