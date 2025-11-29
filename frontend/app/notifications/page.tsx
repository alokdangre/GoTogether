'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BellIcon, CheckCircleIcon, XCircleIcon, MapPinIcon, ClockIcon } from '@heroicons/react/24/outline';
import { NotificationWithDetails } from '@/types';

export default function NotificationsPage() {
    const router = useRouter();
    const [rideNotifications, setRideNotifications] = useState<NotificationWithDetails[]>([]);
    const [systemNotifications, setSystemNotifications] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await response.json();

            // Handle both old list format and new object format
            if (Array.isArray(data)) {
                setRideNotifications(data);
                setSystemNotifications([]);
            } else {
                setRideNotifications(data.ride_notifications || []);
                setSystemNotifications(data.system_notifications || []);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async (notificationId: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/accept`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
            router.push('/my-rides');
        } catch (error) {
            console.error('Error accepting ride:', error);
            alert('Failed to accept ride');
        }
    };

    const handleReject = async (notificationId: string) => {
        if (!confirm('Are you sure you want to reject this ride?')) return;

        try {
            const token = localStorage.getItem('auth_token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/${notificationId}/reject`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error('Error rejecting ride:', error);
            alert('Failed to reject ride');
        }
    };

    const markSystemRead = async (notificationId: string) => {
        try {
            const token = localStorage.getItem('auth_token');
            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/notifications/system/${notificationId}/read`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            fetchNotifications();
        } catch (error) {
            console.error('Error marking read:', error);
        }
    };

    const pendingNotifications = rideNotifications.filter(n => n.status === 'pending');
    const respondedNotifications = rideNotifications.filter(n => n.status !== 'pending');
    const unreadSystemNotifications = systemNotifications.filter(n => !n.is_read);
    const readSystemNotifications = systemNotifications.filter(n => n.is_read);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
            {/* Header */}
            <header className="sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-gray-200">
                <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-6">
                    <div className="flex items-center">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-xl transition-colors mr-3"
                        >
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div className="flex items-center">
                            <BellIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 mr-3" />
                            <div>
                                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Notifications</h1>
                                {(pendingNotifications.length + unreadSystemNotifications.length) > 0 && (
                                    <p className="text-sm text-gray-600">{pendingNotifications.length + unreadSystemNotifications.length} new</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-3 sm:px-6 py-4 sm:py-8">
                {isLoading ? (
                    <div className="text-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    </div>
                ) : (
                    <>
                        {/* System Notifications */}
                        {unreadSystemNotifications.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Important Updates</h2>
                                <div className="space-y-4">
                                    {unreadSystemNotifications.map((notification) => (
                                        <div key={notification.id} className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg border-l-4 border-yellow-500">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900 mb-1">{notification.title}</h3>
                                                    <p className="text-gray-600 mb-3">{notification.message}</p>
                                                    <p className="text-xs text-gray-400">{new Date(notification.created_at).toLocaleString()}</p>
                                                </div>
                                                <button
                                                    onClick={() => markSystemRead(notification.id)}
                                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                                >
                                                    Mark as Read
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pending Notifications */}
                        {pendingNotifications.length > 0 && (
                            <div className="mb-8">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Pending Ride Assignments</h2>
                                <div className="space-y-4">
                                    {pendingNotifications.map((notification) => (
                                        <div key={notification.id} className="bg-white rounded-2xl p-4 sm:p-6 shadow-xl border-2 border-blue-200">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="h-3 w-3 bg-blue-600 rounded-full animate-pulse"></div>
                                                        <span className="text-sm font-semibold text-blue-600">New Ride Assignment</span>
                                                    </div>
                                                    <h3 className="text-xl font-bold text-gray-900 mb-2">
                                                        {notification.grouped_ride.destination_address}
                                                    </h3>
                                                </div>
                                            </div>

                                            {/* Ride Details */}
                                            <div className="space-y-3 mb-4 bg-gray-50 rounded-xl p-4">
                                                {notification.grouped_ride.pickup_time && (
                                                    <div className="flex items-center text-sm">
                                                        <ClockIcon className="h-5 w-5 text-gray-600 mr-2" />
                                                        <span className="font-semibold text-gray-700">Pickup Time:</span>
                                                        <span className="ml-2 text-gray-900">
                                                            {new Date(notification.grouped_ride.pickup_time).toLocaleString()}
                                                        </span>
                                                    </div>
                                                )}

                                                {notification.grouped_ride.pickup_location && (
                                                    <div className="flex items-center text-sm">
                                                        <MapPinIcon className="h-5 w-5 text-gray-600 mr-2" />
                                                        <span className="font-semibold text-gray-700">Pickup Location:</span>
                                                        <span className="ml-2 text-gray-900">{notification.grouped_ride.pickup_location}</span>
                                                    </div>
                                                )}

                                                {notification.grouped_ride.driver && (
                                                    <div className="flex items-center text-sm">
                                                        <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                        </svg>
                                                        <span className="font-semibold text-gray-700">Driver:</span>
                                                        <span className="ml-2 text-gray-900">
                                                            {notification.grouped_ride.driver.name} • {notification.grouped_ride.driver.vehicle_type}
                                                            {notification.grouped_ride.driver.vehicle_plate_number && ` • ${notification.grouped_ride.driver.vehicle_plate_number}`}
                                                        </span>
                                                    </div>
                                                )}

                                                {notification.grouped_ride.charged_price && (
                                                    <div className="flex items-center text-sm">
                                                        <svg className="h-5 w-5 text-gray-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span className="font-semibold text-gray-700">Fare:</span>
                                                        <span className="ml-2 text-gray-900">₹{notification.grouped_ride.charged_price}</span>
                                                        {notification.grouped_ride.actual_price && (
                                                            <span className="ml-2 text-green-600 font-semibold">
                                                                (Save ₹{notification.grouped_ride.actual_price - notification.grouped_ride.charged_price})
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex flex-col sm:flex-row gap-3">
                                                <button
                                                    onClick={() => handleReject(notification.id)}
                                                    className="flex-1 flex items-center justify-center px-6 py-3 border-2 border-red-600 text-red-600 rounded-xl hover:bg-red-50 transition-all font-semibold"
                                                >
                                                    <XCircleIcon className="h-5 w-5 mr-2" />
                                                    Reject
                                                </button>
                                                <button
                                                    onClick={() => handleAccept(notification.id)}
                                                    className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold shadow-lg"
                                                >
                                                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                                                    Accept Ride
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Responded Notifications */}
                        {respondedNotifications.length > 0 && (
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous Notifications</h2>
                                <div className="space-y-3">
                                    {respondedNotifications.map((notification) => (
                                        <div key={notification.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 opacity-75">
                                            <div className="flex items-center justify-between">
                                                <div className="flex-1">
                                                    <p className="font-semibold text-gray-900">{notification.grouped_ride.destination_address}</p>
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {new Date(notification.sent_at).toLocaleDateString()}
                                                    </p>
                                                </div>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${notification.status === 'accepted' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {notification.status.charAt(0).toUpperCase() + notification.status.slice(1)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Read System Notifications */}
                        {readSystemNotifications.length > 0 && (
                            <div className="mt-8">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">Previous Updates</h2>
                                <div className="space-y-3">
                                    {readSystemNotifications.map((notification) => (
                                        <div key={notification.id} className="bg-gray-50 rounded-xl p-4 shadow-sm border border-gray-200">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="text-md font-semibold text-gray-700 mb-1">{notification.title}</h3>
                                                    <p className="text-gray-500 text-sm mb-1">{notification.message}</p>
                                                    <p className="text-xs text-gray-400">{new Date(notification.created_at).toLocaleDateString()}</p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Empty State */}
                        {rideNotifications.length === 0 && systemNotifications.length === 0 && (
                            <div className="text-center py-16 bg-white rounded-2xl">
                                <BellIcon className="mx-auto h-16 w-16 text-gray-400" />
                                <h3 className="mt-4 text-lg font-semibold text-gray-900">No notifications</h3>
                                <p className="mt-2 text-gray-600">You'll be notified when a ride is assigned to you</p>
                                <button
                                    onClick={() => router.push('/request-ride')}
                                    className="mt-6 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-colors"
                                >
                                    Request a Ride
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
