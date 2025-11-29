import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { chatApi } from '@/lib/api';
import { PaperAirplaneIcon } from '@heroicons/react/24/solid';

interface Message {
    id: string;
    content: string;
    user_id: string;
    user_name: string;
    created_at: string;
    message_type: string;
    sender_type?: 'user' | 'admin'; // Added for new logic
    admin_id?: string; // Added for new logic
}

interface ChatProps {
    groupedRideId: string;
    fullScreen?: boolean;
    authToken?: string;
    currentUserId?: string;
}

export default function Chat({ groupedRideId, fullScreen = false, authToken, currentUserId }: ChatProps) {
    const { token: userToken, user } = useAuthStore();
    const token = authToken || userToken;
    const myId = currentUserId || user?.id;

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch history
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                // We need to use the correct token for fetching history
                // chatApi uses the global api instance which uses localStorage token
                // If we are admin, we might need to pass headers manually or use a different API call
                // For simplicity, if authToken is provided, we assume it's set in axios or we pass it

                // Actually, api.ts uses interceptor reading from localStorage.
                // If Admin, we might need to temporarily set it or use a custom request.
                // Let's use fetch directly for custom token

                const headers: any = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/chat/${groupedRideId}/history`, { headers });
                if (response.ok) {
                    const history = await response.json();
                    setMessages(history);
                }
            } catch (error) {
                console.error('Failed to fetch chat history:', error);
            }
        };
        fetchHistory();
    }, [groupedRideId, token]);

    // Connect WebSocket
    useEffect(() => {
        if (!token) return;

        // Determine WS URL (handle https/wss and http/ws)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = process.env.NEXT_PUBLIC_API_URL
            ? new URL(process.env.NEXT_PUBLIC_API_URL).host
            : 'localhost:8000';
        const wsUrl = `${protocol}//${host}/api/chat/${groupedRideId}?token=${token}`;

        const ws = new WebSocket(wsUrl);

        ws.onopen = () => setIsConnected(true);
        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages((prev) => [...prev, message]);
        };
        ws.onclose = () => setIsConnected(false);
        wsRef.current = ws;

        return () => ws.close();
    }, [groupedRideId, token]);

    const sendMessage = () => {
        if (wsRef.current && newMessage.trim()) {
            wsRef.current.send(JSON.stringify({ content: newMessage }));
            setNewMessage('');
        }
    };

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    return (
        <div className={`flex flex-col ${fullScreen ? 'h-full' : 'h-96 rounded-lg border border-gray-200'} bg-[#efeae2]`}>
            {!fullScreen && (
                <div className="p-3 bg-[#008069] text-white rounded-t-lg flex items-center shadow-sm">
                    <h3 className="font-semibold text-sm flex-1">Group Chat</h3>
                    <p className="text-xs opacity-80">End-to-end encrypted</p>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-opacity-10">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm mt-10">
                        No messages yet. Say hello! 👋
                    </div>
                ) : (
                    messages.map((msg) => {
                        // Check if message is from me
                        // If sender_type is 'admin' and I am admin (how do I know? myId matches admin_id?)
                        // msg has admin_id and user_id.
                        // If I am user, myId is user_id.
                        // If I am admin, myId is admin_id.

                        let isMe = false;
                        if (msg.sender_type === 'user' && msg.user_id === myId) isMe = true;
                        if (msg.sender_type === 'admin' && msg.admin_id === myId) isMe = true;

                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg p-2 px-3 shadow-sm relative text-sm ${isMe ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-none' : 'bg-white text-gray-900 rounded-tl-none'
                                    }`}>
                                    {!isMe && <p className={`text-xs font-bold mb-1 ${msg.sender_type === 'admin' ? 'text-red-500' : 'text-orange-500'}`}>{msg.user_name}</p>}
                                    <p className="break-words">{msg.content}</p>
                                    <p className="text-[10px] text-gray-500 text-right mt-1">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            <div className="p-2 bg-[#f0f2f5] flex items-center gap-2">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message"
                    className="flex-1 rounded-lg border-none px-4 py-2 focus:ring-0 bg-white shadow-sm"
                    disabled={!isConnected}
                />
                <button
                    onClick={sendMessage}
                    disabled={!isConnected || !newMessage.trim()}
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors text-[#54656f]"
                >
                    <PaperAirplaneIcon className="h-6 w-6" />
                </button>
            </div>
        </div>
    );
}
