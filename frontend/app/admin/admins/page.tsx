'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Plus, Trash2, UserCog } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface AdminUser {
    id: string;
    email: string;
    name: string;
    role: string;
    is_active: boolean;
    created_at: string;
}

export default function AdminUsersManagementPage() {
    const router = useRouter();
    const [admins, setAdmins] = useState<AdminUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        name: '',
        role: 'admin',
    });

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            const response = await axios.get(`${apiUrl}/api/admin/admins`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setAdmins(response.data);
        } catch (error: any) {
            if (error.response?.status === 401) {
                toast.error('Session expired');
                router.push('/admin/login');
            } else if (error.response?.status === 403) {
                toast.error('Super admin access required');
                router.push('/admin/dashboard');
            } else {
                toast.error('Failed to load admins');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddAdmin = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = localStorage.getItem('admin_token');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            await axios.post(`${apiUrl}/api/admin/admins`, formData, {
                headers: { Authorization: `Bearer ${token}` },
            });

            toast.success('Admin created successfully!');
            setShowAddForm(false);
            setFormData({ email: '', password: '', name: '', role: 'admin' });
            fetchAdmins();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to create admin');
        }
    };

    const handleDeleteAdmin = async (adminId: string) => {
        if (!confirm('Are you sure you want to delete this admin?')) return;

        const token = localStorage.getItem('admin_token');

        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
            await axios.delete(`${apiUrl}/api/admin/admins/${adminId}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            toast.success('Admin deleted successfully!');
            fetchAdmins();
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Failed to delete admin');
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
                            <h1 className="text-3xl font-bold text-gray-900">Admin Users Management</h1>
                        </div>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                        >
                            <Plus className="h-5 w-5 mr-2" />
                            Add Admin
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Add Admin Form */}
                {showAddForm && (
                    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Admin</h2>
                        <form onSubmit={handleAddAdmin} className="grid grid-cols-2 gap-4">
                            <input
                                type="email"
                                placeholder="Email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                            <input
                                type="text"
                                placeholder="Full Name"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                            />
                            <input
                                type="password"
                                placeholder="Password (min 8 characters)"
                                value={formData.password}
                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                                required
                                minLength={8}
                            />
                            <select
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="admin">Admin</option>
                                <option value="super_admin">Super Admin</option>
                            </select>
                            <div className="col-span-2 flex gap-2">
                                <button
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                                >
                                    Create Admin
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

                {/* Admins Table */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">Loading...</td>
                                    </tr>
                                ) : admins.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-500">No admins found</td>
                                    </tr>
                                ) : (
                                    admins.map((admin) => (
                                        <tr key={admin.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center">
                                                    <div className="p-2 bg-purple-100 rounded-lg mr-3">
                                                        {admin.role === 'super_admin' ? (
                                                            <Shield className="h-5 w-5 text-purple-600" />
                                                        ) : (
                                                            <UserCog className="h-5 w-5 text-purple-600" />
                                                        )}
                                                    </div>
                                                    <div className="font-medium text-gray-900">{admin.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{admin.email}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${admin.role === 'super_admin'
                                                        ? 'bg-purple-100 text-purple-800'
                                                        : 'bg-blue-100 text-blue-800'
                                                    }`}>
                                                    {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${admin.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {admin.is_active ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(admin.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <button
                                                    onClick={() => handleDeleteAdmin(admin.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                    title="Delete admin"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Info Card */}
                <div className="mt-6 bg-purple-50 border border-purple-200 rounded-xl p-6">
                    <div className="flex items-start">
                        <Shield className="h-6 w-6 text-purple-600 mr-3 mt-1" />
                        <div>
                            <h3 className="font-medium text-purple-900 mb-1">Role Permissions</h3>
                            <p className="text-sm text-purple-700">
                                <strong>Super Admin:</strong> Can manage all admins, create/delete admin users, and access all features.<br />
                                <strong>Admin:</strong> Can manage users, drivers, and trips but cannot manage other admins.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
