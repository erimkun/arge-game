/**
 * Chat Panel Component
 * Oylama sırasında gerçek zamanlı sohbet
 */

import { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import socketService from '../services/socketService';
import { playSound } from '../utils/sound';

export default function ChatPanel({ isOpen, onToggle }) {
    const [messages, setMessages] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);
    const socket = socketService.getSocket();

    // Yeni mesaj geldiğinde
    useEffect(() => {
        if (!socket) return;

        const handleChatMessage = (message) => {
            setMessages((prev) => [...prev.slice(-49), message]); // Son 50 mesaj

            // Panel kapalıysa unread artır
            if (!isOpen) {
                setUnreadCount((prev) => prev + 1);
                playSound.click();
            }
        };

        socket.on('chatMessage', handleChatMessage);

        return () => {
            socket.off('chatMessage', handleChatMessage);
        };
    }, [socket, isOpen]);

    // Panel açıldığında unread sıfırla
    useEffect(() => {
        if (isOpen) {
            setUnreadCount(0);
        }
    }, [isOpen]);

    // Yeni mesajda scroll
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!inputValue.trim() || !socket) return;

        socket.emit('sendMessage', { message: inputValue.trim() });
        setInputValue('');
    };

    return (
        <>
            {/* Chat Toggle Button */}
            <button
                onClick={onToggle}
                className="fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg transition-transform hover:scale-110"
                style={{
                    backgroundColor: 'var(--accent)',
                    color: 'white',
                }}
            >
                <span className="text-xl">💬</span>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Chat Panel */}
            <div
                className={`fixed bottom-20 right-4 w-80 max-h-96 rounded-xl shadow-2xl transition-all duration-300 z-40 flex flex-col ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
                style={{
                    backgroundColor: 'var(--bg-secondary)',
                    border: '1px solid var(--border-color)',
                }}
            >
                {/* Header */}
                <div
                    className="px-4 py-3 font-semibold flex items-center justify-between rounded-t-xl"
                    style={{
                        backgroundColor: 'var(--bg-card)',
                        borderBottom: '1px solid var(--border-color)',
                        color: 'var(--text-primary)',
                    }}
                >
                    <span>💬 Sohbet</span>
                    <button
                        onClick={onToggle}
                        className="text-lg opacity-70 hover:opacity-100"
                    >
                        ✕
                    </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-60">
                    {messages.length === 0 ? (
                        <p className="text-center opacity-50 text-sm" style={{ color: 'var(--text-secondary)' }}>
                            Henüz mesaj yok...
                        </p>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className="rounded-lg p-2 text-sm"
                                style={{
                                    backgroundColor: 'var(--bg-card)',
                                    color: 'var(--text-primary)',
                                }}
                            >
                                <span className="font-semibold" style={{ color: 'var(--accent)' }}>
                                    {msg.senderName}:
                                </span>{' '}
                                {msg.message}
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <form
                    onSubmit={handleSubmit}
                    className="p-3 flex gap-2"
                    style={{
                        borderTop: '1px solid var(--border-color)',
                    }}
                >
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Mesaj yaz..."
                        maxLength={500}
                        className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                        style={{
                            backgroundColor: 'var(--bg-card)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-color)',
                        }}
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 rounded-lg font-semibold transition-colors"
                        style={{
                            backgroundColor: 'var(--accent)',
                            color: 'white',
                        }}
                    >
                        ➤
                    </button>
                </form>
            </div>
        </>
    );
}

ChatPanel.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onToggle: PropTypes.func.isRequired,
};
