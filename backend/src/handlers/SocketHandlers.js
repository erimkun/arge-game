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
    // Oda oluşturma (options ile)
    socket.on('createRoom', (options) => {
      this.handleCreateRoom(socket, options);
    });

    // Odaya katılma (password ile)
    socket.on('joinRoom', (data) => {
      if (typeof data === 'string') {
        this.handleJoinRoom(socket, data, null);
      } else {
        this.handleJoinRoom(socket, data.roomCode, data.password);
      }
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

    // === YENİ EVENT'LER ===

    // Chat mesajı gönderme
    socket.on('sendMessage', (data) => {
      this.handleSendMessage(socket, data);
    });

    // Host: Oylamayı başlat
    socket.on('startVoting', () => {
      this.handleStartVoting(socket);
    });

    // Host: Katılımcı onayla
    socket.on('approveParticipant', (data) => {
      this.handleApproveParticipant(socket, data);
    });

    // Host: Katılımcı reddet
    socket.on('rejectParticipant', (data) => {
      this.handleRejectParticipant(socket, data);
    });
  }

  /**
   * Oda oluşturma event handler'ı
   * @param {Socket} socket - Socket instance
   * @param {Object} options - { password, participantLimit, waitingRoomEnabled }
   */
  handleCreateRoom(socket, options = {}) {
    try {
      const room = this.roomService.createRoom(socket.id, options);

      // Socket.IO room'una katıl
      socket.join(room.code);
      this.socketRooms.set(socket.id, room.code);

      console.log(`[${socket.id}] Oda oluşturdu: ${room.code}`);

      socket.emit('roomCreated', {
        code: room.code,
        message: 'Oda başarıyla oluşturuldu!',
        hasPassword: !!room.password,
        participantLimit: room.participantLimit,
        waitingRoomEnabled: room.waitingRoomEnabled,
        isHost: true,
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
   * @param {string} password - Oda şifresi
   */
  handleJoinRoom(socket, roomCode, password = null) {
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

      const result = this.roomService.joinRoom(trimmedCode, socket.id, password);

      if (!result) {
        socket.emit('error', 'Oda bulunamadı. Kodu kontrol edin.');
        return;
      }

      // Şifre gerekli ama verilmemiş
      if (result.requiresPassword) {
        socket.emit('passwordRequired', { code: trimmedCode });
        return;
      }

      if (result.error) {
        socket.emit('error', result.error);
        return;
      }

      // Bekleme odasında
      if (result.pending) {
        socket.emit('waitingForApproval', {
          code: result.code,
          message: 'Host onayı bekleniyor...'
        });
        // Host'a haber ver
        const room = this.roomService.getRoom(result.code);
        if (room) {
          this.io.to(room.creatorSocketId).emit('participantPending', {
            socketId: socket.id,
            message: 'Yeni katılımcı onay bekliyor'
          });
        }
        return;
      }

      // Socket.IO room'una katıl
      socket.join(result.code);
      this.socketRooms.set(socket.id, result.code);

      console.log(`[${socket.id}] Odaya katıldı: ${result.code}`);

      const isHost = this.roomService.isHost(result.code, socket.id);

      // Mevcut profilleri ve oyları gönder
      socket.emit('roomJoined', {
        code: result.code,
        profiles: result.profiles,
        votes: result.votes,
        isHost: isHost,
        isVotingStarted: result.isVotingStarted,
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

  /**
   * Chat mesajı gönderme handler'ı
   * @param {Socket} socket - Socket instance
   * @param {Object} data - { message }
   */
  handleSendMessage(socket, data) {
    try {
      const roomCode = this.socketRooms.get(socket.id);

      if (!roomCode) {
        socket.emit('error', 'Bir odada değilsiniz.');
        return;
      }

      if (!data || !data.message || !data.message.trim()) {
        return; // Boş mesaj göndermeyi sessizce yoksay
      }

      const message = data.message.trim().substring(0, 500); // Max 500 karakter
      const room = this.roomService.getRoom(roomCode);
      const profileId = room?.socketToProfile?.[socket.id];
      const profile = room?.profiles?.find(p => p.id === profileId);

      const chatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
        message,
        senderName: profile?.name || 'Anonim',
        senderId: socket.id,
        timestamp: new Date().toISOString()
      };

      // Odadaki herkese gönder
      this.io.to(roomCode).emit('chatMessage', chatMessage);

      console.log(`[Room ${roomCode}] Chat: ${chatMessage.senderName}: ${message.substring(0, 30)}...`);
    } catch (error) {
      console.error(`[${socket.id}] Chat hatası:`, error);
    }
  }

  /**
   * Oylamayı başlat handler'ı (Host kontrolü)
   * @param {Socket} socket - Socket instance
   */
  handleStartVoting(socket) {
    try {
      const roomCode = this.socketRooms.get(socket.id);

      if (!roomCode) {
        socket.emit('error', 'Bir odada değilsiniz.');
        return;
      }

      const result = this.roomService.startVoting(roomCode, socket.id);

      if (result.error) {
        socket.emit('error', result.error);
        return;
      }

      console.log(`[Room ${roomCode}] Oylama başlatıldı.`);

      // Odadaki herkese oylama başladı bildir
      this.io.to(roomCode).emit('votingStarted', {
        message: 'Oylama başladı!'
      });

      this.broadcastRoomStats(roomCode);
    } catch (error) {
      console.error(`[${socket.id}] Oylama başlatma hatası:`, error);
      socket.emit('error', 'Oylama başlatılırken bir hata oluştu.');
    }
  }

  /**
   * Katılımcı onaylama handler'ı (Host kontrolü)
   * @param {Socket} socket - Socket instance
   * @param {Object} data - { socketId }
   */
  handleApproveParticipant(socket, data) {
    try {
      const roomCode = this.socketRooms.get(socket.id);

      if (!roomCode) {
        socket.emit('error', 'Bir odada değilsiniz.');
        return;
      }

      const result = this.roomService.approveParticipant(roomCode, socket.id, data.socketId);

      if (result.error) {
        socket.emit('error', result.error);
        return;
      }

      // Onaylanan kişiyi odaya ekle
      const targetSocket = this.io.sockets.sockets.get(data.socketId);
      if (targetSocket) {
        targetSocket.join(roomCode);
        this.socketRooms.set(data.socketId, roomCode);

        const room = this.roomService.getRoom(roomCode);
        targetSocket.emit('roomJoined', {
          code: roomCode,
          profiles: room.profiles,
          votes: room.votes,
          isHost: false,
          isVotingStarted: room.isVotingStarted,
          stats: this.roomService.getRoomStats(roomCode),
          message: 'Katılım onaylandı!'
        });

        // Odadaki herkese haber ver
        this.io.to(roomCode).emit('participantJoined', {
          participantCount: room.participants.size,
          message: 'Yeni bir katılımcı odaya katıldı.'
        });

        this.broadcastRoomStats(roomCode);
      }

      console.log(`[Room ${roomCode}] Katılımcı onaylandı: ${data.socketId}`);
    } catch (error) {
      console.error(`[${socket.id}] Katılımcı onaylama hatası:`, error);
      socket.emit('error', 'Katılımcı onaylanırken bir hata oluştu.');
    }
  }

  /**
   * Katılımcı reddetme handler'ı (Host kontrolü)
   * @param {Socket} socket - Socket instance
   * @param {Object} data - { socketId }
   */
  handleRejectParticipant(socket, data) {
    try {
      const roomCode = this.socketRooms.get(socket.id);

      if (!roomCode) {
        socket.emit('error', 'Bir odada değilsiniz.');
        return;
      }

      const result = this.roomService.rejectParticipant(roomCode, socket.id, data.socketId);

      if (result.error) {
        socket.emit('error', result.error);
        return;
      }

      // Reddedilen kişiye haber ver
      const targetSocket = this.io.sockets.sockets.get(data.socketId);
      if (targetSocket) {
        targetSocket.emit('joinRejected', {
          message: 'Katılım talebiniz reddedildi.'
        });
      }

      console.log(`[Room ${roomCode}] Katılımcı reddedildi: ${data.socketId}`);
    } catch (error) {
      console.error(`[${socket.id}] Katılımcı reddetme hatası:`, error);
      socket.emit('error', 'Katılımcı reddedilirken bir hata oluştu.');
    }
  }
}

module.exports = SocketHandlers;
