'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TrendingUp, DollarSign, Users, Car, Calendar } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { format, subDays } from 'date-fns';

interface OverviewStats {
    total_trips: number;
    total_revenue: number;
    total_users: number;
    active_drivers: number;
    active_trips: number;
}

export default function AnalyticsPage() {
    const router = useRouter();
    const [overview, setOverview] = useState<OverviewStats | null>(null);
    const [timeline, setTimeline] = useState<any[]>([]);
    const [revenue, setRevenue] = useState<any[]>([]);
    const [drivers, setDrivers] = useState<any[]>([]);
    const [statusDist, setStatusDist] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
        end: format(new Date(), 'yyyy-MM-dd'),
    });

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange]);

    const fetchAnalytics = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const headers = { Authorization: `Bearer ${token}` };
            const params = `start_date=${dateRange.start}&end_date=${dateRange.end}`;

            const [overviewRes, timelineRes, revenueRes, driversRes, statusRes] = await Promise.all([
                axios.get(`${apiUrl}/api/admin/analytics/overview?${params}`, { headers }),
                axios.get(`${apiUrl}/api/admin/analytics/trips-timeline?${params}`, { headers }),
                axios.get(`${apiUrl}/api/admin/analytics/revenue?${params}`, { headers }),
                axios.get(`${apiUrl}/api/admin/analytics/drivers`, { headers }),
                axios.get(`${apiUrl}/api/admin/analytics/status-distribution?${params}`, { headers }),
            ]);

            setOverview(overviewRes.data);
            setTimeline(timelineRes.data);
            setRevenue(revenueRes.data);
            setDrivers(driversRes.data);
            setStatusDist(statusRes.data);
        } catch (error: any) {
            if (error.response?.status === 401) {
                toast.error('Session expired');
                router.push('/admin/login');
            } else {
                toast.error('Failed to load analytics');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'];

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
                            <h1 className="text-3xl font-bold text-gray-900">Trip Analytics</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <input
                                type="date"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <span className="text-gray-500">to</span>
                            <input
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {isLoading ? (
                    <div className="text-center py-12 text-gray-500">Loading analytics...</div>
                ) : (
                    <>
                        {/* Overview Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <TrendingUp className="h-8 w-8 text-blue-600" />
                                </div>
                                <p className="text-sm text-gray-600">Total Trips</p>
                                <p className="text-2xl font-bold text-gray-900">{overview?.total_trips || 0}</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <DollarSign className="h-8 w-8 text-green-600" />
                                </div>
                                <p className="text-sm text-gray-600">Total Revenue</p>
                                <p className="text-2xl font-bold text-gray-900">₹{overview?.total_revenue.toFixed(0) || 0}</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <Users className="h-8 w-8 text-purple-600" />
                                </div>
                                <p className="text-sm text-gray-600">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900">{overview?.total_users || 0}</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <Car className="h-8 w-8 text-orange-600" />
                                </div>
                                <p className="text-sm text-gray-600">Active Drivers</p>
                                <p className="text-2xl font-bold text-gray-900">{overview?.active_drivers || 0}</p>
                            </div>

                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <div className="flex items-center justify-between mb-2">
                                    <Calendar className="h-8 w-8 text-indigo-600" />
                                </div>
                                <p className="text-sm text-gray-600">Active Trips</p>
                                <p className="text-2xl font-bold text-gray-900">{overview?.active_trips || 0}</p>
                            </div>
                        </div>

                        {/* Charts Row 1 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            {/* Trips Timeline */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Trips Over Time</h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <LineChart data={timeline}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Line type="monotone" dataKey="total" stroke="#8b5cf6" strokeWidth={2} name="Total" />
                                        <Line type="monotone" dataKey="active" stroke="#10b981" strokeWidth={2} name="Active" />
                                        <Line type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2} name="Completed" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Revenue Chart */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Revenue Over Time</h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={revenue}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                        <YAxis />
                                        <Tooltip />
                                        <Legend />
                                        <Bar dataKey="total" fill="#10b981" name="Total Revenue" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Charts Row 2 */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Status Distribution */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Trip Status Distribution</h2>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={statusDist}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={(entry) => `${entry.name}: ${entry.value}`}
                                            outerRadius={100}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {statusDist.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Top Drivers */}
                            <div className="bg-white rounded-xl shadow-sm p-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Top Drivers</h2>
                                <div className="space-y-3">
                                    {drivers.slice(0, 5).map((driver, index) => (
                                        <div key={driver.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center">
                                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                                                    <span className="text-purple-600 font-bold">{index + 1}</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{driver.name}</p>
                                                    <p className="text-sm text-gray-500">{driver.vehicle}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-gray-900">{driver.total_trips} trips</p>
                                                <p className="text-sm text-gray-500">⭐ {driver.rating.toFixed(1)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
