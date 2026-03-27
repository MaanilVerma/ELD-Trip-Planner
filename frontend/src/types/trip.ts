export type DutyStatus = 'off_duty' | 'sleeper_berth' | 'driving' | 'on_duty_not_driving';
export type StopType = 'start' | 'pickup' | 'dropoff' | 'rest_break' | 'sleeper' | 'fuel';

export interface ShippingInfo {
  shipperName: string;
  commodity: string;
  documentNumber: string;
}

export interface Location {
  lat: number;
  lng: number;
  name?: string;
  display_name?: string;
}

export interface Stop {
  id: number;
  type: StopType;
  location: Location;
  arrival_time: string;
  departure_time: string;
  duration_hours: number;
  reason: string;
  cumulative_miles: number;
}

export interface LogSegment {
  status: DutyStatus;
  start_time: string; // "HH:MM"
  end_time: string;
  duration_hours: number;
  location: string;
  remark: string;
}

export interface StatusTotals {
  off_duty: number;
  sleeper_berth: number;
  driving: number;
  on_duty_not_driving: number;
}

export interface Remark {
  time: string;
  text: string;
}

export interface RecapData {
  on_duty_hours_today: number;
  total_hours_last_7_days: number;
  hours_available_tomorrow: number;
  cycle_limit: number;
  cycle_days: number;
}

export interface DailyLog {
  date: string;
  day_number: number;
  total_miles_today: number;
  start_odometer: number;
  end_odometer: number;
  from_location: string;
  to_location: string;
  segments: LogSegment[];
  totals: StatusTotals;
  remarks: Remark[];
  recap: RecapData;
}

export interface RouteData {
  total_distance_miles: number;
  total_drive_time_hours: number;
  coordinates: [number, number][];
  leg1_end_index: number;
  start_location: Location;
  pickup_location: Location;
  dropoff_location: Location;
}

export interface TripPlanResponse {
  route: RouteData;
  stops: Stop[];
  daily_logs: DailyLog[];
  timezone: string;
  trip_start: string;
}

export interface TripFormData {
  currentLocation: string;
  pickupLocation: string;
  dropoffLocation: string;
  currentCycleUsed: number;
  startHour: number;
  shipperName: string;
  commodity: string;
  documentNumber: string;
}
