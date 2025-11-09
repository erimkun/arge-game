# Frontend - Lokal Ağ Avatar Yarışması

## 📋 Genel Bakış

Bu frontend uygulaması, arge müdürlüpü'nın kullanıcı arayüzüdür. React, Vite ve Tailwind CSS kullanarak modern, responsive bir deneyim sunar.

## 🏗️ Proje Yapısı

```
frontend/
├── src/
│   ├── components/      # Yeniden kullanılabilir UI bileşenleri
│   ├── pages/           # Sayfa bileşenleri (JoinScreen, VotingScreen, ResultsScreen)
│   ├── contexts/        # React Context API (Global state management)
│   ├── services/        # Dış servis entegrasyonları (Socket.IO)
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Yardımcı fonksiyonlar
│   ├── App.jsx          # Ana uygulama bileşeni
│   ├── main.jsx         # Giriş noktası
│   └── index.css        # Global stiller
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
└── package.json
```

## 🎯 SOLID Prensipleri

Bu proje SOLID prensiplerine uygun olarak tasarlanmıştır:

- **Single Responsibility**: Her component ve servis tek bir sorumluluğa sahiptir
- **Open/Closed**: Yeni özellikler mevcut kodu değiştirmeden eklenebilir
- **Liskov Substitution**: Interface'ler ve soyutlamalar kullanılır
- **Interface Segregation**: Küçük, odaklanmış hook'lar ve servisler
- **Dependency Inversion**: Context API ve dependency injection kullanımı

## 🚀 Kurulum

```bash
npm install
```

## 🏃 Çalıştırma

```bash
# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

## ⚙️ Yapılandırma

Backend URL'i `.env` dosyasında veya `vite.config.js` içinde ayarlanabilir:

```env
VITE_BACKEND_URL=http://localhost:3001
```

## 🎨 Stil Sistemi

- **Tailwind CSS**: Utility-first CSS framework
- **Renk Paleti**: 
  - Ana: Indigo (`#6B46C1`)
  - Vurgu: Mavi, Yeşil, Kırmızı
- **Font**: Inter (sans-serif)
- **Responsive**: Mobile-first yaklaşım

## 📡 Socket.IO Entegrasyonu

Socket.IO bağlantısı `src/services/socketService.js` üzerinden yönetilir. Tüm event'ler `useSocket` hook'u ile dinlenir.

## 📝 Notlar

- State management için React Context API kullanılır
- Socket bağlantısı otomatik olarak yeniden bağlanır
- Responsive tasarım tüm ekran boyutlarında çalışır

