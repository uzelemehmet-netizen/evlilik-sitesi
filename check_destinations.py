#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

with open('src/pages/KesfetDestination.jsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Destinasyon isimlerini bul
# Her destinasyon objesinin içinde island: "X" ve name: "Y" var
pattern = r'(\w+): \{[\s\S]*?name: "([^"]+)",[\s\S]*?island: "([^"]+)"'
matches = re.findall(pattern, content)

# Daha basit yöntemi dene - images array'ından sonraki gezilecekYerler'i ara
pattern2 = r'images: \[[\s\S]*?\],\s*gezilecekYerler: \[[\s\S]*?\n\s*name: "([^"]+)"'
matches2 = re.findall(pattern2, content)

print(f'Pattern 1: {len(matches)} eşleşme')
print(f'Pattern 2: {len(matches2)} eşleşme\n')

# Tüm image array'lerinin sayısı
images_count = len(re.findall(r'images: \[', content))
gezilecek_count = len(re.findall(r'gezilecekImages: \[', content))

print(f'images: array sayısı: {images_count}')
print(f'gezilecekImages: array sayısı: {gezilecek_count}')

# Ubud'u ekle (orijinal olarak vardı)
print(f'\nToplam destinasyonlar: {images_count}')
print(f'Tamamlanan (5 array set'i olan): {gezilecek_count}')
