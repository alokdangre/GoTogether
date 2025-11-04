'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { ArrowLeftIcon, MapPinIcon, ClockIcon, UsersIcon, CurrencyRupeeIcon } from '@heroicons/react/24/outline';
import { CarIcon, TruckIcon } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore, useTripStore } from '@/lib/store';
import { TripFormData, VehicleType } from '@/types';
import LocationInput from '@/components/LocationInput';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function CreateTripPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { createTrip, isLoading } = useTripStore();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<TripFormData>({
    defaultValues: {
      departure_time: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
      total_seats: 3,
      vehicle_type: 'car' as VehicleType,
    },
  });

  const watchedOrigin = watch('origin');
  const watchedDestination = watch('destination');
  const watchedVehicleType = watch('vehicle_type');

  // Redirect if not authenticated
  if (!isAuthenticated) {
    router.push('/auth/signin');
    return null;
  }

  const onSubmit = async (data: TripFormData) => {
    try {
      const tripData = {
        origin_lat: data.origin.lat,
        origin_lng: data.origin.lng,
        origin_address: data.origin.address,
        dest_lat: data.destination.lat,
        dest_lng: data.destination.lng,
        dest_address: data.destination.address,
        departure_time: data.departure_time.toISOString(),
        total_seats: data.total_seats,
        fare_per_person: data.fare_per_person,
        vehicle_type: data.vehicle_type,
        description: data.description,
      };

      const trip = await createTrip(tripData);
      toast.success('Trip created successfully!');
      router.push(`/trips/${trip.id}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create trip');
    }
  };

  const getVehicleIcon = (vehicleType: VehicleType) => {
    switch (vehicleType) {
      case 'car':
        return <CarIcon className="h-5 w-5" />;
      case 'auto':
        return <TruckIcon className="h-5 w-5" />;
      case 'bike':
        return <div className="h-5 w-5 text-center">🏍️</div>;
      default:
        return <CarIcon className="h-5 w-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-20">
            <button
              onClick={() => router.back()}
              className="mr-6 p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all duration-200"
            >
              <ArrowLeftIcon className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create New Trip</h1>
              <p className="text-gray-600 mt-1">Share your journey and split the costs</p>
            </div>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
          {/* Route Section */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center mb-8">
              <div className="p-4 bg-blue-50 rounded-2xl mr-6">
                <MapPinIcon className="h-8 w-8 text-blue-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Route Details</h2>
                <p className="text-gray-600 mt-2">Where are you traveling from and to?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">From (Pickup Location)</label>
                <LocationInput
                  value={watchedOrigin}
                  onChange={(location) => setValue('origin', location)}
                  placeholder="Enter pickup location"
                  error={errors.origin?.message}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">To (Drop-off Location)</label>
                <LocationInput
                  value={watchedDestination}
                  onChange={(location) => setValue('destination', location)}
                  placeholder="Enter destination"
                  error={errors.destination?.message}
                />
              </div>
            </div>
          </div>

          {/* Trip Details Section */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center mb-8">
              <div className="p-4 bg-green-50 rounded-2xl mr-6">
                <ClockIcon className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Trip Details</h2>
                <p className="text-gray-600 mt-2">When and how will you travel?</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Departure Time</label>
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
                    className="w-full px-4 py-4 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200 text-gray-900 font-medium"
                    min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)}
                  />
                  <ClockIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {errors.departure_time && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors.departure_time.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Vehicle Type</label>
                <div className="grid grid-cols-3 gap-4">
                  {(['car', 'auto', 'bike'] as VehicleType[]).map((type) => (
                    <label
                      key={type}
                      className={`relative flex flex-col items-center justify-center p-6 border-2 rounded-2xl cursor-pointer hover:shadow-lg transition-all duration-200 ${
                        watchedVehicleType === type
                          ? 'border-green-500 bg-green-50 text-green-700 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                    >
                      <input
                        type="radio"
                        {...register('vehicle_type', { required: 'Vehicle type is required' })}
                        value={type}
                        className="sr-only"
                      />
                      <div className="mb-3 text-2xl">
                        {getVehicleIcon(type)}
                      </div>
                      <div className="text-sm font-semibold capitalize text-center">{type}</div>
                    </label>
                  ))}
                </div>
                {errors.vehicle_type && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors.vehicle_type.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Capacity Section */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center mb-8">
              <div className="p-4 bg-purple-50 rounded-2xl mr-6">
                <CurrencyRupeeIcon className="h-8 w-8 text-purple-600" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Pricing & Capacity</h2>
                <p className="text-gray-600 mt-2">Set your fare and available seats</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Available Seats</label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="8"
                    {...register('total_seats', {
                      required: 'Number of seats is required',
                      min: { value: 1, message: 'At least 1 seat required' },
                      max: { value: 8, message: 'Maximum 8 seats allowed' },
                    })}
                    className="w-full px-4 py-4 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 font-medium"
                    placeholder="3"
                  />
                  <UsersIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {errors.total_seats && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors.total_seats.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Fare per Person (₹)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    {...register('fare_per_person', {
                      required: 'Fare per person is required',
                      min: { value: 1, message: 'Minimum fare is ₹1' },
                    })}
                    className="w-full px-4 py-4 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 font-medium"
                    placeholder="50.00"
                  />
                  <CurrencyRupeeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {errors.fare_per_person && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errors.fare_per_person.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
            <div className="flex items-center mb-8">
              <div className="p-4 bg-indigo-50 rounded-2xl mr-6">
                <svg className="h-8 w-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-900">Additional Information</h2>
                <p className="text-gray-600 mt-2">Help passengers understand your trip better</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Description (Optional)</label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-gray-900 font-medium resize-none"
                placeholder="Add any additional details about your trip, pickup instructions, or preferences..."
              />
              <p className="mt-2 text-sm text-gray-600">
                Help passengers understand your trip better with additional context.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-6 pt-6">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 inline-flex items-center justify-center px-8 py-4 border border-gray-300 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <ArrowLeftIcon className="h-5 w-5 mr-3" />
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !watchedOrigin || !watchedDestination}
              className="flex-1 inline-flex items-center justify-center px-8 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-3" />
                  Creating Trip...
                </>
              ) : (
                <>
                  <svg className="h-5 w-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Trip
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
