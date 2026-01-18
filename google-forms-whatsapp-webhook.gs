// Google Forms → Google Sheets → WhatsApp Webhook
// Bu script, Google Sheets'e yeni bir form yanıtı geldiğinde çalışır

// Webhook URL'inizi buraya yapıştırın (Make.com, Zapier, veya kendi webhook servisiniz)
const WEBHOOK_URL = 'https://hook.eu1.make.com/judks4fyimbtlmoesxwwrdyvs6wlsmdl';

// WhatsApp numaranız (uluslararası format: 905550343852)
const WHATSAPP_NUMBER = '905550343852';

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
    
    // Webhook'a gönder
    sendToWebhook(message, formData);
    
  } catch (error) {
    Logger.log('Hata: ' + error.toString());
  }
}

// WhatsApp mesajı oluştur
function createWhatsAppMessage(formData) {
  let message = '🔔 *Yeni Evlilik Formu Başvurusu*\n\n';
  
  // Form alanlarını mesaja ekle
  for (const [key, value] of Object.entries(formData)) {
    if (value && key !== 'Zaman Damgası') {
      message += `*${key}:* ${value}\n`;
    }
  }
  
  message += `\n📅 ${new Date().toLocaleString('tr-TR')}`;
  
  return message;
}

// Webhook'a veri gönder
function sendToWebhook(message, formData) {
  const payload = {
    message: message,
    phone: WHATSAPP_NUMBER,
    formData: formData,
    timestamp: new Date().toISOString()
  };
  
  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    const response = UrlFetchApp.fetch(WEBHOOK_URL, options);
    Logger.log('Webhook yanıtı: ' + response.getContentText());
  } catch (error) {
    Logger.log('Webhook hatası: ' + error.toString());
  }
}

// Manuel test için
function testWebhook() {
  const testData = {
    'Ad Soyad': 'Test Kullanıcı',
    'Telefon': '+90 555 123 4567',
    'E-posta': 'test@example.com',
    'Şehir': 'İstanbul',
    'Zaman Damgası': new Date().toLocaleString('tr-TR')
  };
  
  const message = createWhatsAppMessage(testData);
  sendToWebhook(message, testData);
}

