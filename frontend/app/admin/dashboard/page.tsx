'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Car, MapPin, TrendingUp, ArrowRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface DashboardStats {
    totalUsers: number;
    totalDrivers: number;
    totalTrips: number;
    activeTrips: number;
}

export default function AdminDashboardPage() {
    const router = useRouter();
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        totalDrivers: 0,
        totalTrips: 0,
        activeTrips: 0,
    });
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }

        // Fetch dashboard stats
        const fetchStats = async () => {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                const headers = { Authorization: `Bearer ${token}` };

                const [usersRes, driversRes, tripsRes] = await Promise.all([
                    axios.get(`${apiUrl}/api/admin/users?limit=1000`, { headers }),
                    axios.get(`${apiUrl}/api/admin/drivers?limit=1000`, { headers }),
                    axios.get(`${apiUrl}/api/admin/trips?limit=1000`, { headers }),
                ]);

                setStats({
                    totalUsers: usersRes.data.length,
                    totalDrivers: driversRes.data.length,
                    totalTrips: tripsRes.data.length,
                    activeTrips: tripsRes.data.filter((t: any) => t.status === 'active').length,
                });
            } catch (error: any) {
                if (error.response?.status === 401) {
                    toast.error('Session expired. Please login again.');
                    localStorage.removeItem('admin_token');
                    router.push('/admin/login');
                } else {
                    toast.error('Failed to load dashboard data');
                }
            } finally {
                setIsLoading(false);
            }
        };

        fetchStats();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('admin_token');
        toast.success('Logged out successfully');
        router.push('/admin/login');
    };

    const statCards = [
        {
            title: 'Total Users',
            value: stats.totalUsers,
            icon: Users,
            color: 'from-blue-500 to-blue-600',
            link: '/admin/users',
        },
        {
            title: 'Total Drivers',
            value: stats.totalDrivers,
            icon: Car,
            color: 'from-green-500 to-green-600',
            link: '/admin/drivers',
        },
        {
            title: 'Total Trips',
            value: stats.totalTrips,
            icon: MapPin,
            color: 'from-purple-500 to-purple-600',
            link: '/admin/trips',
        },
        {
            title: 'Active Trips',
            value: stats.activeTrips,
            icon: TrendingUp,
            color: 'from-orange-500 to-orange-600',
            link: '/admin/trips',
        },
    ];

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center py-6">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                            <p className="mt-1 text-sm text-gray-600">GoTogether Management System</p>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {statCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <div
                                key={card.title}
                                onClick={() => router.push(card.link)}
                                className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden group"
                            >
                                <div className={`h-2 bg-gradient-to-r ${card.color}`} />
                                <div className="p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className={`p-3 rounded-xl bg-gradient-to-r ${card.color} bg-opacity-10`}>
                                            <Icon className="h-6 w-6 text-gray-700" />
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <p className="text-sm font-medium text-gray-600 mb-1">{card.title}</p>
                                    <p className="text-3xl font-bold text-gray-900">
                                        {isLoading ? '...' : card.value}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-2xl shadow-sm p-6 mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button
                            onClick={() => router.push('/admin/drivers')}
                            className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all group"
                        >
                            <div className="flex items-center">
                                <Car className="h-5 w-5 text-green-600 mr-3" />
                                <span className="font-medium text-gray-900">Add New Driver</span>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all" />
                        </button>

                        <button
                            onClick={() => router.push('/admin/users')}
                            className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:bg-blue-50 transition-all group"
                        >
                            <div className="flex items-center">
                                <Users className="h-5 w-5 text-blue-600 mr-3" />
                                <span className="font-medium text-gray-900">Manage Users</span>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                        </button>

                        <button
                            onClick={() => router.push('/admin/trips')}
                            className="flex items-center justify-between p-4 border-2 border-gray-200 rounded-xl hover:border-purple-500 hover:bg-purple-50 transition-all group"
                        >
                            <div className="flex items-center">
                                <MapPin className="h-5 w-5 text-purple-600 mr-3" />
                                <span className="font-medium text-gray-900">View All Trips</span>
                            </div>
                            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all" />
                        </button>
                    </div>
                </div>

                {/* Welcome Message */}
                <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl shadow-lg p-8 text-white">
                    <h2 className="text-2xl font-bold mb-2">Welcome to GoTogether Admin</h2>
                    <p className="text-purple-100">
                        Manage users, drivers, and trips from this centralized dashboard. Use the navigation above to access different sections.
                    </p>
                </div>
            </div>
        </div>
    );
}
