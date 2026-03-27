"""
HOS (Hours of Service) Calculation Engine

Implements FMCSA HOS rules for property-carrying drivers (70hr/8day):
- 11-Hour Driving Limit
- 14-Hour Driving Window
- 30-Minute Rest Break after 8 cumulative hours driving
- 10-Hour Off-Duty minimum between shifts
- 70-Hour/8-Day rolling limit
- Fueling every 1,000 miles
- 1 hour pickup/dropoff (on-duty not driving)
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import List, Tuple
import math

from .routing_service import interpolate_point_on_route
from .geocoding_service import reverse_geocode


class DutyStatus(str, Enum):
    OFF_DUTY = 'off_duty'
    SLEEPER_BERTH = 'sleeper_berth'
    DRIVING = 'driving'
    ON_DUTY_NOT_DRIVING = 'on_duty_not_driving'


class StopType(str, Enum):
    START = 'start'
    PICKUP = 'pickup'
    DROPOFF = 'dropoff'
    REST_BREAK = 'rest_break'
    SLEEPER = 'sleeper'
    FUEL = 'fuel'


@dataclass
class TripSegment:
    status: DutyStatus
    start_time: datetime
    end_time: datetime
    start_mile: float
    end_mile: float
    location: str
    remark: str = ''

    def duration_hours(self):
        return (self.end_time - self.start_time).total_seconds() / 3600


@dataclass
class Stop:
    stop_type: StopType
    lat: float
    lng: float
    location_name: str
    arrival_time: datetime
    departure_time: datetime
    cumulative_miles: float
    reason: str

    def duration_hours(self):
        return (self.departure_time - self.arrival_time).total_seconds() / 3600


@dataclass
class DriverState:
    current_time: datetime
    current_mile: float = 0.0
    shift_driving_hours: float = 0.0
    shift_elapsed_hours: float = 0.0
    hours_since_break: float = 0.0  # cumulative driving since last 30-min break
    cycle_hours_used: float = 0.0
    miles_since_last_fuel: float = 0.0
    shift_started: bool = False


def _round_down_15min(hours):
    """Round down to nearest 15-minute (0.25 hour) increment."""
    return math.floor(hours * 4) / 4


def _round_to_15min(dt):
    """Round datetime to nearest 15 minutes."""
    minutes = dt.minute
    rounded = (minutes // 15) * 15
    return dt.replace(minute=rounded, second=0, microsecond=0)


def plan_trip(current_loc, pickup_loc, dropoff_loc, current_cycle_used,
              leg1_route, leg2_route, start_time):
    """
    Main entry point. Plans a complete trip with HOS-compliant stops.

    Args:
        current_loc: dict with lat, lng, display_name
        pickup_loc: dict with lat, lng, display_name
        dropoff_loc: dict with lat, lng, display_name
        current_cycle_used: float, hours already used in 70hr/8day cycle
        leg1_route: dict from routing_service (current -> pickup)
        leg2_route: dict from routing_service (pickup -> dropoff)
        start_time: datetime when trip starts

    Returns:
        (stops: List[Stop], segments: List[TripSegment])
    """
    state = DriverState(
        current_time=start_time,
        current_mile=0.0,
        cycle_hours_used=current_cycle_used,
    )

    segments: List[TripSegment] = []
    stops: List[Stop] = []

    # Combined route coordinates for interpolation
    combined_coords = leg1_route['coordinates'] + leg2_route['coordinates'][1:]
    leg1_distance = leg1_route['distance_miles']
    total_distance = leg1_distance + leg2_route['distance_miles']

    # Start location name
    start_name = _short_name(current_loc.get('display_name', 'Start'))
    pickup_name = _short_name(pickup_loc.get('display_name', 'Pickup'))
    dropoff_name = _short_name(dropoff_loc.get('display_name', 'Dropoff'))

    # === Off-duty from midnight to start_time ===
    midnight = start_time.replace(hour=0, minute=0, second=0, microsecond=0)
    if start_time > midnight:
        segments.append(TripSegment(
            status=DutyStatus.OFF_DUTY,
            start_time=midnight,
            end_time=start_time,
            start_mile=0, end_mile=0,
            location=start_name,
            remark='Off Duty',
        ))

    # === Start stop ===
    stops.append(Stop(
        stop_type=StopType.START,
        lat=current_loc['lat'], lng=current_loc['lng'],
        location_name=start_name,
        arrival_time=start_time, departure_time=start_time,
        cumulative_miles=0, reason='Trip start',
    ))

    # === Pre-trip inspection: 15 min on-duty ===
    _add_on_duty(state, segments, 0.25, start_name, 'Pre-trip inspection')
    state.shift_started = True

    # === LEG 1: Drive current -> pickup ===
    leg1_speed = leg1_route['distance_miles'] / max(leg1_route['duration_hours'], 0.1)
    _execute_drive(state, segments, stops, leg1_route['distance_miles'],
                   leg1_speed, combined_coords, total_distance)

    # === PICKUP: 1 hour on-duty not driving ===
    stops.append(Stop(
        stop_type=StopType.PICKUP,
        lat=pickup_loc['lat'], lng=pickup_loc['lng'],
        location_name=pickup_name,
        arrival_time=state.current_time,
        departure_time=state.current_time + timedelta(hours=1),
        cumulative_miles=state.current_mile,
        reason='Pickup - Loading (On Duty)',
    ))
    _add_on_duty(state, segments, 1.0, pickup_name, 'Pickup / Loading')

    # === LEG 2: Drive pickup -> dropoff ===
    leg2_speed = leg2_route['distance_miles'] / max(leg2_route['duration_hours'], 0.1)
    _execute_drive(state, segments, stops, leg2_route['distance_miles'],
                   leg2_speed, combined_coords, total_distance)

    # === DROPOFF: 1 hour on-duty not driving ===
    stops.append(Stop(
        stop_type=StopType.DROPOFF,
        lat=dropoff_loc['lat'], lng=dropoff_loc['lng'],
        location_name=dropoff_name,
        arrival_time=state.current_time,
        departure_time=state.current_time + timedelta(hours=1),
        cumulative_miles=state.current_mile,
        reason='Dropoff - Unloading (On Duty)',
    ))
    _add_on_duty(state, segments, 1.0, dropoff_name, 'Dropoff / Unloading')

    # === Post-trip inspection: 15 min on-duty ===
    _add_on_duty(state, segments, 0.25, dropoff_name, 'Post-trip inspection')

    # === Fill remainder of final day with off-duty ===
    _fill_to_midnight(state, segments, dropoff_name)

    return stops, segments


def _execute_drive(state, segments, stops, remaining_distance, avg_speed,
                   route_coords, total_route_distance):
    """Drive a given distance, inserting mandatory stops as needed."""
    while remaining_distance > 0.5:  # 0.5 mile tolerance
        # Calculate max drivable hours before any limit
        max_by_11hr = 11.0 - state.shift_driving_hours
        max_by_14hr = 14.0 - state.shift_elapsed_hours
        max_by_8hr_break = 8.0 - state.hours_since_break
        max_by_70hr = 70.0 - state.cycle_hours_used
        max_by_fuel = (1000.0 - state.miles_since_last_fuel) / max(avg_speed, 1)
        max_by_remaining = remaining_distance / max(avg_speed, 1)

        raw_drive = min(
            max_by_11hr,
            max_by_14hr,
            max_by_8hr_break,
            max_by_70hr,
            max_by_fuel,
            max_by_remaining,
        )
        raw_drive = max(0, raw_drive)
        # 15-minute rounding can turn a positive legal chunk (e.g. fuel window) into 0.
        # Then elif max_by_fuel <= 0 misses (fuel limit is > 0) and we wrongly take 10hr rest
        # without reducing remaining_distance → infinite loop.
        if 0 < raw_drive < 0.25:
            drive_hours = raw_drive
        else:
            drive_hours = _round_down_15min(raw_drive)

        if drive_hours <= 0:
            # Must stop — determine which constraint is binding
            if max_by_8hr_break <= 0 and max_by_11hr > 0.5 and max_by_14hr > 0.5:
                # Only 30-min break needed
                _take_30min_break(state, segments, stops, route_coords, total_route_distance)
            elif max_by_fuel <= 0:
                _take_fuel_stop(state, segments, stops, route_coords, total_route_distance)
            elif max_by_70hr <= 0:
                # 70hr cycle limit — need 34-hour restart (FMCSA §395.3(c))
                _take_34hr_restart(state, segments, stops, route_coords, total_route_distance)
            else:
                # 11hr or 14hr limit — need 10-hr rest
                _take_10hr_rest(state, segments, stops, route_coords, total_route_distance)
            continue

        # Drive for drive_hours
        drive_miles = drive_hours * avg_speed
        drive_miles = min(drive_miles, remaining_distance)

        location = _get_location_name(state.current_mile, route_coords, total_route_distance)

        segments.append(TripSegment(
            status=DutyStatus.DRIVING,
            start_time=state.current_time,
            end_time=state.current_time + timedelta(hours=drive_hours),
            start_mile=state.current_mile,
            end_mile=state.current_mile + drive_miles,
            location=location,
            remark='Driving',
        ))

        state.current_time += timedelta(hours=drive_hours)
        state.current_mile += drive_miles
        state.shift_driving_hours += drive_hours
        state.shift_elapsed_hours += drive_hours
        state.hours_since_break += drive_hours
        state.cycle_hours_used += drive_hours
        state.miles_since_last_fuel += drive_miles
        remaining_distance -= drive_miles

        # Check if we need to stop after this drive segment
        if remaining_distance > 0.5:
            if state.miles_since_last_fuel >= 995:
                _take_fuel_stop(state, segments, stops, route_coords, total_route_distance)
            elif state.hours_since_break >= 7.75:
                _take_30min_break(state, segments, stops, route_coords, total_route_distance)
            elif state.cycle_hours_used >= 69.75:
                # 70hr cycle approaching — need 34-hour restart
                _take_34hr_restart(state, segments, stops, route_coords, total_route_distance)
            elif state.shift_driving_hours >= 10.75 or state.shift_elapsed_hours >= 13.75:
                _take_10hr_rest(state, segments, stops, route_coords, total_route_distance)


def _take_30min_break(state, segments, stops, route_coords, total_route_distance):
    """Take a mandatory 30-minute rest break (off-duty)."""
    location = _get_location_name(state.current_mile, route_coords, total_route_distance)
    lat, lng = _get_coords(state.current_mile, route_coords, total_route_distance)

    stops.append(Stop(
        stop_type=StopType.REST_BREAK,
        lat=lat, lng=lng,
        location_name=location,
        arrival_time=state.current_time,
        departure_time=state.current_time + timedelta(minutes=30),
        cumulative_miles=state.current_mile,
        reason='30-min rest break (8hr driving limit)',
    ))

    segments.append(TripSegment(
        status=DutyStatus.OFF_DUTY,
        start_time=state.current_time,
        end_time=state.current_time + timedelta(minutes=30),
        start_mile=state.current_mile, end_mile=state.current_mile,
        location=location,
        remark='30-min break',
    ))

    state.current_time += timedelta(minutes=30)
    state.shift_elapsed_hours += 0.5  # Counts against 14-hr window
    state.hours_since_break = 0  # Reset driving-since-break counter
    # Does NOT count toward cycle_hours_used (off-duty)
    # Does NOT reset shift_driving_hours (only 10hr rest does that)


def _take_fuel_stop(state, segments, stops, route_coords, total_route_distance):
    """Take a 30-minute fuel stop (on-duty not driving)."""
    location = _get_location_name(state.current_mile, route_coords, total_route_distance)
    lat, lng = _get_coords(state.current_mile, route_coords, total_route_distance)

    stops.append(Stop(
        stop_type=StopType.FUEL,
        lat=lat, lng=lng,
        location_name=location,
        arrival_time=state.current_time,
        departure_time=state.current_time + timedelta(minutes=30),
        cumulative_miles=state.current_mile,
        reason='Fuel stop (every 1,000 miles)',
    ))

    segments.append(TripSegment(
        status=DutyStatus.ON_DUTY_NOT_DRIVING,
        start_time=state.current_time,
        end_time=state.current_time + timedelta(minutes=30),
        start_mile=state.current_mile, end_mile=state.current_mile,
        location=location,
        remark='Fueling',
    ))

    state.current_time += timedelta(minutes=30)
    state.shift_elapsed_hours += 0.5
    state.cycle_hours_used += 0.5  # On-duty counts toward 70hr
    state.miles_since_last_fuel = 0
    # Per FMCSA 2022: on-duty not driving counts for 30-min break
    state.hours_since_break = 0


def _take_10hr_rest(state, segments, stops, route_coords, total_route_distance):
    """Take a mandatory 10-hour off-duty rest period."""
    location = _get_location_name(state.current_mile, route_coords, total_route_distance)
    lat, lng = _get_coords(state.current_mile, route_coords, total_route_distance)

    stops.append(Stop(
        stop_type=StopType.SLEEPER,
        lat=lat, lng=lng,
        location_name=location,
        arrival_time=state.current_time,
        departure_time=state.current_time + timedelta(hours=10),
        cumulative_miles=state.current_mile,
        reason='10-hour off-duty rest (mandatory)',
    ))

    # Split: 1hr off-duty (post-trip) + 9hr sleeper berth
    segments.append(TripSegment(
        status=DutyStatus.OFF_DUTY,
        start_time=state.current_time,
        end_time=state.current_time + timedelta(hours=1),
        start_mile=state.current_mile, end_mile=state.current_mile,
        location=location,
        remark='Post-trip inspection',
    ))
    segments.append(TripSegment(
        status=DutyStatus.SLEEPER_BERTH,
        start_time=state.current_time + timedelta(hours=1),
        end_time=state.current_time + timedelta(hours=10),
        start_mile=state.current_mile, end_mile=state.current_mile,
        location=location,
        remark='Sleeper berth rest',
    ))

    state.current_time += timedelta(hours=10)
    # Reset shift counters
    state.shift_driving_hours = 0
    state.shift_elapsed_hours = 0
    state.hours_since_break = 0
    # cycle_hours_used does NOT reset (rolling 8-day window)

    # Pre-trip for new shift: 15 min on-duty
    _add_on_duty(state, segments, 0.25, location, 'Pre-trip inspection')


def _take_34hr_restart(state, segments, stops, route_coords, total_route_distance):
    """
    Take a 34-hour restart to reset the 70hr/8day cycle (FMCSA §395.3(c)).

    After 34 consecutive hours off duty, the driver's weekly hours reset to zero.
    Structure: 1hr off-duty (post-trip) + 33hr sleeper berth, then pre-trip.
    """
    location = _get_location_name(state.current_mile, route_coords, total_route_distance)
    lat, lng = _get_coords(state.current_mile, route_coords, total_route_distance)

    stops.append(Stop(
        stop_type=StopType.SLEEPER,
        lat=lat, lng=lng,
        location_name=location,
        arrival_time=state.current_time,
        departure_time=state.current_time + timedelta(hours=34),
        cumulative_miles=state.current_mile,
        reason='34-hour restart (70hr/8day cycle reset)',
    ))

    # Split: 1hr off-duty (post-trip) + 33hr sleeper berth
    segments.append(TripSegment(
        status=DutyStatus.OFF_DUTY,
        start_time=state.current_time,
        end_time=state.current_time + timedelta(hours=1),
        start_mile=state.current_mile, end_mile=state.current_mile,
        location=location,
        remark='Post-trip inspection',
    ))
    segments.append(TripSegment(
        status=DutyStatus.SLEEPER_BERTH,
        start_time=state.current_time + timedelta(hours=1),
        end_time=state.current_time + timedelta(hours=34),
        start_mile=state.current_mile, end_mile=state.current_mile,
        location=location,
        remark='34-hour restart (cycle reset)',
    ))

    state.current_time += timedelta(hours=34)
    # Reset ALL counters — including cycle (this is what makes it a restart)
    state.shift_driving_hours = 0
    state.shift_elapsed_hours = 0
    state.hours_since_break = 0
    state.cycle_hours_used = 0  # 34-hr restart resets the 70hr/8day cycle to zero

    # Pre-trip for new shift: 15 min on-duty
    _add_on_duty(state, segments, 0.25, location, 'Pre-trip inspection')


def _add_on_duty(state, segments, duration_hours, location, remark):
    """Add on-duty not driving time."""
    segments.append(TripSegment(
        status=DutyStatus.ON_DUTY_NOT_DRIVING,
        start_time=state.current_time,
        end_time=state.current_time + timedelta(hours=duration_hours),
        start_mile=state.current_mile, end_mile=state.current_mile,
        location=location,
        remark=remark,
    ))
    state.current_time += timedelta(hours=duration_hours)
    state.shift_elapsed_hours += duration_hours
    state.cycle_hours_used += duration_hours
    # On-duty not driving does NOT count toward 11hr driving limit
    # But DOES count toward 14hr window and 70hr cycle
    # Also resets the 30-min break counter if >= 30 min
    if duration_hours >= 0.5:
        state.hours_since_break = 0


def _fill_to_midnight(state, segments, location):
    """Fill the rest of the current day with off-duty."""
    next_midnight = (state.current_time + timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    if state.current_time < next_midnight:
        segments.append(TripSegment(
            status=DutyStatus.OFF_DUTY,
            start_time=state.current_time,
            end_time=next_midnight,
            start_mile=state.current_mile, end_mile=state.current_mile,
            location=location,
            remark='Off Duty',
        ))


def _get_location_name(current_mile, route_coords, total_distance):
    """Get city/state name at a given mileage along the route."""
    try:
        lat, lng = _get_coords(current_mile, route_coords, total_distance)
        return reverse_geocode(lat, lng)
    except Exception:
        return 'En Route'


def _get_coords(current_mile, route_coords, total_distance):
    """Get coordinates at a given mileage along the route."""
    try:
        return interpolate_point_on_route(route_coords, current_mile)
    except Exception:
        if route_coords:
            return tuple(route_coords[-1])
        return (0, 0)


def _short_name(display_name):
    """Extract a short city/state name from a full display name."""
    parts = display_name.split(',')
    if len(parts) >= 2:
        city = parts[0].strip()
        # Try to find state abbreviation
        for part in parts[1:]:
            part = part.strip()
            if len(part) == 2 and part.isalpha():
                return f'{city}, {part.upper()}'
        # Fall back to second part
        return f'{city}, {parts[1].strip()}'
    return display_name[:30]
