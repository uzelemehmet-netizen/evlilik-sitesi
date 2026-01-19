import React, { useEffect, useMemo, useState } from 'react';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { uploadImageToCloudinaryAuto } from '../../utils/cloudinaryUpload';

const DEFAULT_MEDIA = Object.freeze({
  heroBackgroundUrl:
    'https://res.cloudinary.com/dj1xg1c56/image/upload/v1767352126/ChatGPT_Image_16_Ara_2025_20_55_54_cncrpw.png',
  introImage1Url: 'https://cvcou9szpd.ucarecd.net/84807d3a-fc15-4eb8-ab91-df06aafd02b9/-/preview/562x1000/',
  introImage2Url: 'https://cvcou9szpd.ucarecd.net/b85878d8-0625-4881-9e5b-b36981b06970/20250917_155623.jpg',
});

function UrlField({ label, value, onChange, onUpload, disabled }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <label className="text-sm font-semibold text-slate-900">{label}</label>
        <label className={`inline-flex items-center gap-2 text-xs font-semibold ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'} text-slate-700`}>
          <input
            type="file"
            accept="image/*"
            disabled={disabled}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) onUpload(file);
            }}
          />
          <span className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50">Dosya yükle</span>
        </label>
      </div>

      <input
        type="url"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="https://..."
        className="w-full px-3 py-2 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 disabled:bg-slate-50"
      />
    </div>
  );
}

export default function WeddingMediaTab() {
  const [media, setMedia] = useState(DEFAULT_MEDIA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const docRef = useMemo(() => doc(db, 'weddingContent', 'media'), []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setMessage('');
      try {
        const snap = await getDoc(docRef);
        const data = snap.exists() ? snap.data() || {} : {};
        if (cancelled) return;
        setMedia({
          heroBackgroundUrl: String(data.heroBackgroundUrl || DEFAULT_MEDIA.heroBackgroundUrl),
          introImage1Url: String(data.introImage1Url || DEFAULT_MEDIA.introImage1Url),
          introImage2Url: String(data.introImage2Url || DEFAULT_MEDIA.introImage2Url),
        });
      } catch (err) {
        if (!cancelled) {
          console.error('Wedding media load failed:', err);
          setMessage('Medya ayarları yüklenemedi. Firestore Rules izinlerini kontrol edin.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [docRef]);

  const uploadAndSet = async (key, file) => {
    setMessage('');
    try {
      const res = await uploadImageToCloudinaryAuto(file, {
        folder: 'evlilik-site/wedding',
        tags: ['wedding', 'media', key],
      });
      setMedia((prev) => ({ ...prev, [key]: res.secureUrl }));
      setMessage('Yüklendi. Kaydet ile yayına alabilirsin.');
    } catch (err) {
      console.error('Cloudinary upload failed:', err);
      setMessage('Yükleme başarısız. Cloudinary ayarlarını (env / signature endpoint) kontrol et.');
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    try {
      await setDoc(
        docRef,
        {
          heroBackgroundUrl: String(media.heroBackgroundUrl || ''),
          introImage1Url: String(media.introImage1Url || ''),
          introImage2Url: String(media.introImage2Url || ''),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
      setMessage('Kaydedildi.');
    } catch (err) {
      console.error('Wedding media save failed:', err);
      setMessage('Kaydetme başarısız. Firestore admin izni yok gibi görünüyor.');
    } finally {
      setSaving(false);
    }
  };

  const disabled = loading || saving;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Evlilik Sayfası Görselleri</h2>
          <p className="text-sm text-slate-600 mt-1">
            Hero arka planı ve sayfadaki iki görseli buradan yönet.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={disabled}
          className="px-4 py-2 rounded-lg bg-rose-600 text-white text-sm font-semibold hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? 'Kaydediliyor…' : 'Kaydet'}
        </button>
      </div>

      {message && (
        <div className="mb-5 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">{message}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <UrlField
            label="Hero arka plan (Wedding sayfası)"
            value={media.heroBackgroundUrl}
            disabled={disabled}
            onChange={(v) => setMedia((p) => ({ ...p, heroBackgroundUrl: v }))}
            onUpload={(file) => uploadAndSet('heroBackgroundUrl', file)}
          />

          <UrlField
            label="Görsel 1 (sağ üst)"
            value={media.introImage1Url}
            disabled={disabled}
            onChange={(v) => setMedia((p) => ({ ...p, introImage1Url: v }))}
            onUpload={(file) => uploadAndSet('introImage1Url', file)}
          />

          <UrlField
            label="Görsel 2 (sağ alt)"
            value={media.introImage2Url}
            disabled={disabled}
            onChange={(v) => setMedia((p) => ({ ...p, introImage2Url: v }))}
            onUpload={(file) => uploadAndSet('introImage2Url', file)}
          />
        </div>

        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
            <div className="px-4 py-2 text-xs font-semibold text-slate-700 border-b border-slate-200">Önizleme: Hero arka plan</div>
            <div
              className="h-40 bg-cover bg-center"
              style={{ backgroundImage: `url(${media.heroBackgroundUrl})` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <div className="px-3 py-2 text-xs font-semibold text-slate-700 border-b border-slate-200">Önizleme 1</div>
              <img src={media.introImage1Url} alt="Wedding intro 1" className="w-full h-40 object-cover" />
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50">
              <div className="px-3 py-2 text-xs font-semibold text-slate-700 border-b border-slate-200">Önizleme 2</div>
              <img src={media.introImage2Url} alt="Wedding intro 2" className="w-full h-40 object-cover" />
            </div>
          </div>

          <p className="text-xs text-slate-500">
            Not: Public sayfada bu görseller Firestore’dan okunur. Rules’ta `weddingContent/media` için public read, admin write olmalı.
          </p>
        </div>
      </div>
    </div>
  );
}
