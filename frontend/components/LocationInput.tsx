'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPinIcon } from '@heroicons/react/24/outline';
import { LocationWithAddress } from '@/types';

interface LocationInputProps {
  value?: LocationWithAddress;
  onChange: (location: LocationWithAddress) => void;
  placeholder?: string;
  error?: string;
  className?: string;
}

// Mock locations for demonstration - replace with actual geocoding service
const MOCK_LOCATIONS = [
  { lat: 22.253, lng: 84.901, address: 'NIT Rourkela Main Gate, Rourkela' },
  { lat: 22.270, lng: 84.900, address: 'Rourkela Railway Station, Rourkela' },
  { lat: 22.260, lng: 84.895, address: 'City Center Mall, Rourkela' },
  { lat: 22.245, lng: 84.910, address: 'Sector 1, Rourkela' },
  { lat: 22.275, lng: 84.885, address: 'Steel Plant, Rourkela' },
  { lat: 22.240, lng: 84.920, address: 'Ambagan, Rourkela' },
];

export default function LocationInput({
  value,
  onChange,
  placeholder = 'Enter location',
  error,
  className = ''
}: LocationInputProps) {
  const [inputValue, setInputValue] = useState(value?.address || '');
  const [suggestions, setSuggestions] = useState<LocationWithAddress[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value?.address && value.address !== inputValue) {
      setInputValue(value.address);
    }
  }, [value]);

  const searchLocations = async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock search - replace with actual geocoding API
    const filtered = MOCK_LOCATIONS.filter(location =>
      location.address.toLowerCase().includes(query.toLowerCase())
    );

    setSuggestions(filtered);
    setIsLoading(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setInputValue(query);
    setShowSuggestions(true);

    if (query.trim()) {
      searchLocations(query);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (location: LocationWithAddress) => {
    setInputValue(location.address || '');
    setShowSuggestions(false);
    onChange(location);
  };

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowSuggestions(false);

        // If user typed something but didn't select a suggestion, use the text as-is
        if (inputValue.trim() && !value?.address) {
          onChange({
            lat: 0, // Will be geocoded later or use default
            lng: 0,
            address: inputValue.trim()
          });
        }
      }
    }, 150);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onBlur={handleInputBlur}
          placeholder={placeholder}
          className={`w-full pl-12 pr-10 py-3 sm:py-4 border border-gray-200 rounded-xl 
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent 
            transition-all text-sm sm:text-base text-gray-900 placeholder:text-gray-400
            ${error ? 'border-red-300 focus:border-red-500 focus:ring-red-500' : ''}`}
        />
        <MapPinIcon className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />

        {isLoading && (
          <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto"
        >
          {suggestions.map((location, index) => (
            <button
              key={index}
              type="button"
              className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none border-b border-gray-100 last:border-b-0"
              onClick={() => handleSuggestionClick(location)}
            >
              <div className="flex items-start space-x-3">
                <MapPinIcon className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {location.address}
                  </div>
                  <div className="text-xs text-gray-500">
                    {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showSuggestions && !isLoading && inputValue.length >= 2 && suggestions.length === 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg">
          <div className="px-4 py-3 text-sm text-gray-500 text-center">
            No locations found. Try a different search term.
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}

/* 
Production Implementation Guide:

For Google Places API:
```tsx
import { usePlacesWidget } from "react-google-autocomplete";

const { ref } = usePlacesWidget({
  apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  onPlaceSelected: (place) => {
    const location = {
      lat: place.geometry.location.lat(),
      lng: place.geometry.location.lng(),
      address: place.formatted_address,
    };
    onChange(location);
  },
  options: {
    types: ["establishment", "geocode"],
    componentRestrictions: { country: "in" }, // Restrict to India
  },
});

return <input ref={ref} className="form-input" placeholder={placeholder} />;
```

For Mapbox Geocoding API:
```tsx
const searchLocations = async (query: string) => {
  const response = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_TOKEN}&country=in&limit=5`
  );
  const data = await response.json();
  
  const locations = data.features.map(feature => ({
    lat: feature.center[1],
    lng: feature.center[0],
    address: feature.place_name,
  }));
  
  setSuggestions(locations);
};
```
*/
