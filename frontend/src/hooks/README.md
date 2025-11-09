# Frontend - Hooks

Bu klasör, custom React hook'larını içerir.

## 📋 Hook'lar

### useSocket.js
- **Sorumluluk**: Socket.IO event yönetimi için hook
- **Özellikler**:
  - Socket bağlantısını otomatik başlatır
  - Tüm Socket.IO event'lerini dinler
  - State'i otomatik günceller
  - Cleanup işlemlerini yönetir

## 🎯 Event'ler

- `connect`: Bağlantı kurulduğunda
- `disconnect`: Bağlantı kesildiğinde
- `currentProfiles`: Mevcut profiller geldiğinde
- `profileAdded`: Yeni profil eklendiğinde
- `voteUpdate`: Oy sayısı güncellendiğinde
- `votingEnded`: Oylama sonlandığında
- `error`: Hata oluştuğunda

## 🎯 SOLID Prensipleri

- **Single Responsibility**: Sadece Socket.IO event yönetimi
- **Reusability**: Tüm component'lerde kullanılabilir

