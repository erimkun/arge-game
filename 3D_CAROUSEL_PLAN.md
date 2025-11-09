# 🎠 3D Carousel Oylama Sistemi - Geliştirme Planı (GLB Modelleri ile)

## 📋 Genel Bakış

Oy verme ekranında, kullanıcıların kartlarını **GLB formatındaki gerçek 3D modellerle** eksen etrafında dönen bir sergi formatında göstermek. Merkezde kullanıcının kendi modeli, etrafında diğer kullanıcıların kartları ve modelleri döner.

## 🎯 Özellikler

### Temel Özellikler
1. **3D Carousel**: Kartlar ve modeller eksen etrafında döner
2. **Merkez Model**: Kullanıcının GLB modeli merkezde (fallback 2D avatar)
3. **Kart Rotasyonu**: Kartlar eksen etrafında sürekli döner
4. **Model-Rich Kartlar**: Her kartta avatar görseli + mini 3D model
5. **Navigasyon**: Sağ/sol tuşlar, drag, swipe

### Kontroller
- **Desktop**: Ok tuşları (← →) veya mouse drag
- **Mobil**: Touch swipe veya ekrana basılı tutarak model döndürme
- **Animasyonlar**: Yumuşak geçişler ve dönüşler

## 🛠️ Teknoloji Stack

### Gerekli Paketler
```json
{
  "@react-three/fiber": "^8.15.0",
  "@react-three/drei": "^9.88.0",
  "three": "^0.158.0",
  "framer-motion": "^10.16.0"
}
```

> Paket sürümleri kararlı en güncel minör versiyonlarla doğrulanıp kurulacak.

### 3D Model Yönetimi
- GLB dosyaları `frontend/public/models` altında (örnek: `erim.glb`, `frat.glb`, `gokhan.glb` ...)
- `AVATARS` sabiti her kullanıcı için `model` path içerir (`/models/<id>.glb`)
- `useGLTF` (drei) ile modeller lazy-load edilir ve cache'lenir
- Model yüklerken hata durumunda 2D avatar fallback'i gösterilir

## 📐 Mimari Tasarım

### 1. Bileşen Yapısı
```
VotingScreen/
├── VotingCarousel3D.jsx              # Ana 3D carousel component
├── components/
│   ├── CharacterCard3D.jsx           # Kart yüzeyi + overlay
│   ├── CharacterModel.jsx            # GLB loader & fallback
│   ├── CenterAvatarModel.jsx         # Merkez GLB + platform
│   ├── CarouselControls.jsx          # Kontrol butonları
│   └── TouchControls.jsx             # Touch/drag handler
└── hooks/
    ├── useCarousel.js                # Carousel state
    ├── useKeyboardControls.js        # Klavye kontrolleri
    ├── useTouchControls.js           # Touch kontrolleri
    └── useGLTFCache.js               # GLB caching & preload
```

### 2. 3D Sahne Yapısı
```
Scene (Canvas)
├── Camera (PerspectiveCamera)
├── Lighting
│   ├── AmbientLight
│   ├── SpotLight (ön)
│   └── RimLight (arka glow)
├── CenterAvatarModel (Merkez, sabit)
└── CarouselGroup (Dönen grup)
    └── CharacterCard3D[] (model + kart + raycaster alanı)
```

### 3. Matematiksel Hesaplamalar

#### Kart Pozisyonları (Silindirik Carousel)
```javascript
// Her kart için açı hesaplama
const angleStep = (2 * Math.PI) / profiles.length;
const radius = 5; // Eksenden uzaklık

// Her kart için pozisyon
x = radius * Math.cos(angle + rotationOffset)
z = radius * Math.sin(angle + rotationOffset)
y = 0 (veya hafif yukarı/aşağı varyasyon)

// Kart rotasyonu (merkeze bakacak şekilde)
rotation.y = angle + rotationOffset + Math.PI / 2
```

#### Aktif Kart Belirleme
```javascript
// En öndeki kartı bulma (kamera yönüne en yakın)
const activeIndex = Math.round(-rotationOffset / angleStep) % profiles.length
```

## 🎨 UI/UX Tasarım

### Kart Tasarımı
- **Boyut**: 3D space'de 2.2w x 3h x 0.15d
- **Görünüm**: 
  - Ön yüz: Avatar overlay + isim + oy sayaç çipi
  - Mini Model: Kart önünde şeffaf platform üzerinde GLB önizlemesi
  - Arka yüz: Gradient + hafif glow (dönüş sırasında görünür)
- **Hover/Seçili Durum**: Bloom/parlama, hafif scale artışı

### Merkez Avatar
- **Pozisyon**: (0, 0, 0) - merkez platform
- **Boyut**: Kullanıcı modeline göre otomatik scale
- **Animasyon**: Sürekli yavaş dönüş + nefes efekti
- **Görünüm**: Kullanıcının GLB modeli; model yoksa billboard avatar
- **Platform**: Şeffaf disk + soft shadow + highlight ring

### Kontroller
- **Desktop**: 
  - Sol/Sağ ok tuşları
  - Mouse drag
  - Sol/Sağ butonlar (ekranın kenarlarında)
- **Mobil**:
  - Swipe left/right
  - Ekrana basılı tutarak model döndürme
  - Sol/Sağ butonlar

## 🔄 State Yönetimi

```javascript
const [rotationOffset, setRotationOffset] = useState(0); // Carousel rotasyonu
const [activeIndex, setActiveIndex] = useState(0);      // Aktif kart indexi
const [isRotating, setIsRotating] = useState(false);    // Animasyon durumu
const [centerRotation, setCenterRotation] = useState(0); // Merkez model rotasyonu (mobil)
```

## 📱 Responsive Tasarım

### Desktop (>768px)
- Tam 3D görünüm
- Mouse kontrolleri aktif
- Daha fazla detay

### Mobil (<768px)
- Optimize edilmiş 3D görünüm
- Touch kontrolleri
- Performans optimizasyonu
- Basitleştirilmiş efektler

## 🎬 Animasyonlar

### Geçiş Animasyonları
- **Carousel Dönüşü**: Spring easing ile yumuşak geçiş
- **Aktif Kart**: Scale + glow artışı
- **Model**: Aktif kartın modeli hafif öne eğilir
- **Oy Verme**: Kart üzerinde pulse/patikül feedback'i

### Performans Optimizasyonu
- **LOD (Level of Detail)**: Uzak kartlar için düşük detay
- **Frustum Culling**: Görünmeyen kartları render etme
- **Animation Frame**: requestAnimationFrame kullanımı

## 🚀 Implementasyon Adımları

### Faz 1: Temel 3D Sahne (GLB Entegrasyonu)
1. React Three Fiber + Drei paketlerini ekle
2. Canvas, Camera ve Lights kur
3. `useGLTFCache` ile GLB yükleme helper'ı oluştur
4. Tek kullanıcı modeli + kart ile PoC hazırla

### Faz 2: Carousel Mantığı
1. Profil listesine göre kart pozisyon/rota hesapla
2. Rotasyon offset state + easing
3. Aktif kart belirleme ve highlight
4. Model görünürlüğünü optimize et (frustum culling)

### Faz 3: Kontroller
1. Klavye ok tuşları
2. Mouse drag (pointer hareketi)
3. Touch swipe & basılı tutarak merkez modeli döndürme
4. Opsiyonel auto-rotate toggle

### Faz 4: UI Entegrasyonu
1. Kart overlay (isim, oy sayısı, vote butonu)
2. Oy verme butonunun 3D/2D hibrit tasarımı
3. Header ve footer ile styling uyumu
4. Responsive ayarlar (mobilde shader sadeleştirme)

### Faz 5: Animasyonlar ve Polisaj
1. Geçiş animasyonları
2. Hover efektleri
3. Performans optimizasyonu
4. Hata yönetimi

## 📝 Notlar

- **3D Modeller**: Varsayılan olarak GLB (public/models). Model yoksa 2D avatar billboard'u göster.
- **Karakter ID Eşlemesi**: `AVATARS` sabiti  `id → image → model` bilgisi içeriyor.
- **Performans**: Mobil cihazlarda FPS düşerse basitleştirilmiş materyal & 2D fallback sağlayacağız.
- **Erişilebilirlik**: Klavye navigasyonu + sesli feedback planlanacak.
- **Browser Support**: WebGL 2 destekli modern tarayıcılar hedefleniyor.

## 🔧 Teknik Detaylar

### Camera Ayarları
```javascript
fov: 50
position: [0, 2, 8]
lookAt: [0, 0, 0]
```

### Lighting
```javascript
AmbientLight: intensity 0.5
PointLight: position [0, 5, 5], intensity 1
```

### Kart Boyutları
```javascript
width: 2
height: 3
depth: 0.1
```

Bu plan ile 3D carousel sistemini adım adım implement edebiliriz. Başlayalım mı?


