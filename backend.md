
-----

## 🚀 Backend Engineer Prompt: Lokal Ağ Avatar Yarışması (Node.js/Express & Socket.IO)

**Proje Adı:** Lokal Ağ Avatar Yarışması - Backend
**Teknolojiler:** Node.js, Express, Socket.IO, CORS
**Frontend URL:** `http://[Sunucunun Lokal IP Adresi]:3000` (React Dev Server)

### Genel Amaç ve Sorumluluklar

Backend, uygulamanın **merkezi veri yöneticisi** ve **gerçek zamanlı iletişim köprüsü**dür. Tüm profil ve oylama verilerini yönetir, istemcilerden gelen istekleri işler ve Socket.IO aracılığıyla tüm bağlı istemcilere anlık güncellemeler yayınlar. Güvenilirlik ve gerçek zamanlı senkronizasyon ana hedeflerdir.

### 1\. Sunucu Kurulumu ve Temel Yapılandırma

  * **Node.js Sunucusu:** `express` kütüphanesi ile basit bir HTTP sunucusu oluşturacağım.
  * **HTTP Sunucusu:** Node.js'in `http` modülü ile `express` uygulamasını sarmalayarak `socket.io`'nun da aynı port üzerinden çalışmasını sağlayacağım.
  * **Port:** `3001` numaralı portu kullanacağım (React dev server'ın `3000` portuyla çakışmaması için). Sunucunun `0.0.0.0` IP adresinde dinlemesini sağlayarak lokal ağdaki tüm cihazlardan erişilebilir olmasını garanti edeceğim.
  * **CORS (Cross-Origin Resource Sharing):** Frontend uygulaması farklı bir portta (veya gelecekte farklı bir IP'de) çalışacağı için, Socket.IO ve Express için **geniş CORS ayarları** yapacağım (`origin: "*"`, `methods: ["GET", "POST"]` gibi). Bu, lokal ağdaki tüm istemcilerin sorunsuz bağlanmasını sağlar.
  * **JSON Body Parser:** Express uygulamasına `express.json()` middleware'ini ekleyeceğim, böylece POST isteklerindeki JSON body'leri otomatik olarak parse edilebilir.

### 2\. Veri Depolama Mekanizması (In-Memory)

  * **Geçici Bellek (In-Memory Storage):** Uygulama basit olduğu ve verinin kalıcı olmasına gerek olmadığı için, tüm verileri sunucu belleğinde (RAM) tutacağım. Sunucu yeniden başlatıldığında veriler sıfırlanacaktır, bu mevcut gereksinim için kabul edilebilir.
  * **Veri Yapıları:**
      * `profiles`: Tüm kayıtlı profilleri tutan bir dizi (Array of Objects).
          * Her profil objesi: `{ id: string, name: string, avatar?: string }`
          * `id`: Benzersiz bir kimlik (örneğin `Date.now().toString()` ile oluşturulabilir).
          * `name`: Kullanıcının karakter adı.
          * `avatar`: İsteğe bağlı olarak basit bir avatar URL'si veya tipi (şimdilik default kullanılabilir).
      * `votes`: Her profilin oy sayısını tutan bir obje (Object/Map).
          * Yapısı: `{ [profileId: string]: number }`
          * `profileId`: Profiller dizisindeki `id` ile eşleşir.
          * `number`: O profile verilen toplam oy sayısı.
      * `voters`: Her kullanıcının hangi profile oy verdiğini takip eden bir obje (Object/Map).
          * Yapısı: `{ [socketId: string]: string[] }` veya `{ [ipAddress: string]: string[] }` (birden fazla oylama yapmayı engellemek için)
          * Şimdilik `socketId` üzerinden her bağlantının 1 oy hakkını takip edebiliriz: `{ [socketId]: { votedProfileId: string, hasVoted: boolean } }`. Daha iyi kontrol için `socketId` yerine **IP adresi** veya **kullanıcı ID**'si kullanılabilir, ancak `socketId` başlangıç için yeterli.

### 3\. Socket.IO İletişim Mantığı

Socket.IO, frontend ile gerçek zamanlı, çift yönlü iletişimi sağlayacak ana mekanizmadır.

  * **`io.on('connection', socket)`:** Her yeni istemci bağlandığında tetiklenen ana event.

      * **Mevcut Veri Gönderme:** Yeni bağlanan istemciye anında mevcut tüm `profiles` verisini `socket.emit('currentProfiles', profiles)` ile göndereceğim. Bu, istemcinin arayüzünü güncel tutar.
      * **Disconnect Takibi:** Kullanıcı ayrıldığında loglama (`socket.on('disconnect')`).

  * **`socket.on('createProfile', (newProfileData))`:** Frontend'den yeni bir profil oluşturma isteği geldiğinde:

    1.  `newProfileData` objesini alacağım (`{ name: string }`).
    2.  Benzersiz bir `id` oluşturup `profiles` dizisine ekleyeceğim.
    3.  Yeni eklenen profil için `votes` objesinde sıfır (`0`) oy ile giriş oluşturacağım.
    4.  `io.emit('profileAdded', profileWithId)` ile **tüm bağlı istemcilere** yeni profilin eklendiğini bildireceğim.

  * **`socket.on('vote', (profileId))`:** Frontend'den bir oylama isteği geldiğinde:

    1.  Gelen `profileId`'nin geçerli olup olmadığını ve `votes` objesinde bulunup bulunmadığını kontrol edeceğim.
    2.  **Oy Kontrolü:** Her `socket.id` (yani her bağlantı) için **tek bir oy** hakkı olduğunu doğrulamam gerekiyor.
          * `socket.id`'nin daha önce oy kullanıp kullanmadığını ve hangi profile oy verdiğini kontrol edeceğim (örneğin `socket.voted = true; socket.votedFor = profileId;`).
          * Eğer ilk defa oy veriliyorsa, `votes[profileId]` sayısını bir artıracağım.
    3.  `io.emit('voteUpdate', { profileId, count: votes[profileId] })` ile **tüm bağlı istemcilere** ilgili profilin oy sayısının güncellendiğini yayınlayacağım.

  * **`socket.on('endVoting', ())`:** Herhangi bir istemciden oylamayı bitirme isteği geldiğinde:

    1.  `profiles` ve `votes` verilerini kullanarak en çok oy alan profili/profilleri belirleyeceğim.
    2.  `io.emit('votingEnded', { winner: winningProfile, finalVotes: votes })` ile **tüm bağlı istemcilere** oylamanın bittiğini, kazananı ve nihai oy sayılarını yayınlayacağım.
    3.  **Sıfırlama (Opsiyonel):** Oylama bittikten sonra, eğer frontend'den bir "yeniden başlat" isteği gelirse, `profiles` ve `votes` verilerini sıfırlama mekanizması eklenebilir. Bu iterasyonda manuel sıfırlama (sunucuyu yeniden başlatma) yeterli olabilir.

### 4\. Güvenlik ve Hata Yönetimi (Minimal)

  * **Basit Doğrulama:** Gelen `profileId` veya `name` gibi verilerin geçerliliğini kontrol edeceğim (örneğin boş olup olmadığını).
  * **Hata Yakalama:** Socket.IO event'leri içindeki hataları `try-catch` blokları ile yakalayarak sunucunun çökmesini önleyeceğim ve loglayacağım.
  * **CORS:** Yukarıda belirtildiği gibi doğru CORS konfigürasyonu yapılacak.

### 5\. Backend Kod Yapısı (server.js)

```javascript
// server.js

// Modül Yüklemeleri
const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors'); // CORS middleware'i

// Express Uygulaması ve HTTP Sunucusu
const app = express();
const server = http.createServer(app);

// Socket.IO Sunucusu ve CORS Ayarları
const io = new Server(server, {
    cors: {
        origin: "*", // Tüm kökenlere izin ver (Geliştirme ve lokal ağ için)
        methods: ["GET", "POST"] // İzin verilen HTTP metotları
    }
});

// Express Middleware'ler
app.use(cors()); // Express için de CORS etkinleştir
app.use(express.json()); // JSON istek gövdelerini ayrıştır

// --- IN-MEMORY VERİ DEPOLARI ---
let profiles = []; // [{ id: '...', name: '...', avatar: '...' }]
let votes = {};    // { 'profileId': count }
// Her client'ın sadece bir kez oy vermesini sağlamak için
let votedClients = {}; // { 'socketId': 'votedProfileId' }

// --- SOCKET.IO İLETİŞİM MANTIĞI ---
io.on('connection', (socket) => {
    console.log(`[${socket.id}] Yeni bir kullanıcı bağlandı.`);

    // 1. Yeni bağlanan client'a mevcut tüm profilleri gönder
    socket.emit('currentProfiles', profiles);

    // 2. Profil Oluşturma Event'i
    socket.on('createProfile', (newProfileData) => {
        if (!newProfileData || !newProfileData.name || newProfileData.name.trim() === '') {
            socket.emit('error', 'Karakter adı boş olamaz.');
            return;
        }

        const newId = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const profile = { 
            id: newId, 
            name: newProfileData.name.trim(), 
            avatar: newProfileData.avatar || 'https://via.placeholder.com/150/0000FF/FFFFFF?text=AVTR' // Varsayılan avatar
        };
        
        profiles.push(profile);
        votes[profile.id] = 0; // Yeni profilin oy sayacını başlat

        console.log(`[${socket.id}] Yeni profil oluşturuldu: ${profile.name}`);
        // Tüm client'lara yeni profili yayınla
        io.emit('profileAdded', profile);
    });

    // 3. Oy Kullanma Event'i
    socket.on('vote', (profileId) => {
        // Geçerli bir profile oy verildi mi?
        const targetProfile = profiles.find(p => p.id === profileId);
        if (!targetProfile) {
            socket.emit('error', 'Geçersiz profil ID.');
            return;
        }

        // Kendi profiline oy verme kontrolü (Frontend'de de yapılsa da Backend'de de kontrol edelim)
        // Bunun için client'ın kendi profil ID'sini de takip etmemiz gerekir, bu iterasyonda basit tutalım.

        // Bir client sadece bir kez oy kullanabilir
        if (votedClients[socket.id]) {
            socket.emit('error', 'Zaten oy kullandınız.');
            return;
        }
        
        if (votes.hasOwnProperty(profileId)) {
            votes[profileId]++;
            votedClients[socket.id] = profileId; // Bu client'ın oy verdiğini kaydet

            console.log(`[${socket.id}] ${targetProfile.name} profiline oy verdi. Toplam: ${votes[profileId]}`);
            // Tüm client'lara oy güncellemesini yayınla
            io.emit('voteUpdate', { profileId, count: votes[profileId] });
        } else {
            socket.emit('error', 'Bu profile oy verilemiyor.');
        }
    });

    // 4. Oylamayı Bitirme Event'i
    socket.on('endVoting', () => {
        console.log(`[${socket.id}] Oylamayı bitirme isteği geldi.`);
        let maxVotes = -1;
        let winners = [];

        // Kazananı veya kazananları bulma
        for (const profile of profiles) {
            const currentVotes = votes[profile.id] || 0;
            if (currentVotes > maxVotes) {
                maxVotes = currentVotes;
                winners = [profile]; // Yeni en yüksek oy alan, listeyi sıfırla
            } else if (currentVotes === maxVotes && maxVotes > -1) {
                winners.push(profile); // Beraberlik durumunda ekle
            }
        }

        // Frontend'e nihai sonuçları ve kazananı/kazananları gönder
        io.emit('votingEnded', { 
            winners: winners, // Birden fazla kazanan olabilir
            finalVotes: votes,
            totalParticipants: profiles.length,
            totalVotesCast: Object.values(votes).reduce((sum, count) => sum + count, 0)
        });

        // Oylama bittikten sonra, istersen verileri sıfırlayabilirsin.
        // profiles = [];
        // votes = {};
        // votedClients = {};
        // io.emit('resetApp'); // Frontend'e reset sinyali gönderilebilir
    });

    // 5. Bağlantı Kesilmesi Event'i
    socket.on('disconnect', () => {
        // Kullanıcı ayrıldığında, eğer oy kullanmışsa votedClients'tan çıkar
        delete votedClients[socket.id];
        console.log(`[${socket.id}] Kullanıcı ayrıldı.`);
    });
});

// --- SUNUCUYU BAŞLAT ---
const PORT = 3001;
// 0.0.0.0, sunucunun tüm ağ arayüzlerinde dinlemesini sağlar.
// Bu, lokal ağdaki diğer cihazların sizin bilgisayarınızın IP adresi üzerinden bağlanabilmesi için kritiktir.
server.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend sunucusu şu adreste yayında: http://localhost:${PORT} ve LAN IP'niz üzerinden.`);
    console.log(`Frontend'inizden bağlanmak için: http://[LAN_IP_ADRESİNİZ]:${PORT}`);
});
```

-----

Bu detaylı Backend prompt'u, hem sunucunun temel kurulumunu, hem veri yönetimini, hem de Frontend ile gerçek zamanlı iletişimi sağlayan Socket.IO event'lerinin mantığını açıkça tanımlamaktadır. Artık hem Frontend hem de Backend tarafındaki görevler net bir şekilde belirlenmiştir.