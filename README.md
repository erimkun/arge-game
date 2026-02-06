# Lokal Ağ Avatar Yarışması

## 🎯 Proje Hakkında

Lokal Ağ Avatar Yarışması, aynı lokal ağdaki kullanıcıların profil oluşturup birbirlerine oy verebildiği gerçek zamanlı bir oylama uygulamasıdır. Socket.IO ile anlık senkronizasyon sağlar.

## 🏗️ Sistem Mimarisi

Bu uygulama **merkezi host (sunucu) tabanlı, gerçek zamanlı** bir iletişim modeli kullanır:

- **Backend**: Node.js + Express + Socket.IO (Port: 3001)
- **Frontend**: React + Vite + Tailwind CSS (Port: 3000)
- **İletişim**: Socket.IO WebSocket bağlantıları
- **Veri Depolama**: In-memory (RAM'de geçici)

### Veri Akışı

1. **Profil Oluşturma**: Client → Server (`createProfile`) → Tüm Client'lara yayın (`profileAdded`)
2. **Oylama**: Client → Server (`vote`) → Tüm Client'lara yayın (`voteUpdate`)
3. **Sonlandırma**: Client → Server (`endVoting`) → Tüm Client'lara sonuçlar (`votingEnded`)

## 📁 Proje Yapısı

```
oyvergitsin/
├── backend/              # Backend sunucusu
│   ├── src/
│   │   ├── config/      # Yapılandırma
│   │   ├── services/    # İş mantığı servisleri
│   │   ├── handlers/    # Socket.IO handler'ları
│   │   └── models/      # Veri modelleri
│   ├── server.js        # Ana giriş noktası
│   └── package.json
│
├── frontend/            # Frontend uygulaması
│   ├── src/
│   │   ├── pages/       # Sayfa bileşenleri
│   │   ├── components/  # UI bileşenleri
│   │   ├── contexts/    # State management
│   │   ├── services/    # Socket servisi
│   │   └── hooks/       # Custom hooks
│   ├── vite.config.js
│   └── package.json
│
├── backend.md          # Backend gereksinimleri
├── front.md            # Frontend gereksinimleri
└── Systemarc.md       # Sistem mimarisi dokümantasyonu
```

## 🚀 Kurulum ve Çalıştırma

### Gereksinimler

- Node.js (v16 veya üzeri)
- npm veya pnpm

### Backend Kurulumu

```bash
cd backend
npm install
npm start
```

Backend `http://0.0.0.0:3001` adresinde çalışacaktır.

### Frontend Kurulumu

```bash
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:3000` adresinde çalışacaktır.

### Lokal Ağda Kullanım

1. Backend sunucusunu çalıştırın
2. Bilgisayarınızın lokal IP adresini öğrenin (örn: `192.168.1.100`)
3. Frontend'de `.env` dosyası oluşturun:
   ```
   VITE_BACKEND_URL=http://192.168.1.100:3001
   ```
4. Frontend'i yeniden başlatın
5. Diğer cihazlardan `http://192.168.1.100:3000` adresine erişin

## 🎨 Özellikler

- ✅ Gerçek zamanlı profil oluşturma
- ✅ Anlık oy sayısı güncellemeleri
- ✅ Responsive tasarım (mobil uyumlu)
- ✅ Modern ve kullanıcı dostu arayüz
- ✅ Socket.IO ile otomatik yeniden bağlanma
- ✅ Oylama sonuçlarını görselleştirme

## 🎯 SOLID Prensipleri

Bu proje SOLID prensiplerine uygun olarak tasarlanmıştır:

- **Single Responsibility**: Her sınıf/component tek bir sorumluluğa sahiptir
- **Open/Closed**: Yeni özellikler mevcut kodu değiştirmeden eklenebilir
- **Liskov Substitution**: Interface'ler ve soyutlamalar kullanılır
- **Interface Segregation**: Küçük, odaklanmış interface'ler
- **Dependency Inversion**: Dependency injection kullanımı

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

## ☁️ Cloud Deployment (Vercel + Railway)

Bu uygulama Socket.IO WebSocket kullandığı için Vercel tek başına yeterli değildir.

### Backend → Railway

1. [Railway.app](https://railway.app) hesabı oluştur
2. GitHub repo'sunu bağla
3. Root Directory: `backend`
4. Environment Variables:
   ```
   PORT=3001
   CORS_ORIGIN=https://your-app.vercel.app
   ```

### Frontend → Vercel

1. [Vercel](https://vercel.com) hesabı oluştur
2. GitHub repo'sunu import et
3. Root Directory: `frontend`
4. Environment Variables:
   ```
   VITE_BACKEND_URL=https://your-backend.railway.app
   ```

## 📝 Notlar

- Veriler in-memory olarak saklanır (sunucu yeniden başlatıldığında sıfırlanır)
- Her socket bağlantısı için tek bir oy hakkı vardır
- CORS tüm origin'lere açıktır (lokal ağ kullanımı için)
- Kendi profilimize oy veremeyiz

## 🔧 Geliştirme

### Backend Geliştirme

```bash
cd backend
npm run dev  # Auto-reload ile
```

### Frontend Geliştirme

```bash
cd frontend
npm run dev  # Hot-reload ile
```

## 📚 Dokümantasyon

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Sistem Mimarisi](./Systemarc.md)

## 📄 Lisans

MIT

