'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Chat from '@/components/Chat';
import { tripsApi } from '@/lib/api';
import { GroupedRideDetail } from '@/types';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const { id } = params;
    const [ride, setRide] = useState<GroupedRideDetail | null>(null);

    useEffect(() => {
        const fetchRide = async () => {
            try {
                const data = await tripsApi.getById(id as string);
                setRide(data as any);
            } catch (error) {
                console.error('Failed to fetch ride:', error);
            }
        };
        if (id) fetchRide();
    }, [id]);

    return (
        <div className="flex flex-col h-[calc(100dvh-4rem)] bg-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-[#008069] p-3 shadow-sm flex items-center gap-3 z-10 text-white shrink-0">
                <button onClick={() => router.back()} className="p-1 hover:bg-white/10 rounded-full">
                    <ArrowLeftIcon className="h-6 w-6" />
                </button>
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold shrink-0">
                        {ride ? ride.destination_address.charAt(0).toUpperCase() : 'G'}
                    </div>
                    <div className="flex-1 min-w-0">
                        <h1 className="font-semibold text-lg leading-tight truncate">
                            {ride ? `Trip to ${ride.destination_address.split(',')[0]}` : 'Loading...'}
                        </h1>
                        {ride?.driver && (
                            <p className="text-xs text-white/80 truncate">Driver: {ride.driver.name}</p>
                        )}
                    </div>
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-hidden relative">
                <div className="h-full relative z-0">
                    <Chat groupedRideId={id as string} fullScreen={true} />
                </div>
            </div>
        </div>
    );
}
