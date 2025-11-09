# Frontend - Pages

Bu klasör, uygulamanın ana sayfa bileşenlerini içerir.

## 📋 Sayfalar

### JoinScreen.jsx
- **Sorumluluk**: Kullanıcı profil oluşturma ekranı
- **Özellikler**:
  - Karakter adı girişi
  - Socket bağlantı durumu gösterimi
  - Profil oluşturma ve VotingScreen'e geçiş

### VotingScreen.jsx
- **Sorumluluk**: Oylama ekranı ve oy verme işlevselliği
- **Özellikler**:
  - Karakter kartları grid görünümü
  - Anlık oy sayısı güncellemeleri
  - Oy verme butonları
  - Oylamayı bitirme modal'ı

### ResultsScreen.jsx
- **Sorumluluk**: Oylama sonuçlarını gösterme
- **Özellikler**:
  - Kazanan vurgusu
  - Tüm sonuçlar listesi
  - İstatistikler
  - Yeni oylama başlatma

## 🎯 SOLID Prensipleri

Her sayfa bileşeni **Single Responsibility Principle**'a uygun olarak tasarlanmıştır:
- Her sayfa tek bir ekranı temsil eder
- İş mantığı servisler ve hook'lar aracılığıyla yönetilir

