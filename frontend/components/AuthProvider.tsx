'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';
import PhoneCollectionModal from './PhoneCollectionModal';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [isInitialized, setIsInitialized] = useState(false);
    const { token, user, loadUser, logout } = useAuthStore();
    const [showPhoneModal, setShowPhoneModal] = useState(false);

    useEffect(() => {
        const initAuth = async () => {
            // Check for token in localStorage
            const storedToken = localStorage.getItem('auth_token');

            if (storedToken) {
                try {
                    // Validate token by loading user data
                    await loadUser(storedToken);
                } catch (error) {
                    console.error('Failed to load user, logging out:', error);
                    logout();
                }
            }

            setIsInitialized(true);
        };

        initAuth();
    }, []); // Run only once on mount

    useEffect(() => {
        if (isInitialized && user && !user.phone) {
            setShowPhoneModal(true);
        } else {
            setShowPhoneModal(false);
        }
    }, [isInitialized, user]);

    // Don't render children until auth is initialized
    if (!isInitialized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <>
            {children}
            <PhoneCollectionModal
                isOpen={showPhoneModal}
                onClose={() => setShowPhoneModal(false)}
            />
        </>
    );
}
