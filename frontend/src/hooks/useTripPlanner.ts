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
    try {
      const result = await planTrip(data);
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
    } catch (err: any) {
      const message =
        err?.response?.data?.error ||
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to plan trip. Please check your inputs and try again.";
      setError(message);
      toast.error("Route planning failed");
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
