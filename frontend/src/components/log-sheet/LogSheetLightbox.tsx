/**
 * LogSheetLightbox - Full-screen zoom modal for viewing a daily log sheet
 * at maximum width. Supports day navigation and closes on Escape/backdrop click.
 */

import { useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import DailyLogSheet from "./DailyLogSheet";
import type { DailyLog, ShippingInfo } from "../../types/trip";

interface Props {
  dailyLogs: DailyLog[];
  activeDay: number;
  shippingInfo: ShippingInfo;
  onChangeDay: (day: number) => void;
  onClose: () => void;
}

const DUTY_STATUS_LEGEND = [
  { label: "Off Duty", color: "#64748B" },
  { label: "Sleeper Berth", color: "#7C3AED" },
  { label: "Driving", color: "#2563EB" },
  { label: "On Duty", color: "#D97706" },
];

export default function LogSheetLightbox({
  dailyLogs,
  activeDay,
  shippingInfo,
  onChangeDay,
  onClose,
}: Props) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose],
  );

  const log = dailyLogs[activeDay];

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 bg-overlay flex items-center justify-center"
      style={{}}
      onClick={handleBackdropClick}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, filter: "blur(4px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.98, filter: "blur(2px)" }}
        transition={{ type: "spring", duration: 0.35, bounce: 0 }}
        className="relative bg-white rounded-sm shadow-xl flex flex-col overflow-hidden w-[95dvw] max-w-[95dvw] max-h-[95dvh]"
      >
        {/* Header bar */}
        <div className="shrink-0 flex items-center justify-between bg-surface rounded-t-sm px-5 py-3 shadow-card">
          <div className="flex items-center gap-3">
            <h3 className="text-[14px] font-semibold text-text">
              Day {log.day_number} Log Sheet
            </h3>
            {dailyLogs.length > 1 && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onChangeDay(Math.max(0, activeDay - 1))}
                  disabled={activeDay === 0}
                  aria-label="Previous day"
                  className="w-7 h-7 rounded-sm flex items-center justify-center text-muted hover:text-text hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <span className="text-[12px] text-muted tabular-nums">
                  {activeDay + 1} / {dailyLogs.length}
                </span>
                <button
                  onClick={() =>
                    onChangeDay(Math.min(dailyLogs.length - 1, activeDay + 1))
                  }
                  disabled={activeDay === dailyLogs.length - 1}
                  aria-label="Next day"
                  className="w-7 h-7 rounded-sm flex items-center justify-center text-muted hover:text-text hover:bg-surface-secondary disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close expanded view"
            className="w-8 h-8 rounded-sm flex items-center justify-center text-muted hover:text-text hover:bg-surface-secondary cursor-pointer transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Legend bar */}
        <div className="shrink-0 flex items-center gap-4 bg-surface px-5 py-2 border-t border-border">
          <span className="text-[11px] text-muted font-medium uppercase tracking-wider">
            Legend
          </span>
          {DUTY_STATUS_LEGEND.map((s) => (
            <span
              key={s.label}
              className="flex items-center gap-1.5 text-[11px] text-text-secondary font-medium"
            >
              <span
                className="w-5 h-[3px] rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.label}
            </span>
          ))}
        </div>

        {/* Full-width log sheet — only this section scrolls */}
        <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar bg-surface-secondary rounded-b-sm p-4 shadow-card">
          <DailyLogSheet logDay={log} shippingInfo={shippingInfo} />
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}
