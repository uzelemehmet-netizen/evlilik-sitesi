# Twilio WhatsApp API Kurulum Rehberi

## Adım 1: Twilio Hesabı Oluşturma

1. https://www.twilio.com adresine gidin
2. **"Sign up"** ile ücretsiz hesap oluşturun
3. Telefon numaranızı doğrulayın
4. Hesabınızı aktifleştirin

## Adım 2: WhatsApp Sandbox'a Katılma

1. Twilio Console'da **"Messaging"** → **"Try it out"** → **"Send a WhatsApp message"** seçin
2. **"Join Sandbox"** butonuna tıklayın
3. WhatsApp numaranızdan belirtilen kodu gönderin (örnek: "join <code>")
4. Sandbox'a katıldığınızı onaylayın

## Adım 3: WhatsApp Business API'yi Etkinleştirme

1. **"Messaging"** → **"Senders"** → **"WhatsApp Senders"** seçin
2. **"Request WhatsApp Sender"** butonuna tıklayın
3. WhatsApp Business hesabınızı bağlayın
4. Meta Business hesabınızı seçin
5. Onay sürecini tamamlayın (1-2 gün sürebilir)

## Adım 4: Google Apps Script ile Entegrasyon

Twilio WhatsApp API'yi kullanarak Google Forms'dan direkt WhatsApp bildirimi gönderebilirsiniz.

### Gerekli Bilgiler:
- **Account SID:** Twilio Console → Account → Account SID
- **Auth Token:** Twilio Console → Account → Auth Token
- **WhatsApp From Number:** `whatsapp:+14155238886` (Sandbox) veya onaylı numaranız

### Google Apps Script Kodu:

```javascript
// Twilio WhatsApp API ile bildirim gönderme
const TWILIO_ACCOUNT_SID = 'YOUR_ACCOUNT_SID';
const TWILIO_AUTH_TOKEN = 'YOUR_AUTH_TOKEN';
const TWILIO_WHATSAPP_FROM = 'whatsapp:+14155238886'; // Sandbox numarası
const WHATSAPP_TO = 'whatsapp:+905550343852'; // Sizin numaranız

function sendWhatsAppMessage(message) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  
  const payload = {
    'From': TWILIO_WHATSAPP_FROM,
    'To': WHATSAPP_TO,
    'Body': message
  };
  
  const options = {
    'method': 'post',
    'headers': {
      'Authorization': 'Basic ' + Utilities.base64Encode(TWILIO_ACCOUNT_SID + ':' + TWILIO_AUTH_TOKEN)
    },
    'payload': payload
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    Logger.log('WhatsApp mesajı gönderildi: ' + response.getContentText());
    return JSON.parse(response.getContentText());
  } catch (error) {
    Logger.log('Hata: ' + error.toString());
    return null;
  }
}

// Form yanıtı geldiğinde çalışacak fonksiyon
function onFormSubmit(e) {
  const sheet = e.source.getActiveSheet();
  const lastRow = sheet.getLastRow();
  const data = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  
  const formData = {};
  headers.forEach((header, index) => {
    formData[header] = data[index];
  });
  
  const message = createWhatsAppMessage(formData);
  sendWhatsAppMessage(message);
}

function createWhatsAppMessage(formData) {
  let message = '🔔 *Yeni Evlilik Formu Başvurusu*\n\n';
  
  for (const [key, value] of Object.entries(formData)) {
    if (value && key !== 'Zaman Damgası') {
      message += `*${key}:* ${value}\n`;
    }
  }
  
  message += `\n📅 ${new Date().toLocaleString('tr-TR')}`;
  return message;
}
```

## Maliyet

- **Sandbox:** Ücretsiz (sadece onaylı numaralara gönderebilirsiniz)
- **Production:** Mesaj başına ~$0.005-0.01
- **Aylık 100 form:** ~$0.50-1.00

## Avantajlar

✅ Kolay kurulum
✅ Hızlı onay (Sandbox anında çalışır)
✅ Güvenilir servis
✅ Detaylı loglar
✅ Webhook gerekmez (direkt API)





