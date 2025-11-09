/**
 * Socket Event Handlers
 * Single Responsibility: Socket.IO event'lerini yönetir
 */

class SocketHandlers {
  constructor(io, profileService, votingService) {
    this.io = io;
    this.profileService = profileService;
    this.votingService = votingService;
  }

  /**
   * Yeni bağlantı kurulduğunda çağrılır
   * @param {Socket} socket - Socket instance
   */
  handleConnection(socket) {
    console.log(`[${socket.id}] Yeni bir kullanıcı bağlandı.`);

    // Mevcut profilleri gönder
    const currentProfiles = this.profileService.getAllProfiles();
    socket.emit('currentProfiles', currentProfiles);

    // Event listener'ları kaydet
    this.registerEventHandlers(socket);
  }

  /**
   * Socket event handler'larını kaydeder
   * @param {Socket} socket - Socket instance
   */
  registerEventHandlers(socket) {
    // Profil oluşturma
    socket.on('createProfile', (newProfileData) => {
      this.handleCreateProfile(socket, newProfileData);
    });

    // Oy verme
    socket.on('vote', (profileId) => {
      this.handleVote(socket, profileId);
    });

    // Oylamayı bitirme
    socket.on('endVoting', () => {
      this.handleEndVoting(socket);
    });

    // Uygulamayı sıfırlama
    socket.on('resetApp', () => {
      this.handleResetApp(socket);
    });

    // Bağlantı kesilme
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });
  }

  /**
   * Profil oluşturma event handler'ı
   * @param {Socket} socket - Socket instance
   * @param {Object} newProfileData - Profil verisi
   */
  handleCreateProfile(socket, newProfileData) {
    try {
      // Validasyon
      if (!newProfileData || !this.profileService.isValidProfileName(newProfileData.name)) {
        socket.emit('error', 'Karakter adı boş olamaz.');
        return;
      }

      // Profil oluştur
      const profile = this.profileService.createProfile(newProfileData);
      
      // Oy sayacını başlat
      this.votingService.initializeVoteCount(profile.id);

      console.log(`[${socket.id}] Yeni profil oluşturuldu: ${profile.name}`);
      
      // Tüm client'lara yayınla
      this.io.emit('profileAdded', profile);
    } catch (error) {
      console.error(`[${socket.id}] Profil oluşturma hatası:`, error);
      socket.emit('error', 'Profil oluşturulurken bir hata oluştu.');
    }
  }

  /**
   * Oy verme event handler'ı
   * @param {Socket} socket - Socket instance
   * @param {string} profileId - Profil ID'si
   */
  handleVote(socket, profileId) {
    try {
      // Profil geçerliliği kontrolü
      const targetProfile = this.profileService.getProfileById(profileId);
      if (!targetProfile) {
        socket.emit('error', 'Geçersiz profil ID.');
        return;
      }

      // Oy ver
      const voteResult = this.votingService.castVote(socket.id, profileId);

      console.log(`[${socket.id}] ${targetProfile.name} profiline oy verdi. Toplam: ${voteResult.count}`);
      
      // Tüm client'lara yayınla
      this.io.emit('voteUpdate', voteResult);
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
      console.log(`[${socket.id}] Oylamayı bitirme isteği geldi.`);

      const profiles = this.profileService.getAllProfiles();
      const results = this.votingService.determineWinners(profiles);

      // Tüm client'lara sonuçları yayınla
      this.io.emit('votingEnded', results);

      console.log(`Oylama sonlandı. Kazanan(lar): ${results.winners.map(w => w.name).join(', ')}`);
    } catch (error) {
      console.error(`[${socket.id}] Oylamayı bitirme hatası:`, error);
      socket.emit('error', 'Oylama sonlandırılırken bir hata oluştu.');
    }
  }

  /**
   * Uygulamayı sıfırlama event handler'ı
   * @param {Socket} socket - Socket instance
   */
  handleResetApp(socket) {
    try {
      console.log(`[${socket.id}] Uygulama sıfırlama isteği geldi.`);

      // Servisleri sıfırla
      this.profileService.reset();
      this.votingService.reset();

      console.log('Uygulama sıfırlandı. Tüm profiller ve oylar temizlendi.');

      // Tüm client'lara reset event'i gönder
      this.io.emit('appReset');
    } catch (error) {
      console.error(`[${socket.id}] Uygulama sıfırlama hatası:`, error);
      socket.emit('error', 'Uygulama sıfırlanırken bir hata oluştu.');
    }
  }

  /**
   * Bağlantı kesilme event handler'ı
   * @param {Socket} socket - Socket instance
   */
  handleDisconnect(socket) {
    // Client'ın oy kaydını temizle
    this.votingService.removeClientVote(socket.id);
    console.log(`[${socket.id}] Kullanıcı ayrıldı.`);
  }
}

module.exports = SocketHandlers;

