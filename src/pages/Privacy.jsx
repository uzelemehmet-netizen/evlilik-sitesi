import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      
      <div className="max-w-4xl mx-auto px-4 py-24">
        <h1 className="text-4xl font-bold mb-12 text-gray-900">Gizlilik Politikası</h1>
        
        <div className="space-y-8 text-gray-600">
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Tanıtım</h2>
            <p>
              Endonezya Turizm, müşteri gizliliğine ve veri koruma haklarına saygı duymaktadır.
              Bu gizlilik politikası, kişisel verilerinizin nasıl toplandığını, kullanıldığını
              ve korunduğunu açıklar.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Toplanan Veriler</h2>
            <p>Web sitemiz aracılığıyla aşağıdaki verileri toplayabiliriz:</p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>Ad ve soyadı</li>
              <li>Email adresi</li>
              <li>Telefon numarası</li>
              <li>Seyahat tercihleri</li>
              <li>Tarayıcı ve cihaz bilgileri</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Verilerin Kullanımı</h2>
            <p>Toplanan veriler aşağıdaki amaçlarla kullanılır:</p>
            <ul className="list-disc list-inside mt-4 space-y-2">
              <li>Seyahat ve evlilik hizmetleri sunmak</li>
              <li>İletişim ve müşteri desteği sağlamak</li>
              <li>Web sitesini geliştirmek</li>
              <li>Pazarlama ve promosyon mesajları göndermek (izin ile)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Veri Güvenliği</h2>
            <p>
              Kişisel verileriniz, endüstri standardı şifreleme ve güvenlik önlemleri
              kullanılarak korunur. Ancak, internet üzerindeki hiçbir aktarım %100 güvenli değildir.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Haklarınız</h2>
            <p>
              Kişisel verileriniz hakkında bilgi almak, düzeltmek veya silettirilmek için
              bize yazılı olarak başvurabilirsiniz.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. İletişim</h2>
            <p>
              Gizlilik politikası hakkında sorularınız için bize
              <a href="mailto:endonezyakasifi@gmail.com" className="text-emerald-600 hover:underline">
                {' '}endonezyakasifi@gmail.com
              </a>
              adresinden ulaşabilirsiniz.
            </p>
          </section>

          <div className="border-t pt-8 mt-8 text-sm text-gray-500">
            <p>Son güncellenme: {new Date().toLocaleDateString('tr-TR')}</p>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
