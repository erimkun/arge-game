# Backend - Handlers

Bu klasör, Socket.IO event handler'larını içerir.

## 📋 Handler'lar

### SocketHandlers.js
- **Sorumluluk**: Socket.IO event'lerini yönetir
- **Bağımlılıklar**: ProfileService, VotingService (Dependency Injection)

## 🎯 Event Handler'ları

### handleConnection(socket)
Yeni bağlantı kurulduğunda çağrılır. Mevcut profilleri gönderir ve event listener'ları kaydeder.

### handleCreateProfile(socket, newProfileData)
Profil oluşturma isteğini işler:
- Validasyon yapar
- Profil oluşturur
- Tüm client'lara yayınlar

### handleVote(socket, profileId)
Oy verme isteğini işler:
- Profil geçerliliği kontrol eder
- Oy verir
- Tüm client'lara güncelleme yayınlar

### handleEndVoting(socket)
Oylamayı bitirme isteğini işler:
- Kazananları belirler
- Sonuçları tüm client'lara yayınlar

### handleDisconnect(socket)
Bağlantı kesilme durumunu işler:
- Client'ın oy kaydını temizler

## 🎯 SOLID Prensipleri

- **Single Responsibility**: Sadece Socket.IO event yönetimi
- **Dependency Inversion**: Servisler dependency injection ile kullanılır

