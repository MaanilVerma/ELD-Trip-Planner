from datetime import datetime, timedelta

import pytz
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import TripRequestSerializer
from .services.geocoding_service import geocode, get_timezone, search_locations
from .services.routing_service import get_full_route
from .services.hos_engine import plan_trip
from .services.log_sheet_service import generate_daily_logs



class TripPlanView(APIView):
    """Plan a trip with HOS-compliant stops and daily log sheets."""

    def post(self, request):
        serializer = TripRequestSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            # 1. Geocode all locations
            current_loc = geocode(data['current_location'])
            pickup_loc = geocode(data['pickup_location'])
            dropoff_loc = geocode(data['dropoff_location'])

            # 2. Get timezone from starting location
            tz_name = get_timezone(current_loc['lat'], current_loc['lng'])
            tz = pytz.timezone(tz_name)

            # 3. Get route
            route_data = get_full_route(current_loc, pickup_loc, dropoff_loc)

            # 4. Determine start time in local timezone
            start_hour = data.get('start_hour', 8)
            now = datetime.now(tz)
            start_time = now.replace(hour=start_hour, minute=0, second=0, microsecond=0)
            if now.hour >= start_hour:
                start_time += timedelta(days=1)

            # 5. Run HOS engine
            stops, segments = plan_trip(
                current_loc=current_loc,
                pickup_loc=pickup_loc,
                dropoff_loc=dropoff_loc,
                current_cycle_used=data['current_cycle_used'],
                leg1_route=route_data['leg1'],
                leg2_route=route_data['leg2'],
                start_time=start_time,
            )

            # 6. Generate daily logs
            daily_logs = generate_daily_logs(
                segments, stops,
                current_cycle_used=data['current_cycle_used'],
            )

            # 7. Build response
            response = {
                'route': {
                    'total_distance_miles': round(route_data['total_distance_miles'], 1),
                    'total_drive_time_hours': round(route_data['total_duration_hours'], 1),
                    'coordinates': route_data['coordinates'],
                    'leg1_end_index': len(route_data['leg1']['coordinates']) - 1,
                    'start_location': current_loc,
                    'pickup_location': pickup_loc,
                    'dropoff_location': dropoff_loc,
                },
                'stops': [
                    {
                        'id': i + 1,
                        'type': stop.stop_type.value,
                        'location': {
                            'lat': stop.lat,
                            'lng': stop.lng,
                            'name': stop.location_name,
                        },
                        'arrival_time': stop.arrival_time.isoformat(),
                        'departure_time': stop.departure_time.isoformat(),
                        'duration_hours': round(stop.duration_hours(), 2),
                        'reason': stop.reason,
                        'cumulative_miles': round(stop.cumulative_miles),
                    }
                    for i, stop in enumerate(stops)
                ],
                'daily_logs': daily_logs,
                'timezone': tz_name,
                'trip_start': start_time.isoformat(),
            }

            return Response(response)

        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response(
                {'error': f'Failed to plan trip: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )


class LocationSearchView(APIView):
    """Search for location suggestions (autocomplete)."""

    def get(self, request):
        query = request.query_params.get('q', '').strip()
        if len(query) < 3:
            return Response([])

        try:
            results = search_locations(query, limit=5)
            return Response(results)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
