/**
 * Join Screen Component
 * Single Responsibility: Kullanıcı profil oluşturma ekranı
 * Oda sistemine entegre
 */

import { useState, useEffect } from 'react';
import socketService from '../services/socketService';
import { useAppState, ACTION_TYPES, APP_STATES } from '../contexts/AppStateContext';
import { AVATARS } from '../utils/avatars';

function JoinScreen() {
  const { state, dispatch } = useAppState();
  const [characterName, setCharacterName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const socket = socketService.getSocket();
  const roomCode = state.currentRoom?.code;

  // Oda kodu yoksa lobby'e geri dön
  useEffect(() => {
    if (!roomCode) {
      dispatch({ type: ACTION_TYPES.SET_STATE, payload: APP_STATES.LOBBY });
    }
  }, [roomCode, dispatch]);

  // Kodu kopyala
  const handleCopyCode = async () => {
    if (roomCode) {
      try {
        await navigator.clipboard.writeText(roomCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Kopyalama hatası:', err);
      }
    }
  };

  // Odadan ayrıl
  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leaveRoom');
    }
    dispatch({ type: ACTION_TYPES.LEAVE_ROOM });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!characterName.trim()) {
      setError('Adınızı girmelisiniz.');
      return;
    }

    if (!selectedAvatar) {
      setError('Bir avatar seçmelisiniz.');
      return;
    }

    if (!socket || !socket.connected) {
      setError('Sunucuya bağlanılamadı. Lütfen tekrar deneyin.');
      return;
    }

    setIsCreating(true);

    try {
      // Profil oluştur (oda bazlı)
      socket.emit('createProfile', {
        name: characterName.trim(),
        avatar: selectedAvatar.image,
        model: selectedAvatar.model,
      });

      // Profil eklendiğinde kendi profilimizi kaydet
      const handleProfileAdded = (profile) => {
        if (profile.name === characterName.trim()) {
          dispatch({ type: ACTION_TYPES.SET_MY_PROFILE, payload: profile });
          dispatch({ type: ACTION_TYPES.SET_STATE, payload: APP_STATES.VOTING });
          socket.off('profileAdded', handleProfileAdded);
          setIsCreating(false);
        }
      };

      socket.on('profileAdded', handleProfileAdded);

      // Hata durumu
      socket.once('error', (errorMessage) => {
        setError(errorMessage);
        setIsCreating(false);
        socket.off('profileAdded', handleProfileAdded);
      });
    } catch (err) {
      setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      setIsCreating(false);
    }
  };

  if (!roomCode) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
        {/* Oda Kodu */}
        <div className="bg-gradient-to-r from-purple-500 to-indigo-500 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Oda Kodu (Arkadaşlarınla Paylaş!)</p>
              <p className="text-white text-3xl font-mono font-bold tracking-wider">{roomCode}</p>
            </div>
            <button
              onClick={handleCopyCode}
              className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {copied ? '✓ Kopyalandı!' : '📋 Kopyala'}
            </button>
          </div>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold text-indigo-700 text-center mb-2">
          🎭 Kent Teknolojileri ve ARGE Yarışması
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Aylık arge yarışmasına katılın. Avatar seçin ve profilinizi oluşturun!
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Avatar Seçin:
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 gap-3">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  disabled={isCreating}
                  className={`relative p-2 rounded-lg border-2 transition-all duration-200 ${selectedAvatar?.id === avatar.id
                      ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-300'
                      : 'border-gray-200 hover:border-indigo-300 bg-white'
                    } ${isCreating ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <img
                    src={avatar.image}
                    alt={avatar.name}
                    className="w-full h-auto rounded-md object-cover"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/150/6B46C1/FFFFFF?text=AVTR';
                    }}
                  />
                  {selectedAvatar?.id === avatar.id && (
                    <div className="absolute top-1 right-1 bg-indigo-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                      ✓
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Name Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Adınız:
            </label>
            <input
              type="text"
              value={characterName}
              onChange={(e) => setCharacterName(e.target.value)}
              placeholder="Adınızı Girin..."
              className="w-full px-4 py-3 rounded-lg bg-gray-100 border-2 border-transparent focus:border-indigo-300 focus:ring-2 focus:ring-indigo-200 outline-none transition-all text-gray-900"
              disabled={isCreating}
              maxLength={50}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isCreating || !characterName.trim() || !selectedAvatar}
            className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Oluşturuluyor...' : 'Karakterimi Oluştur ve Katıl'}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-600 text-center">{error}</p>
        )}

        {/* Odadan Ayrıl */}
        <button
          onClick={handleLeaveRoom}
          className="w-full mt-4 text-gray-500 hover:text-gray-700 text-sm underline"
        >
          ← Odadan Ayrıl
        </button>
      </div>
    </div>
  );
}

export default JoinScreen;
