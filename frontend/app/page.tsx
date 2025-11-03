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
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-4">
                <CarIcon className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Share Rides,<br />
              <span className="text-blue-200">Split Costs</span>
            </h1>
            <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto leading-relaxed">
              Find travelers with similar routes for your daily commute or city trips.
              Save money, reduce emissions, and make new connections.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <button
                onClick={() => setShowSearch(true)}
                className="group inline-flex items-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-xl hover:bg-gray-50 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <MagnifyingGlassIcon className="h-6 w-6 mr-3 group-hover:animate-pulse" />
                Find a Ride
              </button>

              <button
                onClick={handleCreateTrip}
                className="group inline-flex items-center px-8 py-4 bg-blue-500/20 backdrop-blur-sm border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-blue-500/30 hover:border-white/50 hover:scale-105 transition-all duration-200"
              >
                <PlusIcon className="h-6 w-6 mr-3 group-hover:rotate-90 transition-transform duration-200" />
                Offer a Ride
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">10K+</div>
                <div className="text-blue-200">Trips Completed</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">50K+</div>
                <div className="text-blue-200">Happy Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">₹2L+</div>
                <div className="text-blue-200">Money Saved</div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-20 left-10 w-32 h-32 bg-white/5 rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-blue-400/10 rounded-full blur-2xl"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-indigo-400/10 rounded-full blur-lg"></div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              How It Works
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Join thousands of users who are already saving money and reducing their carbon footprint
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPinIcon className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Set Your Route</h3>
              <p className="text-gray-600">
                Enter your origin and destination. Our smart algorithm finds the best matches.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <UsersIcon className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Connect & Match</h3>
              <p className="text-gray-600">
                Get matched with verified travelers heading to the same destination at similar times.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <ClockIcon className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Travel Together</h3>
              <p className="text-gray-600">
                Share the ride, split the cost, and enjoy your journey with great company.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Map */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900">
                  {searchResults.length > 0 ? `Found ${searchResults.length} Trip${searchResults.length > 1 ? 's' : ''}` : 'Explore Available Routes'}
                </h3>
                <p className="text-gray-600 mt-1">
                  {searchResults.length > 0 ? 'Click on a trip to view details' : 'Use the search button to find matching trips'}
                </p>
              </div>

              <div className="h-96 lg:h-[500px]">
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
            {/* Quick Actions */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>

              <div className="space-y-3">
                <button
                  onClick={() => setShowSearch(true)}
                  className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  Search Trips
                </button>

                <button
                  onClick={handleCreateTrip}
                  className="w-full flex items-center justify-center px-4 py-3 bg-green-600 text-white font-medium rounded-xl hover:bg-green-700 transition-colors"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Create Trip
                </button>
              </div>
            </div>

            {/* Search Results */}
            {isLoading && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
                <div className="flex flex-col items-center justify-center">
                  <LoadingSpinner />
                  <span className="mt-4 text-gray-600 font-medium">Finding your perfect ride...</span>
                  <span className="mt-2 text-sm text-gray-500">This may take a few seconds</span>
                </div>
              </div>
            )}

            {searchResults.length > 0 && (
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Available Trips
                  </h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Select a trip to view details and join
                  </p>
                </div>

                <div className="max-h-96 overflow-y-auto">
                  {searchResults.map((trip) => (
                    <div
                      key={trip.id}
                      className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                        selectedTrip?.id === trip.id ? 'bg-blue-50 border-l-4 border-l-blue-600' : ''
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
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center">
                <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MagnifyingGlassIcon className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Ready to Search?</h3>
                <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                  Click the search button above to find trips that match your route and schedule.
                </p>
                <button
                  onClick={() => setShowSearch(true)}
                  className="inline-flex items-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                >
                  <MagnifyingGlassIcon className="h-5 w-5 mr-2" />
                  Start Searching
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
