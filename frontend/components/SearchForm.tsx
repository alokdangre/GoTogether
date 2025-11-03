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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Search Trips</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">
          {/* Origin */}
          <div>
            <label className="form-label">From</label>
            <div className="space-y-2">
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
                className="inline-flex items-center text-sm text-primary-600 hover:text-primary-700 disabled:opacity-50"
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
            <label className="form-label">To</label>
            <LocationInput
              value={watchedDestination}
              onChange={(location) => setValue('destination', location)}
              placeholder="Enter destination"
              error={errors.destination?.message}
            />
          </div>

          {/* Departure Time */}
          <div>
            <label className="form-label">Departure Time</label>
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
                className="form-input pl-10"
                min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)} // 5 minutes from now
              />
              <ClockIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
            {errors.departure_time && (
              <p className="mt-1 text-sm text-red-600">{errors.departure_time.message}</p>
            )}
          </div>

          {/* Search Filters */}
          <div className="border-t pt-6">
            <h3 className="text-sm font-medium text-gray-900 mb-4">Search Filters</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Origin Distance (km)</label>
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
                  className="form-input"
                />
                {errors.max_origin_distance && (
                  <p className="mt-1 text-sm text-red-600">{errors.max_origin_distance.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Destination Distance (km)</label>
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
                  className="form-input"
                />
                {errors.max_dest_distance && (
                  <p className="mt-1 text-sm text-red-600">{errors.max_dest_distance.message}</p>
                )}
              </div>
            </div>

            <div className="mt-4">
              <label className="form-label">Time Window (minutes)</label>
              <input
                type="number"
                min="5"
                max="120"
                {...register('time_window_minutes', {
                  required: 'Time window is required',
                  min: { value: 5, message: 'Minimum 5 minutes' },
                  max: { value: 120, message: 'Maximum 120 minutes' },
                })}
                className="form-input"
              />
              {errors.time_window_minutes && (
                <p className="mt-1 text-sm text-red-600">{errors.time_window_minutes.message}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Search for trips within this time range of your departure time
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !watchedOrigin || !watchedDestination}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Searching...
                </>
              ) : (
                'Search Trips'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
