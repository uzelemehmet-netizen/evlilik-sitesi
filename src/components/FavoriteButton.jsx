import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

export default function FavoriteButton({ itemId, itemType = 'destination' }) {
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    // localStorage'dan favorileri yükle
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    setIsFavorite(favorites.some(fav => fav.id === itemId && fav.type === itemType));
  }, [itemId, itemType]);

  const toggleFavorite = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const favorites = JSON.parse(localStorage.getItem('favorites') || '[]');
    const existingIndex = favorites.findIndex(
      fav => fav.id === itemId && fav.type === itemType
    );

    if (existingIndex > -1) {
      favorites.splice(existingIndex, 1);
      setIsFavorite(false);
    } else {
      favorites.push({ id: itemId, type: itemType, timestamp: Date.now() });
      setIsFavorite(true);
    }

    localStorage.setItem('favorites', JSON.stringify(favorites));
  };

  return (
    <button
      onClick={toggleFavorite}
      className={`p-2 rounded-full transition-all duration-300 ${
        isFavorite
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-white/80 text-gray-700 hover:bg-white hover:text-red-500'
      } shadow-lg hover:shadow-xl`}
      title={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
      aria-label={isFavorite ? 'Favorilerden çıkar' : 'Favorilere ekle'}
    >
      <Heart size={20} className={isFavorite ? 'fill-current' : ''} />
    </button>
  );
}





