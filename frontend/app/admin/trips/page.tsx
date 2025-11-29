'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search, Calendar } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Trip {
    id: string;
    driver_name?: string;
    pickup_location: string;
    destination: string;
    scheduled_time: string;
    total_seats: number;
    available_seats: number;
    fare_per_seat: number;
    status: string;
    created_at: string;
}

export default function AdminTripsPage() {
    const router = useRouter();
    const [trips, setTrips] = useState<Trip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }

        const fetchTrips = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await axios.get(`${apiUrl}/api/admin/trips?limit=1000`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTrips(response.data);
            } catch (error: any) {
                if (error.response?.status === 401) {
                    toast.error('Session expired');
                    router.push('/admin/login');
                } else {
                    toast.error('Failed to load trips');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchTrips();
    }, [router]);

    const filteredTrips = trips.filter(
        (trip) =>
            trip.pickup_location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trip.destination?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            trip.driver_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <button
                                onClick={() => router.push('/admin/dashboard')}
                                className="text-sm text-gray-600 hover:text-gray-900 mb-2"
                            >
                                ← Back to Dashboard
                            </button>
                            <h1 className="text-3xl font-bold text-gray-900">Trips Management</h1>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search */}
                <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by origin, destination, or driver..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>
                </div>

                {/* Trips Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full text-center py-12 text-gray-500">Loading trips...</div>
                    ) : filteredTrips.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">No trips found</div>
                    ) : (
                        filteredTrips.map((trip) => (
                            <div key={trip.id} className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden">
                                {/* Status Bar */}
                                <div className={`h-2 ${trip.status === 'active' ? 'bg-green-500' :
                                    trip.status === 'completed' ? 'bg-blue-500' :
                                        trip.status === 'cancelled' ? 'bg-red-500' :
                                            'bg-gray-500'
                                    }`} />

                                <div className="p-6">
                                    {/* Driver Info */}
                                    <div className="flex items-center mb-4">
                                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                            <span className="text-purple-600 font-bold">
                                                {trip.driver_name?.charAt(0) || 'D'}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{trip.driver_name || 'Unknown'}</p>
                                        </div>
                                    </div>

                                    {/* Route */}
                                    <div className="space-y-2 mb-4">
                                        <div className="flex items-start">
                                            <div className="w-3 h-3 bg-green-500 rounded-full mt-1 mr-3 flex-shrink-0" />
                                            <p className="text-sm text-gray-900">{trip.pickup_location || 'Origin'}</p>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="w-3 h-3 bg-red-500 rounded-full mt-1 mr-3 flex-shrink-0" />
                                            <p className="text-sm text-gray-900">{trip.destination || 'Destination'}</p>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-xs text-gray-500">Departure</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {trip.scheduled_time ? new Date(trip.scheduled_time).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500">Seats</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {trip.available_seats}/{trip.total_seats}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${trip.status === 'active' ? 'bg-green-100 text-green-800' :
                                            trip.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                                                trip.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                    'bg-gray-100 text-gray-800'
                                            }`}>
                                            {trip.status}
                                        </span>
                                        <div className="flex items-center gap-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    router.push(`/admin/chat/${trip.id}`);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
                                            >
                                                <span className="text-lg">💬</span> Chat
                                            </button>
                                            <span className="text-lg font-bold text-purple-600">
                                                ₹{trip.fare_per_seat}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Stats */}
                <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{trips.length}</p>
                            <p className="text-sm text-gray-600">Total Trips</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-green-600">
                                {trips.filter((t) => t.status === 'active').length}
                            </p>
                            <p className="text-sm text-gray-600">Active</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-blue-600">
                                {trips.filter((t) => t.status === 'completed').length}
                            </p>
                            <p className="text-sm text-gray-600">Completed</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-red-600">
                                {trips.filter((t) => t.status === 'cancelled').length}
                            </p>
                            <p className="text-sm text-gray-600">Cancelled</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
