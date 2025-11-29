'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Tab } from '@headlessui/react';
import { ClockIcon, CheckCircleIcon, XCircleIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { RideRequest, GroupedRideDetail, UserStats } from '@/types';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function MyRidesPage() {
    const router = useRouter();
    const { isAuthenticated } = useAuthStore();
    const [pendingRequests, setPendingRequests] = useState<RideRequest[]>([]);
    const [upcomingRides, setUpcomingRides] = useState<GroupedRideDetail[]>([]);
    const [completedRides, setCompletedRides] = useState<GroupedRideDetail[]>([]);
    const [stats, setStats] = useState<UserStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!isAuthenticated) {
            toast.error('Please sign in to view your rides');
            router.push('/auth/signin');
            return;
        }
        fetchData();
    }, [isAuthenticated, router]);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const headers = {
                'Authorization': `Bearer ${token}`
            };

            // Fetch pending requests
            const requestsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ride-requests/my-requests`, { headers });
            const requests = await requestsRes.json();
            setPendingRequests(requests.filter((r: RideRequest) => r.status === 'pending' || r.status === 'grouped' || r.status === 'assigned'));

            // Fetch upcoming rides
            const upcomingRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/my-rides/upcoming`, { headers });
            const upcoming = await upcomingRes.json();
            setUpcomingRides(upcoming);

            // Fetch completed rides
            const completedRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/my-rides/completed`, { headers });
            const completed = await completedRes.json();
            setCompletedRides(completed);

            // Fetch stats
            const statsRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/my-rides/stats`, { headers });
            const statsData = await statsRes.json();
            setStats(statsData);
        } catch (error) {
            console.error('Error fetching rides:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const cancelRequest = async (requestId: string) => {
        if (!confirm('Are you sure you want to cancel this request?')) return;

        try {
            const token = localStorage.getItem('auth_token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ride-requests/${requestId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchData();
        } catch (error) {
            console.error('Error canceling request:', error);
            alert('Failed to cancel request');
        }
    };

    const acceptRide = async (requestId: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/ride-requests/${requestId}/accept`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.detail || 'Failed to accept ride');
            }

            fetchData();
        } catch (error) {
            console.error('Error accepting ride:', error);
            alert('Failed to accept ride');
        }
    };

    const getStatusBadge = (status: string) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-800',
            grouped: 'bg-blue-100 text-blue-800',
            assigned: 'bg-purple-100 text-purple-800',
            accepted: 'bg-green-100 text-green-800',
            completed: 'bg-gray-100 text-gray-800',
            cancelled: 'bg-red-100 text-red-800'
        };
        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">My Rides</h1>
                        <button
                            onClick={() => router.push('/request-ride')}
                            className="px-4 py-2 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors text-sm sm:text-base"
                        >
                            + New Request
                        </button>
                    </div>

                    {/* Stats Cards */}
                    {stats && (
                        <div className="grid grid-cols-3 gap-3 sm:gap-4 mt-4 sm:mt-6">
                            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
                                <p className="text-xs sm:text-sm text-gray-600">Total Rides</p>
                                <p className="text-xl sm:text-2xl font-bold text-gray-900">{stats.total_rides}</p>
                            </div>
                            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
                                <p className="text-xs sm:text-sm text-gray-600">Total Savings</p>
                                <p className="text-xl sm:text-2xl font-bold text-green-600">₹{stats.total_savings.toFixed(0)}</p>
                            </div>
                            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100">
                                <p className="text-xs sm:text-sm text-gray-600">Rating</p>
                                <p className="text-xl sm:text-2xl font-bold text-yellow-600">{stats.average_rating.toFixed(1)} ⭐</p>
                            </div>
                        </div>
                    )}
                </div>
            </header>

            {/* Tabs */}
            <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
                <Tab.Group>
                    <Tab.List className="flex space-x-2 rounded-xl bg-white p-1 shadow-sm border border-gray-200">
                        <Tab className={({ selected }) =>
                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ${selected
                                ? 'bg-green-600 text-white shadow'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`
                        }>
                            Pending ({pendingRequests.length})
                        </Tab>
                        <Tab className={({ selected }) =>
                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ${selected
                                ? 'bg-green-600 text-white shadow'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`
                        }>
                            Upcoming ({upcomingRides.length})
                        </Tab>
                        <Tab className={({ selected }) =>
                            `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ${selected
                                ? 'bg-green-600 text-white shadow'
                                : 'text-gray-700 hover:bg-gray-100'
                            }`
                        }>
                            Completed ({completedRides.length})
                        </Tab>
                    </Tab.List>

                    <Tab.Panels className="mt-4 sm:mt-6">
                        {/* Pending Requests */}
                        <Tab.Panel>
                            <div className="space-y-3 sm:space-y-4">
                                {pendingRequests.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-xl">
                                        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-4 text-gray-600">No pending requests</p>
                                    </div>
                                ) : (
                                    pendingRequests.map((request) => (
                                        <div key={request.id} className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <MapPinIcon className="h-5 w-5 text-green-600" />
                                                        <span className="font-semibold text-gray-900">{request.destination_address}</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        {new Date(request.requested_time).toLocaleString()}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {request.passenger_count} passenger{request.passenger_count > 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                                {getStatusBadge(request.status)}
                                            </div>

                                            {request.status === 'pending' && (
                                                <button
                                                    onClick={() => cancelRequest(request.id)}
                                                    className="mt-3 w-full sm:w-auto px-4 py-2 text-sm text-red-600 border border-red-600 rounded-lg hover:bg-red-50 transition-colors"
                                                >
                                                    Cancel Request
                                                </button>
                                            )}

                                            {request.status === 'grouped' && (
                                                <button
                                                    onClick={() => acceptRide(request.id)}
                                                    className="mt-3 w-full sm:w-auto px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
                                                >
                                                    Accept Ride
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </Tab.Panel>

                        {/* Upcoming Rides */}
                        <Tab.Panel>
                            <div className="space-y-3 sm:space-y-4">
                                {upcomingRides.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-xl">
                                        <CheckCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-4 text-gray-600">No upcoming rides</p>
                                    </div>
                                ) : (
                                    upcomingRides.map((ride) => (
                                        <div key={ride.id} className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex-1">
                                                    <h3 className="font-semibold text-lg text-gray-900">{ride.destination_address}</h3>
                                                    {ride.pickup_time && (
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            Pickup: {new Date(ride.pickup_time).toLocaleString()}
                                                        </p>
                                                    )}
                                                    {ride.pickup_location && (
                                                        <p className="text-sm text-gray-600">Location: {ride.pickup_location}</p>
                                                    )}
                                                    {ride.driver && (
                                                        <p className="text-sm text-gray-600 mt-2">
                                                            Driver: {ride.driver.name} • {ride.driver.vehicle_type}
                                                        </p>
                                                    )}
                                                </div>
                                                {getStatusBadge(ride.status)}
                                            </div>

                                            <button
                                                onClick={() => router.push(`/chat/${ride.id}`)}
                                                className="mt-3 w-full sm:w-auto px-4 py-2 text-sm bg-[#008069] text-white rounded-lg hover:bg-[#006d59] transition-colors flex items-center justify-center gap-2"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                                                </svg>
                                                Group Chat
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </Tab.Panel>

                        {/* Completed Rides */}
                        <Tab.Panel>
                            <div className="space-y-3 sm:space-y-4">
                                {completedRides.length === 0 ? (
                                    <div className="text-center py-12 bg-white rounded-xl">
                                        <XCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                                        <p className="mt-4 text-gray-600">No completed rides yet</p>
                                    </div>
                                ) : (
                                    completedRides.map((ride) => {
                                        const savings = ride.actual_price && ride.charged_price ? ride.actual_price - ride.charged_price : 0;
                                        return (
                                            <div key={ride.id} className="bg-white rounded-xl p-4 sm:p-6 shadow-sm border border-gray-200">
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex-1">
                                                        <h3 className="font-semibold text-lg text-gray-900">{ride.destination_address}</h3>
                                                        <p className="text-sm text-gray-600 mt-1">
                                                            {new Date(ride.created_at).toLocaleDateString()}
                                                        </p>
                                                        {savings > 0 && (
                                                            <p className="text-sm text-green-600 font-semibold mt-2">
                                                                Saved ₹{savings.toFixed(0)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => router.push(`/rate-ride/${ride.id}`)}
                                                    className="mt-3 w-full sm:w-auto px-4 py-2 text-sm bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                                                >
                                                    Rate Ride
                                                </button>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </Tab.Panel>
                    </Tab.Panels>
                </Tab.Group>
            </div>
        </div>
    );
}
