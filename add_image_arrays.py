#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

# Dosyayı oku
with open('src/pages/KesfetDestination.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Pexels URL'lerini sakla (Her destinasyon için farklı olanlar kullan)
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

def create_image_arrays(images_url_list, base_name, index):
    """images array'ı için 5 ayrı array oluştur"""
    
    # Her array seti için URL'leri al
    url_set_1 = get_three_urls_for_set(index * 5)
    url_set_2 = get_three_urls_for_set(index * 5 + 1)
    url_set_3 = get_three_urls_for_set(index * 5 + 2)
    url_set_4 = get_three_urls_for_set(index * 5 + 3)
    url_set_5 = get_three_urls_for_set(index * 5 + 4)
    
    # 5 yeni array'i oluştur
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
    
    return arrays

# "images:" array'ını bul ve indexini kaydet
pattern = r'(        images: \[[\s\S]*?\],)'
matches = list(re.finditer(pattern, content))

print(f"Toplam {len(matches)} images array bulundu.")

# Her images array'ından sonra 5 yeni array ekle (sondan başa doğru)
# Böylece index'ler karışmaz
destination_count = 0
for idx, match in enumerate(reversed(matches)):
    # Ters sırada işle, böylece index değişmez
    real_idx = len(matches) - 1 - idx
    
    # images array'ının sonunu bul
    images_end = match.end()
    
    # 5 yeni array'i oluştur
    new_arrays = create_image_arrays(match.group(1), f"dest-{real_idx}", real_idx)
    
    # Ekle
    content = content[:images_end] + '\n' + new_arrays + content[images_end:]
    destination_count += 1

print(f"{destination_count} destinasyona 5 array set'i eklendi!")

# Dosyayı kaydet
with open('src/pages/KesfetDestination.jsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Dosya başarıyla kaydedildi!")
