/**
 * Room Service
 * Single Responsibility: Oda yönetimi iş mantığı
 * Her grup kendi bağımsız odasında oynar
 */

class RoomService {
  constructor() {
    // Tüm odalar: { roomCode: RoomData }
    this.rooms = new Map();
  }

  /**
   * Benzersiz 6 haneli oda kodu üretir
   * @returns {string} Oda kodu
   */
  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Karışabilecek karakterler çıkarıldı (0,O,1,I)
    let code;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code)); // Benzersiz olana kadar üret
    
    return code;
  }

  /**
   * Yeni oda oluşturur
   * @param {string} creatorSocketId - Oda oluşturan socket ID
   * @returns {Object} Oluşturulan oda
   */
  createRoom(creatorSocketId) {
    const code = this.generateRoomCode();
    
    const room = {
      code,
      profiles: [],
      votes: {},           // { profileId: count }
      votedClients: {},    // { socketId: profileId }
      isVotingEnded: false,
      createdAt: new Date(),
      participants: new Set([creatorSocketId]) // Socket ID'leri
    };
    
    this.rooms.set(code, room);
    console.log(`[Room] Yeni oda oluşturuldu: ${code}`);
    
    return room;
  }

  /**
   * Odaya katıl
   * @param {string} roomCode - Oda kodu
   * @param {string} socketId - Katılan socket ID
   * @returns {Object|null} Oda veya null
   */
  joinRoom(roomCode, socketId) {
    const room = this.rooms.get(roomCode.toUpperCase());
    
    if (!room) {
      return null;
    }
    
    if (room.isVotingEnded) {
      return { error: 'Bu odada oylama zaten bitmiş.' };
    }
    
    room.participants.add(socketId);
    console.log(`[Room ${roomCode}] Yeni katılımcı: ${socketId}`);
    
    return room;
  }

  /**
   * Odadan ayrıl
   * @param {string} roomCode - Oda kodu
   * @param {string} socketId - Ayrılan socket ID
   * @returns {boolean} Oda silindi mi?
   */
  leaveRoom(roomCode, socketId) {
    const room = this.rooms.get(roomCode);
    
    if (!room) {
      return false;
    }
    
    room.participants.delete(socketId);
    delete room.votedClients[socketId];
    
    console.log(`[Room ${roomCode}] Katılımcı ayrıldı: ${socketId}, Kalan: ${room.participants.size}`);
    
    // Son kişi çıktıysa odayı sil
    if (room.participants.size === 0) {
      this.rooms.delete(roomCode);
      console.log(`[Room ${roomCode}] Oda silindi (boş kaldı)`);
      return true;
    }
    
    return false;
  }

  /**
   * Oda bilgisini getir
   * @param {string} roomCode - Oda kodu
   * @returns {Object|null} Oda veya null
   */
  getRoom(roomCode) {
    return this.rooms.get(roomCode?.toUpperCase()) || null;
  }

  /**
   * Oda var mı kontrol et
   * @param {string} roomCode - Oda kodu
   * @returns {boolean}
   */
  roomExists(roomCode) {
    return this.rooms.has(roomCode?.toUpperCase());
  }

  /**
   * Odaya profil ekle
   * @param {string} roomCode - Oda kodu
   * @param {Object} profile - Profil verisi
   * @returns {Object} Eklenen profil
   */
  addProfile(roomCode, profileData) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new Error('Oda bulunamadı');
    }

    const newId = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const profile = {
      id: newId,
      name: profileData.name.trim(),
      avatar: profileData.avatar || 'https://via.placeholder.com/150/6B46C1/FFFFFF?text=AVTR',
      model: profileData.model || null,
    };

    room.profiles.push(profile);
    room.votes[profile.id] = 0; // Oy sayacını başlat
    
    return profile;
  }

  /**
   * Odadaki profilleri getir
   * @param {string} roomCode - Oda kodu
   * @returns {Array} Profiller
   */
  getProfiles(roomCode) {
    const room = this.rooms.get(roomCode);
    return room ? [...room.profiles] : [];
  }

  /**
   * Oda içinde oy ver
   * @param {string} roomCode - Oda kodu
   * @param {string} socketId - Oy veren socket ID
   * @param {string} profileId - Oy verilen profil ID
   * @returns {Object} Oy sonucu
   */
  castVote(roomCode, socketId, profileId) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new Error('Oda bulunamadı');
    }

    if (room.votedClients[socketId]) {
      throw new Error('Zaten oy kullandınız.');
    }

    if (!room.votes.hasOwnProperty(profileId)) {
      throw new Error('Geçersiz profil ID.');
    }

    room.votes[profileId]++;
    room.votedClients[socketId] = profileId;

    return {
      profileId,
      count: room.votes[profileId]
    };
  }

  /**
   * Client oy kullandı mı?
   * @param {string} roomCode - Oda kodu
   * @param {string} socketId - Socket ID
   * @returns {boolean}
   */
  hasVoted(roomCode, socketId) {
    const room = this.rooms.get(roomCode);
    return room ? !!room.votedClients[socketId] : false;
  }

  /**
   * Odadaki oylamayı bitir ve kazananları belirle
   * @param {string} roomCode - Oda kodu
   * @returns {Object} Sonuçlar
   */
  endVoting(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new Error('Oda bulunamadı');
    }

    room.isVotingEnded = true;

    let maxVotes = -1;
    let winners = [];

    for (const profile of room.profiles) {
      const currentVotes = room.votes[profile.id] || 0;
      if (currentVotes > maxVotes) {
        maxVotes = currentVotes;
        winners = [profile];
      } else if (currentVotes === maxVotes && maxVotes > -1) {
        winners.push(profile);
      }
    }

    const totalVotesCast = Object.values(room.votes).reduce((sum, count) => sum + count, 0);

    return {
      winners,
      finalVotes: { ...room.votes },
      totalParticipants: room.profiles.length,
      totalVotesCast
    };
  }

  /**
   * Odayı sıfırla (yeniden oylama için)
   * @param {string} roomCode - Oda kodu
   */
  resetRoom(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return;
    }

    room.profiles = [];
    room.votes = {};
    room.votedClients = {};
    room.isVotingEnded = false;
  }

  /**
   * Socket ID'nin hangi odada olduğunu bul
   * @param {string} socketId - Socket ID
   * @returns {string|null} Oda kodu veya null
   */
  findRoomBySocketId(socketId) {
    for (const [code, room] of this.rooms) {
      if (room.participants.has(socketId)) {
        return code;
      }
    }
    return null;
  }
}

module.exports = RoomService;
