import { Link, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Menu, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { isFeatureEnabled } from "../config/siteVariant";

export default function Navigation() {
  const BRAND_LOGO_SRC = "/brand.png";
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const showTravel = isFeatureEnabled('travel');
  const showTours = isFeatureEnabled('tours');
  const showExplore = isFeatureEnabled('explore');
  const showWedding = isFeatureEnabled('wedding');
  const showDocuments = isFeatureEnabled('documents');
  const isWeddingOnly = showWedding && !showTravel;

  const currentLang = (i18n.language || "tr").split("-")[0];

  // Aktif sayfayı kontrol et
  const isActive = (path) => {
    if (path === "/") {
      return location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const navItems = useMemo(
    () => [
      { to: "/", label: t("navigation.home"), active: isActive("/") },
      { to: "/about", label: t("navigation.about"), active: isActive("/about") },
      { to: "/kurumsal", label: t("navigation.corporate"), active: isActive("/kurumsal") },
      ...(showTravel ? [{ to: "/travel", label: t("navigation.travel"), active: isActive("/travel") }] : []),
      ...(showTours ? [{ to: "/tours", label: t("navigation.tours"), active: isActive("/tours") }] : []),
      ...(showExplore ? [{ to: "/kesfet", label: t("navigation.explore"), active: isActive("/kesfet") }] : []),
      ...(showWedding
        ? [{ to: "/uniqah", label: t("navigation.matchmaking"), active: isActive("/uniqah") }]
        : []),
      ...(showWedding ? [{ to: "/profilim", label: t("navigation.panel"), active: isActive("/profilim") }] : []),
      ...(showWedding
        ? [{ to: "/wedding", label: t("navigation.wedding"), active: isActive("/wedding") }]
        : []),
      ...(showDocuments
        ? [{ to: "/dokumanlar", label: t("navigation.documents"), active: isActive("/dokumanlar") }]
        : []),
      { to: "/youtube", label: t("navigation.youtube"), active: isActive("/youtube") },
      { to: "/contact", label: t("navigation.contact"), active: isActive("/contact") },
    ],
    [location.pathname, showDocuments, showExplore, showTours, showTravel, showWedding, t]
  );

  return (
    <>
      <nav className="sticky top-0 z-50 bg-gradient-to-r from-white via-emerald-50 to-white shadow-lg border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4 flex items-center gap-4">
          <Link
            to="/"
            className="flex items-center gap-3 leading-tight shrink-0"
            style={{ fontFamily: '"Poppins", sans-serif' }}
            aria-label="Ana sayfa"
          >
            <div className="flex flex-col leading-none">
              {/* Mobile */}
              <img
                src={BRAND_LOGO_SRC}
                alt="Turk&Indo"
                className="h-12 w-auto md:hidden"
                loading="eager"
                decoding="async"
              />

              {/* Desktop */}
              <img
                src={BRAND_LOGO_SRC}
                alt="Turk&Indo"
                className="hidden md:block h-14 lg:h-16 w-auto"
                loading="eager"
                decoding="async"
              />

              <div className="hidden md:block mt-1">
                {!isWeddingOnly && (
                  <div className="text-[11px] text-slate-700 font-semibold tracking-wide">{t('navigation.taglineTravelOrg')}</div>
                )}
                {showWedding && (
                  <div className="text-[10px] text-slate-600 font-semibold tracking-wide mt-0.5">
                    {t('navigation.taglineWeddingGuidance')}
                  </div>
                )}
              </div>
            </div>
          </Link>

          {/* Mobil: WhatsApp + Menü */}
          <div className="md:hidden flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-emerald-200 bg-white text-gray-800 shadow-sm"
              aria-label={isMobileMenuOpen ? "Menüyü kapat" : "Menüyü aç"}
            >
              {isMobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          <div className="hidden md:flex flex-1 min-w-0 items-center justify-end">
            <div className="flex items-center gap-2 flex-nowrap overflow-x-auto min-w-0">
            <select
              value={currentLang}
              onChange={(e) => {
                try {
                  localStorage.setItem('preferred_lang_source', 'selector');
                } catch {
                  // ignore
                }
                i18n.changeLanguage(e.target.value);
              }}
              className="px-2 py-1.5 rounded-full text-xs sm:text-sm font-semibold border border-emerald-200 bg-white text-slate-800 shadow-sm"
              aria-label="Dil seç"
            >
              <option value="tr">TR</option>
              <option value="en">EN</option>
              <option value="id">ID</option>
            </select>
            <Link to="/" className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap ${
              isActive('/') 
                ? 'bg-emerald-500 text-white shadow-lg' 
                : 'text-gray-700 hover:bg-emerald-500 hover:text-white'
            }`} style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('navigation.home')}
            </Link>
            <Link to="/about" className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap ${
              isActive('/about')
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'text-gray-700 hover:bg-emerald-500 hover:text-white'
            }`} style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('navigation.about')}
            </Link>
            <Link to="/kurumsal" className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap ${
              isActive('/kurumsal')
                ? 'bg-slate-800 text-white shadow-lg'
                : 'text-slate-700 hover:bg-slate-800 hover:text-white'
            }`} style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('navigation.corporate')}
            </Link>
            {showTravel && (
              <Link to="/travel" className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap ${
                isActive('/travel')
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-emerald-500 hover:text-white'
              }`} style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('navigation.travel')}
              </Link>
            )}
            {showTours && (
              <Link to="/tours" className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap ${
                isActive('/tours')
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-emerald-500 hover:text-white'
              }`} style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('navigation.tours')}
              </Link>
            )}
            {showExplore && (
              <Link to="/kesfet" className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap ${
                isActive('/kesfet')
                  ? 'bg-orange-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-orange-500 hover:text-white'
              }`} style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('navigation.explore')}
              </Link>
            )}
            {showWedding && (
              <Link to="/uniqah" className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap ${
                isActive('/uniqah')
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-emerald-500 hover:text-white'
              }`} style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('navigation.matchmaking')}
              </Link>
            )}
            {showWedding && (
              <Link to="/profilim" className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap ${
                isActive('/profilim')
                  ? 'bg-slate-900 text-white shadow-lg'
                  : 'text-slate-800 hover:bg-slate-900 hover:text-white'
              }`} style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('navigation.panel')}
              </Link>
            )}
            {showWedding && (
              <Link to="/wedding" className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap ${
                isActive('/wedding')
                  ? 'bg-emerald-500 text-white shadow-lg'
                  : 'text-gray-700 hover:bg-emerald-500 hover:text-white'
              }`} style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('navigation.wedding')}
              </Link>
            )}
            {showDocuments && (
              <Link to="/dokumanlar" className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap ${
                isActive('/dokumanlar')
                  ? 'bg-sky-600 text-white shadow-lg'
                  : 'text-sky-700 hover:bg-sky-600 hover:text-white'
              }`} style={{ fontFamily: '"Poppins", sans-serif' }}>
                {t('navigation.documents')}
              </Link>
            )}
            <Link to="/youtube" className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap ${
              isActive('/youtube')
                ? 'bg-red-500 text-white shadow-lg'
                : 'text-red-600 hover:bg-red-500 hover:text-white'
            }`} style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('navigation.youtube')}
            </Link>
            <Link to="/contact" className={`px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 shadow-md hover:shadow-lg whitespace-nowrap ${
              isActive('/contact')
                ? 'bg-blue-500 text-white shadow-lg'
                : 'text-blue-600 hover:bg-blue-500 hover:text-white'
            }`} style={{ fontFamily: '"Poppins", sans-serif' }}>
              {t('navigation.contact')}
            </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobil Menü (hamburger) */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-[60]">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(false)}
            className="absolute inset-0 bg-black/40"
            aria-label="Menüyü kapat"
          />
          <div className="absolute top-0 left-0 right-0 bg-white border-b border-slate-200 shadow-xl">
            <div className="max-w-7xl mx-auto px-4 py-4">
              <div className="flex items-center justify-center pb-3">
                <img
                  src={BRAND_LOGO_SRC}
                  alt="Turk&Indo"
                  className="h-28 w-auto"
                  loading="eager"
                  decoding="async"
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-slate-900">Menü</p>
                <button
                  type="button"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="inline-flex items-center justify-center w-10 h-10 rounded-full border border-slate-200 bg-white"
                  aria-label="Kapat"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mt-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="mobile-lang-select">
                  {t('navigation.language')}
                </label>
                <select
                  id="mobile-lang-select"
                  value={currentLang}
                  onChange={(e) => {
                    try {
                      localStorage.setItem('preferred_lang_source', 'selector');
                    } catch {
                      // ignore
                    }
                    i18n.changeLanguage(e.target.value);
                  }}
                  className="w-full px-3 py-2 rounded-xl text-sm font-semibold border border-emerald-200 bg-white text-slate-800 shadow-sm"
                  aria-label={t('navigation.language')}
                >
                  <option value="tr">TR</option>
                  <option value="en">EN</option>
                  <option value="id">ID</option>
                </select>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-2 pb-4">
                {navItems.map((item) => (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={[
                      "w-full px-4 py-3 rounded-xl text-sm font-semibold transition-colors",
                      item.active ? "bg-emerald-600 text-white" : "bg-slate-50 text-slate-800 hover:bg-slate-100",
                    ].join(" ")}
                    style={{ fontFamily: '"Poppins", sans-serif' }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}













