import { MapPin, Clock } from 'lucide-react';

export default function PopularCombinations() {
  const combinations = [
    {
      id: 'bali-lombok',
      name: 'Bali + Lombok',
      duration: '10-14 gün',
      description: 'İki adanın en güzel noktalarını keşfedin',
      islands: ['Bali', 'Lombok'],
      image: 'https://images.pexels.com/photos/2166559/pexels-photo-2166559.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: '/kesfet'
    },
    {
      id: 'bali-java',
      name: 'Bali + Java',
      duration: '12-16 gün',
      description: 'Kültür ve doğa dolu bir yolculuk',
      islands: ['Bali', 'Java'],
      image: 'https://images.pexels.com/photos/3601425/pexels-photo-3601425.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: '/kesfet'
    },
    {
      id: 'komodo-lombok',
      name: 'Komodo + Lombok',
      duration: '8-12 gün',
      description: 'Macera ve sakinliğin mükemmel dengesi',
      islands: ['Komodo', 'Lombok'],
      image: 'https://images.pexels.com/photos/11896657/pexels-photo-11896657.jpeg?auto=compress&cs=tinysrgb&w=800',
      url: '/kesfet'
    }
  ];

  return (
    <div className="bg-white dark:bg-[#1E1E1E] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Popüler Ada Kombinasyonları
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          En çok tercih edilen ada kombinasyonlarını keşfedin
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {combinations.map((combo) => (
            <a
              key={combo.id}
              href={combo.url}
              className="group bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className="relative h-48 overflow-hidden bg-gray-200 dark:bg-gray-700">
                <img
                  src={combo.image}
                  alt={combo.name}
                  loading="lazy"
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  {combo.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  {combo.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>{combo.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin size={14} />
                    <span>{combo.islands.join(' + ')}</span>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}





