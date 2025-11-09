# Frontend - Contexts

Bu klasör, React Context API kullanarak global state yönetimini içerir.

## 📋 Context'ler

### AppStateContext.jsx
- **Sorumluluk**: Global uygulama durumu yönetimi
- **State Yapısı**:
  - `currentState`: Mevcut ekran durumu (JOIN, VOTING, RESULTS)
  - `myProfile`: Kullanıcının kendi profili
  - `profiles`: Tüm profiller listesi
  - `votes`: Profil ID'lerine göre oy sayıları
  - `results`: Oylama sonuçları

## 🎯 Action Types

- `SET_STATE`: Ekran durumunu değiştirir
- `SET_MY_PROFILE`: Kullanıcının profilini ayarlar
- `SET_PROFILES`: Tüm profilleri ayarlar
- `ADD_PROFILE`: Yeni profil ekler
- `UPDATE_VOTE`: Oy sayısını günceller
- `SET_RESULTS`: Sonuçları ayarlar
- `RESET`: Tüm state'i sıfırlar

## 🎯 SOLID Prensipleri

- **Single Responsibility**: Sadece global state yönetimi
- **Open/Closed**: Yeni action type'lar eklenebilir
- **Dependency Inversion**: Context Provider pattern kullanımı

