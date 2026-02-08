/**
 * Export Utilities
 * Sonuçları CSV ve PDF olarak dışa aktarma
 */

/**
 * Sonuçları CSV formatında indir
 * @param {Object} results - Oylama sonuçları
 * @param {Array} profiles - Profil listesi
 */
export function exportToCSV(results, profiles) {
    const { finalVotes, totalParticipants, totalVotesCast } = results;

    // Profilleri oy sayısına göre sırala
    const sortedProfiles = profiles
        .map(profile => ({
            ...profile,
            votes: finalVotes[profile.id] || 0
        }))
        .sort((a, b) => b.votes - a.votes);

    // CSV içeriği oluştur
    let csv = 'Sıra,İsim,Oy Sayısı,Oy Oranı\n';

    sortedProfiles.forEach((profile, index) => {
        const percentage = totalVotesCast > 0
            ? ((profile.votes / totalVotesCast) * 100).toFixed(1)
            : '0';
        csv += `${index + 1},"${profile.name}",${profile.votes},%${percentage}\n`;
    });

    // Özet bilgi ekle
    csv += '\n';
    csv += `Toplam Katılımcı,${totalParticipants}\n`;
    csv += `Toplam Oy,${totalVotesCast}\n`;
    csv += `Tarih,"${new Date().toLocaleString('tr-TR')}"\n`;

    // İndir
    downloadFile(csv, 'oylama-sonuclari.csv', 'text/csv;charset=utf-8');
}

/**
 * Sonuçları basit metin formatında indir (PDF yerine)
 * Not: Gerçek PDF için jspdf paketi gerekir
 * @param {Object} results - Oylama sonuçları
 * @param {Array} profiles - Profil listesi
 */
export function exportToText(results, profiles) {
    const { winners, finalVotes, totalParticipants, totalVotesCast, isTie } = results;

    // Profilleri oy sayısına göre sırala
    const sortedProfiles = profiles
        .map(profile => ({
            ...profile,
            votes: finalVotes[profile.id] || 0
        }))
        .sort((a, b) => b.votes - a.votes);

    let content = '═══════════════════════════════════════\n';
    content += '       OYLAMA SONUÇLARI RAPORU\n';
    content += '═══════════════════════════════════════\n\n';

    content += `📅 Tarih: ${new Date().toLocaleString('tr-TR')}\n\n`;

    // Kazanan(lar)
    content += '🏆 KAZANAN' + (winners.length > 1 ? 'LAR' : '') + ':\n';
    content += '───────────────────────────────────────\n';
    winners.forEach(winner => {
        content += `   ${winner.name} - ${finalVotes[winner.id]} oy\n`;
    });
    if (isTie) {
        content += '   ⚠️ Berabere!\n';
    }
    content += '\n';

    // Tüm sonuçlar
    content += '📊 TÜM SONUÇLAR:\n';
    content += '───────────────────────────────────────\n';
    sortedProfiles.forEach((profile, index) => {
        const percentage = totalVotesCast > 0
            ? ((profile.votes / totalVotesCast) * 100).toFixed(1)
            : '0';
        const bar = '█'.repeat(Math.ceil(profile.votes / (totalVotesCast || 1) * 20));
        content += `   ${index + 1}. ${profile.name.padEnd(20)} ${String(profile.votes).padStart(3)} oy (%${percentage.padStart(5)}) ${bar}\n`;
    });
    content += '\n';

    // İstatistikler
    content += '📈 İSTATİSTİKLER:\n';
    content += '───────────────────────────────────────\n';
    content += `   Toplam Katılımcı: ${totalParticipants}\n`;
    content += `   Toplam Oy: ${totalVotesCast}\n`;
    content += `   Katılım Oranı: %${totalParticipants > 0 ? ((totalVotesCast / totalParticipants) * 100).toFixed(1) : '0'}\n`;
    content += '\n';
    content += '═══════════════════════════════════════\n';
    content += '        Lokal Ağ Avatar Yarışması\n';
    content += '═══════════════════════════════════════\n';

    // İndir
    downloadFile(content, 'oylama-sonuclari.txt', 'text/plain;charset=utf-8');
}

/**
 * Dosya indirme yardımcı fonksiyonu
 */
function downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
}

/**
 * Oda davet linkini oluştur
 * @param {string} roomCode - Oda kodu
 * @returns {string} Davet linki
 */
export function generateInviteLink(roomCode) {
    const baseUrl = window.location.origin;
    return `${baseUrl}?room=${roomCode}`;
}

/**
 * Davet linkini panoya kopyala
 * @param {string} roomCode - Oda kodu
 * @returns {Promise<boolean>} Başarılı mı
 */
export async function copyInviteLink(roomCode) {
    try {
        const link = generateInviteLink(roomCode);
        await navigator.clipboard.writeText(link);
        return true;
    } catch (error) {
        console.error('Kopyalama hatası:', error);
        return false;
    }
}
