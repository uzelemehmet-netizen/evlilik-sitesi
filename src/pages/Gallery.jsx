import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import HeroSocialButtons from '../components/HeroSocialButtons';
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

export default function Gallery() {
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const galleryImages = [
    {
      id: 1,
      src: 'https://cvcou9szpd.ucarecd.net/30e75169-76ff-45fb-9f0f-af8309e698fa/20251011_164149.jpg',
      alt: 'Sukabumi Siti Gunung şelalesinden bir alıntı',
      category: 'wedding',
      layout: 'wide',
    },
    {
      id: 2,
      src: 'https://cvcou9szpd.ucarecd.net/779026a7-ee9b-45d7-8fbb-9e577ad69142/20250923_143339.jpg',
      alt: 'Tapınak ziyaretimizden bir hatıra',
      category: 'wedding',
      layout: 'tall',
    },
    {
      id: 3,
      src: 'https://cvcou9szpd.ucarecd.net/989f7fe5-9d82-415f-aaff-af87f3f86163/20250923_143133.jpg',
      alt: 'Yogyakarta tapınaklarından bir kare',
      category: 'travel',
      layout: 'square',
    },
    {
      id: 4,
      src: 'https://cvcou9szpd.ucarecd.net/2ba39fc9-4d83-4142-bf59-41f63eb158c6/20250914_135337.jpg',
      alt: 'Ciwidey çay bahçelerinden bir anımız',
      category: 'travel',
      layout: 'wide',
    },
    {
      id: 5,
      src: 'https://cvcou9szpd.ucarecd.net/8edd2952-8bee-4752-88ca-29465f4cc06a/20250922_142612.jpg',
      alt: 'Endonezya doğasında yürüyüşten bir kare',
      category: 'daily',
      layout: 'tall',
    },
    {
      id: 6,
      src: 'https://cvcou9szpd.ucarecd.net/a0936c33-5864-43cb-8be4-400bc5ab04a8/20250806_133629.jpg',
      alt: 'Situ Patenggan Gölü manzarasından bir kare',
      category: 'wedding',
      layout: 'wide',
    },
    {
      id: 7,
      src: 'https://cvcou9szpd.ucarecd.net/9e2f87cd-7887-4920-b42e-6884f3bf7bf7/20250915_171303.jpg',
      alt: 'Salih ve Tini\'nin nikahından bir kare',
      category: 'travel',
      layout: 'tall',
    },
    {
      id: 8,
      src: 'https://cvcou9szpd.ucarecd.net/ce716718-ec43-4500-b229-b8b3a8598db8/20250923_143359.jpg',
      alt: 'Yogyakarta tapınak turundan bir an',
      category: 'travel',
      layout: 'square',
    },
    {
      id: 9,
      src: 'https://cvcou9szpd.ucarecd.net/84807d3a-fc15-4eb8-ab91-df06aafd02b9/20250915_164443.jpg',
      alt: 'Salih ve Tini\'nin nikah anısından bir kare',
      category: 'daily',
      layout: 'square',
    },
    {
      id: 10,
      src: 'https://cvcou9szpd.ucarecd.net/c8895342-7e1b-4f36-8fb7-af4b2e13dabc/20250917_161001.jpg',
      alt: 'Pangandaran sahilinde ATV turundan bir kare',
      category: 'travel',
      layout: 'wide',
    },
    {
      id: 11,
      src: 'https://cvcou9szpd.ucarecd.net/a5c39911-faad-48d1-a47c-1ddcf6c22900/20250921_112948.jpg',
      alt: 'Pangandaran resort otelinden bir hatıra',
      category: 'wedding',
      layout: 'tall',
    },
    {
      id: 12,
      src: 'https://cvcou9szpd.ucarecd.net/d5a31d68-63ff-452f-9fde-6615e383fd5a/20251011_163216.jpg',
      alt: 'Sukabumi şelalesinden manzaralar',
      category: 'daily',
      layout: 'wide',
    },
    {
      id: 13,
      src: 'https://cvcou9szpd.ucarecd.net/c3883336-1d43-41df-9f99-8e04e070f546/IMG20250102WA0063.jpg',
      alt: 'Citumang body rafting alanından bir kare',
      category: 'daily',
      layout: 'tall',
    },
  ];

  const imageById = galleryImages.reduce((acc, img) => {
    acc[img.id] = img;
    return acc;
  }, {});

  const columnDefinition = [
    // 1. sütun: Palmiye manzarası ve ahşap köprü gibi doğa kareleri
    [3, 7, 5, 9],
    // 2. sütun: Sahil, havuzlu villa ve balayı/tekne/teras kareleri
    [1, 4, 6, 10, 12, 13],
    // 3. sütun: Tapınak ve palmiye gün batımı gibi ek kareler
    [2, 8, 11],
  ];

  const columns = columnDefinition.map((colIds) =>
    colIds.map((id) => imageById[id]).filter((img) => img)
  );

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      {/* Hero Section */}
      <section
        className="pt-20 pb-8 px-4 relative overflow-hidden min-h-48"
        style={{
          backgroundImage:
            'url(https://cvcou9szpd.ucarecd.net/ce716718-ec43-4500-b229-b8b3a8598db8/20250923_143359.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center 80%',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="absolute inset-0" />
        <div className="max-w-7xl mx-auto relative z-10 text-center flex flex-col justify-center items-center min-h-48">
          <h1
            className="text-4xl md:text-5xl font-bold text-white mb-4"
            style={{ fontFamily: '"Poppins", sans-serif', textShadow: '0 4px 12px rgba(0,0,0,0.7)' }}
          >
            Fotoğraf Galerisi
          </h1>
          <p
            className="text-lg md:text-2xl text-white max-w-2xl"
            style={{ fontFamily: '"Poppins", sans-serif', textShadow: '0 2px 8px rgba(0,0,0,0.6)' }}
          >
            Endonezya’daki evlilik sürecimizden, seyahatlerimizden ve günlük hayatımızdan kısa kısa kareler.
          </p>
        </div>
        <HeroSocialButtons />
      </section>

      {/* Galeri İçeriği */}
      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col gap-4 mb-8">
            <div>
              <h2
                className="text-3xl font-bold text-gray-900 mb-3"
                style={{ fontFamily: '"Poppins", sans-serif' }}
              >
                Endonezya’dan Kareler
              </h2>
              <p
                className="text-gray-600 max-w-2xl text-base"
                style={{ fontFamily: '"Poppins", sans-serif' }}
              >
                Fotoğraf galerimizde hem nikah görüntülerinden, hem de Endonezya’daki keşiflerimizden ve günlük hayatımızdan
                kareleri bulabilirsiniz. Görselleri belirli aralıklarla en son çektiğimiz fotoğraflarla güncellemeye devam edeceğiz.
              </p>
              <div className="mt-4">
                <Link
                  to="../about"
                  className="inline-flex items-center px-5 py-2.5 rounded-full bg-emerald-500 text-white text-sm font-medium shadow-md hover:bg-emerald-600 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-50 transition"
                  style={{ fontFamily: '"Poppins", sans-serif' }}
                >
                  Hakkımızda sayfamıza dön
                </Link>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-0">
            {columns.map((col, colIndex) => (
              <div key={colIndex} className="flex-1 flex flex-col gap-0">
                {col.map((image) => {
                  const aspectStyle = {
                    aspectRatio: image.layout === 'tall' ? '9 / 16' : '16 / 9',
                  };

                  return (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setSelectedImage(image)}
                      className="relative group rounded-2xl overflow-hidden shadow-md bg-gray-100 focus:outline-none focus:ring-2 focus:ring-sky-500"
                      style={aspectStyle}
                    >
                      <img
                        src={image.src}
                        alt={image.alt}
                        className="w-full h-full object-cover transform transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <p
                        className="absolute bottom-2 left-2 right-2 text-[10px] md:text-xs text-white drop-shadow-sm text-left"
                        style={{ fontFamily: '"Poppins", sans-serif' }}
                      >
                        {image.alt}
                      </p>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <p
            className="mt-8 text-sm text-gray-500 text-center"
            style={{ fontFamily: '"Poppins", sans-serif' }}
          >
            Bu sayfadaki görselleri zamanla kendi arşivimizden gerçek fotoğraflarla güncelleyeceğiz.
          </p>
        </div>
      </section>

      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[85vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedImage(null)}
              className="absolute -top-10 right-0 text-white text-sm md:text-base bg-black/60 hover:bg-black/80 px-3 py-1 rounded-full"
              style={{ fontFamily: '"Poppins", sans-serif' }}
            >
              Kapat
            </button>
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="w-full h-full object-contain rounded-2xl shadow-2xl"
            />
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

