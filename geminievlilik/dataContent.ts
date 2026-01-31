
export const NIKO_JOKES = [
  "Evlilik aşkı öldürür derler ama bizim platformda aşkı sadece ciddiyet yaşatır! 😉",
  "Niko dedi ki: Endonezya'dan gelin/damat gelirse düğünde pilavlar benden! 🍚",
  "Aşkın dili birdir ama pasaportu iki tanedir. Hadi yine iyisin! ❤️",
  "Düğün takılarını kimde saklayacağınızı şimdiden düşünmeyin, önce bir selam verin! 😂",
  "Endonezya'da acı biber yemek, Türkiye'de sabah trafiğine girmek gibidir... Sabır ister! 🔥",
  "Niko bugün çok formda, sanki biri Mavi Rozet alacak gibi hissediyorum... 🎉",
  "Kısmetin seni bulması için önce senin profili güncellemen lazım dostum! 📱",
  "Aşk sınır tanımaz ama vizeler tanır. Hazırlıklı ol! ✈️",
  "Niko der ki: Kahveni sade, aşkını ciddi tut! ☕",
  "Endonezce 'Seni seviyorum' demek kolay, asıl 'Düğün ne zaman?' sorusuna cevap ver! 😂"
  // ... Bu liste 100'e kadar uzatılabilir
];

export const CULTURE_TIPS = [
  "Endonezya'da birinin evine girerken mutlaka ayakkabılarınızı kapının dışında bırakın. 💡",
  "Türkiye'de büyüklerin elini öpmek büyük saygıdır, Endonezya'da ise 'Sungkeman' benzeri bir gelenek vardır. 🤝",
  "Endonezya'da yemekler genellikle çok acıdır (Sambal). İlk buluşmada mideye dikkat! 🔥",
  "Türkiye'de kahvaltı bir şölendir, Endonezya'da ise sabahları genellikle Nasi Goreng (kızarmış pilav) yenir. 🍳",
  "Endonezyalılar çok naziktir, doğrudan 'Hayır' demek yerine 'Belki' diyebilirler. Kodları iyi oku! 😉",
  "Türkiye'de akşam çayı bir klasiktir, Endonezya'da ise taze meyve suları ve hindistan cevizi suyu meşhurdur. 🥥",
  "İki kültürde de aile her şeydir. Aile onayını almak evliliğin %50'sidir. 👨‍👩‍👧‍👦",
  "Endonezya'da sol elle birine bir şey uzatmak kaba kabul edilir, her zaman sağ elinizi kullanın! 💡"
  // ... Bu liste 100'e kadar uzatılabilir
];

export interface ReadyQuestion {
  tr: string;
  id: string;
  category: string;
}

export const COMMON_QUESTIONS: ReadyQuestion[] = [
  { tr: "En sevdiğin yemek hangisidir?", id: "Apa makanan favoritmu?", category: "Hobi" },
  { tr: "Evlendikten sonra nerede yaşamayı hayal ediyorsun?", id: "Setelah menikah, kamu ingin tinggal di mana?", category: "Gelecek" },
  { tr: "Ailen bu evliliğe nasıl bakar?", id: "Bagaimana tanggapan keluargamu tentang pernikahan ini?", category: "Aile" },
  { tr: "Boş zamanlarında neler yapmaktan hoşlanırsın?", id: "Apa yang suka kamu lakukan di waktu luang?", category: "Hobi" },
  { tr: "Dini inançların hayatında ne kadar yer kaplar?", id: "Seberapa penting keyakinan agama dalam hidupmu?", category: "İnanç" },
  { tr: "Kaç çocuk sahibi olmak istersin?", id: "Berapa banyak anak yang ingin kamu miliki?", category: "Gelecek" },
  { tr: "Türkiye'ye/Endonezya'ya taşınmak senin için zor olur mu?", id: "Apakah akan sulit bagimu untuk pindah ke Turki/Indonesia?", category: "Lojistik" },
  { tr: "En büyük hayalin nedir?", id: "Apa impian terbesar mu?", category: "Karakter" }
  // ... Bu liste 100'e kadar uzatılabilir
];
