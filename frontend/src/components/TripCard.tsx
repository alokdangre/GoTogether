'use client';

import { format } from 'date-fns';
import { 
  MapPinIcon, 
  ClockIcon, 
  UsersIcon, 
  CurrencyRupeeIcon,
  StarIcon 
} from '@heroicons/react/24/outline';
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid';
import { CarIcon, TruckIcon } from 'lucide-react';
import { TripMatch, TripWithDriver, VehicleType } from '@/types';

interface TripCardProps {
  trip: TripMatch | TripWithDriver;
  compact?: boolean;
  showMatchInfo?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function TripCard({ 
  trip, 
  compact = false, 
  showMatchInfo = false, 
  onClick, 
  className = '' 
}: TripCardProps) {
  const isMatch = 'match_score' in trip;
  const matchTrip = trip as TripMatch;

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'full':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderRating = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <StarSolidIcon key={i} className="h-4 w-4 text-yellow-400" />
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <StarIcon className="h-4 w-4 text-gray-300" />
            <StarSolidIcon className="h-4 w-4 text-yellow-400 absolute inset-0 w-1/2 overflow-hidden" />
          </div>
        );
      } else {
        stars.push(
          <StarIcon key={i} className="h-4 w-4 text-gray-300" />
        );
      }
    }

    return (
      <div className="flex items-center space-x-1">
        <div className="flex">{stars}</div>
        <span className="text-sm text-gray-600">({rating.toFixed(1)})</span>
      </div>
    );
  };

  if (compact) {
    return (
      <div 
        className={`cursor-pointer hover:bg-gray-50 transition-colors ${className}`}
        onClick={onClick}
      >
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <div className="text-primary-600">
                {getVehicleIcon(trip.vehicle_type)}
              </div>
              <span className="font-medium text-gray-900 truncate">
                {trip.driver.name || 'Anonymous'}
              </span>
              {renderRating(trip.driver.rating)}
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <div className="flex items-center">
                <ClockIcon className="h-4 w-4 mr-1" />
                {format(new Date(trip.departure_time), 'MMM d, h:mm a')}
              </div>
              
              {isMatch && showMatchInfo && (
                <div className="flex items-center space-x-3 text-xs">
                  <span>📍 {matchTrip.origin_distance.toFixed(1)}km</span>
                  <span>🎯 {matchTrip.dest_distance.toFixed(1)}km</span>
                  <span>⏱️ {matchTrip.time_difference_minutes}min</span>
                </div>
              )}
            </div>
          </div>
          
          <div className="text-right">
            <div className="font-semibold text-gray-900">
              ₹{trip.fare_per_person}
            </div>
            <div className="text-sm text-gray-600">
              {trip.available_seats} seat{trip.available_seats !== 1 ? 's' : ''}
            </div>
            {isMatch && (
              <div className="text-xs text-primary-600 font-medium">
                {Math.round(matchTrip.match_score * 100)}% match
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600">
              {getVehicleIcon(trip.vehicle_type)}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {trip.driver.name || 'Anonymous Driver'}
              </h3>
              <div className="flex items-center space-x-2">
                {renderRating(trip.driver.rating)}
                <span className="text-sm text-gray-500">
                  • {trip.driver.total_trips} trip{trip.driver.total_trips !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-bold text-gray-900">₹{trip.fare_per_person}</div>
            <div className="text-sm text-gray-600">per person</div>
          </div>
        </div>

        {/* Route */}
        <div className="space-y-3 mb-4">
          <div className="flex items-start space-x-3">
            <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {trip.origin_address || `${trip.origin_lat.toFixed(3)}, ${trip.origin_lng.toFixed(3)}`}
              </div>
              <div className="text-sm text-gray-600">Pickup location</div>
            </div>
          </div>
          
          <div className="ml-1.5 border-l-2 border-dashed border-gray-300 h-4"></div>
          
          <div className="flex items-start space-x-3">
            <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5"></div>
            <div className="flex-1">
              <div className="font-medium text-gray-900">
                {trip.dest_address || `${trip.dest_lat.toFixed(3)}, ${trip.dest_lng.toFixed(3)}`}
              </div>
              <div className="text-sm text-gray-600">Drop-off location</div>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <ClockIcon className="h-4 w-4" />
            <span>{format(new Date(trip.departure_time), 'MMM d, h:mm a')}</span>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <UsersIcon className="h-4 w-4" />
            <span>{trip.available_seats} of {trip.total_seats} seats available</span>
          </div>
        </div>

        {/* Match Information */}
        {isMatch && showMatchInfo && (
          <div className="bg-primary-50 rounded-lg p-3 mb-4">
            <div className="text-sm font-medium text-primary-900 mb-2">Match Details</div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="text-center">
                <div className="font-medium text-primary-900">{matchTrip.origin_distance.toFixed(1)}km</div>
                <div className="text-primary-700">From origin</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-primary-900">{matchTrip.dest_distance.toFixed(1)}km</div>
                <div className="text-primary-700">From destination</div>
              </div>
              <div className="text-center">
                <div className="font-medium text-primary-900">{matchTrip.time_difference_minutes}min</div>
                <div className="text-primary-700">Time difference</div>
              </div>
            </div>
            <div className="mt-2 text-center">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                {Math.round(matchTrip.match_score * 100)}% Match Score
              </span>
            </div>
          </div>
        )}

        {/* Description */}
        {trip.description && (
          <div className="mb-4">
            <div className="text-sm text-gray-600">{trip.description}</div>
          </div>
        )}

        {/* Status */}
        <div className="flex items-center justify-between">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
            {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
          </span>
          
          <div className="text-xs text-gray-500">
            Vehicle: {trip.vehicle_type.charAt(0).toUpperCase() + trip.vehicle_type.slice(1)}
          </div>
        </div>
      </div>
    </div>
  );
}
