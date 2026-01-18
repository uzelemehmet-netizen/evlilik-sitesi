# Google Forms → WhatsApp Webhook Kurulum Rehberi

## Adım 1: Google Sheets'e Bağlama

1. Google Forms'unuzu açın
2. **"Yanıtlar"** sekmesine tıklayın
3. **Yeşil tablo simgesine** (Google Sheets'e bağla) tıklayın
4. Yeni bir Google Sheets oluşturun veya mevcut birini seçin

## Adım 2: Google Apps Script Kurulumu

1. Oluşturulan Google Sheets'i açın
2. **"Uzantılar"** → **"Apps Script"** menüsüne gidin
3. Yeni bir script dosyası açılacak
4. `google-forms-whatsapp-webhook.gs` dosyasındaki kodu kopyalayıp yapıştırın
5. **WEBHOOK_URL** kısmına Make.com'dan alacağınız webhook URL'ini yapıştırın
6. **WHATSAPP_NUMBER** kısmına WhatsApp numaranızı yazın (905550343852 formatında)
7. **"Kaydet"** butonuna tıklayın (Ctrl+S)
8. **"Deploy"** → **"New deployment"** → **"Select type: Web app"**
9. **Execute as:** Me (your email)
10. **Who has access:** Only myself
11. **"Deploy"** butonuna tıklayın
12. İzinleri onaylayın

## Adım 3: Trigger (Tetikleyici) Kurulumu

1. Apps Script editöründe **"Triggers"** (saat simgesi) sekmesine gidin
2. **"+ Add Trigger"** butonuna tıklayın
3. Ayarlar:
   - **Function:** `onFormSubmit`
   - **Event source:** `From spreadsheet`
   - **Event type:** `On form submit`
4. **"Save"** butonuna tıklayın
5. İzinleri onaylayın

## Adım 4: Make.com Webhook Kurulumu

### Make.com Hesabı Oluşturma

1. https://www.make.com adresine gidin
2. Ücretsiz hesap oluşturun (ayda 1000 operasyon ücretsiz)

### Senaryo Oluşturma

1. **"Create a new scenario"** butonuna tıklayın
2. **"Webhooks"** modülünü arayın ve ekleyin
3. **"Custom webhook"** → **"Add"** seçin
4. **"Save"** butonuna tıklayın
5. **Webhook URL'ini kopyalayın** (örnek: `https://hook.us1.make.com/xxxxx`)
6. Bu URL'yi Google Apps Script'teki **WEBHOOK_URL** kısmına yapıştırın

### WhatsApp Modülü Ekleme

1. Make.com'da **"+"** butonuna tıklayın
2. **"WhatsApp"** modülünü arayın
3. **"Send a Message"** seçin
4. WhatsApp Business API bağlantınızı yapın (Twilio veya resmi WhatsApp Business API)

### Alternatif: WhatsApp için Twilio Kullanma

Eğer WhatsApp Business API'niz yoksa, Twilio kullanabilirsiniz:

1. Make.com'da **"Twilio"** modülünü arayın
2. **"Send an SMS"** veya **"Send a WhatsApp Message"** seçin
3. Twilio hesabınızı bağlayın
4. Mesaj formatını ayarlayın:
   ```
   {{1.message}}
   ```
5. Alıcı numarayı ayarlayın: `{{1.phone}}`

## Adım 5: Test Etme

1. Google Apps Script'te **"testWebhook"** fonksiyonunu çalıştırın
2. Google Forms'unuzu test olarak doldurun
3. WhatsApp'ta bildirimi kontrol edin

## Alternatif: Ücretsiz Webhook Servisleri

### 1. IFTTT (Ücretsiz, sınırlı)
- https://ifttt.com
- Google Sheets → Webhook → WhatsApp (sınırlı)

### 2. Zapier (Ücretsiz plan: 100 task/ay)
- https://zapier.com
- Google Forms → Webhook → WhatsApp

### 3. n8n (Kendi sunucunuzda, tamamen ücretsiz)
- https://n8n.io
- Self-hosted çözüm

## Sorun Giderme

### Webhook çalışmıyor
- Apps Script'te **"View"** → **"Execution log"** kontrol edin
- Make.com'da **"Runs"** sekmesinde hataları kontrol edin

### WhatsApp mesajı gelmiyor
- Make.com'da WhatsApp modülünün doğru yapılandırıldığından emin olun
- Twilio kullanıyorsanız, WhatsApp numaranızın onaylı olduğundan emin olun

### Trigger çalışmıyor
- Apps Script'te trigger'ın aktif olduğundan emin olun
- Form yanıtının Google Sheets'e kaydedildiğini kontrol edin

## Örnek Mesaj Formatı

```
🔔 *Yeni Evlilik Formu Başvurusu*

*Ad Soyad:* Ahmet Yılmaz
*Telefon:* +90 555 123 4567
*E-posta:* ahmet@example.com
*Şehir:* İstanbul
*Planlanan Evlilik Tarihi:* 2024-06-15

📅 15.01.2024 14:30:00
```

## Maliyet

- **Google Apps Script:** Ücretsiz (günlük 20,000 çağrı limiti)
- **Make.com:** Ücretsiz plan (ayda 1000 operasyon)
- **Twilio WhatsApp:** Mesaj başına ~$0.005-0.01
- **Toplam:** Ayda ~100 form için ~$0.50-1.00





