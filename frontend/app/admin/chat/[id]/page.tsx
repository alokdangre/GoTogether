'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Chat from '@/components/Chat';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function AdminChatPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const [adminToken, setAdminToken] = useState<string | null>(null);
    const [adminId, setAdminId] = useState<string | null>(null);

    useEffect(() => {
        const token = localStorage.getItem('admin_token');
        if (!token) {
            router.push('/admin/login');
            return;
        }
        setAdminToken(token);

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            setAdminId(payload.sub);
        } catch (e) {
            console.error('Failed to decode admin token', e);
        }
    }, [router]);

    return (
        <div className="flex flex-col h-screen bg-gray-100">
            <div className="bg-[#008069] p-4 shadow-sm flex items-center gap-4 z-10 text-white">
                <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full">
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <h1 className="font-semibold text-lg">Admin Support Chat</h1>
            </div>

            <div className="flex-1 overflow-hidden relative">
                <div className="h-full relative z-0">
                    {adminToken && adminId && (
                        <Chat
                            groupedRideId={id as string}
                            fullScreen={true}
                            authToken={adminToken}
                            currentUserId={adminId}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
