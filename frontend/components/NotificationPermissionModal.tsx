'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, BellIcon, DevicePhoneMobileIcon } from '@heroicons/react/24/outline';
import { notificationService } from '@/lib/notificationService';

interface NotificationPermissionModalProps {
    onClose: () => void;
    onPermissionGranted?: () => void;
}

export default function NotificationPermissionModal({
    onClose,
    onPermissionGranted
}: NotificationPermissionModalProps) {
    const [isRequesting, setIsRequesting] = useState(false);

    const handleRequestPermission = async () => {
        setIsRequesting(true);
        const granted = await notificationService.requestPermission();
        setIsRequesting(false);

        if (granted) {
            onPermissionGranted?.();
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <XMarkIcon className="h-5 w-5 text-gray-500" />
                </button>

                {/* Icon */}
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                        <BellIcon className="h-12 w-12 text-white" />
                    </div>
                </div>

                {/* Content */}
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-3">
                        Stay Updated on Your Rides
                    </h2>
                    <p className="text-gray-600 leading-relaxed">
                        Enable notifications to receive instant updates about:
                    </p>
                </div>

                {/* Benefits list */}
                <div className="space-y-3 mb-8">
                    <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                        <div className="flex-shrink-0 mt-0.5">
                            <svg className="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">New group messages</p>
                            <p className="text-sm text-gray-600">Get notified when your ride group chats</p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
                        <div className="flex-shrink-0 mt-0.5">
                            <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Ride status updates</p>
                            <p className="text-sm text-gray-600">Know when your ride is confirmed or modified</p>
                        </div>
                    </div>

                    <div className="flex items-start space-x-3 p-3 bg-purple-50 rounded-lg">
                        <div className="flex-shrink-0 mt-0.5">
                            <svg className="h-5 w-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div>
                            <p className="font-medium text-gray-900">Driver arrival alerts</p>
                            <p className="text-sm text-gray-600">Be ready when your ride is nearby</p>
                        </div>
                    </div>
                </div>

                {/* Privacy note */}
                <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-600 text-center">
                        🔒 We respect your privacy. You can change this setting anytime in your browser.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-6 py-3 border border-gray-300 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Maybe Later
                    </button>
                    <button
                        onClick={handleRequestPermission}
                        disabled={isRequesting}
                        className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isRequesting ? 'Requesting...' : 'Enable Notifications'}
                    </button>
                </div>
            </div>
        </div>
    );
}
