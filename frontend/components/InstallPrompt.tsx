'use client';

import { useState, useEffect } from 'react';
import { XMarkIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

interface InstallPromptProps {
    onClose: () => void;
}

export default function InstallPrompt({ onClose }: InstallPromptProps) {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isIOS, setIsIOS] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
            return;
        }

        // Detect iOS
        const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        setIsIOS(iOS);

        // Listen for install prompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => {
            window.removeEventListener('beforeinstallprompt', handler);
        };
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            onClose();
        }
    };

    if (isInstalled) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 animate-in slide-in-from-bottom-4 duration-300">
            <div className="max-w-md mx-auto bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-2xl p-6 text-white">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                    <XMarkIcon className="h-5 w-5" />
                </button>

                {/* Icon */}
                <div className="flex items-center space-x-4 mb-4">
                    <div className="flex-shrink-0 p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                        <ArrowDownTrayIcon className="h-8 w-8" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold">Install GoTogether</h3>
                        <p className="text-sm text-blue-100">Use it like a native app!</p>
                    </div>
                </div>

                {/* Benefits */}
                <div className="space-y-2 mb-6">
                    <div className="flex items-center space-x-2 text-sm">
                        <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Quick access from your home screen</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                        <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Works offline for better performance</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                        <svg className="h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span>Full-screen app experience</span>
                    </div>
                </div>

                {/* Install button */}
                {isIOS ? (
                    <div className="space-y-3">
                        <p className="text-sm text-center">
                            Tap the Share button <span className="inline-block">📤</span> then "Add to Home Screen"
                        </p>
                    </div>
                ) : deferredPrompt ? (
                    <button
                        onClick={handleInstall}
                        className="w-full py-3 bg-white text-blue-600 font-semibold rounded-xl hover:bg-blue-50 transition-colors"
                    >
                        Install Now
                    </button>
                ) : (
                    <p className="text-sm text-center text-blue-100">
                        Install option will appear when available
                    </p>
                )}
            </div>
        </div>
    );
}
