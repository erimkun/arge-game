/**
 * Voting Screen Component
 * Single Responsibility: Oylama ekranı ve oy verme işlevselliği
 * Oda sistemi ile çalışır
 * Negatif senaryolar için UI feedback içerir
 */

import { useCallback, useEffect, useMemo, useState, Suspense } from 'react';
import socketService from '../services/socketService';
import { useAppState, ACTION_TYPES, APP_STATES } from '../contexts/AppStateContext';
import VotingCarousel3D from '../components/carousel/VotingCarousel3D';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import CharacterModel from '../components/carousel/CharacterModel';

function VotingScreen() {
  const { state, dispatch } = useAppState();
  const [hasVoted, setHasVoted] = useState(false);
  const [votedProfileId, setVotedProfileId] = useState(null);
  const [showEndModal, setShowEndModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [activeProfile, setActiveProfile] = useState(null);
  const [copied, setCopied] = useState(false);
  const [notification, setNotification] = useState(null);

  const socket = socketService.getSocket();
  const myProfile = state.myProfile;
  const myProfileId = myProfile?.id;
  const roomCode = state.currentRoom?.code;
  const roomStats = state.roomStats;

  // Minimum katılımcı kontrolü
  const canEndVoting = roomStats?.canEndVoting ?? false;
  const minProfilesRequired = roomStats?.minProfilesRequired ?? 2;
  const profileCount = roomStats?.profileCount ?? 0;

  const otherProfiles = useMemo(
    () => state.profiles.filter((profile) => profile.id !== myProfileId),
    [state.profiles, myProfileId]
  );

  useEffect(() => {
    if (otherProfiles.length === 0) {
      setActiveProfile(null);
      return;
    }

    setActiveProfile((prev) => {
      if (!prev) return otherProfiles[0];
      return otherProfiles.find((profile) => profile.id === prev.id) ?? otherProfiles[0];
    });
  }, [otherProfiles]);

  // Socket event listeners for notifications
  useEffect(() => {
    if (!socket) return;

    const handleParticipantJoined = (data) => {
      setNotification({ type: 'info', message: '🎉 Yeni katılımcı!' });
      setTimeout(() => setNotification(null), 3000);
    };

    const handleParticipantLeft = (data) => {
      setNotification({ type: 'warning', message: '👋 Bir katılımcı ayrıldı' });
      setTimeout(() => setNotification(null), 3000);
    };

    const handleError = (errorMessage) => {
      setNotification({ type: 'error', message: errorMessage });
      setTimeout(() => setNotification(null), 5000);
    };

    socket.on('participantJoined', handleParticipantJoined);
    socket.on('participantLeft', handleParticipantLeft);
    socket.on('error', handleError);

    return () => {
      socket.off('participantJoined', handleParticipantJoined);
      socket.off('participantLeft', handleParticipantLeft);
      socket.off('error', handleError);
    };
  }, [socket]);

  const handleVote = useCallback(
    (profileId) => {
      if (hasVoted || profileId === myProfileId || !socket) {
        return;
      }

      socket.emit('vote', profileId);
      setHasVoted(true);
      setVotedProfileId(profileId);
    },
    [hasVoted, myProfileId, socket]
  );

  const handleEndVoting = useCallback(() => {
    if (!socket) return;

    if (!canEndVoting) {
      setNotification({
        type: 'error',
        message: `Oylama için en az ${minProfilesRequired} katılımcı gerekli!`
      });
      setTimeout(() => setNotification(null), 5000);
      setShowEndModal(false);
      return;
    }

    socket.emit('endVoting');
    setShowEndModal(false);
  }, [socket, canEndVoting, minProfilesRequired]);

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

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leaveRoom');
    }
    dispatch({ type: ACTION_TYPES.LEAVE_ROOM });
  };

  const votes = state.votes;

  return (
    <>
      {/* Notification Toast */}
      {notification && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-xl shadow-lg animate-pulse ${notification.type === 'error' ? 'bg-red-500 text-white' :
            notification.type === 'warning' ? 'bg-yellow-500 text-white' :
              'bg-green-500 text-white'
          }`}>
          {notification.message}
        </div>
      )}

      {/* Room Code Header */}
      {roomCode && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 bg-purple-600/90 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg">
          <span className="text-white/70 text-sm">Oda:</span>
          <span className="text-white font-mono font-bold text-lg">{roomCode}</span>
          <button
            onClick={handleCopyCode}
            className="ml-2 text-white/80 hover:text-white text-sm"
          >
            {copied ? '✓' : '📋'}
          </button>
          {/* Katılımcı sayısı */}
          <span className="ml-3 text-white/60 text-sm">
            👥 {profileCount}
          </span>
        </div>
      )}

      {/* Tek başına bekleme durumu */}
      {otherProfiles.length === 0 ? (
        <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-blue-900 p-4 flex items-center justify-center">
          <div className="rounded-3xl bg-white/10 backdrop-blur-lg p-10 text-center shadow-xl max-w-lg border border-white/20">
            {/* Bekleme animasyonu */}
            <div className="flex justify-center mb-6">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-purple-500/30 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-purple-400 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-3xl">
                  ⏳
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-4">
              Arkadaşlarını Bekliyorsun...
            </h2>

            <p className="text-purple-200 mb-6">
              Henüz başka katılımcı yok. Oda kodunu paylaşarak arkadaşlarını davet et!
            </p>

            {/* Oda kodu paylaşım */}
            <div className="bg-white/10 rounded-xl p-4 mb-6">
              <p className="text-purple-300 text-sm mb-2">Oda Kodu:</p>
              <div className="flex items-center justify-center gap-3">
                <span className="text-4xl font-mono font-bold text-white tracking-wider">
                  {roomCode}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {copied ? '✓ Kopyalandı' : '📋 Kopyala'}
                </button>
              </div>
            </div>

            {/* Minimum katılımcı uyarısı */}
            <div className="bg-yellow-500/20 border border-yellow-500/50 rounded-lg p-3 mb-4">
              <p className="text-yellow-200 text-sm">
                ⚠️ Oylama için en az <strong>{minProfilesRequired}</strong> katılımcı gerekli
              </p>
            </div>

            <p className="text-white/50 text-sm">
              Katılımcılar geldikçe burada görünecekler
            </p>
          </div>
        </div>
      ) : (
        <VotingCarousel3D
          profiles={otherProfiles}
          votes={votes}
          myProfile={myProfile}
          onActiveProfileChange={setActiveProfile}
          onVote={handleVote}
          hasVoted={hasVoted}
          votedProfileId={votedProfileId}
        />
      )}

      {/* User Button - Fixed Position Left */}
      <button
        type="button"
        onClick={() => setShowProfileModal(true)}
        className="fixed top-3 left-3 z-40 rounded-xl bg-indigo-600 px-4 py-2 font-semibold text-white shadow-lg transition hover:bg-indigo-700"
      >
        👤
      </button>

      {/* Leave Room Button */}
      <button
        type="button"
        onClick={handleLeaveRoom}
        className="fixed bottom-3 left-3 z-40 rounded-xl bg-gray-600 px-4 py-2 text-sm text-white shadow-lg transition hover:bg-gray-700"
      >
        ← Çık
      </button>

      {/* End Voting Button - Fixed Position */}
      <button
        type="button"
        onClick={() => setShowEndModal(true)}
        disabled={!canEndVoting}
        className={`fixed top-3 right-3 z-40 rounded-xl px-4 py-2 font-semibold text-white shadow-lg transition ${canEndVoting
            ? 'bg-red-600 hover:bg-red-700'
            : 'bg-gray-500 cursor-not-allowed'
          }`}
        title={!canEndVoting ? `En az ${minProfilesRequired} katılımcı gerekli` : ''}
      >
        🏁 Oylamayı Bitir
      </button>

      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/70 p-4">
          <div className="relative w-[80vw] h-[80vh] rounded-lg bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-4 border-black shadow-2xl overflow-hidden">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowProfileModal(false)}
              className="absolute top-4 right-4 z-10 flex items-center justify-center w-12 h-12 rounded-lg bg-black text-white font-bold text-2xl transition hover:bg-gray-800 border-2 border-gray-700"
            >
              ✕
            </button>

            {/* User Info Header */}
            <div className="absolute top-4 left-4 z-10 flex items-center gap-3 bg-black/60 backdrop-blur-sm rounded-xl px-4 py-3 border-2 border-gray-700">
              <img
                src={myProfile?.avatar}
                alt={myProfile?.name}
                className="h-12 w-12 rounded-full border-2 border-indigo-400 object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/150/6B46C1/FFFFFF?text=AVTR';
                }}
              />
              <div>
                <p className="text-white font-bold text-lg">{myProfile?.name}</p>
                <p className="text-gray-400 text-sm">Senin Karakterin</p>
              </div>
            </div>

            {/* 3D Model Viewer */}
            <div className="w-full h-full">
              {myProfile?.model ? (
                <Canvas
                  camera={{ position: [0, 1.5, 3], fov: 50 }}
                  className="w-full h-full"
                >
                  <color attach="background" args={['#1a1a2e']} />
                  <ambientLight intensity={0.5} />
                  <spotLight position={[5, 5, 5]} intensity={1} angle={0.3} penumbra={0.5} castShadow />
                  <spotLight position={[-5, 5, 5]} intensity={0.5} angle={0.3} penumbra={0.5} />
                  <spotLight position={[0, 5, -5]} intensity={0.3} angle={0.3} penumbra={0.5} color="#8ea5ff" />

                  <Suspense fallback={null}>
                    <CharacterModel
                      modelPath={myProfile.model}
                      targetHeight={1.8}
                    />
                    <Environment preset="city" />
                  </Suspense>

                  {/* OrbitControls for rotation and zoom */}
                  <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    minDistance={1.5}
                    maxDistance={6}
                    maxPolarAngle={Math.PI / 1.5}
                    minPolarAngle={Math.PI / 4}
                  />
                </Canvas>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <p className="text-white text-xl font-bold mb-2">Model Bulunamadı</p>
                    <p className="text-gray-400">Bu profil için 3D model yüklenmemiş.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* End Voting Modal */}
      {showEndModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-gray-800">Oylamayı bitirmek istediğine emin misin?</h3>

            {!canEndVoting && (
              <div className="mt-3 p-3 bg-yellow-100 border border-yellow-300 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ Oylama için en az <strong>{minProfilesRequired}</strong> katılımcı gerekli.
                  Şu an: <strong>{profileCount}</strong>
                </p>
              </div>
            )}

            <p className="mt-3 text-sm text-gray-600">
              Bu işlem odadaki oylama sürecini sonlandıracak ve sonuç ekranına geçilecektir.
            </p>
            <div className="mt-6 flex gap-4">
              <button
                type="button"
                onClick={() => setShowEndModal(false)}
                className="flex-1 rounded-xl bg-gray-200 py-2 font-semibold text-gray-700 transition hover:bg-gray-300"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handleEndVoting}
                disabled={!canEndVoting}
                className={`flex-1 rounded-xl py-2 font-semibold text-white transition ${canEndVoting
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-gray-400 cursor-not-allowed'
                  }`}
              >
                {canEndVoting ? 'Evet, bitir' : 'Yeterli kişi yok'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default VotingScreen;
