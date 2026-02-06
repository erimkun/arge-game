/**
 * Room Service
 * Single Responsibility: Oda yönetimi iş mantığı
 * Her grup kendi bağımsız odasında oynar
 * Negatif senaryolar için güvenlik kontrolleri içerir
 */

// Sabitler
const ROOM_TIMEOUT_MS = 30 * 60 * 1000; // 30 dakika
const MIN_PROFILES_FOR_VOTING = 2;
const MAX_PARTICIPANTS_PER_ROOM = 50;

class RoomService {
  constructor() {
    // Tüm odalar: { roomCode: RoomData }
    this.rooms = new Map();

    // Oda timeout kontrolü için interval başlat
    this.startRoomCleanupInterval();
  }

  /**
   * Boş odaları periyodik olarak temizle
   */
  startRoomCleanupInterval() {
    setInterval(() => {
      const now = Date.now();
      for (const [code, room] of this.rooms) {
        const roomAge = now - room.lastActivity.getTime();

        // 30 dakika aktivite yoksa odayı sil
        if (roomAge > ROOM_TIMEOUT_MS && room.participants.size === 0) {
          this.rooms.delete(code);
          console.log(`[Room ${code}] Timeout - oda silindi (${Math.round(roomAge / 60000)} dk inaktif)`);
        }
      }
    }, 5 * 60 * 1000); // Her 5 dakikada kontrol et
  }

  /**
   * Oda aktivitesini güncelle
   */
  updateRoomActivity(roomCode) {
    const room = this.rooms.get(roomCode);
    if (room) {
      room.lastActivity = new Date();
    }
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
    const now = new Date();

    const room = {
      code,
      profiles: [],
      votes: {},           // { profileId: count }
      votedClients: {},    // { socketId: profileId }
      socketToProfile: {}, // { socketId: profileId } - kim hangi profili oluşturdu
      isVotingEnded: false,
      createdAt: now,
      lastActivity: now,
      participants: new Set([creatorSocketId]),
      creatorSocketId: creatorSocketId
    };

    this.rooms.set(code, room);
    console.log(`[Room] Yeni oda oluşturuldu: ${code}`);

    return room;
  }

  /**
   * Odaya katıl
   * @param {string} roomCode - Oda kodu
   * @param {string} socketId - Katılan socket ID
   * @returns {Object|null} Oda veya null veya hata objesi
   */
  joinRoom(roomCode, socketId) {
    const room = this.rooms.get(roomCode.toUpperCase());

    if (!room) {
      return { error: 'Oda bulunamadı. Kodu kontrol edin.' };
    }

    if (room.isVotingEnded) {
      return { error: 'Bu odada oylama zaten bitmiş. Yeni bir oda oluşturun.' };
    }

    if (room.participants.size >= MAX_PARTICIPANTS_PER_ROOM) {
      return { error: `Oda maksimum katılımcı sayısına ulaştı (${MAX_PARTICIPANTS_PER_ROOM}).` };
    }

    room.participants.add(socketId);
    this.updateRoomActivity(roomCode.toUpperCase());
    console.log(`[Room ${roomCode}] Yeni katılımcı: ${socketId}, Toplam: ${room.participants.size}`);

    return room;
  }

  /**
   * Odadan ayrıl
   * @param {string} roomCode - Oda kodu
   * @param {string} socketId - Ayrılan socket ID
   * @returns {Object} { roomDeleted: boolean, profileRemoved: boolean }
   */
  leaveRoom(roomCode, socketId) {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return { roomDeleted: false, profileRemoved: false };
    }

    room.participants.delete(socketId);
    delete room.votedClients[socketId];

    // Kullanıcının profilini bul ve kaldır
    let profileRemoved = false;
    const profileId = room.socketToProfile[socketId];
    if (profileId) {
      room.profiles = room.profiles.filter(p => p.id !== profileId);
      delete room.votes[profileId];
      delete room.socketToProfile[socketId];
      profileRemoved = true;
      console.log(`[Room ${roomCode}] Profil kaldırıldı: ${profileId}`);
    }

    console.log(`[Room ${roomCode}] Katılımcı ayrıldı: ${socketId}, Kalan: ${room.participants.size}`);

    // Son kişi çıktıysa odayı sil
    if (room.participants.size === 0) {
      this.rooms.delete(roomCode);
      console.log(`[Room ${roomCode}] Oda silindi (boş kaldı)`);
      return { roomDeleted: true, profileRemoved };
    }

    return { roomDeleted: false, profileRemoved };
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
   * @param {string} socketId - Profili oluşturan socket ID
   * @param {Object} profileData - Profil verisi
   * @returns {Object} Eklenen profil
   */
  addProfile(roomCode, socketId, profileData) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      throw new Error('Oda bulunamadı');
    }

    if (room.isVotingEnded) {
      throw new Error('Oylama bitmiş, profil oluşturulamaz.');
    }

    // Kullanıcının zaten profili var mı kontrol et
    if (room.socketToProfile[socketId]) {
      throw new Error('Zaten bir profiliniz var.');
    }

    const newId = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const profile = {
      id: newId,
      name: profileData.name.trim(),
      avatar: profileData.avatar || 'https://via.placeholder.com/150/6B46C1/FFFFFF?text=AVTR',
      model: profileData.model || null,
      socketId: socketId // Profil sahibini kaydet
    };

    room.profiles.push(profile);
    room.votes[profile.id] = 0; // Oy sayacını başlat
    room.socketToProfile[socketId] = profile.id; // Socket -> Profile mapping

    this.updateRoomActivity(roomCode);

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
   * Socket ID'nin profili var mı?
   * @param {string} roomCode - Oda kodu
   * @param {string} socketId - Socket ID
   * @returns {boolean}
   */
  hasProfile(roomCode, socketId) {
    const room = this.rooms.get(roomCode);
    return room ? !!room.socketToProfile[socketId] : false;
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

    if (room.isVotingEnded) {
      throw new Error('Oylama zaten bitmiş.');
    }

    // Kullanıcının profili var mı kontrol et
    if (!room.socketToProfile[socketId]) {
      throw new Error('Oy vermek için önce profil oluşturmalısınız.');
    }

    // Kendi profiline oy vermeyi engelle
    const myProfileId = room.socketToProfile[socketId];
    if (myProfileId === profileId) {
      throw new Error('Kendi profilinize oy veremezsiniz.');
    }

    if (room.votedClients[socketId]) {
      throw new Error('Zaten oy kullandınız.');
    }

    if (!room.votes.hasOwnProperty(profileId)) {
      throw new Error('Geçersiz profil ID.');
    }

    room.votes[profileId]++;
    room.votedClients[socketId] = profileId;

    this.updateRoomActivity(roomCode);

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
   * Oylama için yeterli profil var mı?
   * @param {string} roomCode - Oda kodu
   * @returns {Object} { canEnd: boolean, profileCount: number, minRequired: number }
   */
  canEndVoting(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return { canEnd: false, profileCount: 0, minRequired: MIN_PROFILES_FOR_VOTING };
    }

    const profileCount = room.profiles.length;
    return {
      canEnd: profileCount >= MIN_PROFILES_FOR_VOTING,
      profileCount,
      minRequired: MIN_PROFILES_FOR_VOTING
    };
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

    // Minimum profil kontrolü
    const canEndCheck = this.canEndVoting(roomCode);
    if (!canEndCheck.canEnd) {
      throw new Error(`Oylama için en az ${canEndCheck.minRequired} katılımcı gerekli. Şu an: ${canEndCheck.profileCount}`);
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
      totalVotesCast,
      isTie: winners.length > 1
    };
  }

  /**
   * Oda istatistiklerini getir
   * @param {string} roomCode - Oda kodu
   * @returns {Object} İstatistikler
   */
  getRoomStats(roomCode) {
    const room = this.rooms.get(roomCode);
    if (!room) {
      return null;
    }

    return {
      code: room.code,
      profileCount: room.profiles.length,
      participantCount: room.participants.size,
      votedCount: Object.keys(room.votedClients).length,
      isVotingEnded: room.isVotingEnded,
      canEndVoting: room.profiles.length >= MIN_PROFILES_FOR_VOTING,
      minProfilesRequired: MIN_PROFILES_FOR_VOTING,
      createdAt: room.createdAt,
      lastActivity: room.lastActivity
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
    room.socketToProfile = {};
    room.isVotingEnded = false;
    room.lastActivity = new Date();
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
