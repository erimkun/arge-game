/**
 * Results Screen Component
 * Single Responsibility: Oylama sonuçlarını gösterme
 * Oda sistemi ile çalışır
 */

import { useEffect } from 'react';
import { useAppState, ACTION_TYPES, APP_STATES } from '../contexts/AppStateContext';
import socketService from '../services/socketService';
import confetti from 'canvas-confetti';
import { playSound } from '../utils/sound';
import { exportToCSV, exportToText } from '../utils/ExportUtils';

function ResultsScreen() {
  const { state, dispatch } = useAppState();
  const { results } = state;
  const socket = socketService.getSocket();
  const roomCode = state.currentRoom?.code;

  useEffect(() => {
    if (results) {
      playSound.win();
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 2,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#8B5CF6', '#EC4899', '#FFFFFF']
        });
        confetti({
          particleCount: 2,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#8B5CF6', '#EC4899', '#FFFFFF']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };

      frame();
    }
  }, [results]);

  if (!results) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 flex items-center justify-center">
        <p className="text-gray-600">Sonuçlar yükleniyor...</p>
      </div>
    );
  }

  const { winners, finalVotes, totalParticipants, totalVotesCast, isTie } = results;

  // Profilleri oy sayısına göre sırala
  const sortedProfiles = state.profiles
    .map(profile => ({
      ...profile,
      votes: finalVotes[profile.id] || 0
    }))
    .sort((a, b) => b.votes - a.votes);

  // Yeni oylama başlat (aynı odada)
  const handleNewVoting = () => {
    playSound.click();
    if (socket) {
      socket.emit('resetRoom');
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

  return (
    <div className="flex-1 p-4 overflow-auto">
      <div className="max-w-4xl mx-auto pb-8">
        {/* Header */}
        <h1 className="text-4xl md:text-5xl font-extrabold text-red-600 text-center mb-8">
          🎉 OYLAMA SONUÇLANDI!
        </h1>

        {/* Winner Highlight */}
        {winners.length > 0 && (
          <div className="bg-yellow-100 border-4 border-yellow-500 rounded-xl p-8 shadow-2xl mb-8">
            <p className="text-2xl md:text-3xl font-semibold text-gray-800 mb-4 text-center">
              {winners.length === 1 ? '🏆 Kazanan:' : '🏆 Kazananlar:'}
            </p>
            {winners.map((winner, index) => (
              <div key={winner.id} className="text-center mb-4">
                <img
                  src={winner.avatar}
                  alt={winner.name}
                  className="w-24 h-24 rounded-full mx-auto mb-3 object-cover border-4 border-yellow-400"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150/6B46C1/FFFFFF?text=AVTR';
                  }}
                />
                <span className="text-indigo-800 font-bold text-3xl md:text-4xl block mb-2">
                  {winner.name}
                </span>
                <p className="text-xl text-gray-700">
                  Toplam Oy: <span className="font-bold">{finalVotes[winner.id] || 0}</span>
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Statistics */}
        <div className="glass-card rounded-2xl p-6 mb-8 flex justify-around">
          <div className="text-center">
            <p className="text-purple-200 text-sm uppercase tracking-wide">Toplam Katılımcı</p>
            <p className="text-3xl font-bold text-white">{totalParticipants}</p>
          </div>
          <div className="text-center">
            <p className="text-purple-200 text-sm uppercase tracking-wide">Toplam Oy</p>
            <p className="text-3xl font-bold text-white">{totalVotesCast}</p>
          </div>
        </div>

        {/* All Results List */}
        <div className="glass-card rounded-2xl p-6 mb-8">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>📋</span> Tüm Sonuçlar
          </h2>
          <ul className="space-y-3">
            {sortedProfiles.map((profile, index) => (
              <li
                key={profile.id}
                className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-xl transition-colors border border-white/5"
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <img
                      src={profile.avatar}
                      alt={profile.name}
                      className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150/6B46C1/FFFFFF?text=AVTR';
                      }}
                    />
                    <div className="absolute -top-1 -left-1 w-6 h-6 bg-purple-600 rounded-full flex items-center justify-center text-xs font-bold text-white border border-white/20">
                      #{index + 1}
                    </div>
                  </div>
                  <span className="text-lg text-white font-semibold">
                    {profile.name}
                  </span>
                </div>
                <div className="bg-white/10 px-4 py-2 rounded-lg">
                  <span className="text-lg font-bold text-purple-200">
                    {profile.votes} <span className="text-xs font-normal opacity-70">OY</span>
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-4">
          <button
            onClick={handleNewVoting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            🔄 Yeni Oylama (Aynı Oda)
          </button>
          <button
            onClick={handleLeaveRoom}
            className="bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
          >
            🚪 Odadan Ayrıl
          </button>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => exportToCSV(results, state.profiles)}
            className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-xl transition-colors duration-200 text-sm"
          >
            📄 CSV İndir
          </button>
          <button
            onClick={() => exportToText(results, state.profiles)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-xl transition-colors duration-200 text-sm"
          >
            📝 Rapor İndir
          </button>
        </div>

        {/* Room Code Footer */}
        {roomCode && (
          <p className="text-center text-gray-500 text-sm mt-4">
            Oda: <span className="font-mono font-bold">{roomCode}</span>
          </p>
        )}
      </div>
    </div>
  );
}

export default ResultsScreen;


