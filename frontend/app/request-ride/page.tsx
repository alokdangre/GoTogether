'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { MapPinIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline';
import LocationInput from '@/components/LocationInput';
import { RideRequestCreate, Location } from '@/types';

export default function RequestRidePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isRailwayStation, setIsRailwayStation] = useState(false);

    const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<RideRequestCreate>();

    const watchedSource = watch('source_lat') && watch('source_lng') ? {
        lat: watch('source_lat'),
        lng: watch('source_lng'),
        address: watch('source_address')
    } : null;

    const watchedDestination = watch('destination_lat') && watch('destination_lng') ? {
        lat: watch('destination_lat'),
        lng: watch('destination_lng'),
        address: watch('destination_address')
    } : null;

    const onSubmit = async (data: any) => {
        setIsLoading(true);
        try {
            const token = localStorage.getItem('auth_token');

            const requestBody = {
                source_lat: data.source_lat,
                source_lng: data.source_lng,
                source_address: data.source_address,
                destination_lat: data.destination_lat,
                destination_lng: data.destination_lng,
                destination_address: data.destination_address,
                is_railway_station: isRailwayStation,
                train_time: isRailwayStation && data.train_time ? new Date(data.train_time).toISOString() : null,
                requested_time: new Date(data.requested_time).toISOString(),
                passenger_count: parseInt(data.passenger_count),
                additional_info: data.additional_info || null
            };

            console.log('Sending ride request:', requestBody);

            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ride-requests`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ detail: 'Failed to create ride request' }));
                console.error('API Error:', errorData);
                throw new Error(errorData.detail || 'Failed to create ride request');
            }

            const result = await response.json();
            console.log('Ride request created:', result);
            router.push('/my-rides');
        } catch (error) {
            console.error('Error creating ride request:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to create ride request. Please try again.';
            alert(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200 h-14 sm:h-20">
                <div className="max-w-4xl mx-auto px-3 sm:px-6 h-full flex items-center justify-between">
                    <button
                        onClick={() => router.back()}
                        className="p-2 sm:p-3 hover:bg-gray-100 rounded-xl transition-colors"
                    >
                        <svg className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900">Request a Ride</h1>
                    <div className="w-10 sm:w-12"></div>
                </div>
            </header>

            {/* Form */}
            <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 lg:py-12">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 sm:space-y-6">
                    {/* Route Section */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8">
                        <div className="flex items-center mb-4 sm:mb-6">
                            <div className="p-2 sm:p-3 bg-blue-50 rounded-xl mr-3 sm:mr-4">
                                <MapPinIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Route</h2>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">Where do you want to go?</p>
                            </div>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Pickup Location</label>
                                <LocationInput
                                    value={watchedSource || undefined}
                                    onChange={(location: Location) => {
                                        setValue('source_lat', location.lat);
                                        setValue('source_lng', location.lng);
                                        setValue('source_address', location.address || '');
                                    }}
                                    placeholder="Enter pickup location"
                                    error={errors.source_lat?.message}
                                />
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Destination</label>
                                <LocationInput
                                    value={watchedDestination || undefined}
                                    onChange={(location: Location) => {
                                        setValue('destination_lat', location.lat);
                                        setValue('destination_lng', location.lng);
                                        setValue('destination_address', location.address || '');
                                    }}
                                    placeholder="Enter destination"
                                    error={errors.destination_lat?.message}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Trip Details */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8">
                        <div className="flex items-center mb-4 sm:mb-6">
                            <div className="p-2 sm:p-3 bg-green-50 rounded-xl mr-3 sm:mr-4">
                                <ClockIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Trip Details</h2>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">When do you need the ride?</p>
                            </div>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Requested Time</label>
                                <input
                                    type="datetime-local"
                                    {...register('requested_time', { required: 'Requested time is required' })}
                                    className="w-full px-3 py-3 sm:px-4 sm:py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                                    min={new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16)}
                                />
                                {errors.requested_time && (
                                    <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.requested_time.message}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">Number of Passengers</label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="1"
                                        max="8"
                                        defaultValue="1"
                                        {...register('passenger_count', {
                                            required: 'Number of passengers is required',
                                            min: { value: 1, message: 'At least 1 passenger required' },
                                            max: { value: 8, message: 'Maximum 8 passengers allowed' }
                                        })}
                                        className="w-full px-3 py-3 sm:px-4 sm:py-4 pl-9 sm:pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                                    />
                                    <UsersIcon className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
                                </div>
                                {errors.passenger_count && (
                                    <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.passenger_count.message}</p>
                                )}
                            </div>

                            {/* Railway Station Checkbox */}
                            <div className="flex items-start">
                                <input
                                    type="checkbox"
                                    id="railway-station"
                                    checked={isRailwayStation}
                                    onChange={(e) => setIsRailwayStation(e.target.checked)}
                                    className="mt-1 h-4 w-4 sm:h-5 sm:w-5 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                />
                                <label htmlFor="railway-station" className="ml-3 block text-xs sm:text-sm text-gray-700">
                                    <span className="font-semibold">Destination is a railway station</span>
                                    <p className="text-gray-500 mt-1">We'll ask for your train time to ensure timely pickup</p>
                                </label>
                            </div>

                            {/* Train Time (conditional) */}
                            {isRailwayStation && (
                                <div className="pl-0 sm:pl-8">
                                    <label className="block text-xs sm:text-sm font-semibold text-gray-700 mb-2">
                                        <svg className="inline h-4 w-4 sm:h-5 sm:w-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                                        </svg>
                                        Train Departure Time
                                    </label>
                                    <input
                                        type="datetime-local"
                                        {...register('train_time', {
                                            required: isRailwayStation ? 'Train time is required for railway stations' : false
                                        })}
                                        className="w-full px-3 py-3 sm:px-4 sm:py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-sm sm:text-base"
                                    />
                                    {errors.train_time && (
                                        <p className="mt-2 text-xs sm:text-sm text-red-600">{errors.train_time.message}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className="bg-white rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 p-4 sm:p-6 lg:p-8">
                        <div className="flex items-center mb-4 sm:mb-6">
                            <div className="p-2 sm:p-3 bg-purple-50 rounded-xl mr-3 sm:mr-4">
                                <svg className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Additional Info</h2>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1 hidden sm:block">Any special requirements?</p>
                            </div>
                        </div>

                        <textarea
                            {...register('additional_info')}
                            rows={4}
                            className="w-full px-3 py-3 sm:px-4 sm:py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm sm:text-base"
                            placeholder="E.g., heavy luggage, wheelchair accessible, etc."
                        />
                    </div>

                    {/* Submit Button */}
                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="w-full sm:flex-1 px-6 py-3 sm:px-8 sm:py-4 border border-gray-300 text-sm sm:text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || !watchedSource || !watchedDestination}
                            className="w-full sm:flex-1 px-6 py-3 sm:px-8 sm:py-4 border border-transparent text-sm sm:text-base font-medium rounded-xl text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Submitting...' : 'Request Ride'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
