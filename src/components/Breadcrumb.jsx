import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb({ items }) {
  return (
    <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
      <a href="/tr" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
        <Home size={16} />
      </a>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <ChevronRight size={16} className="text-gray-400" />
          {item.url ? (
            <a
              href={item.url}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-gray-900 dark:text-white font-semibold">
              {item.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}





