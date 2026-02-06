/**
 * Socket Event Handlers
 * Single Responsibility: Socket.IO event'lerini yönetir
 * Oda bazlı çalışır - her oda izole bir oyun
 * Negatif senaryolar için güvenlik kontrolleri içerir
 */

class SocketHandlers {
  constructor(io, roomService) {
    this.io = io;
    this.roomService = roomService;
    // Socket ID -> Room Code mapping
    this.socketRooms = new Map();
  }

  /**
   * Yeni bağlantı kurulduğunda çağrılır
   * @param {Socket} socket - Socket instance
   */
  handleConnection(socket) {
    console.log(`[${socket.id}] Yeni bir kullanıcı bağlandı.`);

    // Event listener'ları kaydet
    this.registerEventHandlers(socket);
  }

  /**
   * Socket event handler'larını kaydeder
   * @param {Socket} socket - Socket instance
   */
  registerEventHandlers(socket) {
    // Oda oluşturma
    socket.on('createRoom', () => {
      this.handleCreateRoom(socket);
    });

    // Odaya katılma
    socket.on('joinRoom', (roomCode) => {
      this.handleJoinRoom(socket, roomCode);
    });

    // Profil oluşturma
    socket.on('createProfile', (data) => {
      this.handleCreateProfile(socket, data);
    });

    // Oy verme
    socket.on('vote', (data) => {
      this.handleVote(socket, data);
    });

    // Oylamayı bitirme
    socket.on('endVoting', () => {
      this.handleEndVoting(socket);
    });

    // Oda istatistikleri
    socket.on('getRoomStats', () => {
      this.handleGetRoomStats(socket);
    });

    // Oda sıfırlama
    socket.on('resetRoom', () => {
      this.handleResetRoom(socket);
    });

    // Odadan ayrılma
    socket.on('leaveRoom', () => {
      this.handleLeaveRoom(socket);
    });

    // Bağlantı kesilme
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  /**
   * Oda oluşturma event handler'ı
   * @param {Socket} socket - Socket instance
   */
  handleCreateRoom(socket) {
    try {
      const room = this.roomService.createRoom(socket.id);

      // Socket.IO room'una katıl
      socket.join(room.code);
      this.socketRooms.set(socket.id, room.code);

      console.log(`[${socket.id}] Oda oluşturdu: ${room.code}`);

      socket.emit('roomCreated', {
        code: room.code,
        message: 'Oda başarıyla oluşturuldu!',
        stats: this.roomService.getRoomStats(room.code)
      });
    } catch (error) {
      console.error(`[${socket.id}] Oda oluşturma hatası:`, error);
      socket.emit('error', 'Oda oluşturulurken bir hata oluştu.');
    }
  }

  /**
   * Odaya katılma event handler'ı
   * @param {Socket} socket - Socket instance
   * @param {string} roomCode - Oda kodu
   */
  handleJoinRoom(socket, roomCode) {
    try {
      if (!roomCode || typeof roomCode !== 'string') {
        socket.emit('error', 'Geçersiz oda kodu.');
        return;
      }

      const trimmedCode = roomCode.trim().toUpperCase();
      if (trimmedCode.length !== 6) {
        socket.emit('error', 'Oda kodu 6 haneli olmalıdır.');
        return;
      }

      const result = this.roomService.joinRoom(trimmedCode, socket.id);

      if (!result) {
        socket.emit('error', 'Oda bulunamadı. Kodu kontrol edin.');
        return;
      }

      if (result.error) {
        socket.emit('error', result.error);
        return;
      }

      // Socket.IO room'una katıl
      socket.join(result.code);
      this.socketRooms.set(socket.id, result.code);

      console.log(`[${socket.id}] Odaya katıldı: ${result.code}`);

      // Mevcut profilleri ve oyları gönder
      socket.emit('roomJoined', {
        code: result.code,
        profiles: result.profiles,
        votes: result.votes,
        stats: this.roomService.getRoomStats(result.code),
        message: 'Odaya başarıyla katıldınız!'
      });

      // Odadaki diğerlerine haber ver
      socket.to(result.code).emit('participantJoined', {
        participantCount: result.participants.size,
        message: 'Yeni bir katılımcı odaya katıldı.'
      });

      // Odadaki herkese güncel stats gönder
      this.broadcastRoomStats(result.code);
    } catch (error) {
      console.error(`[${socket.id}] Odaya katılma hatası:`, error);
      socket.emit('error', 'Odaya katılırken bir hata oluştu.');
    }
  }

  /**
   * Profil oluşturma event handler'ı
   * @param {Socket} socket - Socket instance
   * @param {Object} data - { name, avatar, model }
   */
  handleCreateProfile(socket, data) {
    try {
      const roomCode = this.socketRooms.get(socket.id);

      if (!roomCode) {
        socket.emit('error', 'Önce bir odaya katılmalısınız.');
        return;
      }

      if (!data || !data.name || !data.name.trim()) {
        socket.emit('error', 'Karakter adı boş olamaz.');
        return;
      }

      if (data.name.trim().length > 50) {
        socket.emit('error', 'Karakter adı 50 karakterden uzun olamaz.');
        return;
      }

      const profile = this.roomService.addProfile(roomCode, socket.id, data);

      console.log(`[${socket.id}] [Room ${roomCode}] Profil oluşturuldu: ${profile.name}`);

      // Odadaki herkese yayınla
      this.io.to(roomCode).emit('profileAdded', profile);

      // Güncel stats gönder
      this.broadcastRoomStats(roomCode);
    } catch (error) {
      console.error(`[${socket.id}] Profil oluşturma hatası:`, error);
      socket.emit('error', error.message || 'Profil oluşturulurken bir hata oluştu.');
    }
  }

  /**
   * Oy verme event handler'ı
   * @param {Socket} socket - Socket instance
   * @param {Object} data - { profileId }
   */
  handleVote(socket, data) {
    try {
      const roomCode = this.socketRooms.get(socket.id);

      if (!roomCode) {
        socket.emit('error', 'Bir odada değilsiniz.');
        return;
      }

      const profileId = typeof data === 'string' ? data : data?.profileId;

      if (!profileId) {
        socket.emit('error', 'Geçersiz profil ID.');
        return;
      }

      const voteResult = this.roomService.castVote(roomCode, socket.id, profileId);

      console.log(`[${socket.id}] [Room ${roomCode}] Oy verdi: ${profileId}, Toplam: ${voteResult.count}`);

      // Odadaki herkese yayınla
      this.io.to(roomCode).emit('voteUpdate', voteResult);

      // Oy kullanan kişiye onay
      socket.emit('voteConfirmed', {
        profileId,
        message: 'Oyunuz başarıyla kaydedildi!'
      });

      // Güncel stats gönder
      this.broadcastRoomStats(roomCode);
    } catch (error) {
      console.error(`[${socket.id}] Oy verme hatası:`, error);
      socket.emit('error', error.message || 'Oy verilirken bir hata oluştu.');
    }
  }

  /**
   * Oylamayı bitirme event handler'ı
   * @param {Socket} socket - Socket instance
   */
  handleEndVoting(socket) {
    try {
      const roomCode = this.socketRooms.get(socket.id);

      if (!roomCode) {
        socket.emit('error', 'Bir odada değilsiniz.');
        return;
      }

      // Önce yeterli katılımcı var mı kontrol et
      const canEndCheck = this.roomService.canEndVoting(roomCode);
      if (!canEndCheck.canEnd) {
        socket.emit('error', `Oylama için en az ${canEndCheck.minRequired} katılımcı gerekli. Şu an: ${canEndCheck.profileCount}`);
        return;
      }

      console.log(`[${socket.id}] [Room ${roomCode}] Oylamayı bitirme isteği.`);

      const results = this.roomService.endVoting(roomCode);

      // Odadaki herkese sonuçları yayınla
      this.io.to(roomCode).emit('votingEnded', results);

      console.log(`[Room ${roomCode}] Oylama bitti. Kazanan(lar): ${results.winners.map(w => w.name).join(', ')}`);
    } catch (error) {
      console.error(`[${socket.id}] Oylamayı bitirme hatası:`, error);
      socket.emit('error', error.message || 'Oylama sonlandırılırken bir hata oluştu.');
    }
  }

  /**
   * Oda istatistikleri event handler'ı
   * @param {Socket} socket - Socket instance
   */
  handleGetRoomStats(socket) {
    try {
      const roomCode = this.socketRooms.get(socket.id);

      if (!roomCode) {
        socket.emit('error', 'Bir odada değilsiniz.');
        return;
      }

      const stats = this.roomService.getRoomStats(roomCode);
      socket.emit('roomStats', stats);
    } catch (error) {
      console.error(`[${socket.id}] Room stats hatası:`, error);
    }
  }

  /**
   * Odadaki herkese güncel stats gönder
   * @param {string} roomCode - Oda kodu
   */
  broadcastRoomStats(roomCode) {
    const stats = this.roomService.getRoomStats(roomCode);
    if (stats) {
      this.io.to(roomCode).emit('roomStats', stats);
    }
  }

  /**
   * Oda sıfırlama event handler'ı
   * @param {Socket} socket - Socket instance
   */
  handleResetRoom(socket) {
    try {
      const roomCode = this.socketRooms.get(socket.id);

      if (!roomCode) {
        socket.emit('error', 'Bir odada değilsiniz.');
        return;
      }

      console.log(`[${socket.id}] [Room ${roomCode}] Oda sıfırlama isteği.`);

      this.roomService.resetRoom(roomCode);

      // Odadaki herkese reset event'i gönder
      this.io.to(roomCode).emit('roomReset', {
        code: roomCode,
        message: 'Oda sıfırlandı. Yeni oylama başlayabilir.',
        stats: this.roomService.getRoomStats(roomCode)
      });

      console.log(`[Room ${roomCode}] Oda sıfırlandı.`);
    } catch (error) {
      console.error(`[${socket.id}] Oda sıfırlama hatası:`, error);
      socket.emit('error', error.message || 'Oda sıfırlanırken bir hata oluştu.');
    }
  }

  /**
   * Odadan ayrılma event handler'ı
   * @param {Socket} socket - Socket instance
   */
  handleLeaveRoom(socket) {
    try {
      const roomCode = this.socketRooms.get(socket.id);

      if (!roomCode) {
        return;
      }

      // Socket.IO room'undan ayrıl
      socket.leave(roomCode);
      this.socketRooms.delete(socket.id);

      const result = this.roomService.leaveRoom(roomCode, socket.id);

      socket.emit('leftRoom', { message: 'Odadan ayrıldınız.' });

      if (!result.roomDeleted) {
        // Odadaki diğerlerine haber ver
        if (result.profileRemoved) {
          // Profil kaldırıldı, güncellenmiş profil listesini gönder
          const profiles = this.roomService.getProfiles(roomCode);
          this.io.to(roomCode).emit('profilesUpdated', profiles);
        }

        socket.to(roomCode).emit('participantLeft', {
          profileRemoved: result.profileRemoved,
          message: 'Bir katılımcı odadan ayrıldı.'
        });

        // Güncel stats gönder
        this.broadcastRoomStats(roomCode);
      }

      console.log(`[${socket.id}] Odadan ayrıldı: ${roomCode}`);
    } catch (error) {
      console.error(`[${socket.id}] Odadan ayrılma hatası:`, error);
    }
  }

  /**
   * Bağlantı kesilme event handler'ı
   * @param {Socket} socket - Socket instance
   */
  handleDisconnect(socket) {
    try {
      const roomCode = this.socketRooms.get(socket.id);

      if (roomCode) {
        socket.leave(roomCode);
        this.socketRooms.delete(socket.id);

        const result = this.roomService.leaveRoom(roomCode, socket.id);

        if (!result.roomDeleted) {
          // Profil kaldırıldıysa güncellenmiş profil listesini gönder
          if (result.profileRemoved) {
            const profiles = this.roomService.getProfiles(roomCode);
            this.io.to(roomCode).emit('profilesUpdated', profiles);
          }

          // Odadaki diğerlerine haber ver
          this.io.to(roomCode).emit('participantLeft', {
            profileRemoved: result.profileRemoved,
            message: 'Bir katılımcı bağlantısını kaybetti.'
          });

          // Güncel stats gönder
          this.broadcastRoomStats(roomCode);
        }
      }

      console.log(`[${socket.id}] Kullanıcı ayrıldı.`);
    } catch (error) {
      console.error(`[${socket.id}] Disconnect hatası:`, error);
    }
  }
}

module.exports = SocketHandlers;
