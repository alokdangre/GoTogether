'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Car, Plus, Search, CheckCircle, XCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Driver {
    id: string;
    name: string;
    phone: string;
    email?: string;
    license_number?: string;
    vehicle_type?: string;
    vehicle_make?: string;
    vehicle_model?: string;
    vehicle_plate_number?: string;
    is_verified: boolean;
    is_active: boolean;
    total_rides: number;
    rating: number;
    availability_status?: string;
}

export default function AdminDriversPage() {
    const router = useRouter();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        phone: '',
        name: '',
        email: '',
        license_number: '',
        vehicle_type: '',
        vehicle_make: '',
        vehicle_model: '',
        vehicle_plate_number: '',
    });
    const [sortBy, setSortBy] = useState('default');

    useEffect(() => {
        fetchDrivers();
    }, [sortBy]);

    const fetchDrivers = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await axios.get(`${apiUrl}/api/admin/drivers?limit=1000&sort_by=${sortBy}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setDrivers(response.data);
        } catch (error: any) {
            if (error.response?.status === 401) {
                toast.error('Session expired');
                router.push('/admin/login');
            } else {
                toast.error('Failed to load drivers');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddDriver = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('admin_token');

        try {
            // Clean data
            const dataToSend = {
                ...formData,
                email: formData.email || undefined, // Send undefined if empty string
                // Ensure phone starts with + if not present. 
                // Note: This assumes the user enters a valid number. 
                // Ideally we should have better validation/input mask.
                phone: formData.phone.startsWith('+') ? formData.phone : `+${formData.phone}`
            };

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            await axios.post(`${apiUrl}/api/admin/drivers`, dataToSend, {
                headers: { Authorization: `Bearer ${token}` },
            });

            toast.success('Driver added successfully!');
            setShowAddForm(false);
            setFormData({
                phone: '',
                name: '',
                email: '',
                license_number: '',
                vehicle_type: '',
                vehicle_make: '',
                vehicle_model: '',
                vehicle_plate_number: '',
            });
            fetchDrivers();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to add driver');
        }
    };

    const handleVerifyDriver = async (driverId: string, isVerified: boolean) => {
        const token = localStorage.getItem('admin_token');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            await axios.patch(
                `${apiUrl}/api/admin/drivers/${driverId}`,
                { is_verified: !isVerified },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success(`Driver ${!isVerified ? 'verified' : 'unverified'} successfully!`);
            fetchDrivers();
        } catch (error) {
            toast.error('Failed to update driver');
        }
    };

    const handleStatusChange = async (driverId: string, status: string) => {
        const token = localStorage.getItem('admin_token');
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            await axios.patch(
                `${apiUrl}/api/admin/drivers/${driverId}`,
                { availability_status: status },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Status updated');
            fetchDrivers();
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

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
                            <h1 className="text-3xl font-bold text-gray-900">Drivers Management</h1>
                        </div>
                        <div className="flex items-center gap-4">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                <option value="default">Default Sort</option>
                                <option value="queue">Queue (Fairness)</option>
                            </select>
                            <button
                                onClick={() => setShowAddForm(true)}
                                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                            >
                                <Plus className="h-5 w-5 mr-2" />
                                Add Driver
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Add Driver Form */}
                {showAddForm && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Driver</h2>
                        <form onSubmit={handleAddDriver} className="grid grid-cols-2 gap-4">
                            <input
                                type="text"
                                placeholder="Phone (with country code)"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                required
                            />
                            <input
                                type="email"
                                placeholder="Email (optional)"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <input
                                type="text"
                                placeholder="License Number"
                                value={formData.license_number}
                                onChange={(e) => setFormData({ ...formData, license_number: e.target.value })}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <input
                                type="text"
                                placeholder="Vehicle Type (e.g., car, auto)"
                                value={formData.vehicle_type}
                                onChange={(e) => setFormData({ ...formData, vehicle_type: e.target.value })}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <input
                                type="text"
                                placeholder="Vehicle Make (e.g., Toyota)"
                                value={formData.vehicle_make}
                                onChange={(e) => setFormData({ ...formData, vehicle_make: e.target.value })}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <input
                                type="text"
                                placeholder="Vehicle Model"
                                value={formData.vehicle_model}
                                onChange={(e) => setFormData({ ...formData, vehicle_model: e.target.value })}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <input
                                type="text"
                                placeholder="Vehicle Plate Number"
                                value={formData.vehicle_plate_number}
                                onChange={(e) => setFormData({ ...formData, vehicle_plate_number: e.target.value })}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <div className="col-span-2 flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Add Driver
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowAddForm(false)}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Drivers Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Driver</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vehicle</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">License</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stats</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Availability</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">Loading...</td>
                                    </tr>
                                ) : drivers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-gray-500">No drivers found</td>
                                    </tr>
                                ) : (
                                    drivers.map((driver) => (
                                        <tr key={driver.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{driver.name || 'N/A'}</div>
                                                <div className="text-sm text-gray-500">{driver.phone}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">
                                                    {driver.vehicle_make} {driver.vehicle_model}
                                                </div>
                                                <div className="text-sm text-gray-500">{driver.vehicle_plate_number}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{driver.license_number || 'N/A'}</td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900">{driver.total_rides} trips</div>
                                                <div className="text-sm text-gray-500">⭐ {driver.rating.toFixed(1)}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${driver.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {driver.is_verified ? 'Verified' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <select
                                                    value={driver.availability_status || 'available'}
                                                    onChange={(e) => handleStatusChange(driver.id, e.target.value)}
                                                    className={`text-xs font-medium rounded-full px-2 py-1 border-none focus:ring-0 cursor-pointer ${driver.availability_status === 'available' ? 'bg-green-100 text-green-800' :
                                                        driver.availability_status === 'busy' ? 'bg-red-100 text-red-800' :
                                                            'bg-gray-100 text-gray-800'
                                                        }`}
                                                >
                                                    <option value="available">Available</option>
                                                    <option value="busy">Busy</option>
                                                    <option value="offline">Offline</option>
                                                </select>
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleVerifyDriver(driver.id, driver.is_verified)}
                                                    className={`px-3 py-1 text-xs font-medium rounded-lg ${driver.is_verified
                                                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                                                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                                                        }`}
                                                >
                                                    {driver.is_verified ? 'Unverify' : 'Verify'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
