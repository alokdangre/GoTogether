'use client';

import { useEffect, useRef, useState } from 'react';
import { TripMatch, Location } from '@/types';

// Mock map component since we can't install actual map libraries in this environment
// In production, replace with actual Mapbox or Google Maps implementation

interface MapProps {
  center: Location;
  markers?: { lat: number; lng: number; title: string }[];
  trips?: TripMatch[];
  selectedTrip?: TripMatch | null;
  onTripSelect?: (trip: TripMatch) => void;
  className?: string;
}

export default function Map({ center, markers = [], trips = [], selectedTrip, onTripSelect, className = '' }: MapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Simulate map loading
    const timer = setTimeout(() => {
      setMapLoaded(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Mock implementation - replace with actual map library
  const renderMockMap = () => {
    return (
      <div className="relative w-full h-full bg-gradient-to-br from-green-100 to-blue-100 rounded-lg overflow-hidden">
        {/* Mock map background */}
        <div className="absolute inset-0 opacity-20">
          <svg className="w-full h-full" viewBox="0 0 400 300">
            {/* Mock roads */}
            <path d="M0 150 Q100 100 200 150 T400 150" stroke="#94a3b8" strokeWidth="3" fill="none" />
            <path d="M200 0 Q150 100 200 200 T200 300" stroke="#94a3b8" strokeWidth="2" fill="none" />
            <path d="M0 100 L400 120" stroke="#e2e8f0" strokeWidth="2" />
            <path d="M0 200 L400 180" stroke="#e2e8f0" strokeWidth="2" />
          </svg>
        </div>

        {/* Center marker */}
        <div 
          className="absolute w-4 h-4 bg-primary-600 rounded-full border-2 border-white shadow-lg transform -translate-x-2 -translate-y-2"
          style={{
            left: '50%',
            top: '50%',
          }}
        >
          <div className="absolute inset-0 bg-primary-600 rounded-full animate-ping opacity-75"></div>
        </div>

        {/* Trip markers */}
        {trips.map((trip, index) => (
          <div key={trip.id}>
            {/* Origin marker */}
            <div
              className={`absolute w-3 h-3 rounded-full border border-white shadow cursor-pointer transform -translate-x-1.5 -translate-y-1.5 ${
                selectedTrip?.id === trip.id ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{
                left: `${45 + (index % 3) * 10}%`,
                top: `${40 + (index % 2) * 20}%`,
              }}
              onClick={() => onTripSelect?.(trip)}
              title={`${trip.driver.name || 'Anonymous'}'s trip origin`}
            />
            
            {/* Destination marker */}
            <div
              className={`absolute w-3 h-3 rounded-full border border-white shadow cursor-pointer transform -translate-x-1.5 -translate-y-1.5 ${
                selectedTrip?.id === trip.id ? 'bg-yellow-600' : 'bg-red-500'
              }`}
              style={{
                left: `${55 + (index % 3) * 10}%`,
                top: `${50 + (index % 2) * 20}%`,
              }}
              onClick={() => onTripSelect?.(trip)}
              title={`${trip.driver.name || 'Anonymous'}'s trip destination`}
            />

            {/* Route line */}
            <svg className="absolute inset-0 pointer-events-none">
              <line
                x1={`${45 + (index % 3) * 10}%`}
                y1={`${40 + (index % 2) * 20}%`}
                x2={`${55 + (index % 3) * 10}%`}
                y2={`${50 + (index % 2) * 20}%`}
                stroke={selectedTrip?.id === trip.id ? '#eab308' : '#6b7280'}
                strokeWidth="2"
                strokeDasharray="5,5"
                opacity="0.7"
              />
            </svg>
          </div>
        ))}

        {/* Map controls */}
        <div className="absolute top-4 right-4 flex flex-col space-y-2">
          <button className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center text-gray-600 hover:text-gray-900">
            +
          </button>
          <button className="w-8 h-8 bg-white rounded shadow-md flex items-center justify-center text-gray-600 hover:text-gray-900">
            −
          </button>
        </div>

        {/* Loading overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Loading map...</p>
            </div>
          </div>
        )}

        {/* Map attribution */}
        <div className="absolute bottom-2 left-2 text-xs text-gray-500 bg-white bg-opacity-75 px-2 py-1 rounded">
          Mock Map • Replace with Mapbox/Google Maps
        </div>
      </div>
    );
  };

  return (
    <div ref={mapRef} className={`w-full h-full ${className}`}>
      {renderMockMap()}
    </div>
  );
}

/* 
Production Implementation Guide:

For Mapbox GL JS:
```tsx
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Initialize map
useEffect(() => {
  if (!mapRef.current) return;

  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;
  
  const map = new mapboxgl.Map({
    container: mapRef.current,
    style: 'mapbox://styles/mapbox/streets-v12',
    center: [center.lng, center.lat],
    zoom: 12,
  });

  // Add markers for trips
  trips.forEach(trip => {
    // Origin marker
    new mapboxgl.Marker({ color: '#22c55e' })
      .setLngLat([trip.origin_lng, trip.origin_lat])
      .addTo(map);
    
    // Destination marker  
    new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([trip.dest_lng, trip.dest_lat])
      .addTo(map);
  });

  return () => map.remove();
}, [center, trips]);
```

For Google Maps:
```tsx
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';

<LoadScript googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
  <GoogleMap
    mapContainerStyle={{ width: '100%', height: '100%' }}
    center={center}
    zoom={12}
  >
    {trips.map(trip => (
      <Marker
        key={`${trip.id}-origin`}
        position={{ lat: trip.origin_lat, lng: trip.origin_lng }}
        icon={{ url: '/marker-green.png' }}
      />
    ))}
  </GoogleMap>
</LoadScript>
```
*/
