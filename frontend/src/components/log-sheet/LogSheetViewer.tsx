/**
 * LogSheetViewer - Paginated viewer for daily log sheets with day tabs,
 * print support for all days, and PDF export.
 */

import { useState, useRef, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import DailyLogSheet from "./DailyLogSheet";
import LogSheetLightbox from "./LogSheetLightbox";
import { exportLogsToPdf } from "../../utils/exportPdf";
import type { DailyLog, ShippingInfo } from "../../types/trip";

interface Props {
  dailyLogs: DailyLog[];
  shippingInfo: ShippingInfo;
}

const DUTY_STATUS_LEGEND = [
  { label: "Off Duty", color: "#64748B" },
  { label: "Sleeper Berth", color: "#7C3AED" },
  { label: "Driving", color: "#2563EB" },
  { label: "On Duty", color: "#D97706" },
];

export default function LogSheetViewer({ dailyLogs, shippingInfo }: Props) {
  const [activeDay, setActiveDay] = useState(0);
  const [exporting, setExporting] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExportPdf = useCallback(async () => {
    if (!containerRef.current || exporting) return;
    setExporting(true);
    try {
      await exportLogsToPdf(containerRef.current);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  }, [exporting]);

  if (dailyLogs.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Header: title + action buttons */}
      <div className="flex shrink-0 items-start sm:items-center justify-between flex-col sm:flex-row gap-2 sm:gap-0">
        <h3 className="text-[13px] font-semibold text-text">
          Daily Log Sheets
          <span className="ml-1.5 text-muted font-normal">
            ({dailyLogs.length} {dailyLogs.length === 1 ? "day" : "days"})
          </span>
        </h3>
        <div className="no-print flex items-center gap-2">
          {/* Expand / Zoom */}
          <button
            onClick={() => setLightboxOpen(true)}
            aria-label="Expand log sheet"
            className="press-effect h-8 px-3 bg-surface text-text-secondary text-[12px] font-medium
                       rounded-sm shadow-ring hover:bg-surface-secondary hover:text-text
                       transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5v-4m0 4h-4m4 0l-5-5"
              />
            </svg>
            Expand
          </button>
          {/* PDF export */}
          <button
            onClick={handleExportPdf}
            disabled={exporting}
            aria-label="Export logs as PDF"
            className="press-effect h-8 px-3 bg-secondary text-white text-[12px] font-medium
                       rounded-sm hover:bg-secondary-hover disabled:bg-muted/20 disabled:text-muted/50
                       flex items-center gap-1.5 cursor-pointer
                       disabled:cursor-not-allowed shadow-xs hover:shadow-sm"
          >
            {exporting ? (
              <>
                <svg
                  className="animate-spin w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                PDF
              </>
            )}
          </button>
          {/* Print */}
          <button
            onClick={() => window.print()}
            aria-label="Print log sheets"
            className="press-effect h-8 px-3 bg-surface text-text-secondary text-[12px] font-medium
                       rounded-sm shadow-ring hover:bg-surface-secondary hover:text-text
                       transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* Day tabs */}
      {dailyLogs.length > 1 && (
        <div className="no-print flex gap-1 flex-wrap">
          {dailyLogs.map((log, i) => (
            <button
              key={i}
              onClick={() => setActiveDay(i)}
              className={`press-effect h-8 px-3 rounded-sm text-[12px] font-medium transition-all duration-150 cursor-pointer
                ${
                  activeDay === i
                    ? "bg-primary text-white shadow-xs"
                    : "bg-surface text-muted shadow-ring hover:bg-surface-secondary hover:text-text"
                }`}
            >
              Day {log.day_number}
              <span
                className={`ml-1 text-[10px] sm:text-[11px] ${activeDay === i ? "text-white/60" : "text-muted/50"}`}
              >
                (
                {new Date(log.date + "T00:00:00").toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}
                )
              </span>
            </button>
          ))}
        </div>
      )}

      {/* All log sheets — active visible, rest hidden on screen but in DOM for PDF/print */}
      <div ref={containerRef}>
        {dailyLogs.map((log, i) => (
          <div
            key={i}
            className={
              i === activeDay
                ? "overflow-x-auto py-1 pr-2 print:overflow-visible print:p-0"
                : "hidden print:block print:mt-4"
            }
          >
            <DailyLogSheet logDay={log} shippingInfo={shippingInfo} />
          </div>
        ))}
      </div>

      {/* Duty Status Legend */}
      <div className="no-print flex items-center gap-4 px-1">
        <span className="text-[11px] text-muted font-medium uppercase tracking-wider">
          Legend
        </span>
        <div className="flex items-center gap-3 flex-wrap">
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
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <LogSheetLightbox
            dailyLogs={dailyLogs}
            activeDay={activeDay}
            shippingInfo={shippingInfo}
            onChangeDay={setActiveDay}
            onClose={() => setLightboxOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
