# Backend - Servisler

Bu klasör, uygulamanın iş mantığını içeren servisleri barındırır.

## 📋 Servisler

### ProfileService.js
- **Sorumluluk**: Profil yönetimi iş mantığı
- **Metodlar**:
  - `createProfile(profileData)`: Yeni profil oluşturur
  - `getAllProfiles()`: Tüm profilleri döndürür
  - `getProfileById(profileId)`: ID'ye göre profil bulur
  - `isValidProfileName(name)`: Profil adı validasyonu
  - `reset()`: Tüm profilleri sıfırlar

### VotingService.js
- **Sorumluluk**: Oylama iş mantığı
- **Metodlar**:
  - `castVote(socketId, profileId)`: Oy verir
  - `hasVoted(socketId)`: Oy kullanıldı mı kontrol eder
  - `initializeVoteCount(profileId)`: Profil için oy sayacını başlatır
  - `determineWinners(profiles)`: Kazananları belirler
  - `removeClientVote(socketId)`: Client oy kaydını siler
  - `reset()`: Tüm oylama verilerini sıfırlar

## 🎯 SOLID Prensipleri

Her servis **Single Responsibility Principle**'a uygun olarak tasarlanmıştır:
- ProfileService sadece profil yönetimiyle ilgilenir
- VotingService sadece oylama mantığıyla ilgilenir

