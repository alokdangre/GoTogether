'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPinIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline';
import { CarIcon, ClockIcon, UsersIcon } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore, useTripStore, useLocationStore } from '@/lib/store';
import { TripMatch, Location } from '@/types';
import Map from '@/components/Map';
import SearchForm from '@/components/SearchForm';
import TripCard from '@/components/TripCard';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { searchResults, isLoading, searchTrips } = useTripStore();
  const { currentLocation, getCurrentLocation } = useLocationStore();
  
  const [showSearch, setShowSearch] = useState(false);
  const [mapCenter, setMapCenter] = useState<Location>({ lat: 22.253, lng: 84.901 }); // NIT Rourkela default
  const [selectedTrip, setSelectedTrip] = useState<TripMatch | null>(null);

  useEffect(() => {
    // Get user's current location on load
    getCurrentLocation().catch(() => {
      // Silently fail - will use default location
    });
  }, [getCurrentLocation]);

  useEffect(() => {
    // Update map center when location is available
    if (currentLocation) {
      setMapCenter(currentLocation);
    }
  }, [currentLocation]);

  const handleSearch = async (searchData: any) => {
    if (!isAuthenticated) {
      toast.error('Please sign in to search for trips');
      router.push('/auth/signin');
      return;
    }

    try {
      const results = await searchTrips({
        origin_lat: searchData.origin.lat,
        origin_lng: searchData.origin.lng,
        dest_lat: searchData.destination.lat,
        dest_lng: searchData.destination.lng,
        departure_time: searchData.departure_time.toISOString(),
        max_origin_distance: searchData.max_origin_distance,
        max_dest_distance: searchData.max_dest_distance,
        time_window_minutes: searchData.time_window_minutes,
      });

      if (results.length === 0) {
        toast('No matching trips found. Try adjusting your search criteria.', {
          icon: '🔍',
        });
      } else {
        toast.success(`Found ${results.length} matching trip${results.length > 1 ? 's' : ''}!`);
      }
      
      setShowSearch(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to search trips');
    }
  };

  const handleCreateTrip = () => {
    if (!isAuthenticated) {
      toast.error('Please sign in to create a trip');
      router.push('/auth/signin');
      return;
    }
    router.push('/trips/create');
  };

  const handleTripSelect = (trip: TripMatch) => {
    setSelectedTrip(trip);
    setMapCenter({ lat: trip.origin_lat, lng: trip.origin_lng });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <CarIcon className="h-8 w-8 text-primary-600" />
              <h1 className="ml-2 text-xl font-bold text-gray-900">GoTogether</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => router.push('/trips')}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    My Trips
                  </button>
                  <button
                    onClick={() => router.push('/profile')}
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Profile
                  </button>
                </>
              ) : (
                <button
                  onClick={() => router.push('/auth/signin')}
                  className="btn-primary"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Share Rides, Split Costs
            </h2>
            <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
              Find travelers with similar routes for your daily commute or city trips. 
              Save money and make new connections.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setShowSearch(true)}
                className="inline-flex items-center px-6 py-3 bg-white text-primary-600 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                Find a Ride
              </button>
              
              <button
                onClick={handleCreateTrip}
                className="inline-flex items-center px-6 py-3 bg-primary-800 text-white font-medium rounded-lg hover:bg-primary-900 transition-colors"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Offer a Ride
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {searchResults.length > 0 ? 'Available Trips' : 'Explore Area'}
              </h3>
              
              <div className="h-96 rounded-lg overflow-hidden">
                <Map
                  center={mapCenter}
                  trips={searchResults}
                  selectedTrip={selectedTrip}
                  onTripSelect={handleTripSelect}
                />
              </div>
            </div>
          </div>

          {/* Search Results / Info */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">How It Works</h3>
              
              <div className="space-y-4">
                <div className="flex items-start">
                  <MapPinIcon className="h-6 w-6 text-primary-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Set Your Route</h4>
                    <p className="text-sm text-gray-600">Enter your origin and destination</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <UsersIcon className="h-6 w-6 text-primary-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Find Matches</h4>
                    <p className="text-sm text-gray-600">Connect with travelers on similar routes</p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <ClockIcon className="h-6 w-6 text-primary-600 mt-0.5 mr-3" />
                  <div>
                    <h4 className="font-medium text-gray-900">Travel Together</h4>
                    <p className="text-sm text-gray-600">Share the ride and split the cost</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Results */}
            {isLoading && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-center">
                  <LoadingSpinner />
                  <span className="ml-2 text-gray-600">Searching for trips...</span>
                </div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Found {searchResults.length} Trip{searchResults.length > 1 ? 's' : ''}
                  </h3>
                </div>
                
                <div className="divide-y max-h-96 overflow-y-auto">
                  {searchResults.map((trip) => (
                    <div
                      key={trip.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                        selectedTrip?.id === trip.id ? 'bg-primary-50 border-l-4 border-primary-600' : ''
                      }`}
                      onClick={() => handleTripSelect(trip)}
                    >
                      <TripCard trip={trip} compact />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!isLoading && searchResults.length === 0 && (
              <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
                <MagnifyingGlassIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Start Your Search</h3>
                <p className="text-gray-600 mb-4">
                  Use the search button above to find trips matching your route.
                </p>
                <button
                  onClick={() => setShowSearch(true)}
                  className="btn-primary"
                >
                  Search Trips
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search Modal */}
      {showSearch && (
        <SearchForm
          onSearch={handleSearch}
          onClose={() => setShowSearch(false)}
          defaultOrigin={currentLocation}
        />
      )}
    </div>
  );
}
