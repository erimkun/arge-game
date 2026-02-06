/**
 * Lobby Screen Component
 * Single Responsibility: Oda oluşturma ve katılma ekranı
 */

import { useState } from 'react';
import socketService from '../services/socketService';
import { useAppState, ACTION_TYPES } from '../contexts/AppStateContext';

function LobbyScreen() {
    const { dispatch } = useAppState();
    const [roomCode, setRoomCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [connectionStatus, setConnectionStatus] = useState('Bağlanılıyor...');

    // Socket bağlantısını başlat
    useState(() => {
        const socket = socketService.connect();

        const handleConnect = () => setConnectionStatus('Bağlandı ✓');
        const handleDisconnect = () => setConnectionStatus('Bağlantı kesildi ✗');

        socket.on('connect', handleConnect);
        socket.on('disconnect', handleDisconnect);

        if (socket.connected) {
            setConnectionStatus('Bağlandı ✓');
        }

        return () => {
            socket.off('connect', handleConnect);
            socket.off('disconnect', handleDisconnect);
        };
    }, []);

    const socket = socketService.getSocket();

    // Oda oluştur
    const handleCreateRoom = async () => {
        setError('');

        if (!socket || !socket.connected) {
            setError('Sunucuya bağlanılamadı. Lütfen sayfayı yenileyin.');
            return;
        }

        setIsLoading(true);

        socket.emit('createRoom');

        socket.once('roomCreated', (data) => {
            console.log('Oda oluşturuldu:', data);
            dispatch({ type: ACTION_TYPES.SET_ROOM, payload: { code: data.code } });
            setIsLoading(false);
        });

        socket.once('error', (errorMessage) => {
            setError(errorMessage);
            setIsLoading(false);
        });
    };

    // Odaya katıl
    const handleJoinRoom = async (e) => {
        e.preventDefault();
        setError('');

        if (!roomCode.trim()) {
            setError('Oda kodu giriniz.');
            return;
        }

        if (roomCode.length !== 6) {
            setError('Oda kodu 6 haneli olmalıdır.');
            return;
        }

        if (!socket || !socket.connected) {
            setError('Sunucuya bağlanılamadı. Lütfen sayfayı yenileyin.');
            return;
        }

        setIsLoading(true);

        socket.emit('joinRoom', roomCode.toUpperCase());

        socket.once('roomJoined', (data) => {
            console.log('Odaya katıldı:', data);
            dispatch({ type: ACTION_TYPES.SET_ROOM, payload: { code: data.code } });
            dispatch({ type: ACTION_TYPES.SET_PROFILES, payload: data.profiles || [] });
            // Votes objesi varsa yükle
            if (data.votes) {
                Object.entries(data.votes).forEach(([profileId, count]) => {
                    dispatch({ type: ACTION_TYPES.UPDATE_VOTE, payload: { profileId, count } });
                });
            }
            setIsLoading(false);
        });

        socket.once('error', (errorMessage) => {
            setError(errorMessage);
            setIsLoading(false);
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20">
                <h1 className="text-4xl font-bold text-white text-center mb-2">
                    🎭 ARGE Yarışması
                </h1>
                <p className="text-center text-purple-200 mb-8">
                    Kent Teknolojileri Aylık Yarışma
                </p>

                {/* Oda Oluştur */}
                <button
                    onClick={handleCreateRoom}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 disabled:opacity-50 text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg mb-6"
                >
                    {isLoading ? '⏳ Oda Oluşturuluyor...' : '🏠 Yeni Oda Oluştur'}
                </button>

                {/* Ayırıcı */}
                <div className="flex items-center mb-6">
                    <div className="flex-1 border-t border-white/30"></div>
                    <span className="px-4 text-white/60 text-sm">veya</span>
                    <div className="flex-1 border-t border-white/30"></div>
                </div>

                {/* Odaya Katıl */}
                <form onSubmit={handleJoinRoom} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-purple-200 mb-2">
                            Oda Kodunu Girin:
                        </label>
                        <input
                            type="text"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            placeholder="ABC123"
                            maxLength={6}
                            disabled={isLoading}
                            className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/30 text-white text-center text-2xl font-mono tracking-wider placeholder-white/40 focus:border-purple-400 focus:ring-2 focus:ring-purple-400/50 outline-none transition-all uppercase"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading || !roomCode.trim()}
                        className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-lg"
                    >
                        {isLoading ? '⏳ Katılınıyor...' : '🚪 Odaya Katıl'}
                    </button>
                </form>

                {/* Hata Mesajı */}
                {error && (
                    <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
                        <p className="text-sm text-red-200 text-center">{error}</p>
                    </div>
                )}

                {/* Bağlantı Durumu */}
                <p className="mt-6 text-xs text-white/40 text-center">
                    {connectionStatus}
                </p>
            </div>
        </div>
    );
}

export default LobbyScreen;
