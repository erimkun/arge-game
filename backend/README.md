# Backend - Lokal Ağ Avatar Yarışması

## 📋 Genel Bakış

Bu backend uygulaması, Lokal Ağ Avatar Yarışması'nın merkezi sunucusudur. Node.js, Express ve Socket.IO kullanarak gerçek zamanlı iletişim sağlar.

## 🏗️ Proje Yapısı

```
backend/
├── src/
│   ├── config/          # Yapılandırma dosyaları
│   ├── services/        # İş mantığı servisleri (Single Responsibility)
│   ├── handlers/        # Socket.IO event handler'ları
│   ├── models/          # Veri modelleri ve tipleri
│   └── utils/           # Yardımcı fonksiyonlar
├── server.js            # Ana giriş noktası
├── package.json
└── README.md
```

## 🎯 SOLID Prensipleri

Bu proje SOLID prensiplerine uygun olarak tasarlanmıştır:

- **Single Responsibility**: Her servis ve handler tek bir sorumluluğa sahiptir
- **Open/Closed**: Yeni özellikler mevcut kodu değiştirmeden eklenebilir
- **Liskov Substitution**: Interface'ler ve soyutlamalar kullanılır
- **Interface Segregation**: Küçük, odaklanmış interface'ler
- **Dependency Inversion**: Bağımlılıklar dependency injection ile yönetilir

## 🚀 Kurulum

```bash
npm install
```

## 🏃 Çalıştırma

```bash
# Production
npm start

# Development (auto-reload)
npm run dev
```

Sunucu `http://0.0.0.0:3001` adresinde çalışacaktır.

## 📡 Socket.IO Events

### Client → Server

- `createProfile`: Yeni profil oluşturma
- `vote`: Bir profile oy verme
- `endVoting`: Oylamayı sonlandırma

### Server → Client

- `currentProfiles`: Mevcut tüm profilleri gönderme
- `profileAdded`: Yeni profil eklendiğinde bildirim
- `voteUpdate`: Oy sayısı güncellendiğinde bildirim
- `votingEnded`: Oylama sonlandığında sonuçları gönderme
- `error`: Hata durumlarında bildirim

## 🔧 Yapılandırma

Port ve diğer ayarlar `src/config/` klasöründe yönetilir.

## 📝 Notlar

- Veriler in-memory olarak saklanır (sunucu yeniden başlatıldığında sıfırlanır)
- Her socket bağlantısı için tek bir oy hakkı vardır
- CORS tüm origin'lere açıktır (lokal ağ kullanımı için)

