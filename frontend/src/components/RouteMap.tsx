import { useEffect, memo } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { RouteData, Stop } from '../types/trip';

// Fix default marker icon issue with webpack/vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface Props {
  route: RouteData;
  stops: Stop[];
  timezone: string;
}

const STOP_COLORS: Record<string, string> = {
  start: '#059669',
  pickup: '#2563EB',
  dropoff: '#1E3A5F',
  rest_break: '#F59E0B',
  sleeper: '#DC2626',
  fuel: '#0891B2',
};

const STOP_LABELS: Record<string, string> = {
  start: 'S',
  pickup: 'P',
  dropoff: 'D',
  rest_break: 'R',
  sleeper: 'Z',
  fuel: 'F',
};

function createStopIcon(type: string) {
  const color = STOP_COLORS[type] || '#64748B';
  const label = STOP_LABELS[type] || '?';
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="
      background: ${color};
      width: 30px; height: 30px;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      color: white; font-weight: 700; font-size: 12px;
      font-family: 'Plus Jakarta Sans', sans-serif;
      border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
    ">${label}</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
  });
}

function FitBounds({ route }: { route: RouteData }) {
  const map = useMap();
  useEffect(() => {
    if (route.coordinates.length > 0) {
      const bounds = L.latLngBounds(
        route.coordinates.map((c) => [c[0], c[1]] as [number, number])
      );
      map.fitBounds(bounds, { padding: [40, 40] });
    }
  }, [route, map]);
  return null;
}

function formatTime(isoString: string, timeZone: string) {
  const d = new Date(isoString);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone });
}

function formatDate(isoString: string, timeZone: string) {
  const d = new Date(isoString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone });
}

function RouteMap({ route, stops, timezone }: Props) {
  const center: [number, number] = route.coordinates.length > 0
    ? [route.coordinates[0][0], route.coordinates[0][1]]
    : [39.8283, -98.5795];

  return (
    <MapContainer center={center} zoom={5} style={{ height: '100%', minHeight: 300 }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />
      <FitBounds route={route} />

      {/* Leg 1: Current → Pickup (blue) */}
      <Polyline
        positions={route.coordinates.slice(0, (route.leg1_end_index ?? route.coordinates.length) + 1)
          .map((c) => [c[0], c[1]] as [number, number])}
        pathOptions={{
          color: '#2563EB',
          weight: 5,
          opacity: 0.85,
          lineCap: 'round',
          lineJoin: 'round',
        }}
      />
      {/* Leg 2: Pickup → Dropoff (orange, dashed) */}
      <Polyline
        positions={route.coordinates.slice(route.leg1_end_index ?? 0)
          .map((c) => [c[0], c[1]] as [number, number])}
        pathOptions={{
          color: '#F97316',
          weight: 5,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
          dashArray: '12, 8',
        }}
      />

      {stops.map((stop) => (
        <Marker
          key={stop.id}
          position={[stop.location.lat, stop.location.lng]}
          icon={createStopIcon(stop.type)}
          eventHandlers={{
            mouseover: (e) => e.target.openPopup(),
            mouseout: (e) => e.target.closePopup(),
          }}
        >
          <Popup>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", lineHeight: 1.5, minWidth: 160 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 2 }}>{stop.reason}</p>
              <p style={{ fontSize: 12, color: '#64748B', marginBottom: 6 }}>{stop.location.name}</p>
              <div style={{ fontSize: 11, color: '#64748B', display: 'flex', flexWrap: 'wrap', gap: '4px 8px' }}>
                <span>{formatDate(stop.arrival_time, timezone)} {formatTime(stop.arrival_time, timezone)}</span>
                {stop.duration_hours > 0 && (
                  <span>→ {formatTime(stop.departure_time, timezone)}</span>
                )}
                {stop.duration_hours > 0 && (
                  <span style={{ fontWeight: 500 }}>{stop.duration_hours}hr</span>
                )}
                <span style={{ fontVariantNumeric: 'tabular-nums' }}>Mile {stop.cumulative_miles}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default memo(RouteMap);
