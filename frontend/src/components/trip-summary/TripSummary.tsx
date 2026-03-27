import { memo } from "react";
import { motion } from "motion/react";
import type { Stop, RouteData } from "../../types/trip";

interface Props {
  route: RouteData;
  stops: Stop[];
  timezone: string;
}

const STOP_STYLES: Record<string, { bg: string; ring: string }> = {
  start: { bg: "bg-success", ring: "ring-success/20" },
  pickup: { bg: "bg-secondary", ring: "ring-secondary/20" },
  dropoff: { bg: "bg-primary", ring: "ring-primary/20" },
  rest_break: { bg: "bg-amber-500", ring: "ring-amber-500/20" },
  sleeper: { bg: "bg-destructive", ring: "ring-destructive/20" },
  fuel: { bg: "bg-cyan-600", ring: "ring-cyan-600/20" },
};

const STOP_ICONS: Record<string, string> = {
  start: "S",
  pickup: "P",
  dropoff: "D",
  rest_break: "R",
  sleeper: "Z",
  fuel: "F",
};

function formatTime(isoString: string, timeZone: string) {
  const d = new Date(isoString);
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone,
  });
}

function formatDate(isoString: string, timeZone: string) {
  const d = new Date(isoString);
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone,
  });
}

function TripSummary({ route, stops, timezone }: Props) {
  return (
    <div className="space-y-5">
      {/* Route Stats */}
      <div className="grid grid-cols-2 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ type: "spring", duration: 0.35, bounce: 0 }}
          className="bg-secondary-light rounded-sm p-3.5 text-center"
        >
          <p className="text-[11px] text-secondary font-semibold uppercase tracking-wider">
            Distance
          </p>
          <p className="text-xl font-bold text-text mt-0.5 tabular-nums">
            {Math.round(route.total_distance_miles).toLocaleString()}
            <span className="text-[13px] font-medium text-text-secondary ml-0.5">
              mi
            </span>
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 6, filter: "blur(3px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{
            type: "spring",
            duration: 0.35,
            bounce: 0,
            delay: 0.06,
          }}
          className="bg-success-light rounded-sm p-3.5 text-center"
        >
          <p className="text-[11px] text-success font-semibold uppercase tracking-wider">
            Drive Time
          </p>
          <p className="text-xl font-bold text-text mt-0.5 tabular-nums">
            {route.total_drive_time_hours.toFixed(1)}
            <span className="text-[13px] font-medium text-text-secondary ml-0.5">
              hrs
            </span>
          </p>
        </motion.div>
      </div>

      {/* Stops Timeline */}
      <div>
        <h3 className="text-[11px] font-semibold text-muted uppercase tracking-wider mb-3">
          Trip Stops
        </h3>
        <div className="space-y-0">
          {stops.map((stop, i) => {
            const style = STOP_STYLES[stop.type] || {
              bg: "bg-muted",
              ring: "ring-muted/20",
            };
            return (
              <motion.div
                key={stop.id}
                initial={{ opacity: 0, x: -6, filter: "blur(3px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                transition={{
                  type: "spring",
                  duration: 0.35,
                  bounce: 0,
                  delay: Math.min(i * 0.05, 0.3),
                }}
                className="flex items-start gap-3 group"
              >
                {/* Timeline line + icon */}
                <div className="flex flex-col items-center">
                  <div
                    className={`w-7 h-7 rounded-sm ${style.bg}
                                  flex items-center justify-center text-white text-[11px] font-bold
                                  shrink-0 shadow-xs ring-2 ${style.ring}`}
                  >
                    {STOP_ICONS[stop.type] || "?"}
                  </div>
                  {i < stops.length - 1 && (
                    <div className="w-px h-8 bg-border/70 my-0.5" />
                  )}
                </div>

                {/* Stop details */}
                <div className="pb-3 min-w-0 flex-1 -mt-0.5">
                  <p className="text-[13px] font-medium text-text leading-tight">
                    {stop.reason}
                  </p>
                  <p className="text-[12px] text-muted mt-0.5 truncate">
                    {stop.location.name}
                  </p>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted/60 mt-0.5 tabular-nums">
                    <span>{formatDate(stop.arrival_time, timezone)}</span>
                    <span className="text-border">·</span>
                    <span>{formatTime(stop.arrival_time, timezone)}</span>
                    {stop.duration_hours > 0 && (
                      <>
                        <span className="text-border">·</span>
                        <span>{stop.duration_hours}hr</span>
                      </>
                    )}
                    <span className="text-border">·</span>
                    <span>Mi {stop.cumulative_miles}</span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default memo(TripSummary);
