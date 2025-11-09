Harika\! React/Tailwind ve Node.js/Socket.IO ile kurduğumuz bu lokal ağ oylama uygulaması için, öncelikle **Sistem Mimarisi Metni**'ni ve ardından **Kullanıcı Arayüzü (UI) Akışı**'nı (metin ve görsel taslakları) hazırlayalım.

-----

## 1\. 🏗️ Uygulama Sistem Mimarisi Metni

Bu uygulama, **merkezi host (sunucu) tabanlı, gerçek zamanlı** bir iletişim modeli kullanır. Uygulamanın temel amacı, aynı lokal ağdaki kullanıcıların profil oluşturmasını, oylama yapmasını ve sonuçları anlık görmesini sağlamaktır.

### A. Temel Bileşenler

1.  **Merkezi Sunucu (Backend - Host Cihazı):**

      * **Teknoloji:** Node.js (Express) ve Socket.IO.
      * **Rol:** Uygulamanın beynidir.
          * Tüm **profil verilerini** (Karakter Adı, ID) bellekte tutar.
          * Tüm **oyları** depolar ve sayar.
          * Tüm istemcilerle gerçek zamanlı iletişimi (Socket.IO) yönetir.
          * Oylama bitti komutunu işler ve sonucu yayınlar.

2.  **İstemci Uygulaması (Frontend):**

      * **Teknoloji:** React (JavaScript) ve Tailwind CSS.
      * **Rol:** Kullanıcı arayüzüdür.
          * Kullanıcının profil oluşturmasını sağlar.
          * Sunucuya profil ve oy gönderme isteklerini iletir.
          * Socket.IO üzerinden gelen **anlık güncellemeleri** (yeni profil, oy değişikliği, sonuç) dinler ve arayüzü otomatik olarak günceller.

### B. İletişim Protokolleri

  * **Lokal Ağ Erişimi:** Sunucu (Host), lokal IP adresi ve belirlenen bir port üzerinden (`http://[Lokal_IP]:3001` gibi) yayın yapar. Tüm istemciler bu adrese bağlanır.
  * **Gerçek Zamanlı İletişim (Socket.IO):**
      * **Olay (Event) Tabanlıdır.** Yeni bir profil oluşturulduğunda veya oy kullanıldığında, sunucu tüm bağlı istemcilere anında mesaj (event) gönderir.
      * Kullanılan Örnek Olaylar: `profileAdded`, `voteUpdate`, `votingEnded`.
  * **Veri Senkronizasyonu:** Yeni bir istemci bağlandığında, sunucu ilk olarak mevcut tüm profilleri (`currentProfiles` olayı ile) göndererek istemcinin verisini senkronize eder.

### C. Veri Akışı ve Senkronizasyon

1.  **Profil Oluşturma:** Client (A) formu doldurur $\rightarrow$ Socket.IO ile Sunucuya `createProfile` isteği gönderir $\rightarrow$ Sunucu profili kaydeder $\rightarrow$ Sunucu, tüm Client'lara `profileAdded` olayı yayınlar $\rightarrow$ Client (B, C, D...) anında yeni profili listelerine ekler.
2.  **Oylama:** Client (B) bir profile tıklar $\rightarrow$ Socket.IO ile Sunucuya `vote` isteği gönderir $\rightarrow$ Sunucu oy sayısını artırır $\rightarrow$ Sunucu, tüm Client'lara `voteUpdate` olayı yayınlar $\rightarrow$ Client (A, C, D...) ilgili profilin oy sayacını anlık olarak günceller.
3.  **Sonlandırma:** Herhangi bir Client $\rightarrow$ Sunucuya `endVoting` isteği gönderir $\rightarrow$ Sunucu kazananı hesaplar $\rightarrow$ Sunucu tüm Client'lara `votingEnded` olayı ile sonuçları gönderir.

-----

## 2\. 📱 Kullanıcı Arayüzü (UI) Akışı ve Öğeleri

Uygulama, temel olarak 3 ana görünümden oluşacaktır.

### A. Görünüm 1: Katılım / Profil Oluşturma Ekranı (Initial View)

Bu ekran, kullanıcının sisteme ilk giriş yaptığı ve kendine bir karakter (profil) oluşturduğu ekrandır.

| Öğeler (Metin Açıklama) | Amaç |
| :--- | :--- |
| **Başlık** | Uygulamanın adı (Örn: Lokal Ağ Avatar Yarışması) |
| **Giriş Formu** | Kullanıcının karakter adını gireceği metin alanı. |
| **Katıl Butonu** | Formu onaylayıp profili ağa yayınlamak için butondur (Örn: "Karakterimi Oluştur ve Başlat"). |
| **Durum Mesajı** | "Lokal sunucuya bağlanılıyor..." gibi ağ durumu bilgisi. |
| **Not:** Kullanıcı profilini oluşturduktan sonra otomatik olarak Oylama Ekranı'na geçer ve bu ekran bir daha gösterilmez. |

### B. Görünüm 2: Oylama Ekranı (Voting View)

Kullanıcı kendi profilini oluşturup katıldıktan sonra gördüğü, ağdaki tüm aktif profilleri ve oy verme arayüzünü içeren ana ekrandır.

| Öğeler (Metin Açıklama) | Amaç |
| :--- | :--- |
| **Başlık/Durum** | "Oylama Devam Ediyor" / Kendi karakter adının vurgulanması. |
| **Karakter Listesi (Grid)** | Ağdaki **kendi profili hariç** tüm karakterlerin kartlar halinde listesi. |
| **Karakter Kartı Öğeleri** | Karakter Adı, Avatar Görseli (varsa), **Anlık Oy Sayısı** (Socket.IO ile güncellenen). |
| **Oy Ver Butonu** | Her karakter kartının altında bulunur. Tıklandığında oyu sunucuya gönderir. **(Önemli: Oy verilen buton pasif hale gelmelidir.)** |
| **Oylamayı Bitir Butonu** | Sayfanın alt kısmında belirgin bir düğme. Tıklandığında tüm ağdaki oylama sürecini sonlandırır. (Örn: "Oylamayı Bitir ve Sonuçları Gör"). |

### C. Görünüm 3: Sonuç Ekranı (Results View)

Oylamayı Bitir butonu tetiklendiğinde tüm kullanıcılara anlık olarak gösterilen ekrandır.

| Öğeler (Metin Açıklama) | Amaç |
| :--- | :--- |
| **Başlık** | "Oylama Sonuçlandı\!" |
| **Kazanan Vurgusu** | En çok oy alan karakterin adı, avatarı ve aldığı oy sayısı **büyük ve dikkat çekici** bir şekilde gösterilir. |
| **Kazanan Listesi** | Tüm karakterlerin aldıkları oy sayısına göre sıralanmış son listesi. |
| **Kapat/Baştan Başlat Butonu** | İsteğe bağlı, uygulamayı sıfırlayıp yeni bir oturum başlatmak için (Bu, sunucunun sıfırlanmasını gerektirir). |

-----

## 🎨 Görsel Taslak (DOM Yapısı Önerisi)

Aşağıdaki yapı, Tailwind CSS sınıflarıyla kolayca stil verilebilecek temel DOM ağacını temsil eder.

```html
<div id="initial-view">
    <h1 class="text-3xl">Lokal Ağ Yarışması</h1>
    <form>
        <input type="text" placeholder="Karakter Adınız" />
        <button type="submit">Karakterimi Oluştur</button>
    </form>
</div>

<div id="voting-view">
    <h2 class="text-xl">Oylama Devam Ediyor</h2>
    
    <div class="grid grid-cols-3 gap-4">
        <div class="character-card">
            <p class="name">Karakter Adı</p>
            <p class="votes">Oy: [Sayı]</p>
            <button class="vote-button">Oy Ver</button>
        </div>
        </div>

    <button id="end-voting-button">OYLAMAYI BİTİR!</button>
</div>

<div id="results-view" class="hidden">
    <h2 class="text-4xl">Kazanan: [Kazanan Adı]</h2>
    <p class="winner-votes">Toplam Oy: [Sayı]</p>
    
    <ul class="final-list">
        <li>[Karakter Adı] - [Oy Sayısı]</li>
    </ul>
</div>
```

Bu mimari ve arayüz akışı, React ve Tailwind ile uygulamanızı hızlıca geliştirmeniz için sağlam bir zemin hazırlamaktadır.

**Şimdi bu yapıyı kullanarak React bileşenlerini (components) oluşturmaya başlayabiliriz.** Uygulamanın en karmaşık kısmı olan **Gerçek Zamanlı Durum Yönetimi (State Management)** ile mi başlayalım, yoksa **profil oluşturma formu** ile mi?