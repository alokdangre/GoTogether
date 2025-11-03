'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import {
  MapPinIcon,
  ClockIcon,
  UserGroupIcon,
  CurrencyRupeeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChatBubbleLeftRightIcon,
  StarIcon,
} from '@heroicons/react/24/outline';
import { Car } from 'lucide-react';
import toast from 'react-hot-toast';

import { useAuthStore, useTripStore } from '@/lib/store';
import { TripDetail, TripMember } from '@/types';
import Map from '@/components/Map';
import LoadingSpinner from '@/components/LoadingSpinner';

export default function TripDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;

  const { isAuthenticated, user } = useAuthStore();
  const { currentTrip, isLoading, fetchTrip } = useTripStore();

  const [showChat, setShowChat] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/signin');
      return;
    }

    fetchTrip(tripId).catch((error) => {
      toast.error('Failed to load trip details');
      console.error('Error fetching trip:', error);
    });
  }, [isAuthenticated, tripId, fetchTrip, router]);

  useEffect(() => {
    if (currentTrip && isAuthenticated) {
      // Connect to WebSocket for chat
      const websocket = new WebSocket(`ws://localhost:8000/ws/trips/${tripId}/chat?token=${localStorage.getItem('auth_token')}`);

      websocket.onopen = () => {
        console.log('Connected to trip chat');
      };

      websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'message') {
          // Handle incoming message
          console.log('New message:', data);
        }
      };

      websocket.onclose = () => {
        console.log('Disconnected from trip chat');
      };

      setWs(websocket);

      return () => {
        websocket.close();
      };
    }
  }, [currentTrip, tripId, isAuthenticated]);

  const handleJoinTrip = async () => {
    // This would be implemented with a form for seats and message
    toast('Join trip functionality to be implemented');
  };

  const handleApproveMember = async (memberId: string) => {
    // This would call the approve API
    toast('Approve member functionality to be implemented');
  };

  const handleSendMessage = () => {
    if (ws && ws.readyState === WebSocket.OPEN && chatMessage.trim()) {
      const messageData = {
        type: 'message',
        content: chatMessage.trim(),
      };
      ws.send(JSON.stringify(messageData));
      setChatMessage('');
    }
  };

  if (isLoading || !currentTrip) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  const isDriver = currentTrip.driver.id === user?.id;
  const isMember = currentTrip.members.some(member => member.user_id === user?.id && member.status === 'approved');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Header */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    Trip to {currentTrip.dest_address}
                  </h1>
                  <p className="text-gray-600 mb-4">
                    From {currentTrip.origin_address}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <ClockIcon className="h-5 w-5 mr-2" />
                      {new Date(currentTrip.departure_time).toLocaleString()}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <UserGroupIcon className="h-5 w-5 mr-2" />
                      {currentTrip.available_seats}/{currentTrip.total_seats} seats
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <CurrencyRupeeIcon className="h-5 w-5 mr-2" />
                      ₹{currentTrip.fare_per_person}
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Car className="h-5 w-5 mr-2" />
                      {currentTrip.vehicle_type}
                    </div>
                  </div>
                </div>

                {!isDriver && !isMember && currentTrip.status === 'active' && (
                  <button
                    onClick={handleJoinTrip}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Join Trip
                  </button>
                )}
              </div>
            </div>

            {/* Driver Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Driver Information</h2>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {currentTrip.driver.name?.charAt(0) || 'D'}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{currentTrip.driver.name || 'Anonymous Driver'}</p>
                  <div className="flex items-center">
                    <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                    <span className="text-sm text-gray-600">{currentTrip.driver.rating?.toFixed(1) || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trip Members */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Members</h2>
              <div className="space-y-3">
                {currentTrip.members.map((member: TripMember) => (
                  <div key={member.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-xs text-gray-600">
                          {member.user.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{member.user.name || 'Anonymous'}</p>
                        <p className="text-xs text-gray-600">{member.seats_requested} seat{member.seats_requested > 1 ? 's' : ''}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {member.status === 'approved' && (
                        <CheckCircleIcon className="h-5 w-5 text-green-500" />
                      )}
                      {member.status === 'pending' && isDriver && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveMember(member.id)}
                            className="text-green-600 hover:text-green-800 text-sm font-medium"
                          >
                            Approve
                          </button>
                          <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                            Reject
                          </button>
                        </div>
                      )}
                      {member.status === 'pending' && (
                        <span className="text-sm text-yellow-600">Pending</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trip Description */}
            {currentTrip.description && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Trip Details</h2>
                <p className="text-gray-700">{currentTrip.description}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Map */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <Map
                center={{ lat: currentTrip.origin_lat, lng: currentTrip.origin_lng }}
                markers={[
                  { lat: currentTrip.origin_lat, lng: currentTrip.origin_lng, title: 'Origin' },
                  { lat: currentTrip.dest_lat, lng: currentTrip.dest_lng, title: 'Destination' },
                ]}
                className="h-64 rounded-lg"
              />
            </div>

            {/* Chat */}
            {(isDriver || isMember) && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Trip Chat</h3>
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <ChatBubbleLeftRightIcon className="h-5 w-5" />
                  </button>
                </div>

                {showChat && (
                  <div className="space-y-3">
                    <div className="h-32 bg-gray-50 rounded-lg p-2 overflow-y-auto">
                      {/* Chat messages would go here */}
                      <p className="text-sm text-gray-500 text-center">Chat functionality coming soon</p>
                    </div>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
