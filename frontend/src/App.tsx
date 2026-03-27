import { lazy, Suspense } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Toaster } from "sonner";
import TripForm from "./components/trip-form/TripForm";
const RouteMap = lazy(() => import("./components/map/RouteMap"));
import TripSummary from "./components/trip-summary/TripSummary";
import LogSheetViewer from "./components/log-sheet/LogSheetViewer";
import { useTripPlanner } from "./hooks/useTripPlanner";
import { fadeUp, fadeDown, fadeScale } from "./constants/animations";

export default function App() {
  const {
    tripPlan,
    isLoading,
    error,
    activeTab,
    shippingInfo,
    isFormCollapsed,
    setActiveTab,
    setError,
    setIsFormCollapsed,
    handleSubmit,
    handleReset,
  } = useTripPlanner();

  return (
    <div className="min-h-dvh bg-background">
      {/* Skip to content — visible on focus for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-secondary focus:text-white focus:sm focus:text-[13px] focus:font-semibold focus:shadow-lg focus:outline-none"
      >
        Skip to content
      </a>

      {/* Screen reader live region for announcements */}
      <div
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
        id="sr-announcements"
      >
        {isLoading && "Planning your route, please wait."}
        {tripPlan &&
          !isLoading &&
          `Route planned successfully. ${tripPlan.stops.length} stops across ${tripPlan.daily_logs.length} days.`}
        {error && `Error: ${error}`}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-primary/95 backdrop-blur-md border-b border-white/10 no-print">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-white/10 rounded-sm flex items-center justify-center ring-1 ring-white/15">
            <svg
              className="w-5 h-5 text-white/90"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.75}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-[15px] font-bold text-white tracking-tight leading-tight">
              ELD Trip Planner
            </h1>
            <p className="text-[11px] text-white/50 font-medium">
              FMCSA HOS Compliant Route Planning
            </p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-[10px] sm:text-[11px] px-2.5 py-1 bg-emerald-500/15 text-emerald-300 rounded-sm font-semibold ring-1 ring-emerald-400/20 tracking-wide uppercase">
              FMCSA Compliant
            </span>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-7xl mx-auto px-3 sm:px-0 py-6">
        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
          {/* Left Panel: Form + Summary */}
          <aside className="w-full lg:w-[360px] shrink-0 no-print space-y-4 lg:sticky lg:top-[73px] lg:max-h-[88dvh] border border-border rounded-sm no-scrollbar p-1 bg-blue-50 lg:overflow-y-auto sidebar-scroll">
            <motion.div
              layout
              initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ type: "spring", duration: 0.4, bounce: 0 }}
              className="bg-surface rounded-sm shadow-card p-5"
            >
              <TripForm
                onSubmit={handleSubmit}
                isLoading={isLoading}
                isCollapsed={isFormCollapsed}
                onToggleCollapse={() => setIsFormCollapsed(false)}
                onReset={handleReset}
                hasResults={!!tripPlan}
              />
            </motion.div>

            {/* Error State */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error"
                  role="alert"
                  {...fadeDown}
                  className="bg-destructive-light rounded-sm shadow-card p-4 flex items-start gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                    <svg
                      className="w-4 h-4 text-destructive"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                      />
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-destructive leading-tight">
                      Route Planning Failed
                    </p>
                    <p className="text-[12px] text-destructive/80 mt-0.5">
                      Supported demo routes: Chicago, Indianapolis, Dallas,
                      Oklahoma City, Amarillo, and Miami. West Coast
                      (California, LA) etc. are not supported on the free
                      routing API.
                    </p>
                    <button
                      onClick={() => setError(null)}
                      className="mt-2 text-[12px] font-medium text-destructive hover:text-destructive/80 underline underline-offset-2 cursor-pointer transition-colors"
                    >
                      Dismiss
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Trip Summary */}
            <AnimatePresence mode="wait">
              {tripPlan && (
                <motion.div
                  key="summary"
                  {...fadeUp}
                  transition={{
                    type: "spring",
                    duration: 0.35,
                    bounce: 0,
                    delay: 0.1,
                  }}
                  className="bg-surface rounded-sm shadow-card p-5"
                >
                  <TripSummary
                    route={tripPlan.route}
                    stops={tripPlan.stops}
                    timezone={tripPlan.timezone}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </aside>

          {/* Right Panel: Map + Logs */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* Empty State */}
              {!tripPlan && !isLoading && (
                <motion.div
                  key="empty"
                  {...fadeScale}
                  className="bg-surface rounded-sm shadow-card flex items-center justify-center min-h-[320px] md:min-h-[400px] lg:min-h-[480px]"
                >
                  <div className="text-center px-8 py-12 max-w-sm">
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        type: "spring",
                        duration: 0.5,
                        bounce: 0.1,
                        delay: 0.1,
                      }}
                      className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-secondary-light flex items-center justify-center"
                    >
                      <svg
                        className="w-8 h-8 text-secondary"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                        />
                      </svg>
                    </motion.div>
                    <h3 className="text-[15px] font-semibold text-text">
                      Plan your route
                    </h3>
                    <p className="text-[13px] text-muted mt-1.5 leading-relaxed">
                      Enter your current location, pickup, and dropoff to
                      generate an HOS-compliant route with daily ELD logs.
                    </p>
                    <div className="mt-5 flex items-center justify-center gap-4 text-[11px] text-muted/70 font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-success"></span>
                        Route mapping
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                        HOS compliance
                      </span>
                      <span className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                        ELD logs
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Loading State */}
              {isLoading && (
                <motion.div
                  key="loading"
                  {...fadeScale}
                  className="bg-surface rounded-sm shadow-card p-6 space-y-4 min-h-[320px] md:min-h-[400px] lg:min-h-[480px]"
                >
                  <div className="skeleton h-64 w-full rounded-sm" />
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="skeleton h-4 w-1/3 rounded stagger-1" />
                      <div className="skeleton h-4 w-1/4 rounded stagger-2" />
                    </div>
                    <div className="skeleton h-3 w-2/5 rounded stagger-3" />
                  </div>
                  <div className="flex gap-2.5 stagger-4">
                    <div className="skeleton w-9 h-9 rounded-full" />
                    <div className="skeleton w-9 h-9 rounded-full" />
                    <div className="skeleton w-9 h-9 rounded-full" />
                    <div className="skeleton w-9 h-9 rounded-full" />
                  </div>
                  <div className="pt-4 text-center">
                    <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-secondary-light">
                      <svg
                        className="animate-spin h-3.5 w-3.5 text-secondary"
                        viewBox="0 0 24 24"
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
                      <span className="text-[13px] text-secondary font-medium">
                        Planning your route...
                      </span>
                    </div>
                    <p className="text-[11px] text-muted/60 mt-2">
                      Calculating HOS-compliant stops and daily logs
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Results */}
              {tripPlan && !isLoading && (
                <motion.div key="results" {...fadeUp} className="space-y-4">
                  {/* Tab Navigation — with sliding indicator via layoutId */}
                  <div
                    role="tablist"
                    aria-label="Trip results view"
                    className="no-print flex items-center gap-1 bg-surface-secondary rounded-sm p-1 w-fit shadow-ring relative"
                    onKeyDown={(e) => {
                      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                        e.preventDefault();
                        setActiveTab(activeTab === "map" ? "logs" : "map");
                      }
                    }}
                  >
                    {(["map", "logs"] as const).map((tab) => (
                      <button
                        key={tab}
                        role="tab"
                        aria-selected={activeTab === tab}
                        aria-controls={`tabpanel-${tab}`}
                        tabIndex={activeTab === tab ? 0 : -1}
                        onClick={() => setActiveTab(tab)}
                        className={`press-effect relative flex items-center gap-1.5 px-4 py-2 sm text-[13px] font-semibold transition-colors duration-150 cursor-pointer z-10 focus-ring
                          ${activeTab === tab ? "text-text" : "text-muted hover:text-text"}`}
                      >
                        {activeTab === tab && (
                          <motion.div
                            layoutId="tab-indicator"
                            className="absolute inset-0 bg-surface rounded-sm shadow-sm"
                            transition={{
                              type: "spring",
                              duration: 0.3,
                              bounce: 0.1,
                            }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-1.5">
                          {tab === "map" ? (
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                              />
                            </svg>
                          ) : (
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          )}
                          {tab === "map" ? "Route Map" : "ELD Logs"}
                          {tab === "logs" && (
                            <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-secondary/10 text-secondary">
                              {tripPlan.daily_logs.length}
                            </span>
                          )}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Tab Content — AnimatePresence for crossfade */}
                  <AnimatePresence mode="wait">
                    {activeTab === "map" && (
                      <motion.div
                        key="tab-map"
                        role="tabpanel"
                        id="tabpanel-map"
                        aria-labelledby="tab-map"
                        initial={{ opacity: 0, filter: "blur(3px)" }}
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, filter: "blur(2px)" }}
                        transition={{ duration: 0.2 }}
                        className="relative bg-surface rounded-sm shadow-card overflow-hidden h-[360px] md:h-[440px] lg:h-[520px]"
                      >
                        <Suspense
                          fallback={
                            <div className="flex items-center justify-center h-full bg-surface-secondary">
                              <div className="flex items-center gap-2">
                                <svg
                                  className="animate-spin h-4 w-4 text-secondary"
                                  viewBox="0 0 24 24"
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
                                <span className="text-[13px] text-muted font-medium">
                                  Loading map...
                                </span>
                              </div>
                            </div>
                          }
                        >
                          <RouteMap
                            route={tripPlan.route}
                            stops={tripPlan.stops}
                            timezone={tripPlan.timezone}
                          />
                        </Suspense>
                        {/* Route Legend */}
                        <div className="absolute bottom-3 left-3 z-1000 bg-surface/90 backdrop-blur-sm shadow-card rounded-sm px-3 py-2.5 pointer-events-none">
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-[3px] bg-secondary rounded-full" />
                              <span className="text-[11px] text-text-secondary font-medium">
                                To Pickup
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className="w-6 h-[3px] bg-accent rounded-full"
                                style={{
                                  backgroundImage:
                                    "repeating-linear-gradient(90deg, var(--color-accent) 0, var(--color-accent) 4px, transparent 4px, transparent 7px)",
                                }}
                              />
                              <span className="text-[11px] text-text-secondary font-medium">
                                To Dropoff
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeTab === "logs" && (
                      <motion.div
                        key="tab-logs"
                        role="tabpanel"
                        id="tabpanel-logs"
                        aria-labelledby="tab-logs"
                        initial={{ opacity: 0, filter: "blur(3px)" }}
                        animate={{ opacity: 1, filter: "blur(0px)" }}
                        exit={{ opacity: 0, filter: "blur(2px)" }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        <LogSheetViewer
                          dailyLogs={tripPlan.daily_logs}
                          shippingInfo={shippingInfo}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      <Toaster
        richColors
        position="bottom-right"
        toastOptions={{
          style: {
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: "13px",
          },
        }}
      />
    </div>
  );
}
