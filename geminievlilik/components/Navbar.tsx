
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { UserProfile } from '../types';

interface NavbarProps {
  user: UserProfile | null;
  onLogout: () => void;
  onLoginClick?: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, onLoginClick }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 glass px-6 py-4 flex items-center justify-between border-b border-pink-100">
      <Link to="/" className="flex items-center gap-3 group">
        <div className="w-10 h-10 gradient-bg rounded-xl flex items-center justify-center text-white text-xl rotate-3 group-hover:rotate-0 transition-all shadow-lg shadow-rose-200/50">
          <i className="fa-solid fa-heart"></i>
        </div>
        <span className="text-2xl font-black bg-gradient-to-r from-rose-600 to-amber-600 bg-clip-text text-transparent tracking-tighter">
          Nikahtan
        </span>
      </Link>

      <div className="flex items-center gap-6">
        {user ? (
          <>
            <Link 
              to="/dashboard" 
              className={`font-bold text-sm transition-colors ${isActive('/dashboard') ? 'text-rose-600' : 'text-gray-500 hover:text-rose-500'}`}
            >
              Keşfet
            </Link>
            <Link 
              to="/profile" 
              className={`flex items-center gap-2 font-bold text-sm transition-colors ${isActive('/profile') ? 'text-rose-600' : 'text-gray-500 hover:text-rose-500'}`}
            >
              <img src={user.photos[0]} className="w-9 h-9 rounded-full object-cover border-2 border-rose-200 shadow-sm" alt="Avatar" />
              <span className="hidden sm:inline">Profilim</span>
            </Link>
            <button 
              onClick={onLogout}
              className="w-10 h-10 rounded-xl bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all border border-gray-100"
              title="Çıkış Yap"
            >
              <i className="fa-solid fa-right-from-bracket"></i>
            </button>
          </>
        ) : (
          <button 
            onClick={onLoginClick}
            className="px-6 py-2.5 gradient-bg text-white font-black text-xs rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-all uppercase tracking-widest"
          >
            Giriş Yap
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
