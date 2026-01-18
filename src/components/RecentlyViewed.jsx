import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function RecentlyViewed() {
  const [recentItems, setRecentItems] = useState([]);

  useEffect(() => {
    const viewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    setRecentItems(viewed.slice(0, 4)); // Son 4 öğe
  }, []);

  if (recentItems.length === 0) return null;

  return (
    <div className="bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={20} className="text-emerald-600" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Son Görüntülenenler
        </h3>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {recentItems.map((item) => (
          <a
            key={`${item.type}-${item.id}`}
            href={item.url}
            className="group relative h-32 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all"
          >
            <img
              src={item.image}
              alt={item.name}
              loading="lazy"
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end">
              <p className="text-white text-xs font-semibold p-2 line-clamp-2">
                {item.name}
              </p>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}





