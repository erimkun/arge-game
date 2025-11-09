/**
 * Join Screen Component
 * Single Responsibility: Kullanıcı profil oluşturma ekranı
 */

import { useState, useEffect } from 'react';
import socketService from '../services/socketService';
import { useAppState, ACTION_TYPES, APP_STATES } from '../contexts/AppStateContext';
import { AVATARS } from '../utils/avatars';

function JoinScreen() {
  const { dispatch } = useAppState();
  const [characterName, setCharacterName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('Bağlanılıyor...');

  // Socket bağlantısını başlat ve durumunu dinle
  useEffect(() => {
    const socket = socketService.connect();

    const handleConnect = () => {
      setConnectionStatus('Bağlandı ✓');
    };
    const handleDisconnect = () => {
      setConnectionStatus('Bağlantı kesildi ✗');
    };

    socket.on('connect', handleConnect);
    socket.on('disconnect', handleDisconnect);

    // İlk durumu kontrol et
    if (socket.connected) {
      setConnectionStatus('Bağlandı ✓');
    }

    return () => {
      socket.off('connect', handleConnect);
      socket.off('disconnect', handleDisconnect);
    };
  }, []);

  const socket = socketService.getSocket();

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
      // Profil oluştur (avatar ile birlikte)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-2xl">
        <h1 className="text-3xl md:text-4xl font-bold text-indigo-700 text-center mb-2">
          🎭 Kent Teknolojileri ve ARGE Yarışması
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Aylık arge yarışmasına katılın ve kazanan olmak için şansınızı deneyin. Çünkü ERİM kazanacak zaten. siz şans denersiniz max xd.
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
                  className={`relative p-2 rounded-lg border-2 transition-all duration-200 ${
                    selectedAvatar?.id === avatar.id
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

        <p className="mt-4 text-xs text-gray-500 text-center">
          {connectionStatus}
        </p>
      </div>
    </div>
  );
}

export default JoinScreen;
