
import { UserProfile } from './types';

/**
 * İki profil arasındaki uyumluluk skorunu (0-100) hesaplar.
 * NOT: Dashboard seviyesinde yaş ve cinsiyet zaten filtrelenmiş olmalıdır.
 */
export function calculateMatchScore(currentUser: UserProfile, targetUser: UserProfile): number {
  let score = 0;

  // 1. Yaş Uyumu (Zorunlu aralıklar geçildikten sonra, yakınlık puanı)
  const ageDiff = Math.abs(currentUser.age - targetUser.age);
  if (ageDiff <= 2) score += 30;
  else if (ageDiff <= 5) score += 20;
  else score += 10;

  // 2. Yerleşim & Ülke Uyumu (Kültür birliği)
  if (currentUser.country === targetUser.country) {
    score += 25;
  } else if (currentUser.relocationStatus === 'Evet' || targetUser.relocationStatus === 'Evet') {
    score += 15; // Taşınmaya sıcak bakma puanı
  }

  // 3. Çocuk Durumu Uyumu (Hayati Kriter)
  if (currentUser.hasChildren === targetUser.hasChildren) {
    score += 20;
  }

  // 4. Dil & Çeviri Uyumu
  if (currentUser.willUseTranslation && targetUser.partnerCanUseTranslation) {
    score += 15;
  }

  // 5. Doğrulanmış Profil Bonusu
  if (targetUser.isVerified) {
    score += 10;
  }

  return Math.min(score, 100);
}
