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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Trip Header */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-white mb-2">
                      Trip to {currentTrip.dest_address}
                    </h1>
                    <p className="text-blue-100 text-lg">
                      From {currentTrip.origin_address}
                    </p>
                  </div>

                  {!isDriver && !isMember && currentTrip.status === 'active' && (
                    <button
                      onClick={handleJoinTrip}
                      className="inline-flex items-center px-8 py-4 bg-white text-blue-600 font-bold rounded-xl hover:bg-gray-50 hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      <UserGroupIcon className="h-6 w-6 mr-3" />
                      Join Trip
                    </button>
                  )}
                </div>
              </div>

              <div className="p-8">
                {/* Trip Details Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <ClockIcon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-600 mb-1">Departure</div>
                    <div className="text-lg font-bold text-gray-900">
                      {new Date(currentTrip.departure_time).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-600">
                      {new Date(currentTrip.departure_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <UserGroupIcon className="h-8 w-8 text-green-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-600 mb-1">Seats</div>
                    <div className="text-lg font-bold text-gray-900">
                      {currentTrip.available_seats}/{currentTrip.total_seats}
                    </div>
                    <div className="text-sm text-gray-600">Available</div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <CurrencyRupeeIcon className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-600 mb-1">Fare</div>
                    <div className="text-lg font-bold text-gray-900">₹{currentTrip.fare_per_person}</div>
                    <div className="text-sm text-gray-600">per person</div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-4 text-center">
                    <Car className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
                    <div className="text-sm font-medium text-gray-600 mb-1">Vehicle</div>
                    <div className="text-lg font-bold text-gray-900 capitalize">{currentTrip.vehicle_type}</div>
                    <div className="text-sm text-gray-600">Type</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Driver Info */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center mb-6">
                <div className="p-3 bg-blue-50 rounded-xl mr-4">
                  <Car className="h-6 w-6 text-blue-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Driver Information</h2>
              </div>
              <div className="flex items-center space-x-6">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl">
                    {currentTrip.driver.name?.charAt(0) || 'D'}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="text-xl font-bold text-gray-900">{currentTrip.driver.name || 'Anonymous Driver'}</p>
                  <div className="flex items-center mt-2">
                    <div className="flex items-center bg-yellow-50 px-3 py-1 rounded-full">
                      <StarIcon className="h-4 w-4 text-yellow-400 mr-1" />
                      <span className="text-sm font-semibold text-gray-900">{currentTrip.driver.rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                    <span className="text-gray-600 text-sm ml-2">
                      {currentTrip.driver.total_trips || 0} trips completed
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Trip Members */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-50 rounded-xl mr-4">
                    <UserGroupIcon className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Trip Members</h2>
                    <p className="text-gray-600">{currentTrip.members.length} passenger{currentTrip.members.length !== 1 ? 's' : ''} joined</p>
                  </div>
                </div>
                {isDriver && (
                  <div className="bg-blue-50 px-4 py-2 rounded-xl">
                    <span className="text-sm font-semibold text-blue-700">You are the driver</span>
                  </div>
                )}
              </div>
              <div className="space-y-4">
                {currentTrip.members.map((member: TripMember) => (
                  <div key={member.id} className="flex items-center justify-between p-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-md transition-shadow">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center shadow-md">
                        <span className="text-white font-bold">
                          {member.user.name?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div>
                        <p className="text-lg font-semibold text-gray-900">{member.user.name || 'Anonymous'}</p>
                        <p className="text-sm text-gray-600">{member.seats_requested} seat{member.seats_requested > 1 ? 's' : ''} requested</p>
                        <div className="flex items-center mt-1">
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            member.status === 'approved' ? 'bg-green-500' :
                            member.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                          }`} />
                          <span className={`text-xs font-medium capitalize ${
                            member.status === 'approved' ? 'text-green-700' :
                            member.status === 'pending' ? 'text-yellow-700' : 'text-red-700'
                          }`}>
                            {member.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {member.status === 'approved' && (
                        <CheckCircleIcon className="h-6 w-6 text-green-500" />
                      )}
                      {member.status === 'pending' && isDriver && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleApproveMember(member.id)}
                            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition-colors"
                          >
                            <CheckCircleIcon className="h-4 w-4 mr-1" />
                            Approve
                          </button>
                          <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 transition-colors">
                            <XCircleIcon className="h-4 w-4 mr-1" />
                            Reject
                          </button>
                        </div>
                      )}
                      {member.status === 'pending' && (
                        <span className="text-sm text-yellow-600 font-medium">Waiting for approval</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Trip Description */}
            {currentTrip.description && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <div className="flex items-center mb-6">
                  <div className="p-3 bg-indigo-50 rounded-xl mr-4">
                    <MapPinIcon className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">Trip Details</h2>
                </div>
                <div className="bg-gray-50 rounded-xl p-6">
                  <p className="text-gray-700 leading-relaxed">{currentTrip.description}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Map */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Trip Route</h3>
                <p className="text-gray-600 text-sm mt-1">Visual overview of the journey</p>
              </div>
              <div className="h-80">
                <Map
                  center={{ lat: currentTrip.origin_lat, lng: currentTrip.origin_lng }}
                  markers={[
                    { lat: currentTrip.origin_lat, lng: currentTrip.origin_lng, title: 'Origin' },
                    { lat: currentTrip.dest_lat, lng: currentTrip.dest_lng, title: 'Destination' },
                  ]}
                  className="h-full rounded-b-2xl"
                />
              </div>
            </div>

            {/* Chat */}
            {(isDriver || isMember) && (
              <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <div className="p-3 bg-purple-50 rounded-xl mr-4">
                      <ChatBubbleLeftRightIcon className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900">Trip Chat</h3>
                  </div>
                  <button
                    onClick={() => setShowChat(!showChat)}
                    className="p-2 text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <ChatBubbleLeftRightIcon className="h-6 w-6" />
                  </button>
                </div>

                {showChat && (
                  <div className="space-y-4">
                    <div className="h-48 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 overflow-y-auto border border-gray-200">
                      {/* Chat messages would go here */}
                      <div className="text-center py-8">
                        <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500 font-medium">Chat functionality coming soon</p>
                        <p className="text-sm text-gray-400 mt-1">Connect with fellow travelers</p>
                      </div>
                    </div>
                    <div className="flex space-x-3">
                      <input
                        type="text"
                        value={chatMessage}
                        onChange={(e) => setChatMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                      />
                      <button
                        onClick={handleSendMessage}
                        className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
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
