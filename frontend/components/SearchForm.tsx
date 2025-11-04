'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { Location, SearchFormData } from '@/types';
import { useLocationStore } from '@/lib/store';
import LocationInput from './LocationInput';
import LoadingSpinner from './LoadingSpinner';

interface SearchFormProps {
  onSearch: (data: SearchFormData) => void;
  onClose: () => void;
  defaultOrigin?: Location | null;
}

export default function SearchForm({ onSearch, onClose, defaultOrigin }: SearchFormProps) {
  const { getCurrentLocation, isLocationLoading } = useLocationStore();
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<SearchFormData>({
    defaultValues: {
      max_origin_distance: 2.0,
      max_dest_distance: 3.0,
      time_window_minutes: 15,
      departure_time: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
    },
  });

  const watchedOrigin = watch('origin');
  const watchedDestination = watch('destination');

  useEffect(() => {
    if (defaultOrigin) {
      setValue('origin', { ...defaultOrigin, address: 'Current Location' });
    }
  }, [defaultOrigin, setValue]);

  const handleUseCurrentLocation = async () => {
    setUseCurrentLocation(true);
    try {
      const location = await getCurrentLocation();
      setValue('origin', { ...location, address: 'Current Location' });
    } catch (error) {
      console.error('Failed to get current location:', error);
    } finally {
      setUseCurrentLocation(false);
    }
  };

  const onSubmit = (data: SearchFormData) => {
    onSearch(data);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                <MapPinIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Find Your Ride</h2>
                <p className="text-blue-100 text-sm">Search for matching trips</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-8 space-y-8">
          {/* Route Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                <MapPinIcon className="h-5 w-5 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Route</h3>
            </div>

            {/* Origin */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">From</label>
              <div className="space-y-3">
                <LocationInput
                  value={watchedOrigin}
                  onChange={(location) => setValue('origin', location)}
                  placeholder="Enter pickup location"
                  error={errors.origin?.message}
                />

                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  disabled={useCurrentLocation || isLocationLoading}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {(useCurrentLocation || isLocationLoading) ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <MapPinIcon className="h-4 w-4 mr-2" />
                  )}
                  Use current location
                </button>
              </div>
            </div>

            {/* Destination */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">To</label>
              <LocationInput
                value={watchedDestination}
                onChange={(location) => setValue('destination', location)}
                placeholder="Enter destination"
                error={errors.destination?.message}
              />
            </div>
          </div>

          {/* Time Section */}
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-green-50 rounded-lg">
                <ClockIcon className="h-5 w-5 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Departure Time</h3>
            </div>

            <div>
              <div className="relative">
                <input
                  type="datetime-local"
                  {...register('departure_time', {
                    required: 'Departure time is required',
                    validate: (value) => {
                      const selectedTime = new Date(value);
                      const now = new Date();
                      if (selectedTime <= now) {
                        return 'Departure time must be in the future';
                      }
                      return true;
                    },
                  })}
                  className="w-full px-4 py-4 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-gray-900 font-medium"
                  min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)} // 5 minutes from now
                />
                <ClockIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              </div>
              {errors.departure_time && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.departure_time.message}</p>
              )}
            </div>
          </div>

          {/* Advanced Filters */}
          <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <svg className="h-5 w-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Search Preferences</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Origin Distance</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    {...register('max_origin_distance', {
                      required: 'Origin distance is required',
                      min: { value: 0.1, message: 'Minimum 0.1 km' },
                      max: { value: 10, message: 'Maximum 10 km' },
                    })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="2.0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">km</span>
                </div>
                {errors.max_origin_distance && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors.max_origin_distance.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Destination Distance</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    {...register('max_dest_distance', {
                      required: 'Destination distance is required',
                      min: { value: 0.1, message: 'Minimum 0.1 km' },
                      max: { value: 10, message: 'Maximum 10 km' },
                    })}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                    placeholder="3.0"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">km</span>
                </div>
                {errors.max_dest_distance && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors.max_dest_distance.message}</p>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Time Window</label>
              <div className="relative">
                <input
                  type="number"
                  min="5"
                  max="120"
                  {...register('time_window_minutes', {
                    required: 'Time window is required',
                    min: { value: 5, message: 'Minimum 5 minutes' },
                    max: { value: 120, message: 'Maximum 120 minutes' },
                  })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200"
                  placeholder="15"
                />
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500 font-medium">min</span>
              </div>
              {errors.time_window_minutes && (
                <p className="mt-2 text-sm text-red-600 font-medium">{errors.time_window_minutes.message}</p>
              )}
              <p className="mt-2 text-xs text-gray-600">
                Search for trips within this time range of your departure time
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 inline-flex items-center justify-center px-6 py-4 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !watchedOrigin || !watchedDestination}
              className="flex-1 inline-flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Searching...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Search Trips
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
