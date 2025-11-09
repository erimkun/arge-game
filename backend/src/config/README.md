# Backend - Config

Bu klasör, uygulamanın yapılandırma dosyalarını içerir.

## 📋 Yapılandırma Dosyaları

### server.config.js
- **Sorumluluk**: Sunucu yapılandırma ayarları
- **Ayarlar**:
  - `port`: Sunucu portu (varsayılan: 3001)
  - `host`: Sunucu host adresi (varsayılan: 0.0.0.0)
  - `cors`: CORS yapılandırması
    - `origin`: İzin verilen origin'ler (varsayılan: '*')
    - `methods`: İzin verilen HTTP metodları

## 🔧 Ortam Değişkenleri

Aşağıdaki ortam değişkenleri kullanılabilir:

- `PORT`: Sunucu portu
- `HOST`: Sunucu host adresi
- `CORS_ORIGIN`: CORS origin ayarı

## 📝 Notlar

- Tüm ayarlar varsayılan değerlere sahiptir
- Ortam değişkenleri `.env` dosyasından okunabilir
- Lokal ağ kullanımı için `host: '0.0.0.0'` önerilir

