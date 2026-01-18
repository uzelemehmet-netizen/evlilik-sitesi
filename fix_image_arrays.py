#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

# Dosyayı oku
with open('src/pages/KesfetDestination.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pexels URL'lerini sakla
pexels_urls = [
    "https://images.pexels.com/photos/1450353/pexels-photo-1450353.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/1320686/pexels-photo-1320686.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/2166711/pexels-photo-2166711.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/2166553/pexels-photo-2166553.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/2474690/pexels-photo-2474690.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/3601453/pexels-photo-3601453.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/2723041/pexels-photo-2723041.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/1319459/pexels-photo-1319459.jpeg?auto=compress&cs=tinysrgb&w=800",
]

def get_three_urls_for_set(index):
    """Her array seti için 3 farklı URL döndür"""
    base = (index % len(pexels_urls))
    urls = [
        pexels_urls[base % len(pexels_urls)],
        pexels_urls[(base + 1) % len(pexels_urls)],
        pexels_urls[(base + 2) % len(pexels_urls)],
    ]
    return urls

# "images:" array'ını bul (getImageUrl'ile normal images arrays)
pattern = r'(        images: \[[\s\S]*?\],)'
matches = list(re.finditer(pattern, content))

print(f"Toplam {len(matches)} images array bulundu.")

# Her images array'ını kontrol et - eğer hemen sonrasında gezilecekImages yoksa ekle
added_count = 0
for idx, match in enumerate(reversed(matches)):
    # Ters sırada işle
    real_idx = len(matches) - 1 - idx
    
    # images array'ının sonunu bul
    images_end = match.end()
    
    # Sonrasındaki metni kontrol et
    next_content = content[images_end:images_end + 100]
    
    # Eğer gezilecekImages yoksa (yani 5 array set'i yoksa)
    if 'gezilecekImages:' not in next_content:
        # 5 yeni array'i oluştur
        url_set_1 = get_three_urls_for_set(real_idx * 5)
        url_set_2 = get_three_urls_for_set(real_idx * 5 + 1)
        url_set_3 = get_three_urls_for_set(real_idx * 5 + 2)
        url_set_4 = get_three_urls_for_set(real_idx * 5 + 3)
        url_set_5 = get_three_urls_for_set(real_idx * 5 + 4)
        
        arrays = f"""        gezilecekImages: [
          "{url_set_1[0]}",
          "{url_set_1[1]}",
          "{url_set_1[2]}",
        ],
        aktivitelerImages: [
          "{url_set_2[0]}",
          "{url_set_2[1]}",
          "{url_set_2[2]}",
        ],
        yiyecekImages: [
          "{url_set_3[0]}",
          "{url_set_3[1]}",
          "{url_set_3[2]}",
        ],
        konaklamaImages: [
          "{url_set_4[0]}",
          "{url_set_4[1]}",
          "{url_set_4[2]}",
        ],
        alisverisImages: [
          "{url_set_5[0]}",
          "{url_set_5[1]}",
          "{url_set_5[2]}",
        ],"""
        
        # Ekle
        content = content[:images_end] + '\n' + arrays + content[images_end:]
        added_count += 1
        print(f"Array Set #{added_count} eklendi (destinasyon {real_idx})")
    else:
        print(f"Array Set #{len(matches) - real_idx} atlandı - zaten var (destinasyon {real_idx})")

print(f"\nToplam {added_count} destinasyona 5 array set'i eklendi!")

# Dosyayı kaydet
with open('src/pages/KesfetDestination.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Dosya başarıyla kaydedildi!")
