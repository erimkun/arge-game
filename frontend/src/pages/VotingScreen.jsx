/**
 * Voting Screen Component
 * Single Responsibility: Oylama ekranı ve oy verme işlevselliği
 * Oda sistemi ile çalışır
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

  const socket = socketService.getSocket();
  const myProfile = state.myProfile;
  const myProfileId = myProfile?.id;
  const roomCode = state.currentRoom?.code;

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
    socket.emit('endVoting');
    setShowEndModal(false);
  }, [socket]);

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
        </div>
      )}

      {otherProfiles.length === 0 ? (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4 flex items-center justify-center">
          <div className="rounded-3xl bg-white/80 p-10 text-center shadow-xl backdrop-blur max-w-md">
            <p className="text-lg font-semibold text-gray-600">
              Henüz başka karakter bulunmuyor. Yeni katılımcılar geldiğinde kartlar burada görünecek.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              Oda kodunu ({roomCode}) arkadaşlarınla paylaş!
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
        className="fixed top-3 right-3 z-40 rounded-xl bg-red-600 px-4 py-2 font-semibold text-white shadow-lg transition hover:bg-red-700"
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
            <p className="mt-3 text-sm text-gray-600">
              Bu işlem tüm ağdaki oylama sürecini sonlandıracak ve sonuç ekranına geçilecektir.
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
                className="flex-1 rounded-xl bg-red-600 py-2 font-semibold text-white transition hover:bg-red-700"
              >
                Evet, bitir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default VotingScreen;

