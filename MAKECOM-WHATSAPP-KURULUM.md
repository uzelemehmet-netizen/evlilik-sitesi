# Make.com (Integromat) WhatsApp Bildirimi Kurulum Rehberi

## Adım 1: Make.com Hesabı Oluşturma

1. https://www.make.com adresine gidin
2. **"Sign up"** veya **"Get started for free"** butonuna tıklayın
3. Email adresinizle kayıt olun
4. Email doğrulaması yapın
5. Hesabınızı aktifleştirin

**Not:** Ücretsiz plan ayda 1000 operasyon (operations) içerir. Bu çoğu kullanım için yeterlidir.

## Adım 2: Senaryo (Scenario) Oluşturma

1. Make.com ana sayfasında **"Create a new scenario"** butonuna tıklayın
2. Senaryo adını girin: **"Google Forms WhatsApp Bildirimi"**
3. **"Create"** butonuna tıklayın

## Adım 3: Webhook Modülü Ekleme

1. Senaryo editöründe **"+"** butonuna tıklayın
2. Arama kutusuna **"webhooks"** yazın
3. **"Webhooks"** modülünü seçin
4. **"Custom webhook"** → **"Add"** seçin
5. **"Save"** butonuna tıklayın
6. **Webhook URL'ini kopyalayın** (örnek: `https://hook.us1.make.com/xxxxx`)
7. Bu URL'yi not edin, Google Apps Script'te kullanacağız

## Adım 4: Google Apps Script'i Güncelleme

1. Google Sheets'inizi açın (Google Forms'un bağlı olduğu)
2. **"Uzantılar"** → **"Apps Script"** menüsüne gidin
3. `google-forms-whatsapp-webhook.gs` dosyasındaki kodu kopyalayın
4. **WEBHOOK_URL** kısmına Make.com'dan aldığınız webhook URL'ini yapıştırın:
   ```javascript
   const WEBHOOK_URL = 'https://hook.us1.make.com/YOUR_WEBHOOK_ID';
   ```
5. **"Kaydet"** butonuna tıklayın (Ctrl+S)

## Adım 5: Trigger (Tetikleyici) Kurulumu

1. Apps Script editöründe sol menüden **"Triggers"** (saat simgesi) sekmesine gidin
2. **"+ Add Trigger"** butonuna tıklayın
3. Ayarları yapın:
   - **Function:** `onFormSubmit`
   - **Event source:** `From spreadsheet`
   - **Event type:** `On form submit`
4. **"Save"** butonuna tıklayın
5. İzinleri onaylayın (Google hesabınızla giriş yapın ve izin verin)

## Adım 6: Make.com'da WhatsApp Modülü Ekleme

### Seçenek 1: WhatsApp Business API (Meta)

1. Make.com'da webhook modülünden sonra **"+"** butonuna tıklayın
2. **"WhatsApp"** modülünü arayın
3. **"Send a Message"** seçin
4. **"Add"** butonuna tıklayın
5. WhatsApp Business API bağlantınızı yapın:
   - **Connection name:** "WhatsApp Business API"
   - **Access Token:** Meta Developers'dan alacağınız token
   - **Phone Number ID:** Meta'dan alacağınız ID
6. **"Save"** butonuna tıklayın

### Seçenek 2: Twilio WhatsApp (Daha Kolay)

1. Make.com'da webhook modülünden sonra **"+"** butonuna tıklayın
2. **"Twilio"** modülünü arayın
3. **"Send a WhatsApp Message"** seçin
4. **"Add"** butonuna tıklayın
5. Twilio bağlantınızı yapın:
   - **Connection name:** "Twilio WhatsApp"
   - **Account SID:** Twilio Console'dan
   - **Auth Token:** Twilio Console'dan
6. **"Save"** butonuna tıklayın

### Seçenek 3: WhatsApp Web API (En Basit - Ücretsiz)

Eğer WhatsApp Business API veya Twilio hesabınız yoksa, WhatsApp Web API kullanabilirsiniz:

1. Make.com'da **"WhatsApp"** modülünü arayın
2. **"Send a Message via WhatsApp Web"** seçin
3. QR kod ile WhatsApp Web'i bağlayın
4. Mesaj formatını ayarlayın

**Not:** WhatsApp Web API güvenlik açısından daha az tercih edilir, ancak test için kullanılabilir.

## Adım 7: Veri Eşleme (Data Mapping)

1. Webhook modülünde gelen veriyi görmek için **"Run once"** butonuna tıklayın
2. Test verisi gönderin (Google Apps Script'te `testWebhook()` fonksiyonunu çalıştırın)
3. Webhook modülünde gelen veriyi görün
4. WhatsApp modülünde:
   - **To:** `{{1.phone}}` veya direkt numaranız: `+905550343852`
   - **Message:** `{{1.message}}`
5. **"Save"** butonuna tıklayın

## Adım 8: Senaryoyu Aktifleştirme

1. Senaryo editöründe sağ üstteki **"Toggle"** butonuna tıklayın
2. Senaryo aktif hale gelecek (yeşil renk)
3. Artık Google Forms'dan gelen her yanıt WhatsApp'a bildirim gönderecek

## Adım 9: Test Etme

1. Google Forms'unuzu test olarak doldurun
2. Make.com'da **"Runs"** sekmesine gidin
3. Senaryonun çalıştığını kontrol edin
4. WhatsApp'ta bildirimi kontrol edin

## Sorun Giderme

### Webhook çalışmıyor
- Make.com'da webhook modülünün **"Save"** edildiğinden emin olun
- Google Apps Script'te **"Execution log"** kontrol edin
- Webhook URL'inin doğru olduğundan emin olun

### WhatsApp mesajı gelmiyor
- Make.com'da **"Runs"** sekmesinde hataları kontrol edin
- WhatsApp modülünün doğru yapılandırıldığından emin olun
- Telefon numarasının doğru formatta olduğundan emin olun (`+905550343852`)

### Senaryo çalışmıyor
- Senaryonun aktif (toggle açık) olduğundan emin olun
- Google Apps Script trigger'ının aktif olduğundan emin olun
- Make.com'da **"Operations"** limitinizi kontrol edin (ücretsiz plan: 1000/ay)

## Maliyet

- **Make.com Ücretsiz Plan:** Ayda 1000 operasyon
- **WhatsApp Business API:** Ücretsiz (Meta'dan)
- **Twilio:** Mesaj başına ~$0.005 (opsiyonel)
- **Toplam:** Tamamen ücretsiz (Make.com + WhatsApp Business API ile)

## Avantajlar

✅ Tamamen ücretsiz (ayda 1000 operasyon)
✅ Kolay kurulum
✅ Görsel arayüz
✅ Hata ayıklama kolay
✅ Google Apps Script ile entegrasyon
✅ SEO/Google Ads sorunu yok

## Dezavantajlar

⚠️ Ayda 1000 operasyon limiti (ücretsiz plan)
⚠️ WhatsApp Business API kurulumu gerekebilir
⚠️ İnternet bağlantısı gerekli

## Sonraki Adımlar

1. Senaryoyu test edin
2. Google Forms'unuzu gerçek kullanıcılara açın
3. Make.com'da operasyon sayısını takip edin
4. Gerekirse ücretli plana geçin (ayda 10,000 operasyon: ~$9/ay)





