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
}

interface ChatProps {
    groupedRideId: string;
}

export default function Chat({ groupedRideId }: ChatProps) {
    const { token, user } = useAuthStore();
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Fetch history
    useEffect(() => {
        const fetchHistory = async () => {
            try {
                const history = await chatApi.getHistory(groupedRideId);
                setMessages(history);
            } catch (error) {
                console.error('Failed to fetch chat history:', error);
            }
        };
        fetchHistory();
    }, [groupedRideId]);

    // Connect WebSocket
    useEffect(() => {
        if (!token) return;

        // Determine WS URL (handle https/wss and http/ws)
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const host = process.env.NEXT_PUBLIC_API_URL
            ? new URL(process.env.NEXT_PUBLIC_API_URL).host
            : 'localhost:8000';
        const wsUrl = `${protocol}//${host}/api/chat/${groupedRideId}?token=${token}`;

        console.log('Connecting to WS:', wsUrl);
        const ws = new WebSocket(wsUrl);

        ws.onopen = () => {
            console.log('WS Connected');
            setIsConnected(true);
        };

        ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            setMessages((prev) => [...prev, message]);
        };

        ws.onclose = () => {
            console.log('WS Disconnected');
            setIsConnected(false);
        };

        ws.onerror = (error) => {
            console.error('WS Error:', error);
        };

        wsRef.current = ws;

        return () => {
            ws.close();
        };
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
        <div className="flex flex-col h-96 bg-gray-50 rounded-lg border border-gray-200">
            {/* Header with Guidance */}
            <div className="p-4 bg-white border-b border-gray-200 rounded-t-lg">
                <h3 className="font-semibold text-gray-900">Group Chat</h3>
                <p className="text-xs text-gray-500 mt-1">
                    Chat with your fellow riders. This chat will be deleted after the ride is completed.
                </p>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 text-sm mt-10">
                        No messages yet. Say hello! 👋
                    </div>
                ) : (
                    messages.map((msg) => {
                        const isMe = msg.user_id === user?.id;
                        return (
                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] rounded-lg p-3 ${isMe ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-900'
                                    }`}>
                                    {!isMe && <p className="text-xs font-medium mb-1 text-gray-500">{msg.user_name}</p>}
                                    <p className="text-sm break-words">{msg.content}</p>
                                    <p className={`text-[10px] mt-1 ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
                <div className="flex space-x-2">
                    <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                        disabled={!isConnected}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!isConnected || !newMessage.trim()}
                        className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        <PaperAirplaneIcon className="h-5 w-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
