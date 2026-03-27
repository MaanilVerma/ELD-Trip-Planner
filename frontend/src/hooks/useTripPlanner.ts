import { useState } from "react";
import { toast } from "sonner";
import { planTrip } from "../api/tripApi";
import type { TripFormData, TripPlanResponse, ShippingInfo } from "../types/trip";

type Tab = "map" | "logs";

interface TripPlannerState {
  tripPlan: TripPlanResponse | null;
  isLoading: boolean;
  error: string | null;
  activeTab: Tab;
  shippingInfo: ShippingInfo;
  isFormCollapsed: boolean;
}

interface TripPlannerActions {
  setActiveTab: (tab: Tab) => void;
  setError: (error: string | null) => void;
  setIsFormCollapsed: (collapsed: boolean) => void;
  handleSubmit: (data: TripFormData) => Promise<void>;
  handleReset: () => void;
}

export function useTripPlanner(): TripPlannerState & TripPlannerActions {
  const [tripPlan, setTripPlan] = useState<TripPlanResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("map");
  const [shippingInfo, setShippingInfo] = useState<ShippingInfo>({
    shipperName: "",
    commodity: "",
    documentNumber: "",
  });
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);

  const handleReset = () => {
    setTripPlan(null);
    setError(null);
    setIsFormCollapsed(false);
    setActiveTab("map");
  };

  const handleSubmit = async (data: TripFormData) => {
    setIsLoading(true);
    setError(null);

    // Cold-start toast: backend on free tier sleeps after inactivity.
    // Only fire if the request is still running after 8 seconds.
    const coldStartToastId = setTimeout(() => {
      toast.info("Backend is waking up…", {
        description: "Free hosting goes to sleep after inactivity. First request may take up to 50 seconds — hang tight. or reload the page to try again.",
        duration: 45_000,
        id: "cold-start",
      });
    }, 8_000);

    try {
      const result = await planTrip(data);
      clearTimeout(coldStartToastId);
      toast.dismiss("cold-start");
      setTripPlan(result);
      setShippingInfo({
        shipperName: data.shipperName,
        commodity: data.commodity,
        documentNumber: data.documentNumber,
      });
      setActiveTab("map");
      setIsFormCollapsed(true);
      toast.success("Route planned successfully", {
        description: `${result.stops.length} stops across ${result.daily_logs.length} days`,
      });
    } catch (err: unknown) {
      clearTimeout(coldStartToastId);
      toast.dismiss("cold-start");
      const e = err as { response?: { data?: { error?: string; detail?: string } }; message?: string };
      const message = e.response?.data?.error ?? e.response?.data?.detail ?? e.message ?? "Failed to plan trip. Please check your inputs and try again.";
      setError(message);
      toast.error(
        "Supported demo routes: Chicago, Indianapolis, Dallas, Oklahoma City, Amarillo, and Miami. West Coast (California, LA) etc. are not supported on the free routing API."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
  };
}
