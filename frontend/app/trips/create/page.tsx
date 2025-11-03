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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Create Trip</h1>
          </div>
        </div>
      </header>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Route Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2 text-primary-600" />
              Route Details
            </h2>

            <div className="space-y-6">
              <div>
                <label className="form-label">From (Pickup Location)</label>
                <LocationInput
                  value={watchedOrigin}
                  onChange={(location) => setValue('origin', location)}
                  placeholder="Enter pickup location"
                  error={errors.origin?.message}
                />
              </div>

              <div>
                <label className="form-label">To (Drop-off Location)</label>
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
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2 text-primary-600" />
              Trip Details
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Departure Time</label>
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
                  className="form-input"
                  min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)}
                />
                {errors.departure_time && (
                  <p className="mt-1 text-sm text-red-600">{errors.departure_time.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Vehicle Type</label>
                <div className="grid grid-cols-3 gap-3">
                  {(['car', 'auto', 'bike'] as VehicleType[]).map((type) => (
                    <label
                      key={type}
                      className={`relative flex items-center justify-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        watchedVehicleType === type
                          ? 'border-primary-600 bg-primary-50 text-primary-600'
                          : 'border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        {...register('vehicle_type', { required: 'Vehicle type is required' })}
                        value={type}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <div className="mb-1">{getVehicleIcon(type)}</div>
                        <div className="text-sm font-medium capitalize">{type}</div>
                      </div>
                    </label>
                  ))}
                </div>
                {errors.vehicle_type && (
                  <p className="mt-1 text-sm text-red-600">{errors.vehicle_type.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Capacity Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <CurrencyRupeeIcon className="h-5 w-5 mr-2 text-primary-600" />
              Pricing & Capacity
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="form-label">Available Seats</label>
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
                    className="form-input pl-10"
                  />
                  <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {errors.total_seats && (
                  <p className="mt-1 text-sm text-red-600">{errors.total_seats.message}</p>
                )}
              </div>

              <div>
                <label className="form-label">Fare per Person (₹)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    {...register('fare_per_person', {
                      required: 'Fare per person is required',
                      min: { value: 1, message: 'Minimum fare is ₹1' },
                    })}
                    className="form-input pl-10"
                    placeholder="50.00"
                  />
                  <CurrencyRupeeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
                {errors.fare_per_person && (
                  <p className="mt-1 text-sm text-red-600">{errors.fare_per_person.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information Section */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">
              Additional Information
            </h2>

            <div>
              <label className="form-label">Description (Optional)</label>
              <textarea
                {...register('description')}
                rows={3}
                className="form-input"
                placeholder="Add any additional details about your trip, pickup instructions, or preferences..."
              />
              <p className="mt-1 text-sm text-gray-500">
                Help passengers understand your trip better with additional context.
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || !watchedOrigin || !watchedDestination}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Creating Trip...
                </>
              ) : (
                'Create Trip'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
