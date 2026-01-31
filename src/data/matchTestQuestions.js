// Extracted from geminievlilik demo so we can run the same "match test" inside
// the main app during an active match chat.

export const GENDER_SPECIFIC_QUESTIONS = [
  // --- KADININ ERKEĞE SORDUĞU SORULAR (20) ---
  { id: 1, askedBy: 'FEMALE', text: 'Mutfakta yemek tercihin ne olur?', options: ['Kendi ülkemin yemeği', 'Karışık mutfak', 'Eşim ne yaparsa', 'Yeni tatlara alışırım'] },
  { id: 2, askedBy: 'FEMALE', text: 'Yıllık uçak bileti bütçesini nasıl planlarız?', options: ['Özel fon ayırırım', 'İmkan buldukça', 'Birkaç yılda bir', 'Aileleri getiririz'] },
  { id: 3, askedBy: 'FEMALE', text: 'Endonezya sıcağına veya Türk kışına hazır mısın?', options: ['Aşk için alışırım', 'Çok zorlanırım', 'Sadece klimalı ortam', 'Taşınmak istemem'] },
  { id: 4, askedBy: 'FEMALE', text: 'Dil engelini nasıl aşacağız?', options: ['Akıcı öğreneceğim', 'İngilizce yeterli', 'Çeviri uygulaması', 'Eşim öğrenmeli'] },
  { id: 5, askedBy: 'FEMALE', text: 'Ailelerimizin iletişimi nasıl olmalı?', options: ['Tercüman olurum', 'Temel kelimeler', 'Az iletişim', 'Teknoloji yardımı'] },
  { id: 6, askedBy: 'FEMALE', text: 'Evlilik sonrası nerede yaşamayı hayal ediyorsun?', options: ["Türkiye'de", "Endonezya'da", 'Üçüncü bir ülkede', 'İki ülkede dönüşümlü'] },
  { id: 7, askedBy: 'FEMALE', text: 'Resmi nikah ve düğün töreni tercihin?', options: ['İki ülkede de tören', 'Sadece resmi nikah', 'Sade bir aile yemeği', 'Sadece kendi ülkemde'] },
  { id: 8, askedBy: 'FEMALE', text: 'Eşinin ailesine maddi destek göndermesine ne dersin?', options: ['Makul miktarda evet', 'Sadece acil durumda', 'Hayır, kendi evimiz', 'Tamamen desteklerim'] },
  { id: 9, askedBy: 'FEMALE', text: "Endonezya'daki baharatlı yemeklere ne kadar hazırsın?", options: ['Hepsini denerim', 'Zamanla alışırım', 'Sadece bildiğim tadlar', 'Asla yiyemem'] },
  { id: 10, askedBy: 'FEMALE', text: 'Yalnız kalmak istediğinde eşine nasıl ifade edersin?', options: ['Açıkça söylerim', 'İçime kapanırım', 'Bahane bulurum', 'Yalnız kalmam'] },
  { id: 11, askedBy: 'FEMALE', text: "Türkiye'deki kahvaltı kültürüne uyum sağlar mısın?", options: ['Bayılırım!', 'Çok ağır gelir', 'Sadece hafta sonu', 'Alışmam zaman alır'] },
  { id: 12, askedBy: 'FEMALE', text: 'Çocuklarımızın hangi dili ana dili olarak konuşmasını istersin?', options: ['Her iki dili de', 'Sadece Türkçe', 'Sadece Endonezce', 'Sadece İngilizce'] },
  { id: 13, askedBy: 'FEMALE', text: 'Dini bayramları nerede geçirmek istersin?', options: ['Dönüşümlü iki ülkede', "Sadece Türkiye'de", "Sadece Endonezya'da", 'Çekirdek ailemizle'] },
  { id: 14, askedBy: 'FEMALE', text: 'Eşinin kariyer yapmasına destek olur musun?', options: ['Tam desteklerim', 'Evi aksatmazsa evet', 'Çalışmasını istemem', 'Sadece kendi işimizde'] },
  { id: 15, askedBy: 'FEMALE', text: 'Ev işlerinde iş bölümü nasıldır?', options: ['Eşit paylaşım', 'Sadece ağır işler', 'Ben yapmam', 'Yardımcı tutarız'] },
  { id: 16, askedBy: 'FEMALE', text: 'Tartışma anında tavrın ne olur?', options: ['Sakinleşip konuşurum', 'Sesimi yükseltirim', 'Odayı terk ederim', 'Hemen özür dilerim'] },
  { id: 17, askedBy: 'FEMALE', text: 'Görüntülü aile görüşmeleri ne sıklıkla olmalı?', options: ['Her gün', 'Haftada bir', 'Sadece bayramlarda', 'İhtiyaç duyuldukça'] },
  { id: 18, askedBy: 'FEMALE', text: 'Eşinin arkadaşlarıyla dışarı çıkmasına ne dersin?', options: ['Güvenim tamdır', 'Benden izin almalı', 'Sadece kadınlarla', 'İstemem'] },
  { id: 19, askedBy: 'FEMALE', text: 'Sosyal medyada aile paylaşımı yapar mısın?', options: ['Sık sık', 'Özel günlerde', 'Asla paylaşmam', 'Eşim isterse'] },
  { id: 20, askedBy: 'FEMALE', text: 'Emeklilik planın neresi?', options: ['Sakin bir köy', 'Kendi ülkem', 'Eşimin ülkesi', 'Sürekli gezerek'] },

  // --- ERKEĞİN KADINA SORDUĞU SORULAR (20) ---
  { id: 21, askedBy: 'MALE', text: 'Uzaklık nedeniyle özlemle nasıl başa çıkarsın?', options: ['Görüntülü konuşarak', 'Yıllık ziyaretle', 'Zamanla alışırım', 'Beni çok zorlar'] },
  { id: 22, askedBy: 'MALE', text: 'Evde hangi dili konuşalım?', options: ['Karma (Tur-Indo)', 'Sadece Türkçe', 'Sadece Endonezce', 'Sadece İngilizce'] },
  { id: 23, askedBy: 'MALE', text: 'Bütçe tek kişide mi, ortak mı olmalı?', options: ['Ortak havuz', 'Herkes kendi parasını', 'Eşim yönetmeli', 'Ben yönetmelim'] },
  { id: 24, askedBy: 'MALE', text: 'Yeni kültüre alışmak seni korkutuyor mu?', options: ['Heyecan veriyor', 'Biraz endişeliyim', 'Zorlanacağımı biliyorum', 'Korkmuyorum'] },
  { id: 25, askedBy: 'MALE', text: 'Misafir ağırlama kültürün nasıldır?', options: ['Kapım hep açıktır', 'Haberli gelmeli', 'Pek sevmem', 'Sadece ailem'] },
  { id: 26, askedBy: 'MALE', text: 'Eşin iş seyahatlerine çıkarsa ne hissedersin?', options: ['Gurur duyarım', 'Biraz kıskanırım', 'Gitmesini istemem', 'Ben de giderim'] },
  { id: 27, askedBy: 'MALE', text: 'Hangi iklimde çocuk büyütmek istersin?', options: ['Ilıman iklim', 'Tropikal sıcak', 'Dört mevsim', 'Fark etmez'] },
  { id: 28, askedBy: 'MALE', text: 'Eşinin hobilerine vakit ayırmasına ne dersin?', options: ['Teşvik ederim', 'Abartmamalı', 'Evle ilgilenmeli', 'Benimle yapmalı'] },
  { id: 29, askedBy: 'MALE', text: 'Bayram harçlığı ve gelenekler ne kadar önemli?', options: ['Çok önemli', 'Sembolik olmalı', 'Önemsiz', 'Yeni gelenek kurarız'] },
  { id: 30, askedBy: 'MALE', text: 'Eşinin giyim tarzına müdahale eder misin?', options: ['Asla', 'Fikrimi söylerim', 'Bazı sınırlarım var', 'Ben karar veririm'] },
  { id: 31, askedBy: 'MALE', text: 'Evde hayvan beslemek ister misin?', options: ['Evet, kedi/köpek', 'Sadece bahçede', 'Hayır, istemem', 'Eşim çok isterse'] },
  { id: 32, askedBy: 'MALE', text: 'Hafta sonu aktivite tercihin?', options: ['Doğa yürüyüşü', 'Evde film', 'Alışveriş merkezi', 'Akraba ziyareti'] },
  { id: 33, askedBy: 'MALE', text: 'Eşin mutfakta başarısız olursa tavrın ne olur?', options: ['Beraber öğreniriz', 'Dışarıdan yeriz', 'Ben yaparım', 'Onu uyarırım'] },
  { id: 34, askedBy: 'MALE', text: 'İnternet ve telefon kullanım sınırın var mı?', options: ['Sınırsız özgürlük', 'Yemekte yasak', 'Gece kapalı olmalı', 'Takip ederim'] },
  { id: 35, askedBy: 'MALE', text: 'Düğün takıları kimde kalmalı?', options: ['Ortak geleceğimiz için', 'Kadında kalmalı', 'Düğün borçlarına', 'Ailelere verilmeli'] },
  { id: 36, askedBy: 'MALE', text: 'Eşinle ortak hobin olması şart mı?', options: ['Şarttır', 'Olsa iyi olur', 'Gerek yok', 'Farklılık iyidir'] },
  { id: 37, askedBy: 'MALE', text: 'Yalanın küçüğü büyüğü olur mu?', options: ['Asla, hep dürüstlük', 'Beyaz yalan olabilir', 'Duruma göre değişir', 'Gizlilik haktır'] },
  { id: 38, askedBy: 'MALE', text: "Eşinin eski arkadaşlarıyla görüşmesi?", options: ['Sorun değil', 'Sadece kadınlarla', 'Görüşmesini istemem', 'Tanıyorsam evet'] },
  { id: 39, askedBy: 'MALE', text: 'Tasarruf mu, anı yaşamak mı?', options: ['Gelecek için birikim', 'Bugünün tadını çıkar', 'Yarısını biriktir', 'Borçlanmadan yaşa'] },
  { id: 40, askedBy: 'MALE', text: "Eşinin sana 'hayır' demesine tepkin?", options: ['Saygı duyarım', 'Nedenini sorgularım', 'Israr ederim', 'Küserim'] },
];

export function normalizeGender(v) {
  const s = String(v || '').trim().toLowerCase();
  if (!s) return '';
  if (s === 'female' || s === 'f' || s === 'kadin' || s === 'kadın') return 'FEMALE';
  if (s === 'male' || s === 'm' || s === 'erkek') return 'MALE';
  return '';
}

export function getMatchTestQuestionsForAskerGender(gender) {
  const asker = normalizeGender(gender);
  if (!asker) return GENDER_SPECIFIC_QUESTIONS;
  return GENDER_SPECIFIC_QUESTIONS.filter((q) => q && q.askedBy === asker);
}
