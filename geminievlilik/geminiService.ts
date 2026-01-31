
import { GoogleGenAI } from "@google/genai";
import { NIKO_JOKES, CULTURE_TIPS } from "./dataContent";

const ai = new GoogleGenAI({apiKey: process.env.API_KEY});

export async function generateIcebreaker(user1: any, user2: any): Promise<string> {
  // Kotayı korumak ve iptalleri önlemek için %40 ihtimalle direkt yerel soru dön
  if (Math.random() > 0.6) {
    return "Birbirinize en çok neye değer verdiğinizi sormaya ne dersiniz?";
  }
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `GÖREV: İki aday arasında (Biri ${user1.country}'den diğeri ${user2.country}'den) ciddi bir evlilik sohbetini başlatacak eğlenceli ama saygılı bir soru sor. 
      Hobileri: ${user1.bio} ve ${user2.bio}. 
      Türkçe sor. Kısa olsun.`,
      config: {
        temperature: 0.7,
        topP: 0.95,
      }
    });
    return response.text?.trim() || "İlk adımı atmak için güzel bir gün!";
  } catch (e: any) {
    console.error("Icebreaker Hatası (İptal edilmiş olabilir):", e.message);
    return "Birbirinize hayallerinizden bahsetmek ister misiniz?";
  }
}

export async function generateNikoQuip(type: 'JOKE' | 'CULTURE_TIP' | 'CONSOLATION'): Promise<string> {
  // Hata riskini minimize etmek için %80 oranında yerel listeden seç
  if (type === 'JOKE' && Math.random() > 0.2) {
    return NIKO_JOKES[Math.floor(Math.random() * NIKO_JOKES.length)];
  }
  if (type === 'CULTURE_TIP' && Math.random() > 0.2) {
    return CULTURE_TIPS[Math.floor(Math.random() * CULTURE_TIPS.length)];
  }

  try {
    const prompts = {
      JOKE: "Nikahtan platformu için evlilik veya Türkiye-Endonezya ilişkileri hakkında çok kısa, muzur ve komik bir Niko (maskot) esprisi yaz.",
      CULTURE_TIP: "Türkiye ve Endonezya arasındaki ilginç bir kültür farkını evlenecek adaylara tavsiye niteliğinde çok kısa anlat.",
      CONSOLATION: "Eşleşmesi iptal olan birine Niko maskotu ağzıyla kısa, sempatik ve teselli edici bir cümle yaz."
    };

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompts[type],
    });
    return response.text?.trim() || "Niko bugün biraz uykulu, sonra konuşalım mı? 😉";
  } catch (e: any) {
    console.warn("Niko API Hatası (Yerel veriye dönülüyor):", e.message);
    // Hata durumunda (kota dolması, iptal vb.) güvenli yerel listeye dön
    if (type === 'JOKE') return NIKO_JOKES[Math.floor(Math.random() * NIKO_JOKES.length)];
    if (type === 'CULTURE_TIP') return CULTURE_TIPS[Math.floor(Math.random() * CULTURE_TIPS.length)];
    return "Nasip değilmiş, ama Niko her zaman yanında!";
  }
}

export async function translateMessage(text: string, targetLang: 'Turkish' | 'Indonesian'): Promise<string> {
  if (!text.trim()) return '';
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following to ${targetLang}: "${text}". Only return the translation.`,
    });
    const result = response.text?.trim();
    if (!result) throw new Error("Boş çeviri yanıtı");
    return result;
  } catch (error: any) {
    console.error("Çeviri Servisi Hatası:", error.message);
    // Task Canceled durumunda kullanıcıyı bekletmemek için metni olduğu gibi dön
    return text; 
  }
}

export async function detectContactInfo(text: string): Promise<boolean> {
  if (!text.trim() || text.length < 5) return false;
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Does this message contain phone numbers, emails, or social media handles? Answer only YES or NO: "${text}"`,
    });
    return response.text?.trim().toUpperCase().includes('YES');
  } catch (error: any) {
    // API hata verirse, güvenlik için çok katı bir regex kontrolü yapabiliriz (opsiyonel)
    return false;
  }
}
