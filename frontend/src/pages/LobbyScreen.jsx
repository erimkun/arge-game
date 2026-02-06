/**
 * Lobby Screen Component
 * Single Responsibility: Oda oluşturma ve katılma ekranı
 * Negatif senaryolar için güvenlik kontrolleri içerir
 */

import { useState, useEffect } from 'react';
import socketService from '../services/socketService';
import { useAppState, ACTION_TYPES } from '../contexts/AppStateContext';
import { useSocket } from '../hooks/useSocket';

function LobbyScreen() {
    const { dispatch } = useAppState();
    const { connectionStatus, lastError, clearError } = useSocket();
    const [roomCode, setRoomCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const socket = socketService.getSocket();

    // Socket event listeners
    useEffect(() => {
        if (!socket) return;

        const handleRoomCreated = (data) => {
            console.log('Oda oluşturuldu:', data);
            setIsLoading(false);
            dispatch({
                type: ACTION_TYPES.SET_ROOM,
                payload: { code: data.code }
            });
            if (data.stats) {
                dispatch({ type: ACTION_TYPES.SET_ROOM_STATS, payload: data.stats });
            }
        };

        const handleRoomJoined = (data) => {
            console.log('Odaya katıldı:', data);
            setIsLoading(false);
            dispatch({
                type: ACTION_TYPES.SET_ROOM,
                payload: { code: data.code }
            });
            if (data.stats) {
                dispatch({ type: ACTION_TYPES.SET_ROOM_STATS, payload: data.stats });
            }
            // Mevcut profilleri yükle
            if (data.profiles && data.profiles.length > 0) {
                dispatch({ type: ACTION_TYPES.SET_PROFILES, payload: data.profiles });
            }
        };

        const handleError = (errorMessage) => {
            console.error('Socket hatası:', errorMessage);
            setError(errorMessage);
            setIsLoading(false);
        };

        socket.on('roomCreated', handleRoomCreated);
        socket.on('roomJoined', handleRoomJoined);
        socket.on('error', handleError);

        return () => {
            socket.off('roomCreated', handleRoomCreated);
            socket.off('roomJoined', handleRoomJoined);
            socket.off('error', handleError);
        };
    }, [socket, dispatch]);

    // Connection status'a göre lastError'u göster
    useEffect(() => {
        if (lastError) {
            setError(lastError);
        }
    }, [lastError]);

    const handleCreateRoom = () => {
        if (!socket || !socket.connected) {
            setError('Sunucuya bağlanılamadı. Lütfen sayfayı yenileyin.');
            return;
        }

        setError('');
        setIsLoading(true);
        socket.emit('createRoom');
    };

    const handleJoinRoom = (e) => {
        e.preventDefault();

        if (!socket || !socket.connected) {
            setError('Sunucuya bağlanılamadı. Lütfen sayfayı yenileyin.');
            return;
        }

        const trimmedCode = roomCode.trim().toUpperCase();

        if (!trimmedCode) {
            setError('Oda kodu boş olamaz.');
            return;
        }

        if (trimmedCode.length !== 6) {
            setError('Oda kodu 6 haneli olmalıdır.');
            return;
        }

        // Geçersiz karakterleri kontrol et
        const validChars = /^[A-Z0-9]+$/;
        if (!validChars.test(trimmedCode)) {
            setError('Oda kodu sadece harf ve rakam içerebilir.');
            return;
        }

        setError('');
        setIsLoading(true);
        socket.emit('joinRoom', trimmedCode);
    };

    const handleInputChange = (e) => {
        const value = e.target.value.toUpperCase().slice(0, 6);
        setRoomCode(value);
        if (error) setError('');
    };

    // Bağlantı durumu göstergesi
    const renderConnectionStatus = () => {
        if (connectionStatus === 'connected') {
            return (
                <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1 rounded-full text-sm">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    Bağlandı
                </div>
            );
        }
        if (connectionStatus === 'connecting') {
            return (
                <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-3 py-1 rounded-full text-sm">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full animate-ping"></div>
                    Bağlanıyor...
                </div>
            );
        }
        return (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-1 rounded-full text-sm">
                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                Bağlantı kesildi
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
                {/* Connection Status */}
                <div className="flex justify-center mb-6">
                    {renderConnectionStatus()}
                </div>

                {/* Logo / Title */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">
                        🎭 Avatar Yarışması
                    </h1>
                    <p className="text-purple-200">
                        Kent Teknolojileri ve ARGE
                    </p>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-xl">
                        <div className="flex items-center justify-between">
                            <p className="text-red-200 text-sm">{error}</p>
                            <button
                                onClick={() => { setError(''); clearError(); }}
                                className="text-red-300 hover:text-white ml-2"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                )}

                {/* Create Room Button */}
                <button
                    onClick={handleCreateRoom}
                    disabled={isLoading || connectionStatus !== 'connected'}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:from-gray-500 disabled:to-gray-600 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 mb-6 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
                >
                    {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            İşleniyor...
                        </span>
                    ) : (
                        '🚀 Yeni Oda Oluştur'
                    )}
                </button>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-white/20"></div>
                    <span className="text-white/50 text-sm">veya</span>
                    <div className="flex-1 h-px bg-white/20"></div>
                </div>

                {/* Join Room Form */}
                <form onSubmit={handleJoinRoom} className="space-y-4">
                    <div>
                        <label className="block text-purple-200 text-sm font-medium mb-2">
                            Oda Kodunu Gir
                        </label>
                        <input
                            type="text"
                            value={roomCode}
                            onChange={handleInputChange}
                            placeholder="ABC123"
                            className="w-full bg-white/10 border border-white/20 text-white text-center text-2xl font-mono font-bold tracking-widest py-4 px-4 rounded-xl placeholder-white/30 focus:outline-none focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 uppercase"
                            maxLength={6}
                            disabled={isLoading}
                            autoComplete="off"
                        />
                        <p className="text-white/40 text-xs mt-2 text-center">
                            6 haneli oda kodunu arkadaşından iste
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || !roomCode.trim() || connectionStatus !== 'connected'}
                        className="w-full bg-white/20 hover:bg-white/30 disabled:bg-white/5 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 border border-white/30 disabled:border-white/10 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Katılınıyor...' : '🔗 Odaya Katıl'}
                    </button>
                </form>

                {/* Footer */}
                <p className="text-center text-white/30 text-xs mt-8">
                    Aynı ağdaki arkadaşlarınla oyna
                </p>
            </div>
        </div>
    );
}

export default LobbyScreen;
