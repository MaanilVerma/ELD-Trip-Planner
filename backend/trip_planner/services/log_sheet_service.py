"""
Log Sheet Service

Transforms raw HOS engine segments into per-day daily log data,
handling midnight splits and ensuring 24-hour totals.
"""

from datetime import datetime, timedelta
from collections import defaultdict


def generate_daily_logs(segments, stops, current_cycle_used=0.0):
    """
    Convert a list of TripSegments into daily log sheets.

    Each daily log covers midnight-to-midnight and contains:
    - segments split at midnight boundaries
    - per-status hour totals summing to 24.0
    - remarks list with city/state at each status change
    - total miles driven that day
    - recap section with 70hr/8day cycle tracking
    """
    if not segments:
        return []

    # Split segments at midnight boundaries
    split_segs = _split_at_midnight(segments)

    # Group by date
    days = defaultdict(list)
    for seg in split_segs:
        date_key = seg['start_time'].strftime('%Y-%m-%d')
        days[date_key] = days.get(date_key, [])
        days[date_key].append(seg)

    # Build daily logs
    daily_logs = []
    sorted_dates = sorted(days.keys())
    cumulative_cycle_hours = current_cycle_used  # Rolling 70hr/8day tracker

    for i, date_str in enumerate(sorted_dates):
        day_segments = days[date_str]
        day_segments.sort(key=lambda s: s['start_time'])

        # Calculate totals
        totals = {
            'off_duty': 0.0,
            'sleeper_berth': 0.0,
            'driving': 0.0,
            'on_duty_not_driving': 0.0,
        }
        total_miles = 0.0
        remarks = []
        prev_status = None
        prev_remark = None

        for seg in day_segments:
            duration = (seg['end_time'] - seg['start_time']).total_seconds() / 3600
            totals[seg['status']] += duration

            if seg['status'] == 'driving':
                total_miles += seg['end_mile'] - seg['start_mile']

            # Add remark on status change OR activity change (e.g. dropoff → post-trip)
            remark_text = seg.get('remark', '')
            if seg['status'] != prev_status or (remark_text and remark_text != prev_remark):
                time_str = seg['start_time'].strftime('%H:%M')
                location = seg.get('location', '')
                if remark_text and location:
                    remarks.append({
                        'time': time_str,
                        'text': f'{remark_text}, {location}',
                    })
                elif location:
                    remarks.append({
                        'time': time_str,
                        'text': f'{_status_label(seg["status"])}, {location}',
                    })
                prev_status = seg['status']
                prev_remark = remark_text

        # Normalize totals to exactly 24.0 hours
        total_sum = sum(totals.values())
        if abs(total_sum - 24.0) > 0.01:
            diff = 24.0 - total_sum
            totals['off_duty'] += diff
            totals['off_duty'] = max(0, totals['off_duty'])

        # Round totals to 2 decimal places
        for k in totals:
            totals[k] = round(totals[k], 2)

        # Format segments for frontend
        formatted_segments = []
        for seg in day_segments:
            formatted_segments.append({
                'status': seg['status'],
                'start_time': seg['start_time'].strftime('%H:%M'),
                'end_time': seg['end_time'].strftime('%H:%M'),
                'duration_hours': round(
                    (seg['end_time'] - seg['start_time']).total_seconds() / 3600, 2
                ),
                'location': seg.get('location', ''),
                'remark': seg.get('remark', ''),
            })

        # Derive from/to locations for this day
        from_location = ''
        to_location = ''
        for seg in day_segments:
            loc = seg.get('location', '')
            if loc and not from_location:
                from_location = loc
            if loc:
                to_location = loc

        # Odometer: cumulative miles at start and end of day
        day_start_mile = min(seg['start_mile'] for seg in day_segments)
        day_end_mile = max(seg['end_mile'] for seg in day_segments)
        start_odometer = round(day_start_mile)
        end_odometer = round(day_end_mile)

        # Detect 34-hour restart: resets the 70hr/8day cycle to zero
        has_34hr_restart = any(
            'restart' in seg.get('remark', '').lower() or 'cycle reset' in seg.get('remark', '').lower()
            for seg in day_segments
        )
        if has_34hr_restart:
            cumulative_cycle_hours = 0

        # Recap: 70hr/8day cycle tracking
        on_duty_today = round(totals['driving'] + totals['on_duty_not_driving'], 2)
        cumulative_cycle_hours += on_duty_today
        hours_available = round(max(0, 70.0 - cumulative_cycle_hours), 2)

        recap = {
            'on_duty_hours_today': on_duty_today,
            'total_hours_last_7_days': round(cumulative_cycle_hours, 2),
            'hours_available_tomorrow': hours_available,
            'cycle_limit': 70,
            'cycle_days': 8,
        }

        daily_logs.append({
            'date': date_str,
            'day_number': i + 1,
            'total_miles_today': round(total_miles),
            'start_odometer': start_odometer,
            'end_odometer': end_odometer,
            'from_location': from_location,
            'to_location': to_location,
            'segments': formatted_segments,
            'totals': totals,
            'remarks': remarks,
            'recap': recap,
        })

    return daily_logs


def _split_at_midnight(segments):
    """Split segments that cross midnight into two separate segments."""
    result = []

    for seg in segments:
        start = seg.start_time
        end = seg.end_time

        while start.date() < end.date():
            # This segment crosses midnight
            next_midnight = (start + timedelta(days=1)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )

            # First part: start to midnight
            total_duration = (end - start).total_seconds()
            first_duration = (next_midnight - start).total_seconds()
            if total_duration > 0:
                mile_fraction = first_duration / total_duration
            else:
                mile_fraction = 0

            mile_range = seg.end_mile - seg.start_mile
            split_mile = seg.start_mile + mile_range * mile_fraction

            result.append({
                'status': seg.status.value if hasattr(seg.status, 'value') else seg.status,
                'start_time': start,
                'end_time': next_midnight,
                'start_mile': seg.start_mile if start == seg.start_time else split_mile,
                'end_mile': split_mile,
                'location': seg.location,
                'remark': seg.remark,
            })

            start = next_midnight
            seg_start_mile = split_mile

        # Remaining part (or full segment if no midnight crossing)
        if start < end:
            result.append({
                'status': seg.status.value if hasattr(seg.status, 'value') else seg.status,
                'start_time': start,
                'end_time': end,
                'start_mile': seg.start_mile if start == seg.start_time else seg_start_mile,
                'end_mile': seg.end_mile,
                'location': seg.location,
                'remark': seg.remark,
            })

    return result


def _status_label(status):
    labels = {
        'off_duty': 'Off Duty',
        'sleeper_berth': 'Sleeper Berth',
        'driving': 'Driving',
        'on_duty_not_driving': 'On Duty',
    }
    return labels.get(status, status)
