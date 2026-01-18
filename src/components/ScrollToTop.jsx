import { useState, useEffect } from 'react';
import { ChevronUp } from 'lucide-react';

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const toggleVisibility = () => {
      if (window.scrollY > 300) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', toggleVisibility);
    return () => window.removeEventListener('scroll', toggleVisibility);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  if (!isVisible) {
    return null;
  }

  return (
    <button
      onClick={scrollToTop}
      className="fixed bottom-24 right-4 sm:right-6 z-50 bg-emerald-500 text-white p-3 sm:p-3.5 rounded-full shadow-2xl hover:shadow-emerald-500/50 hover:bg-emerald-600 active:scale-95 transition-all duration-300 flex items-center justify-center group touch-manipulation"
      title="Yukarı çık"
      aria-label="Yukarı çık"
      style={{ minWidth: '44px', minHeight: '44px' }}
    >
      <ChevronUp size={20} className="group-hover:-translate-y-1 transition-transform" />
    </button>
  );
}

