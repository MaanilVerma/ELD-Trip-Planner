import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { TripFormData, Location } from "../../types/trip";
import { searchLocations } from "../../api/tripApi";

interface Props {
  onSubmit: (data: TripFormData) => void;
  isLoading: boolean;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onReset?: () => void;
  hasResults?: boolean;
}

export default function TripForm({
  onSubmit,
  isLoading,
  isCollapsed,
  onToggleCollapse,
  onReset,
  hasResults,
}: Props) {
  const initialForm: TripFormData = {
    currentLocation: "",
    pickupLocation: "",
    dropoffLocation: "",
    currentCycleUsed: 0,
    startHour: 8,
    shipperName: "",
    commodity: "",
    documentNumber: "",
  };
  const [form, setForm] = useState<TripFormData>(initialForm);
  const [showShipping, setShowShipping] = useState(false);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const markTouched = (field: string) =>
    setTouched((prev) => ({ ...prev, [field]: true }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Mark all required fields as touched to show errors
    setTouched({
      currentLocation: true,
      pickupLocation: true,
      dropoffLocation: true,
    });
    if (!form.currentLocation || !form.pickupLocation || !form.dropoffLocation)
      return;
    onSubmit(form);
  };

  // Collapsed summary view after results
  if (isCollapsed && hasResults) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold text-text truncate">
              {form.currentLocation.split(",")[0]} →{" "}
              {form.pickupLocation.split(",")[0]} →{" "}
              {form.dropoffLocation.split(",")[0]}
            </p>
            <p className="text-[11px] text-muted mt-0.5">
              {form.currentCycleUsed}hr cycle used ·{" "}
              {form.startHour === 0
                ? "12 AM"
                : form.startHour < 12
                  ? `${form.startHour} AM`
                  : form.startHour === 12
                    ? "12 PM"
                    : `${form.startHour - 12} PM`}{" "}
              start
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={onToggleCollapse}
              className="press-effect h-8 px-3 bg-surface-secondary text-text-secondary text-[12px] font-medium
                         rounded-sm hover:bg-surface hover:text-text shadow-ring
                         flex items-center gap-1.5 cursor-pointer"
            >
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                setForm(initialForm);
                setTouched({});
                setShowShipping(false);
                onReset?.();
              }}
              className="press-effect h-8 px-3 bg-surface-secondary text-muted text-[12px] font-medium
                         rounded-sm hover:bg-destructive-light hover:text-destructive shadow-ring
                         flex items-center gap-1.5 cursor-pointer"
            >
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
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              New
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="text-center mb-5">
        <h2 className="text-[15px] font-bold text-text tracking-tight">
          {hasResults ? "Trip Details" : "Plan Your Route"}
        </h2>
        {!hasResults && (
          <p className="text-[12px] text-muted mt-0.5">
            Generate HOS-compliant route with ELD logs
          </p>
        )}
        {hasResults && (
          <p className="text-[12px] text-muted mt-0.5">
            Modify inputs and re-plan
          </p>
        )}
      </div>

      <LocationField
        label="Current Location"
        placeholder="e.g. Dallas, TX"
        value={form.currentLocation}
        onChange={(v) => setForm({ ...form, currentLocation: v })}
        onBlur={() => markTouched("currentLocation")}
        error={
          touched.currentLocation && !form.currentLocation
            ? "Location is required"
            : undefined
        }
        required
        icon={
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
          </svg>
        }
      />

      <LocationField
        label="Pickup Location"
        placeholder="e.g. Oklahoma City, OK"
        value={form.pickupLocation}
        onChange={(v) => setForm({ ...form, pickupLocation: v })}
        onBlur={() => markTouched("pickupLocation")}
        error={
          touched.pickupLocation && !form.pickupLocation
            ? "Location is required"
            : undefined
        }
        required
        icon={
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        }
      />

      <LocationField
        label="Dropoff Location"
        placeholder="e.g. Amarillo, TX"
        value={form.dropoffLocation}
        onChange={(v) => setForm({ ...form, dropoffLocation: v })}
        onBlur={() => markTouched("dropoffLocation")}
        error={
          touched.dropoffLocation && !form.dropoffLocation
            ? "Location is required"
            : undefined
        }
        required
        icon={
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
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        }
      />

      {/* Cycle Used — slider with live badge */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-[13px] font-medium text-text-secondary">
            Cycle Hours Used
          </label>
          <span className="tabular-nums text-[13px] font-semibold text-text bg-surface-secondary px-2 py-0.5 rounded-sm shadow-xs">
            {form.currentCycleUsed}
            <span className="text-muted/60 font-normal"> / 70 hrs</span>
          </span>
        </div>
        <input
          type="range"
          min={0}
          max={70}
          step={0.5}
          value={form.currentCycleUsed}
          onChange={(e) =>
            setForm({ ...form, currentCycleUsed: parseFloat(e.target.value) })
          }
          className="w-full h-1.5 bg-border rounded-full appearance-none cursor-grabbing
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:bg-secondary [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-md
                     [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform
                     [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-secondary
                     [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md"
          style={{
            background: `linear-gradient(to right, var(--color-secondary) ${(form.currentCycleUsed / 70) * 100}%, var(--color-border) ${(form.currentCycleUsed / 70) * 100}%)`,
          }}
        />
        <div className="flex justify-between text-[10px] text-muted/40 mt-1 tabular-nums">
          <span>0</span>
          <span>35</span>
          <span>70</span>
        </div>
      </div>

      {/* Start Time — segmented picker */}
      <div>
        <label className="block text-[13px] font-medium text-text-secondary mb-2">
          Departure Time
        </label>
        <div className="flex gap-2 items-center">
          {/* Hour selector */}
          <div className="flex-1 grid grid-cols-6 gap-1">
            {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((displayHour) => {
              const isPM = form.startHour >= 12;
              const hour24 = isPM
                ? displayHour === 12
                  ? 12
                  : displayHour + 12
                : displayHour === 12
                  ? 0
                  : displayHour;
              const isSelected = form.startHour === hour24;
              return (
                <button
                  key={displayHour}
                  type="button"
                  onClick={() => setForm({ ...form, startHour: hour24 })}
                  className={`h-7 rounded-sm text-[11px] font-medium transition-all duration-150 cursor-pointer
                    ${
                      isSelected
                        ? "bg-secondary text-white shadow-sm"
                        : "bg-surface-secondary text-text-secondary hover:bg-surface hover:text-text shadow-xs"
                    }`}
                >
                  {displayHour}
                </button>
              );
            })}
          </div>
          {/* AM/PM toggle */}
          <div className="flex flex-col gap-1 shrink-0">
            <button
              type="button"
              onClick={() => {
                const h =
                  form.startHour >= 12 ? form.startHour - 12 : form.startHour;
                setForm({ ...form, startHour: h });
              }}
              className={`h-7 w-10 rounded-sm text-[11px] font-semibold transition-all duration-150 cursor-pointer
                ${
                  form.startHour < 12
                    ? "bg-secondary text-white shadow-sm"
                    : "bg-surface-secondary text-muted hover:text-text shadow-xs"
                }`}
            >
              AM
            </button>
            <button
              type="button"
              onClick={() => {
                const h =
                  form.startHour < 12 ? form.startHour + 12 : form.startHour;
                setForm({ ...form, startHour: h });
              }}
              className={`h-7 w-10 rounded-sm text-[11px] font-semibold transition-all duration-150 cursor-pointer
                ${
                  form.startHour >= 12
                    ? "bg-secondary text-white shadow-sm"
                    : "bg-surface-secondary text-muted hover:text-text shadow-xs"
                }`}
            >
              PM
            </button>
          </div>
        </div>
        <p className="text-[11px] text-muted/60 mt-1.5">
          Selected:{" "}
          {form.startHour === 0
            ? "12:00 AM"
            : form.startHour < 12
              ? `${form.startHour}:00 AM`
              : form.startHour === 12
                ? "12:00 PM"
                : `${form.startHour - 12}:00 PM`}
        </p>
      </div>

      {/* Shipping Documents (optional, collapsible) */}
      <div className="pt-1">
        <button
          type="button"
          onClick={() => setShowShipping(!showShipping)}
          aria-expanded={showShipping}
          aria-controls="shipping-docs"
          className="flex items-center gap-1.5 text-[12px] text-muted hover:text-text transition-colors duration-150 cursor-pointer group focus-ring rounded-[--radius-sm]"
        >
          <svg
            className={`w-3 h-3 text-muted/60 group-hover:text-muted transition-transform duration-200 ${showShipping ? "rotate-90" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5l7 7-7 7"
            />
          </svg>
          Shipping Documents
          <span className="text-muted/40">(Optional)</span>
        </button>

        <AnimatePresence>
          {showShipping && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ type: "spring", duration: 0.3, bounce: 0 }}
              className="overflow-hidden"
            >
              <div id="shipping-docs" className="mt-2.5 space-y-2">
                <input
                  type="text"
                  placeholder="Shipper Name"
                  value={form.shipperName}
                  onChange={(e) =>
                    setForm({ ...form, shipperName: e.target.value })
                  }
                  className="w-full h-10 px-3 bg-surface border border-border sm text-[13px] shadow-xs
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:border-secondary
                             transition-shadow duration-150 placeholder:text-muted/50 rounded-sm"
                />
                <input
                  type="text"
                  placeholder="Commodity"
                  value={form.commodity}
                  onChange={(e) =>
                    setForm({ ...form, commodity: e.target.value })
                  }
                  className="w-full h-10 px-3 bg-surface border border-border sm text-[13px] shadow-xs
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:border-secondary
                             transition-shadow duration-150 placeholder:text-muted/50 rounded-sm"
                />
                <input
                  type="text"
                  placeholder="DVL / Manifest No."
                  value={form.documentNumber}
                  onChange={(e) =>
                    setForm({ ...form, documentNumber: e.target.value })
                  }
                  className="w-full h-10 px-3 bg-surface border border-border sm text-[13px] shadow-xs
                             focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:border-secondary
                             transition-shadow duration-150 placeholder:text-muted/50 rounded-sm"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <button
        type="submit"
        disabled={
          isLoading ||
          !form.currentLocation ||
          !form.pickupLocation ||
          !form.dropoffLocation
        }
        className="press-effect w-full h-11 px-4 bg-accent text-white font-semibold rounded-sm
                   hover:bg-accent-hover disabled:bg-muted/20 disabled:text-muted/50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2 text-[13px]
                   shadow-sm hover:shadow-md cursor-pointer"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
            Planning Route...
          </>
        ) : (
          <>
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
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
            Plan Trip
          </>
        )}
      </button>
    </form>
  );
}

function LocationField({
  label,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  required,
  icon,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  icon: React.ReactNode;
}) {
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fetchGenerationRef = useRef(0);
  const listboxId = useRef(
    `listbox-${label.replace(/\s+/g, "-").toLowerCase()}`,
  ).current;

  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 3) {
      fetchGenerationRef.current += 1;
      setSuggestions([]);
      setIsSearching(false);
      return;
    }
    const gen = ++fetchGenerationRef.current;
    setIsSearching(true);
    try {
      const results = await searchLocations(query);
      if (gen !== fetchGenerationRef.current) return;
      setSuggestions(results);
    } catch {
      if (gen !== fetchGenerationRef.current) return;
      setSuggestions([]);
    } finally {
      if (gen === fetchGenerationRef.current) setIsSearching(false);
    }
  }, []);

  const handleChange = (v: string) => {
    onChange(v);
    setActiveIndex(-1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 400);
    setShowSuggestions(true);
  };

  const handleSelect = (loc: Location) => {
    fetchGenerationRef.current += 1;
    setIsSearching(false);
    onChange(loc.display_name || `${loc.lat}, ${loc.lng}`);
    setSuggestions([]);
    setShowSuggestions(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
        setActiveIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isOpen = showSuggestions && suggestions.length > 0;

  return (
    <div ref={wrapperRef} className="relative">
      <label
        id={`${listboxId}-label`}
        className="block text-[13px] font-medium text-text-secondary mb-1.5"
      >
        {label}
        {required && (
          <span className="text-destructive/70 ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <div className="relative">
        <span
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted/60"
          aria-hidden="true"
        >
          {icon}
        </span>
        <input
          type="text"
          role="combobox"
          aria-expanded={isOpen}
          aria-busy={isSearching}
          aria-controls={listboxId}
          aria-labelledby={`${listboxId}-label`}
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          aria-autocomplete="list"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          onBlur={onBlur}
          onKeyDown={handleKeyDown}
          title={value}
          aria-invalid={!!error}
          aria-describedby={error ? `${listboxId}-error` : undefined}
          className={`w-full h-10 pl-9 bg-surface border border-border rounded-sm text-[13px] shadow-xs
                     focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:border-secondary
                     transition-shadow duration-150 placeholder:text-muted/50
                     ${isSearching ? "pr-9" : "pr-3"}
                     ${error ? "border-destructive/50" : "border-border"}`}
        />
        {isSearching && (
          <span
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-secondary/80 pointer-events-none"
            aria-hidden="true"
          >
            <svg
              className="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-90"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            id={`${listboxId}-error`}
            role="alert"
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -2, height: 0 }}
            transition={{ type: "spring", duration: 0.2, bounce: 0 }}
            className="text-[11px] text-destructive font-medium mt-1 overflow-hidden"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {isOpen && (
          <motion.ul
            id={listboxId}
            role="listbox"
            aria-labelledby={`${listboxId}-label`}
            initial={{ opacity: 0, scale: 0.96, filter: "blur(3px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            exit={{ opacity: 0, scale: 0.97, filter: "blur(2px)" }}
            transition={{ type: "spring", duration: 0.2, bounce: 0 }}
            style={{ transformOrigin: "top center" }}
            className="absolute z-50 w-full mt-1.5 bg-surface rounded-sm
                       shadow-elevated max-h-48 overflow-y-auto py-1"
          >
            {suggestions.map((loc, i) => (
              <li
                key={i}
                id={`${listboxId}-option-${i}`}
                role="option"
                aria-selected={i === activeIndex}
                onClick={() => handleSelect(loc)}
                className={`px-3 py-2 text-[13px] text-text cursor-pointer
                           transition-colors duration-100 mx-1 rounded-[--radius-sm]
                           ${i === activeIndex ? "bg-surface-secondary" : "hover:bg-surface-secondary"}`}
              >
                <span className="line-clamp-1">{loc.display_name}</span>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
