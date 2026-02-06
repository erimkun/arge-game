/**
 * Results Screen Component
 * Single Responsibility: Oylama sonuçlarını gösterme
 * Oda sistemi ile çalışır
 */

import { useAppState, ACTION_TYPES, APP_STATES } from '../contexts/AppStateContext';
import socketService from '../services/socketService';

function ResultsScreen() {
  const { state, dispatch } = useAppState();
  const { results } = state;
  const socket = socketService.getSocket();
  const roomCode = state.currentRoom?.code;

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
    if (socket) {
      socket.emit('resetRoom');
    }
  };

  // Odadan ayrıl
  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('leaveRoom');
    }
    dispatch({ type: ACTION_TYPES.LEAVE_ROOM });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto">
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
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📊 İstatistikler</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Toplam Katılımcı</p>
              <p className="text-2xl font-bold text-indigo-600">{totalParticipants}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Toplam Oy</p>
              <p className="text-2xl font-bold text-indigo-600">{totalVotesCast}</p>
            </div>
          </div>
        </div>

        {/* All Results List */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Tüm Sonuçlar</h2>
          <ul className="space-y-2">
            {sortedProfiles.map((profile, index) => (
              <li
                key={profile.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/150/6B46C1/FFFFFF?text=AVTR';
                    }}
                  />
                  <span className="text-lg font-bold text-indigo-600 w-8">
                    #{index + 1}
                  </span>
                  <span className="text-lg text-gray-800 font-semibold">
                    {profile.name}
                  </span>
                </div>
                <span className="text-lg font-bold text-gray-700">
                  {profile.votes} oy
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
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


