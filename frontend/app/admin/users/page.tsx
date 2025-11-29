'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Search, Filter } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface User {
    id: string;
    name: string;
    phone?: string;
    email?: string;
    is_verified: boolean;
    created_at: string;
}

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [notificationModalOpen, setNotificationModalOpen] = useState(false);
    const [selectedUserForNotification, setSelectedUserForNotification] = useState<User | null>(null);
    const [notificationTitle, setNotificationTitle] = useState('');
    const [notificationMessage, setNotificationMessage] = useState('');

    const fetchUsers = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) return;

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await axios.get(`${apiUrl}/api/admin/users?limit=1000`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setUsers(response.data);
        } catch (error: any) {
            if (error.response?.status === 401) {
                toast.error('Session expired');
                router.push('/admin/login');
            } else {
                toast.error('Failed to load users');
            }
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }
        fetchUsers();
    }, [router]);

    const sendCustomNotification = async () => {
        if (!selectedUserForNotification || !notificationTitle || !notificationMessage) return;

        try {
            const token = localStorage.getItem('admin_token');
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            await axios.post(
                `${apiUrl}/api/admin/users/${selectedUserForNotification.id}/notify`,
                { title: notificationTitle, message: notificationMessage },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            toast.success('Notification sent successfully');
            setNotificationModalOpen(false);
            setNotificationTitle('');
            setNotificationMessage('');
            setSelectedUserForNotification(null);
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to send notification');
        }
    };

    const filteredUsers = users.filter(
        (user) =>
            user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.phone?.includes(searchTerm) ||
            user.email?.toLowerCase().includes(searchTerm.toLowerCase())
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
                            <h1 className="text-3xl font-bold text-gray-900">Users Management</h1>
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
                            placeholder="Search by name, phone, or email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Users Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        User
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Contact
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Joined
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            Loading users...
                                        </td>
                                    </tr>
                                ) : filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            No users found
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="font-medium text-gray-900">{user.name || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {user.phone ? (
                                                    <div className="text-sm text-gray-900">{user.phone}</div>
                                                ) : (
                                                    <div className="flex items-center space-x-2">
                                                        <span className="text-sm text-red-500 font-medium">Missing</span>
                                                        <button
                                                            onClick={async () => {
                                                                try {
                                                                    const token = localStorage.getItem('admin_token');
                                                                    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                                                    await axios.post(
                                                                        `${apiUrl}/api/admin/users/${user.id}/notify-phone`,
                                                                        {},
                                                                        { headers: { Authorization: `Bearer ${token}` } }
                                                                    );
                                                                    toast.success(`Notification sent to ${user.name}`);
                                                                } catch (error: any) {
                                                                    toast.error(error.response?.data?.detail || 'Failed to send notification');
                                                                }
                                                            }}
                                                            className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                                                        >
                                                            Notify Phone
                                                        </button>
                                                    </div>
                                                )}
                                                <div className="text-sm text-gray-500">{user.email || 'No email'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.is_verified
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {user.is_verified ? 'Verified' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <button
                                                    onClick={() => {
                                                        setSelectedUserForNotification(user);
                                                        setNotificationModalOpen(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-900 mr-4"
                                                >
                                                    Message
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (!confirm(`Are you sure you want to delete ${user.name}? This action cannot be undone.`)) return;
                                                        try {
                                                            const token = localStorage.getItem('admin_token');
                                                            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
                                                            await axios.delete(
                                                                `${apiUrl}/api/admin/users/${user.id}`,
                                                                { headers: { Authorization: `Bearer ${token}` } }
                                                            );
                                                            toast.success('User deleted successfully');
                                                            fetchUsers();
                                                        } catch (error: any) {
                                                            toast.error(error.response?.data?.detail || 'Failed to delete user');
                                                        }
                                                    }}
                                                    className="text-red-600 hover:text-red-900"
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${user.is_verified
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {user.is_verified ? 'Verified' : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Stats */}
                <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                            <p className="text-sm text-gray-600">Total Users</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {users.filter((u) => u.is_verified).length}
                            </p>
                            <p className="text-sm text-gray-600">Verified</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
