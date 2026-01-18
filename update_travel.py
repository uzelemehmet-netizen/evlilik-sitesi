#!/usr/bin/env python3

file_path = 'src/pages/Travel.jsx'

with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
    content = f.read()

# Ekonomik paket tam değiştir
ekonomik_old = '''<div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-green-600" style={{ fontFamily: '"Poppins", sans-serif' }}>Ekonomik Paket</h3>
              <p className="text-gray-600 mb-6">5 Gece 6 Gün</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>3 yıldızlı apart otel</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>1 Lokasyon</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>3 öğün yemek</span>
                </li>
              </ul>
            </div>'''

ekonomik_new = '''<div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-green-600" style={{ fontFamily: '"Poppins", sans-serif' }}>Ekonomik Paket</h3>
              <p className="text-gray-600 mb-2 text-lg font-semibold">5 Gece 6 Gün</p>
              <p className="text-gray-500 text-sm mb-4">1 Lokasyon</p>
              <ul className="space-y-3 text-gray-700 mb-4">
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>3 yıldızlı apart otel</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>Özel araç transferi</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>Günde 3 öğün yemek</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>Günlük rehberli turlar</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-green-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>Çeşitli aktiviteler</span>
                </li>
              </ul>
              <p className="text-sm text-green-700 font-semibold mt-6 pt-4 border-t border-green-100">İdeal başlangıç paketi</p>
            </div>'''

content = content.replace(ekonomik_old, ekonomik_new)

# Standart paket tam değiştir
standart_old = '''<div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-xl shadow-2xl border-2 border-blue-400">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                Popüler
              </div>
              <h3 className="text-2xl font-bold mb-4 text-blue-600" style={{ fontFamily: '"Poppins", sans-serif' }}>Standart Paket</h3>
              <p className="text-gray-600 mb-6">9 Gece 10 Gün</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-blue-600 flex-shrink-0" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>4 yıldızlı otel</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-blue-600 flex-shrink-0" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>Konforlu ulaşım</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-blue-600 flex-shrink-0" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>Gündüz ve akşam aktiviteleri</span>
                </li>
              </ul>
            </div>'''

standart_new = '''<div className="bg-gradient-to-br from-blue-50 to-cyan-50 p-8 rounded-xl shadow-2xl border-2 border-blue-400 relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-2 rounded-full text-sm font-semibold">
                Popüler
              </div>
              <h3 className="text-2xl font-bold mb-4 text-blue-600" style={{ fontFamily: '"Poppins", sans-serif' }}>Standart Paket</h3>
              <p className="text-gray-600 mb-2 text-lg font-semibold">9 Gece 10 Gün</p>
              <p className="text-gray-500 text-sm mb-4">2 Lokasyon</p>
              <ul className="space-y-3 text-gray-700 mb-4">
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>4 yıldızlı otel</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>Özel araç transferi</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>Günde 3 öğün yemek</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>Profesyonel rehberli turlar</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>Gündüz ve akşam aktiviteleri</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>Esneklik ve kustomizasyon</span>
                </li>
              </ul>
              <p className="text-sm text-blue-700 font-semibold mt-6 pt-4 border-t border-blue-200">En iyi fiyat-kalite oranı</p>
            </div>'''

content = content.replace(standart_old, standart_new)

# VIP paket tam değiştir
vip_old = '''<div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-purple-600" style={{ fontFamily: '"Poppins", sans-serif' }}>VIP Paket</h3>
              <p className="text-gray-600 mb-6">14 Gece 15 Gün</p>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-purple-600 flex-shrink-0" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>5 yıldızlı villa</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-purple-600 flex-shrink-0" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>7/24 Türkçe asistan</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-purple-600 flex-shrink-0" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>Özel araç transferi</span>
                </li>
              </ul>
            </div>'''

vip_new = '''<div className="bg-white p-8 rounded-xl shadow-lg">
              <h3 className="text-2xl font-bold mb-4 text-purple-600" style={{ fontFamily: '"Poppins", sans-serif' }}>VIP Paket</h3>
              <p className="text-gray-600 mb-2 text-lg font-semibold">14 Gece 15 Gün</p>
              <p className="text-gray-500 text-sm mb-4">3 Lokasyon</p>
              <ul className="space-y-3 text-gray-700 mb-4">
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>5 yıldızlı otel / Vila</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>VIP araç transferi</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>Yemek opsiyonel (tatlı/lüks)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>7/24 Türkçe asistan</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>Profesyonel fotoğraf/video</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>Benzersiz aktiviteler</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle size={20} className="text-purple-600 flex-shrink-0 mt-0.5" />
                  <span style={{ fontFamily: '"Poppins", sans-serif' }}>Tamamen kustomize edilebilir</span>
                </li>
              </ul>
              <p className="text-sm text-purple-700 font-semibold mt-6 pt-4 border-t border-purple-100">Lüks ve unutulmaz deneyim</p>
            </div>'''

content = content.replace(vip_old, vip_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('✓ Tüm paketler güncellemeldi')
