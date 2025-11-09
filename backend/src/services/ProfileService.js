/**
 * Profile Service
 * Single Responsibility: Profil yönetimi iş mantığı
 */

class ProfileService {
  constructor() {
    this.profiles = [];
  }

  /**
   * Yeni profil oluşturur
   * @param {Object} profileData - Profil verisi { name: string, avatar?: string }
   * @returns {Object} Oluşturulan profil
   */
  createProfile(profileData) {
    const newId = `profile-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const profile = {
      id: newId,
      name: profileData.name.trim(),
      avatar: profileData.avatar || 'https://via.placeholder.com/150/6B46C1/FFFFFF?text=AVTR',
      model: profileData.model || null,
    };

    this.profiles.push(profile);
    return profile;
  }

  /**
   * Tüm profilleri döndürür
   * @returns {Array} Profil listesi
   */
  getAllProfiles() {
    return [...this.profiles];
  }

  /**
   * ID'ye göre profil bulur
   * @param {string} profileId - Profil ID'si
   * @returns {Object|undefined} Bulunan profil
   */
  getProfileById(profileId) {
    return this.profiles.find(p => p.id === profileId);
  }

  /**
   * Profil adının geçerli olup olmadığını kontrol eder
   * @param {string} name - Profil adı
   * @returns {boolean} Geçerlilik durumu
   */
  isValidProfileName(name) {
    return name && typeof name === 'string' && name.trim().length > 0;
  }

  /**
   * Tüm profilleri sıfırlar (reset için)
   */
  reset() {
    this.profiles = [];
  }
}

module.exports = ProfileService;

