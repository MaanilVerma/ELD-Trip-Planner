import time
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from timezonefinder import TimezoneFinder

_tf = TimezoneFinder()
_geocode_cache = {}
_reverse_cache = {}
_last_request_time = 0

NOMINATIM_BASE = 'https://nominatim.openstreetmap.org'
HEADERS = {'User-Agent': 'ELDTripPlanner/1.0 (educational project)'}

# Session with retry logic
_session = requests.Session()
_retry = Retry(total=3, backoff_factor=1, status_forcelist=[429, 500, 502, 503, 504])
_session.mount('https://', HTTPAdapter(max_retries=_retry))
_session.headers.update(HEADERS)


def _rate_limit():
    global _last_request_time
    elapsed = time.time() - _last_request_time
    if elapsed < 1.1:
        time.sleep(1.1 - elapsed)
    _last_request_time = time.time()


def geocode(address):
    """Geocode an address string to {lat, lng, display_name}."""
    if address in _geocode_cache:
        return _geocode_cache[address]

    _rate_limit()
    resp = _session.get(f'{NOMINATIM_BASE}/search', params={
        'q': address,
        'format': 'json',
        'limit': 1,
        'countrycodes': 'us',
    }, headers=HEADERS, timeout=10)
    resp.raise_for_status()
    results = resp.json()

    if not results:
        raise ValueError(f'Could not geocode address: {address}')

    result = results[0]
    data = {
        'lat': float(result['lat']),
        'lng': float(result['lon']),
        'display_name': result['display_name'],
    }
    _geocode_cache[address] = data
    return data


def reverse_geocode(lat, lng):
    """Reverse geocode coordinates to a 'City, ST' string."""
    cache_key = (round(lat, 3), round(lng, 3))
    if cache_key in _reverse_cache:
        return _reverse_cache[cache_key]

    _rate_limit()
    resp = _session.get(f'{NOMINATIM_BASE}/reverse', params={
        'lat': lat,
        'lon': lng,
        'format': 'json',
        'zoom': 10,
    }, headers=HEADERS, timeout=10)
    resp.raise_for_status()
    result = resp.json()

    address = result.get('address', {})
    city = (
        address.get('city')
        or address.get('town')
        or address.get('village')
        or address.get('county', 'Unknown')
    )
    state = address.get('state', '')
    # Abbreviate state if possible
    state_abbr = _get_state_abbr(state)
    name = f'{city}, {state_abbr}' if state_abbr else city

    _reverse_cache[cache_key] = name
    return name


def get_timezone(lat, lng):
    """Get timezone string for coordinates."""
    tz = _tf.timezone_at(lat=lat, lng=lng)
    return tz or 'America/Chicago'


def search_locations(query, limit=5):
    """Search for location suggestions (for autocomplete)."""
    _rate_limit()
    resp = _session.get(f'{NOMINATIM_BASE}/search', params={
        'q': query,
        'format': 'json',
        'limit': limit,
        'countrycodes': 'us',
    }, headers=HEADERS, timeout=10)
    resp.raise_for_status()
    results = resp.json()

    return [
        {
            'lat': float(r['lat']),
            'lng': float(r['lon']),
            'display_name': r['display_name'],
        }
        for r in results
    ]


# US state abbreviations
_STATE_ABBREVS = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
    'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
    'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
    'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
    'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
    'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
    'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
    'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
    'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
    'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
    'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
}


def _get_state_abbr(state_name):
    return _STATE_ABBREVS.get(state_name, state_name[:2].upper() if state_name else '')
