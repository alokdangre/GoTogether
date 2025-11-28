'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search, Calendar, User, Clock, Train, X, CheckSquare, Square } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Driver {
    id: string;
    name: string;
    vehicle_type?: string;
    vehicle_make?: string;
    vehicle_model?: string;
}

interface RideRequest {
    id: string;
    user_name?: string;
    user_phone?: string;
    source_address: string;
    destination_address: string;
    requested_time: string;
    passenger_count: number;
    status: string;
    created_at: string;
    is_railway_station: boolean;
    train_time?: string;
}

export default function AdminRequestsPage() {
    const router = useRouter();
    const [requests, setRequests] = useState<RideRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Grouping state
    const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [groupFormData, setGroupFormData] = useState({
        driver_id: '',
        pickup_time: '',
        pickup_location: '',
        destination_address: '',
        charged_price: '',
    });

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }

        const fetchRequests = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await axios.get(`${apiUrl}/api/admin/ride-requests?limit=1000`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRequests(response.data);
            } catch (error: any) {
                if (error.response?.status === 401) {
                    toast.error('Session expired');
                    router.push('/admin/login');
                } else {
                    toast.error('Failed to load ride requests');
                }
            } finally {
                setIsLoading(false);
            }
        };

        const fetchDrivers = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const response = await axios.get(`${apiUrl}/api/admin/drivers?limit=1000&is_active=true`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setDrivers(response.data);
            } catch (error) {
                console.error('Failed to load drivers');
            }
        };

        fetchRequests();
        fetchDrivers();
    }, [router]);

    const toggleSelection = (id: string) => {
        if (selectedRequests.includes(id)) {
            setSelectedRequests(selectedRequests.filter(reqId => reqId !== id));
        } else {
            setSelectedRequests([...selectedRequests, id]);
        }
    };

    const handleOpenGroupModal = () => {
        if (selectedRequests.length === 0) return;

        // Prefill data from first selected request
        const firstReq = requests.find(r => r.id === selectedRequests[0]);
        if (firstReq) {
            setGroupFormData({
                driver_id: '',
                pickup_time: firstReq.requested_time.slice(0, 16), // Format for datetime-local
                pickup_location: firstReq.source_address,
                destination_address: firstReq.destination_address,
                charged_price: '',
            });
        }
        setShowGroupModal(true);
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('admin_token');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            await axios.post(
                `${apiUrl}/api/admin/trips/create`,
                {
                    ride_request_ids: selectedRequests,
                    driver_id: groupFormData.driver_id,
                    pickup_time: new Date(groupFormData.pickup_time).toISOString(),
                    pickup_location: groupFormData.pickup_location,
                    destination_address: groupFormData.destination_address,
                    charged_price: parseFloat(groupFormData.charged_price),
                },
                {
                    headers: { Authorization: `Bearer ${token}` },
                }
            );

            toast.success('Grouped ride created successfully!');
            setShowGroupModal(false);
            setSelectedRequests([]);
            // Refresh requests
            const response = await axios.get(`${apiUrl}/api/admin/ride-requests?limit=1000`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setRequests(response.data);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to create group');
        }
    };

    const filteredRequests = requests.filter(
        (req) =>
            req.source_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.destination_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            req.user_phone?.includes(searchTerm)
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
                            <h1 className="text-3xl font-bold text-gray-900">Ride Requests</h1>
                        </div>
                        {selectedRequests.length > 0 && (
                            <button
                                onClick={handleOpenGroupModal}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors shadow-sm flex items-center"
                            >
                                <CheckSquare className="h-5 w-5 mr-2" />
                                Group Selected ({selectedRequests.length})
                            </button>
                        )}
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
                            placeholder="Search by user, location, or phone..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Requests Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isLoading ? (
                        <div className="col-span-full text-center py-12 text-gray-500">Loading requests...</div>
                    ) : filteredRequests.length === 0 ? (
                        <div className="col-span-full text-center py-12 text-gray-500">No requests found</div>
                    ) : (
                        filteredRequests.map((req) => (
                            <div
                                key={req.id}
                                className={`bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden border ${selectedRequests.includes(req.id) ? 'border-purple-500 ring-1 ring-purple-500' : 'border-gray-100'
                                    }`}
                            >
                                {/* Status Bar */}
                                <div className={`h-2 ${req.status === 'pending' ? 'bg-yellow-500' :
                                        req.status === 'grouped' ? 'bg-blue-500' :
                                            req.status === 'assigned' ? 'bg-purple-500' :
                                                req.status === 'accepted' ? 'bg-green-500' :
                                                    req.status === 'cancelled' ? 'bg-red-500' :
                                                        'bg-gray-500'
                                    }`} />

                                <div className="p-6 relative">
                                    {/* Selection Checkbox */}
                                    {req.status === 'pending' && (
                                        <button
                                            onClick={() => toggleSelection(req.id)}
                                            className="absolute top-4 right-4 text-gray-400 hover:text-purple-600 transition-colors"
                                        >
                                            {selectedRequests.includes(req.id) ? (
                                                <CheckSquare className="h-6 w-6 text-purple-600" />
                                            ) : (
                                                <Square className="h-6 w-6" />
                                            )}
                                        </button>
                                    )}

                                    {/* User Info */}
                                    <div className="flex items-center mb-4">
                                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                                            <User className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{req.user_name || 'Unknown User'}</p>
                                            <p className="text-sm text-gray-500">{req.user_phone}</p>
                                        </div>
                                    </div>

                                    {/* Route */}
                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-start">
                                            <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5 mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-gray-500">From</p>
                                                <p className="text-sm text-gray-900 line-clamp-2">{req.source_address}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start">
                                            <div className="w-3 h-3 bg-red-500 rounded-full mt-1.5 mr-3 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs text-gray-500">To</p>
                                                <p className="text-sm text-gray-900 line-clamp-2">{req.destination_address}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Details */}
                                    <div className="grid grid-cols-2 gap-4 mb-4 bg-gray-50 p-3 rounded-lg">
                                        <div>
                                            <div className="flex items-center text-gray-500 mb-1">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                <span className="text-xs">Date</span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {new Date(req.requested_time).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="flex items-center text-gray-500 mb-1">
                                                <Clock className="h-3 w-3 mr-1" />
                                                <span className="text-xs">Time</span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {new Date(req.requested_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="flex items-center text-gray-500 mb-1">
                                                <User className="h-3 w-3 mr-1" />
                                                <span className="text-xs">Passengers</span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-900">
                                                {req.passenger_count}
                                            </p>
                                        </div>
                                        {req.is_railway_station && req.train_time && (
                                            <div>
                                                <div className="flex items-center text-gray-500 mb-1">
                                                    <Train className="h-3 w-3 mr-1" />
                                                    <span className="text-xs">Train</span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {new Date(req.train_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Footer */}
                                    <div className="flex items-center justify-between pt-2">
                                        <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${req.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            req.status === 'grouped' ? 'bg-blue-100 text-blue-800' :
                                                req.status === 'assigned' ? 'bg-purple-100 text-purple-800' :
                                                    req.status === 'accepted' ? 'bg-green-100 text-green-800' :
                                                        req.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                            }`}>
                                            {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                                        </span>
                                        <span className="text-xs text-gray-400">
                                            {new Date(req.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Group Modal */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">Create Grouped Ride</h2>
                            <button onClick={() => setShowGroupModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateGroup} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Select Driver</label>
                                <select
                                    value={groupFormData.driver_id}
                                    onChange={(e) => setGroupFormData({ ...groupFormData, driver_id: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                >
                                    <option value="">Select a driver...</option>
                                    {drivers.map(driver => (
                                        <option key={driver.id} value={driver.id}>
                                            {driver.name} {driver.vehicle_type ? `(${driver.vehicle_type})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Time</label>
                                <input
                                    type="datetime-local"
                                    value={groupFormData.pickup_time}
                                    onChange={(e) => setGroupFormData({ ...groupFormData, pickup_time: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Pickup Location</label>
                                <input
                                    type="text"
                                    value={groupFormData.pickup_location}
                                    onChange={(e) => setGroupFormData({ ...groupFormData, pickup_location: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Destination</label>
                                <input
                                    type="text"
                                    value={groupFormData.destination_address}
                                    onChange={(e) => setGroupFormData({ ...groupFormData, destination_address: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price per Seat (₹)</label>
                                <input
                                    type="number"
                                    value={groupFormData.charged_price}
                                    onChange={(e) => setGroupFormData({ ...groupFormData, charged_price: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    required
                                    min="0"
                                />
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowGroupModal(false)}
                                    className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium"
                                >
                                    Create Group
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
