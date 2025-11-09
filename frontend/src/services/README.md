# Frontend - Services

Bu klasör, dış servis entegrasyonlarını içerir.

## 📋 Servisler

### socketService.js
- **Sorumluluk**: Socket.IO bağlantı yönetimi
- **Özellikler**:
  - Singleton pattern kullanımı
  - Otomatik yeniden bağlanma
  - Bağlantı durumu kontrolü

## 🎯 Metodlar

- `connect()`: Socket bağlantısını başlatır
- `disconnect()`: Socket bağlantısını kapatır
- `getSocket()`: Socket instance'ını döndürür
- `isConnected()`: Bağlantı durumunu kontrol eder

## 🎯 SOLID Prensipleri

- **Single Responsibility**: Sadece Socket.IO bağlantı yönetimi
- **Singleton Pattern**: Tek bir instance kullanımı

