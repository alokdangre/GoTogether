'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { EnvelopeIcon, LockClosedIcon, ShieldCheckIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import axios from 'axios';

import LoadingSpinner from '@/components/LoadingSpinner';

interface AdminLoginFormData {
    email: string;
    password: string;
}

export default function AdminLoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AdminLoginFormData>();

    const onSubmit = async (data: AdminLoginFormData) => {
        setIsLoading(true);
        try {
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/admin/login`,
                data
            );

            // Store admin token
            localStorage.setItem('admin_token', response.data.access_token);

            toast.success('Welcome back, Admin!');
            router.push('/admin/dashboard');
        } catch (error: any) {
            toast.error(error.response?.data?.detail || 'Invalid credentials');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Card Container */}
                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-10">
                        <div className="text-center">
                            <div className="flex items-center justify-center mb-6">
                                <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                                    <ShieldCheckIcon className="h-14 w-14 text-white" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">Admin Portal</h1>
                            <p className="text-purple-100 text-sm">GoTogether Management System</p>
                        </div>
                    </div>

                    {/* Form */}
                    <div className="px-8 py-8">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                            <p className="text-gray-600">Sign in to access the admin dashboard</p>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            {/* Email */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Email Address</label>
                                <div className="relative">
                                    <input
                                        type="email"
                                        {...register('email', {
                                            required: 'Email is required',
                                            pattern: {
                                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                                message: 'Please enter a valid email address',
                                            },
                                        })}
                                        placeholder="admin@gotogether.com"
                                        className="w-full px-4 py-4 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 font-medium"
                                    />
                                    <EnvelopeIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                </div>
                                {errors.email && (
                                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.email.message}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">Password</label>
                                <div className="relative">
                                    <input
                                        type="password"
                                        {...register('password', {
                                            required: 'Password is required',
                                            minLength: {
                                                value: 6,
                                                message: 'Password must be at least 6 characters',
                                            },
                                        })}
                                        placeholder="Enter your password"
                                        className="w-full px-4 py-4 pl-12 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 text-gray-900 font-medium"
                                    />
                                    <LockClosedIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                </div>
                                {errors.password && (
                                    <p className="mt-2 text-sm text-red-600 font-medium">{errors.password.message}</p>
                                )}
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full inline-flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <LoadingSpinner size="sm" className="mr-3" />
                                        Signing in...
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        {/* Back to Main Site */}
                        <div className="mt-6 text-center">
                            <button
                                onClick={() => router.push('/')}
                                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
                            >
                                ← Back to main site
                            </button>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-8 py-6 bg-gray-50 border-t border-gray-100">
                        <div className="text-center text-sm text-gray-600">
                            <p>
                                🔒 Secure admin access only
                            </p>
                        </div>
                    </div>

                    {/* Development Note */}
                    {process.env.NODE_ENV === 'development' && (
                        <div className="mx-8 mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                            <p className="text-sm text-yellow-800 text-center">
                                <strong className="font-medium">Development Mode:</strong> Use{' '}
                                <code className="bg-yellow-100 px-2 py-1 rounded font-mono">admin@gotogether.com</code> /{' '}
                                <code className="bg-yellow-100 px-2 py-1 rounded font-mono">admin123</code>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
