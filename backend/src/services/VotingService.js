/**
 * Voting Service
 * Single Responsibility: Oylama iş mantığı
 */

class VotingService {
  constructor() {
    this.votes = {}; // { profileId: count }
    this.votedClients = {}; // { socketId: profileId }
  }

  /**
   * Bir profile oy verir
   * @param {string} socketId - Socket ID
   * @param {string} profileId - Profil ID'si
   * @returns {Object} Güncellenmiş oy sayısı { profileId, count }
   */
  castVote(socketId, profileId) {
    // Daha önce oy kullanılmış mı kontrol et
    if (this.votedClients[socketId]) {
      throw new Error('Zaten oy kullandınız.');
    }

    // Profil için oy sayısını başlat (yoksa)
    if (!this.votes.hasOwnProperty(profileId)) {
      this.votes[profileId] = 0;
    }

    // Oy sayısını artır
    this.votes[profileId]++;
    
    // Client'ın oy verdiğini kaydet
    this.votedClients[socketId] = profileId;

    return {
      profileId,
      count: this.votes[profileId]
    };
  }

  /**
   * Bir client'ın oy kullanıp kullanmadığını kontrol eder
   * @param {string} socketId - Socket ID
   * @returns {boolean} Oy kullanıldı mı?
   */
  hasVoted(socketId) {
    return !!this.votedClients[socketId];
  }

  /**
   * Profil için oy sayısını başlatır (yeni profil oluşturulduğunda)
   * @param {string} profileId - Profil ID'si
   */
  initializeVoteCount(profileId) {
    if (!this.votes.hasOwnProperty(profileId)) {
      this.votes[profileId] = 0;
    }
  }

  /**
   * Kazanan profilleri belirler
   * @param {Array} profiles - Tüm profil listesi
   * @returns {Object} Kazananlar ve istatistikler
   */
  determineWinners(profiles) {
    let maxVotes = -1;
    let winners = [];

    for (const profile of profiles) {
      const currentVotes = this.votes[profile.id] || 0;
      if (currentVotes > maxVotes) {
        maxVotes = currentVotes;
        winners = [profile];
      } else if (currentVotes === maxVotes && maxVotes > -1) {
        winners.push(profile);
      }
    }

    const totalVotesCast = Object.values(this.votes).reduce((sum, count) => sum + count, 0);

    return {
      winners,
      finalVotes: { ...this.votes },
      totalParticipants: profiles.length,
      totalVotesCast
    };
  }

  /**
   * Client'ın oy kaydını siler (disconnect olduğunda)
   * @param {string} socketId - Socket ID
   */
  removeClientVote(socketId) {
    delete this.votedClients[socketId];
  }

  /**
   * Tüm oylama verilerini sıfırlar (reset için)
   */
  reset() {
    this.votes = {};
    this.votedClients = {};
  }
}

module.exports = VotingService;

