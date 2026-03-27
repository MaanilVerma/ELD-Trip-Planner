import axios from 'axios';
import type { TripFormData, TripPlanResponse, Location } from '../types/trip';

const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

export async function planTrip(data: TripFormData): Promise<TripPlanResponse> {
  const response = await api.post<TripPlanResponse>('/api/trip/plan', {
    current_location: data.currentLocation,
    pickup_location: data.pickupLocation,
    dropoff_location: data.dropoffLocation,
    current_cycle_used: data.currentCycleUsed,
    start_hour: data.startHour,
  });
  return response.data;
}

export async function searchLocations(query: string): Promise<Location[]> {
  if (query.length < 3) return [];
  const response = await api.get<Location[]>('/api/locations/search', {
    params: { q: query },
  });
  return response.data;
}
