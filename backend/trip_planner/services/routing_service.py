import math
import os
import requests

ORS_BASE = 'https://api.openrouteservice.org/v2/directions/driving-car'
ORS_API_KEY = os.environ.get('ORS_API_KEY', '')

METERS_TO_MILES = 0.000621371


def get_route(origin, destination):
    """
    Get route between two points.
    Uses OpenRouteService (primary) with haversine straight-line fallback.
    origin/destination: (lat, lng) tuples
    Returns: {distance_miles, duration_hours, coordinates: [[lat, lng], ...]}
    """
    if ORS_API_KEY:
        return _get_route_ors(origin, destination)
    return _get_route_haversine(origin, destination)


def _get_route_haversine(origin, destination):
    """Fallback: straight-line estimate when no routing API is available.
    Uses 1.3x haversine for road distance estimate, 55 mph average speed."""
    straight_miles = _haversine(origin[0], origin[1], destination[0], destination[1])
    road_miles = straight_miles * 1.3  # road distance ≈ 1.3x straight line
    duration_hours = road_miles / 55.0  # assume 55 mph average

    # Generate intermediate points along great circle for map display
    steps = max(int(road_miles / 5), 10)  # ~1 point every 5 miles
    coords = []
    for i in range(steps + 1):
        t = i / steps
        lat = origin[0] + t * (destination[0] - origin[0])
        lng = origin[1] + t * (destination[1] - origin[1])
        coords.append([lat, lng])

    return {
        'distance_miles': road_miles,
        'duration_hours': duration_hours,
        'coordinates': coords,
    }


def _get_route_ors(origin, destination):
    """Route via OpenRouteService (free, 2000 req/day)."""
    resp = requests.get(ORS_BASE, params={
        'start': f'{origin[1]},{origin[0]}',
        'end': f'{destination[1]},{destination[0]}',
    }, headers={
        'Authorization': ORS_API_KEY,
    }, timeout=30)
    resp.raise_for_status()
    data = resp.json()

    if not data.get('features'):
        raise ValueError(f'ORS routing failed: {data.get("error", {}).get("message", "unknown error")}')

    feature = data['features'][0]
    summary = feature['properties']['summary']

    # GeoJSON coordinates are [lng, lat], convert to [lat, lng]
    coords = [
        [coord[1], coord[0]]
        for coord in feature['geometry']['coordinates']
    ]

    return {
        'distance_miles': summary['distance'] * METERS_TO_MILES,
        'duration_hours': summary['duration'] / 3600,
        'coordinates': coords,
    }


def get_full_route(current_loc, pickup_loc, dropoff_loc):
    """
    Get the full route with two legs: current->pickup and pickup->dropoff.
    Each loc is a dict with 'lat' and 'lng'.
    Returns combined route data with leg information.
    """
    leg1 = get_route(
        (current_loc['lat'], current_loc['lng']),
        (pickup_loc['lat'], pickup_loc['lng'])
    )
    leg2 = get_route(
        (pickup_loc['lat'], pickup_loc['lng']),
        (dropoff_loc['lat'], dropoff_loc['lng'])
    )

    # Combine coordinates (remove duplicate pickup point)
    combined_coords = leg1['coordinates'] + leg2['coordinates'][1:]

    return {
        'leg1': leg1,
        'leg2': leg2,
        'total_distance_miles': leg1['distance_miles'] + leg2['distance_miles'],
        'total_duration_hours': leg1['duration_hours'] + leg2['duration_hours'],
        'coordinates': combined_coords,
    }


def _haversine(lat1, lng1, lat2, lng2):
    """Calculate distance in miles between two points using haversine formula."""
    R = 3958.8  # Earth radius in miles
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng / 2) ** 2)
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def interpolate_point_on_route(route_coords, target_miles):
    """
    Find the geographic point at a given mileage along the route polyline.
    route_coords: [[lat, lng], ...]
    target_miles: miles from start
    Returns: (lat, lng)
    """
    if not route_coords:
        return route_coords[0] if route_coords else (0, 0)

    cumulative = 0.0
    for i in range(len(route_coords) - 1):
        lat1, lng1 = route_coords[i]
        lat2, lng2 = route_coords[i + 1]
        segment_dist = _haversine(lat1, lng1, lat2, lng2)

        if cumulative + segment_dist >= target_miles:
            # Interpolate within this segment
            remaining = target_miles - cumulative
            if segment_dist == 0:
                return (lat1, lng1)
            fraction = remaining / segment_dist
            lat = lat1 + fraction * (lat2 - lat1)
            lng = lng1 + fraction * (lng2 - lng1)
            return (lat, lng)

        cumulative += segment_dist

    # If target_miles exceeds route length, return last point
    return tuple(route_coords[-1])


def compute_cumulative_distances(route_coords):
    """
    Compute cumulative distance at each coordinate point.
    Returns list of distances in miles, same length as route_coords.
    """
    distances = [0.0]
    for i in range(1, len(route_coords)):
        lat1, lng1 = route_coords[i - 1]
        lat2, lng2 = route_coords[i]
        d = _haversine(lat1, lng1, lat2, lng2)
        distances.append(distances[-1] + d)
    return distances
