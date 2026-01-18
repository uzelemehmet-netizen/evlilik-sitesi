// Google Forms → Google Sheets → Twilio WhatsApp API
// Bu script, Google Sheets'e yeni bir form yanıtı geldiğinde çalışır

// Twilio Bilgileri (Twilio Console'dan alın)
const TWILIO_ACCOUNT_SID = 'YOUR_ACCOUNT_SID_BURAYA';
const TWILIO_AUTH_TOKEN = 'YOUR_AUTH_TOKEN_BURAYA';
const TWILIO_WHATSAPP_FROM = 'whatsapp:+14155238886'; // Sandbox için, sonra kendi numaranızı kullanın
const WHATSAPP_TO = 'whatsapp:+905550343852'; // Bildirim almak istediğiniz numara

// Form yanıtı geldiğinde çalışacak fonksiyon
function onFormSubmit(e) {
  try {
    // Form verilerini al
    const sheet = e.source.getActiveSheet();
    const lastRow = sheet.getLastRow();
    const data = sheet.getRange(lastRow, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Sütun başlıklarını al
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    
    // Verileri obje haline getir
    const formData = {};
    headers.forEach((header, index) => {
      formData[header] = data[index];
    });
    
    // WhatsApp mesajı oluştur
    const message = createWhatsAppMessage(formData);
    
    // Twilio WhatsApp API ile gönder
    sendWhatsAppMessage(message);
    
  } catch (error) {
    Logger.log('Hata: ' + error.toString());
    // Hata durumunda email gönderebilirsiniz
    MailApp.sendEmail({
      to: 'your-email@example.com',
      subject: 'Form Bildirimi Hatası',
      body: 'Form yanıtı alındı ancak WhatsApp bildirimi gönderilemedi: ' + error.toString()
    });
  }
}

// WhatsApp mesajı oluştur
function createWhatsAppMessage(formData) {
  let message = '🔔 *Yeni Evlilik Formu Başvurusu*\n\n';
  
  // Form alanlarını mesaja ekle
  for (const [key, value] of Object.entries(formData)) {
    if (value && key !== 'Zaman Damgası' && key !== 'Timestamp') {
      message += `*${key}:* ${value}\n`;
    }
  }
  
  message += `\n📅 ${new Date().toLocaleString('tr-TR')}`;
  
  return message;
}

// Twilio WhatsApp API ile mesaj gönder
function sendWhatsAppMessage(message) {
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  
  const payload = {
    'From': TWILIO_WHATSAPP_FROM,
    'To': WHATSAPP_TO,
    'Body': message
  };
  
  // Basic Authentication için header oluştur
  const authString = TWILIO_ACCOUNT_SID + ':' + TWILIO_AUTH_TOKEN;
  const encodedAuth = Utilities.base64Encode(authString);
  
  const options = {
    'method': 'post',
    'headers': {
      'Authorization': 'Basic ' + encodedAuth
    },
    'payload': payload,
    'muteHttpExceptions': true
  };
  
  try {
    const response = UrlFetchApp.fetch(url, options);
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    if (responseCode === 200 || responseCode === 201) {
      Logger.log('WhatsApp mesajı başarıyla gönderildi: ' + responseText);
      return JSON.parse(responseText);
    } else {
      Logger.log('WhatsApp mesajı gönderilemedi. Hata kodu: ' + responseCode);
      Logger.log('Yanıt: ' + responseText);
      throw new Error('Twilio API hatası: ' + responseCode);
    }
  } catch (error) {
    Logger.log('WhatsApp mesajı gönderme hatası: ' + error.toString());
    throw error;
  }
}

// Manuel test için
function testWhatsApp() {
  const testData = {
    'Ad Soyad': 'Test Kullanıcı',
    'Telefon': '+90 555 123 4567',
    'E-posta': 'test@example.com',
    'Şehir': 'İstanbul',
    'Planlanan Evlilik Tarihi': '2024-06-15',
    'Zaman Damgası': new Date().toLocaleString('tr-TR')
  };
  
  const message = createWhatsAppMessage(testData);
  sendWhatsAppMessage(message);
}





