/**
 * Socket Event Handlers
 * Single Responsibility: Socket.IO event'lerini yönetir
 * Oda bazlı çalışır - her oda izole bir oyun
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
        message: 'Oda başarıyla oluşturuldu!'
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
      if (!roomCode || roomCode.length !== 6) {
        socket.emit('error', 'Geçersiz oda kodu.');
        return;
      }

      const room = this.roomService.joinRoom(roomCode.toUpperCase(), socket.id);

      if (!room) {
        socket.emit('error', 'Oda bulunamadı. Kodu kontrol edin.');
        return;
      }

      if (room.error) {
        socket.emit('error', room.error);
        return;
      }

      // Socket.IO room'una katıl
      socket.join(room.code);
      this.socketRooms.set(socket.id, room.code);

      console.log(`[${socket.id}] Odaya katıldı: ${room.code}`);

      // Mevcut profilleri ve oyları gönder
      socket.emit('roomJoined', {
        code: room.code,
        profiles: room.profiles,
        votes: room.votes,
        message: 'Odaya başarıyla katıldınız!'
      });

      // Odadaki diğerlerine haber ver
      socket.to(room.code).emit('participantJoined', {
        message: 'Yeni bir katılımcı odaya katıldı.'
      });
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

      const profile = this.roomService.addProfile(roomCode, data);

      console.log(`[${socket.id}] [Room ${roomCode}] Profil oluşturuldu: ${profile.name}`);

      // Odadaki herkese yayınla
      this.io.to(roomCode).emit('profileAdded', profile);
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
        message: 'Oda sıfırlandı.'
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

      const roomDeleted = this.roomService.leaveRoom(roomCode, socket.id);

      socket.emit('leftRoom', { message: 'Odadan ayrıldınız.' });

      if (!roomDeleted) {
        // Odadaki diğerlerine haber ver
        socket.to(roomCode).emit('participantLeft', {
          message: 'Bir katılımcı odadan ayrıldı.'
        });
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

        const roomDeleted = this.roomService.leaveRoom(roomCode, socket.id);

        if (!roomDeleted) {
          // Odadaki diğerlerine haber ver
          socket.to(roomCode).emit('participantLeft', {
            message: 'Bir katılımcı bağlantısını kaybetti.'
          });
        }
      }

      console.log(`[${socket.id}] Kullanıcı ayrıldı.`);
    } catch (error) {
      console.error(`[${socket.id}] Disconnect hatası:`, error);
    }
  }
}

module.exports = SocketHandlers;
