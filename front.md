

Önümdeki hedefler: Temiz, modern, duyarlı (responsive) bir arayüz tasarlamak ve kullanıcı deneyimini en üst düzeye çıkarmak. Kullanıcı akışını net bir şekilde tanımlayıp, her adımda neyi nasıl yapacağımı planlayacağım.

İşte "Lokal Ağ Avatar Yarışması" uygulamasını geliştirmek için detaylı bir Frontend Engineering prompt'u:

---

## 🚀 Frontend Engineer Prompt: Lokal Ağ Avatar Yarışması

**Proje Adı:** Lokal Ağ Avatar Yarışması
**Teknolojiler:** React (Vite/CRA), Tailwind CSS, Socket.IO Client
**Backend URL:** `http://[Sunucunun Lokal IP Adresi]:3001`

### Genel Tema ve Stil Yaklaşımı

* **Tema:** Modern, minimalist, canlı ve davetkar. Oyunlaştırılmış bir his vermelidir.
* **Renk Paleti:**
    * **Ana Renkler:** Canlı mor (`#6B46C1` veya Tailwind `indigo-600`), açık mavi (`#A7D9FD` veya Tailwind `blue-200`)
    * **Vurgu Renkleri:** Parlak yeşil (başarı, onay için - Tailwind `green-500`), sıcak turuncu/kırmızı (uyarı, bitirme için - Tailwind `red-500`).
    * **Nötr Renkler:** Yumuşak gri tonları (Tailwind `gray-100` - `gray-700`) arka plan, metin için.
* **Fontlar:** Sans-serif, okunaklı ve modern bir font (örn: `Inter`, `Poppins`, `Roboto`). Tailwind'in varsayılan `sans` fontu yeterli olabilir.
* **Öğeler:** Kart tabanlı düzenler, hafif gölgeler (shadows), yuvarlatılmış köşeler (rounded corners) ve mikro etkileşimler (hover durumları, buton animasyonları).
* **Duyarlılık (Responsiveness):** Uygulama, mobil cihazlardan masaüstü monitörlere kadar tüm ekran boyutlarında iyi görünmelidir. Tailwind'in responsive utility'leri kullanılacak.

---

### Sayfa 1: `JoinScreen.js` (Katılım / Profil Oluşturma)

**Amaç:** Kullanıcının uygulamaya ilk adımını atarak kendine bir karakter adı oluşturmasını sağlamak.

**DOM Özellikleri ve Görünüm:**

* **Ortalanmış İçerik:** Tüm öğeler dikeyde ve yatayda ekranın ortasında yer almalı.
* **Kapsayıcı Kutu:** Arka planı hafif gri olan, beyaz bir kart içinde ortalanmış. Hafif bir gölge ve yuvarlak köşeler (`shadow-lg`, `rounded-xl`).
* **Başlık (`h1`):** "Lokal Ağ Avatar Yarışmasına Hoş Geldiniz!" veya "Karakterinizi Oluşturun!" gibi davetkar bir metin. Büyük, kalın font (`text-3xl`, `font-bold`, `text-indigo-700`).
* **Form Alanı (`input[type="text"]`):** Karakter adının girileceği alan.
    * Geniş, yuvarlak kenarlı (`rounded-lg`), hafif gri bir arka planı (`bg-gray-100`).
    * `placeholder="Karakter Adınızı Girin..."`.
    * `focus` durumunda kenarlığı vurgulanmalı (Tailwind `focus:ring focus:ring-indigo-300`).
* **Buton (`button`):** "Karakterimi Oluştur ve Katıl".
    * Ana renk olan mor tonlarında (`bg-indigo-600`, `hover:bg-indigo-700`).
    * Beyaz metin (`text-white`), kalın font (`font-semibold`), yuvarlak kenarlar (`rounded-lg`), geniş dolgu (`px-6 py-3`).
    * `disabled` durumunda rengi soluk olmalı (`disabled:bg-indigo-300`).
* **Durum Mesajı (`p`):** Bağlantı durumu veya hata mesajları için. (Örn: "Sunucuya bağlanılıyor...", "Karakter adı gerekli."). Küçük, gri metin.
* **Minimalist Tasarım:** Ekstra dağınıklıktan kaçın, net ve odaklı bir arayüz.

**Mantık:**

1.  **Durum Yönetimi:** `useState` kullanarak `characterName` ve `isCreatingProfile` (buton loading state'i için) gibi durumları yöneteceğim.
2.  **Socket Bağlantısı:** Component mount edildiğinde `socket.io-client` ile backend'e bağlanılacak. `socket.on('connect')`, `socket.on('disconnect')` event'leri ile bağlantı durumu izlenecek.
3.  **Profil Oluşturma Fonksiyonu:**
    * Kullanıcı `characterName`'i girip butona tıkladığında tetiklenir.
    * `characterName` boşsa bir hata mesajı gösterilir.
    * `socket.emit('createProfile', { name: characterName })` ile backend'e gönderilir.
    * Başarılı olduğunda (veya backend'den onay geldiğinde), kullanıcı `VotingScreen`'e yönlendirilir (React Router veya basit bir `isJoined` state'i ile).
    * `isCreatingProfile` state'i, butonun kullanıcı arayüzünde "Yükleniyor..." gibi görünmesini sağlar ve çift tıklamayı engeller.
4.  **Kendi Profil ID'si:** Sunucu `profileAdded` event'i ile kendi oluşturduğumuz profili de bize geri gönderecek. Bu `id`'yi `localStorage` veya bir React Context'te tutmalıyım ki `VotingScreen`'de kendi profilime oy veremeyeyim.

---

### Sayfa 2: `VotingScreen.js` (Oylama Ekranı)

**Amaç:** Kullanıcılara ağdaki diğer tüm aktif profilleri göstermek, onlara oy verme imkanı sunmak ve oylamayı sonlandırma yeteneği vermek.

**DOM Özellikleri ve Görünüm:**

* **Ana Düzen:** Başlık üstte, altında karakterlerin listesi (ızgara/grid düzeninde), en altta ise oylamayı bitirme butonu. İçerik ortalanmış, `max-width` ile sınırlı.
* **Başlık (`h2`):** "Oylama Devam Ediyor!" veya "Karakterinizi Seçin!". `text-2xl`, `font-bold`, `text-gray-800`.
* **Kendi Profil Vurgusu (`p`):** "Senin Karakterin: [Karakter Adı]" gibi bir metin. Küçük, italik veya farklı bir renkte (`text-sm`, `italic`, `text-indigo-500`).
* **Karakter Kartları Konteyneri:** `grid` düzeni (`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4`). Ekran boyutuna göre kolon sayısı değişmeli.
* **Karakter Kartı (`div`):** Her profil için ayrı bir kart.
    * Beyaz arka plan (`bg-white`), hafif yuvarlak köşeler (`rounded-lg`), hafif bir gölge (`shadow`).
    * Padding (`p-4`).
    * **Karakter Adı (`p`):** `text-xl`, `font-semibold`, `text-gray-900`.
    * **Avatar Görseli (`img`):** Eğer backend basit bir avatar URL'si gönderiyorsa burada gösterilebilir. Yoksa, sadece ad yeterli. Yuvarlak bir çerçeve ve boyutlandırma (`w-16 h-16 rounded-full mx-auto mb-2`).
    * **Oy Sayısı (`p`):** "Oy: [Sayı]". `text-sm`, `text-gray-600`. **Bu sayı anlık olarak güncellenmelidir.**
    * **Oy Ver Butonu (`button`):** "Bu Karakteri Seç".
        * Mavi tonlarında (`bg-blue-500`, `hover:bg-blue-600`), beyaz metin (`text-white`), yuvarlak kenarlar (`rounded-md`).
        * **Önemli:**
            * **Kendi profilime oy vermemeliyim:** Eğer kart benim karakterimse, buton `disabled` olmalı veya hiç görünmemeli.
            * **Bir profile sadece bir kez oy verebilirim:** Oy verildiğinde, ilgili buton `disabled` olmalı ve rengi griye dönmeli (`disabled:bg-gray-400`). Kullanıcının hangi profile oy verdiğini `localStorage` veya component state'inde tutmalıyım.
* **Oylamayı Bitir Butonu (`button`):** Sayfanın en altında, ortalanmış.
    * Kırmızı tonlarında (`bg-red-600`, `hover:bg-red-700`), büyük, kalın metin (`text-lg`, `font-bold`, `text-white`).
    * Geniş dolgu (`py-3 px-8`), yuvarlak kenarlar (`rounded-xl`).
    * **Uyarı:** Bu butona basıldığında oylama tüm ağda sona erecektir. Belki küçük bir onay pop-up'ı (modal) eklenebilir.

**Mantık:**

1.  **Durum Yönetimi:**
    * `profiles`: `useState` ile tüm aktif profilleri tutacağım. (Backend'den `profileAdded` event'i ile güncellenecek).
    * `votes`: `useState` ile her profilin anlık oy sayısını tutacağım. (Backend'den `voteUpdate` event'i ile güncellenecek).
    * `myProfileId`: `localStorage`'dan veya `props` olarak `JoinScreen`'den gelen kendi profil ID'm.
    * `hasVotedFor`: `useState` veya `localStorage` ile hangi profile oy verdiğimi takip edeceğim (`{ profileId: true }`).
2.  **Socket Dinleme:**
    * `socket.on('profileAdded')`: Yeni gelen profili `profiles` state'ine ekleyeceğim.
    * `socket.on('voteUpdate')`: Gelen oy güncellemesini `votes` state'inde ilgili profilin sayısını artıracağım.
    * `socket.on('votingEnded')`: Bu event geldiğinde `ResultsScreen`'e yönlendirme yapacağım.
3.  **`handleVote(profileId)` Fonksiyonu:**
    * `myProfileId` ile `profileId` aynı ise işlem yapma (kendi kendine oy verme engeli).
    * Daha önce bu profile oy verilmişse işlem yapma.
    * `socket.emit('vote', profileId)` ile oy gönderme.
    * `hasVotedFor` state'ini güncelleyerek butonun `disabled` olmasını sağlama.
4.  **`handleEndVoting()` Fonksiyonu:**
    * Opsiyonel olarak bir onay `modal`ı gösterebilirim.
    * `socket.emit('endVoting')` ile backend'e oylamayı bitirme isteğini gönderme.

---

### Sayfa 3: `ResultsScreen.js` (Sonuç Ekranı)

**Amaç:** Oylama sona erdiğinde, kazananı ve tüm profillerin nihai oy sayılarını göstermek.

**DOM Özellikleri ve Görünüm:**

* **Ortalanmış İçerik:** Geniş bir kart içinde ortalanmış.
* **Ana Başlık (`h1`):** "OYLAMA SONUÇLANDI!" `text-4xl`, `font-extrabold`, `text-red-600`.
* **Kazanan Vurgusu (`div`):** En çok oy alan karakter için özel bir alan.
    * Daha büyük bir kart (`bg-yellow-100`, `border-4 border-yellow-500`, `p-8`, `rounded-xl`, `shadow-2xl`).
    * "Kazanan:" metni (`text-2xl`, `font-semibold`).
    * Kazanan Karakter Adı (`span`): `text-indigo-800`, `font-bold`, `text-4xl`.
    * Kazananın Oy Sayısı (`p`): `text-xl`, `text-gray-700`.
* **Tüm Sonuçlar Listesi (`ul`):** Tüm karakterlerin oy sayısına göre büyükten küçüğe sıralanmış listesi.
    * Her liste öğesi (`li`) Karakter Adı ve Oy Sayısını içermeli. (`text-lg`, `text-gray-800`, `mb-1`).
    * Sıralamayı React tarafında yapacağım.
* **Tekrar Başlat Butonu (Opsiyonel):** "Yeni Bir Oylama Başlat" (Bu, Backend'i de sıfırlama mantığı gerektirir, bu iterasyonda eklemeyebilirim, sadece sayfa yenilenmesi veya `JoinScreen`'e dönme olabilir).

**Mantık:**

1.  **Durum Yönetimi:** `winner` ve `finalVotes` verileri `socket.on('votingEnded')` event'inden gelecek. Bu verileri `useState` ile tutacağım.
2.  **Sıralama:** Gelen `finalVotes` objesini kullanarak profilleri azalan oy sayısına göre sıralayacağım.
3.  **Kazananı Belirleme:** Backend'den gelen `winner` objesini direkt kullanacağım. Beraberlik durumunda birden fazla kazananı gösterebilirim (bu durumda `winner` objesi bir dizi olabilir, backend'e bağlı).
4.  **Ekran Geçişi:** `VotingScreen`'den bu ekrana geçiş, `isVotingEnded` gibi bir genel state ile yönetilecek.

---

### Ek Notlar ve Yapılandırma

* **Vite veya Create React App:** Hızlı başlangıç için Vite tercih edilebilir.
* **Tailwind CSS Kurulumu:** `postcss.config.js` ve `tailwind.config.js` dosyalarını doğru yapılandıracağım.
* **Socket.IO Client:** `socket.io-client` paketini kurup kullanacağım.
* **Modüler Yapı:** Her sayfa ayrı bir React component'i olacak (`src/components/` veya `src/pages/` klasörleri altında).
* **Ana Component (`App.js`):** Uygulamanın genel akışını (hangi ekranın gösterileceği) yönetecek ana bileşen. Belki bir `GlobalStateContext` veya `useReducer` kullanarak `appState`'i (JOINED, VOTING, RESULTS) yöneteceğim.

Bu detaylı plan ile, Lokal Ağ Avatar Yarışması uygulamasını React ve Tailwind ile adım adım inşa edebilirim. Şimdi kodlamaya başlayabilirim!
```