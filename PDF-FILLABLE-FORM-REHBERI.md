# HTML Formlarını Fillable PDF'e Çevirme Rehberi

## 🎯 En Pratik Yöntem: PDFescape Kullanımı

### Adım 1: HTML'yi PDF'e Çevirin
1. `fillable-pdf-form-template.html` veya `evlilik-form-template.html` dosyasını Chrome/Edge tarayıcısında açın
2. **Ctrl+P** (veya **Cmd+P** Mac'te) tuşlarına basın
3. **Hedef** olarak **"PDF olarak kaydet"** seçin
4. **Ayarlar** bölümünde:
   - Kenar boşlukları: **Yok**
   - Ölçek: **%100**
   - Arka plan grafikleri: **Açık** (işaretli)
5. **Kaydet** butonuna tıklayın
6. Dosyayı masaüstüne kaydedin (örn: `seyahat-formu.pdf`)

### Adım 2: PDFescape ile Fillable Form Yapın

#### 2.1. PDFescape'e Giriş
1. https://www.pdfescape.com adresine gidin
2. **"Start Filling"** butonuna tıklayın
3. **"Upload PDF to Fill"** seçeneğini seçin
4. Oluşturduğunuz PDF dosyasını yükleyin

#### 2.2. Form Alanlarını Ekleyin
1. Üst menüden **"Form Fields"** sekmesine tıklayın
2. Her form alanı için uygun alan tipini seçin:

   **Text Field (Metin Alanı):**
   - Ad, Soyad, E-posta, Telefon gibi alanlar için
   - İlgili yere tıklayın → **"Text Field"** seçin
   - Alan adını girin (örn: "firstName")
   - Gerekli alanları işaretleyin

   **Checkbox (Onay Kutusu):**
   - Çoklu seçim alanları için (Ada seçimi, İlgi alanları vb.)
   - İlgili yere tıklayın → **"Checkbox"** seçin
   - Her checkbox için aynı grup adını kullanın

   **Radio Button (Radyo Butonu):**
   - Tek seçim alanları için (Seyahat türü, Medeni hal vb.)
   - İlgili yere tıklayın → **"Radio Button"** seçin
   - Aynı grup için aynı grup adını kullanın

   **Dropdown (Açılır Liste):**
   - Select/Seçim alanları için (Süre, Yolcu sayısı vb.)
   - İlgili yere tıklayın → **"Dropdown"** seçin
   - Seçenekleri ekleyin

   **Textarea (Çok Satırlı Metin):**
   - Özel istekler, Ek bilgiler gibi alanlar için
   - İlgili yere tıklayın → **"Textarea"** seçin

#### 2.3. Alanları Düzenleyin
- Her alanı tıklayarak boyutunu ayarlayın
- Gerekli alanları işaretleyin (Required)
- Alan adlarını anlamlı şekilde adlandırın

#### 2.4. Kaydedin
1. **"Save & Download PDF"** butonuna tıklayın
2. Fillable PDF dosyanız indirilecek
3. Bu dosyayı WhatsApp üzerinden müşterilerinize gönderebilirsiniz

---

## 🔄 Alternatif Yöntem: Sejda PDF Editor

### Adımlar:
1. https://www.sejda.com/pdf-editor adresine gidin
2. PDF dosyanızı yükleyin
3. **"Form"** sekmesine tıklayın
4. Form alanlarını ekleyin (Text, Checkbox, Radio, Dropdown)
5. **"Download"** ile indirin

---

## 📱 Müşteri Kullanımı

### Müşteriler PDF'i Nasıl Doldurur?
1. PDF dosyasını açarlar (Adobe Reader, Chrome, Edge vb.)
2. Form alanlarına tıklayarak bilgileri girerler
3. Checkbox ve Radio button'ları işaretlerler
4. Doldurduktan sonra:
   - **Dosya → Farklı Kaydet** ile kaydederler
   - Veya **Ctrl+S** ile kaydederler
5. Kaydedilmiş PDF'i WhatsApp üzerinden size geri gönderirler

---

## ⚠️ Önemli Notlar

1. **Adobe Reader Kullanımı:**
   - Müşterilerin Adobe Reader kullanması önerilir (en iyi uyumluluk)
   - Ücretsiz: https://get.adobe.com/reader/

2. **Mobil Uyumluluk:**
   - Mobil cihazlarda PDF doldurma sınırlı olabilir
   - Müşterilere masaüstü bilgisayar kullanmalarını önerebilirsiniz

3. **Form Validasyonu:**
   - PDFescape'de "Required" işaretleyerek zorunlu alanlar belirleyebilirsiniz
   - Ancak karmaşık validasyonlar (e-posta formatı vb.) için HTML form daha uygun olabilir

4. **Güvenlik:**
   - PDF'leri şifreleyebilirsiniz (PDFescape'de "Protect" özelliği)
   - Hassas bilgiler için şifreleme önerilir

---

## 🎨 İpuçları

- **Alan Boyutları:** Form alanlarını metinle tam hizalayın
- **Font Uyumu:** PDF'deki font ile form alanı fontunu eşleştirin
- **Renkler:** Form alanlarını görünür yapmak için border ekleyin
- **Test Edin:** PDF'i kendiniz doldurup test edin

---

## 📞 Sorun Giderme

**Problem:** Form alanları görünmüyor
- **Çözüm:** PDF'i Adobe Reader'da açın, Chrome'da bazı form alanları görünmeyebilir

**Problem:** Checkbox/Radio button çalışmıyor
- **Çözüm:** Aynı grup için aynı grup adını kullandığınızdan emin olun

**Problem:** PDF çok büyük
- **Çözüm:** PDFescape'de "Optimize" seçeneğini kullanın

---

## ✅ Kontrol Listesi

- [ ] HTML formu tarayıcıda açıldı
- [ ] PDF olarak kaydedildi
- [ ] PDFescape'e yüklendi
- [ ] Tüm form alanları eklendi
- [ ] Zorunlu alanlar işaretlendi
- [ ] Form test edildi
- [ ] Fillable PDF indirildi
- [ ] WhatsApp'ta test gönderimi yapıldı

---

**Hazırlayan:** AI Assistant  
**Tarih:** 2024  
**Versiyon:** 1.0





