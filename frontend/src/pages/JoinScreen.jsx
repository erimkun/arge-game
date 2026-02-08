/**
 * Join Screen Component
 * Single Responsibility: Kullanıcı profil oluşturma ekranı
 * Oda sistemine entegre
 */

import { useState, useEffect, Suspense } from 'react'; // Added Suspense
import socketService from '../services/socketService';
import { useAppState, ACTION_TYPES, APP_STATES } from '../contexts/AppStateContext';
import { AVATARS } from '../utils/avatars';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import CharacterModel from '../components/carousel/CharacterModel';
import { playSound } from '../utils/sound';

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

  // Set default avatar
  useEffect(() => {
    if (!selectedAvatar && AVATARS.length > 0) {
      setSelectedAvatar(AVATARS[0]);
    }
  }, []);

  // Kodu kopyala
  const handleCopyCode = async () => {
    playSound.click();
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
    playSound.click();
    if (socket) {
      socket.emit('leaveRoom');
    }
    dispatch({ type: ACTION_TYPES.LEAVE_ROOM });
  };

  const handleAvatarSelect = (avatar) => {
    playSound.click();
    setSelectedAvatar(avatar);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    playSound.click();
    setError('');

    if (!characterName.trim()) {
      playSound.error();
      setError('Adınızı girmelisiniz.');
      return;
    }

    if (!selectedAvatar) {
      playSound.error();
      setError('Bir avatar seçmelisiniz.');
      return;
    }

    if (!socket || !socket.connected) {
      playSound.error();
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
          playSound.join();
          dispatch({ type: ACTION_TYPES.SET_MY_PROFILE, payload: profile });
          dispatch({ type: ACTION_TYPES.SET_STATE, payload: APP_STATES.VOTING });
          socket.off('profileAdded', handleProfileAdded);
          setIsCreating(false);
        }
      };

      socket.on('profileAdded', handleProfileAdded);

      // Hata durumu
      socket.once('error', (errorMessage) => {
        playSound.error();
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
    <div className="flex-1 flex items-center justify-center p-4 overflow-hidden">
      <div className="glass-card rounded-3xl w-full max-w-5xl overflow-hidden shadow-2xl flex flex-col md:flex-row h-[85vh] md:h-auto">

        {/* Left Side: 3D Preview */}
        <div className="w-full md:w-1/2 bg-gray-900/50 relative min-h-[300px] md:min-h-[600px] flex flex-col">
          <div className="absolute top-4 left-4 z-10 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10">
            <span className="text-white text-sm font-medium">3D Önizleme</span>
          </div>

          <Canvas
            shadows
            camera={{ position: [0, 1.5, 4], fov: 45 }}
            className="w-full h-full"
          >
            <color attach="background" args={['#1a1a2e']} />
            <ambientLight intensity={0.7} />
            <spotLight position={[5, 10, 5]} intensity={1.5} angle={0.5} penumbra={1} castShadow />
            <spotLight position={[-5, 5, 5]} intensity={0.5} color="purple" />
            <Environment preset="city" />

            <Suspense fallback={null}>
              {selectedAvatar && (
                <CharacterModel
                  modelPath={selectedAvatar.model}
                  targetHeight={2.2}
                  position={[0, -1, 0]}
                />
              )}
            </Suspense>

            <OrbitControls
              enableZoom={false}
              enablePan={false}
              minPolarAngle={Math.PI / 2.5}
              maxPolarAngle={Math.PI / 1.8}
              autoRotate={true}
              autoRotateSpeed={2}
            />
          </Canvas>

          <div className="absolute bottom-4 left-0 w-full text-center pointer-events-none">
            <p className="text-white/50 text-xs">Modeli döndürmek için sürükleyin</p>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-center bg-white/5 backdrop-blur-sm overflow-y-auto">
          {/* Oda Kodu Header */}
          <div className="flex items-center justify-between mb-6 bg-white/5 rounded-xl p-3 border border-white/10">
            <div>
              <p className="text-purple-200 text-xs uppercase tracking-wide">Oda Kodu</p>
              <p className="text-white text-2xl font-mono font-bold tracking-wider">{roomCode}</p>
            </div>
            <button
              onClick={handleCopyCode}
              className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-lg transition-colors"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">
            Karakterini Seç
          </h1>
          <p className="text-purple-200 mb-6 text-sm">
            Yarışmadaki dijital kimliğini oluştur
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Avatar Selection */}
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-3">
                Avatar
              </label>
              <div className="grid grid-cols-4 gap-3">
                {AVATARS.map((avatar) => (
                  <button
                    key={avatar.id}
                    type="button"
                    onClick={() => handleAvatarSelect(avatar)}
                    disabled={isCreating}
                    className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-200 border-2 ${selectedAvatar?.id === avatar.id
                      ? 'border-purple-500 scale-105 shadow-[0_0_15px_rgba(168,85,247,0.5)]'
                      : 'border-transparent hover:border-white/30 opacity-70 hover:opacity-100'
                      }`}
                  >
                    <img
                      src={avatar.image}
                      alt={avatar.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div>
              <label className="block text-sm font-semibold text-white/80 mb-2">
                Görünen Ad
              </label>
              <input
                type="text"
                value={characterName}
                onChange={(e) => setCharacterName(e.target.value)}
                placeholder="İsim girin..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
                disabled={isCreating}
                maxLength={50}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isCreating || !characterName.trim() || !selectedAvatar}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-4 px-6 rounded-xl transition-all duration-200 shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isCreating ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Katılınıyor...
                </span>
              ) : (
                '✨ Yarışmaya Katıl'
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          <button
            onClick={handleLeaveRoom}
            className="w-full mt-4 text-white/30 hover:text-white text-xs transition-colors"
          >
            ← Başlangıca Dön
          </button>
        </div>
      </div>
    </div>
  );
}

export default JoinScreen;
