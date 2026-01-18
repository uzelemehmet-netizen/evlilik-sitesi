import { useNavigate, useLocation } from "react-router-dom";
import {
  MapPin,
  ArrowLeft,
  Plane,
  X,
  MessageCircle,
  Youtube,
} from "lucide-react";
import { openWhatsAppToText } from "../utils/whatsapp";
import { useTranslation } from "react-i18next";

export default function KesfetSidebar({ isOpen, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const handleNavigateToTravel = () => {
    navigate("/travel");
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleGoBack = () => {
    navigate(-1);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleWhatsApp = () => {
    openWhatsAppToText(t("kesfetSidebar.whatsappMessage"));
  };

  const handleYouTube = () => {
    navigate("/youtube");
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const isKesfetPage = location.pathname === "/kesfet";
  const canGoBack = location.pathname !== "/kesfet";

  return (
    <div
      className={`w-[280px] bg-white dark:bg-[#1E1E1E] shadow-sm border-r border-gray-200 dark:border-gray-700 fixed left-0 top-0 h-full flex flex-col font-inter z-50 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      {/* Mobile Close Button */}
      <div className="lg:hidden absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors duration-200"
          aria-label={t("kesfetSidebar.closeMenu")}
        >
          <X size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Brand Row */}
      <div className="pt-6 px-6 pb-6 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center">
          <div className="w-12 h-12 mr-4 bg-gradient-to-br from-[#FF8940] to-[#F07C3E] dark:from-[#FF7D33] dark:to-[#E27134] rounded-lg flex items-center justify-center relative">
            <MapPin size={24} className="text-white" />
          </div>
          <h1 className="text-[20px] font-poppins font-semibold text-black dark:text-white tracking-tight">
            {t("kesfetSidebar.title")}
          </h1>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 px-6 py-6 overflow-y-auto scrollbar-hide space-y-3">
        {/* Geri Dön Button */}
        {canGoBack && (
          <button
            onClick={handleGoBack}
            className="w-full flex items-center px-4 py-3 rounded-xl bg-white dark:bg-[#1E1E1E] shadow-md hover:shadow-lg border border-[#E4E4E4] dark:border-[#404040] transition-all duration-200 group"
          >
            <ArrowLeft
              size={18}
              className="text-[#FF8940] dark:text-[#FF9D55] mr-3 group-hover:translate-x-[-2px] transition-transform duration-200"
            />
            <span className="text-[14px] font-inter font-semibold text-[#FF8940] dark:text-[#FF9D55]">
              {t("kesfetSidebar.back")}
            </span>
          </button>
        )}

        {/* Seyahat Formu Button */}
        <button
          onClick={handleNavigateToTravel}
          className="w-full flex items-center px-4 py-3 rounded-xl bg-white dark:bg-[#1E1E1E] shadow-md hover:shadow-lg border border-[#E4E4E4] dark:border-[#404040] transition-all duration-200 group"
        >
          <Plane
            size={18}
            className="text-[#5634EA] dark:text-[#7C69FF] mr-3 group-hover:translate-y-[-2px] transition-transform duration-200"
          />
          <span className="text-[14px] font-inter font-semibold text-[#5634EA] dark:text-[#7C69FF]">
            {t("kesfetSidebar.planTravel")}
          </span>
        </button>

        {/* WhatsApp Button */}
        <button
          onClick={handleWhatsApp}
          className="w-full flex items-center px-4 py-3 rounded-xl bg-white dark:bg-[#1E1E1E] shadow-md hover:shadow-lg border border-[#E4E4E4] dark:border-[#404040] transition-all duration-200 group"
        >
          <MessageCircle
            size={18}
            className="text-[#25D366] dark:text-[#25D366] mr-3 group-hover:scale-110 transition-transform duration-200"
          />
          <span className="text-[14px] font-inter font-semibold text-[#25D366]">
            {t("kesfetSidebar.whatsapp")}
          </span>
        </button>

        {/* YouTube Button */}
        <button
          onClick={handleYouTube}
          className="w-full flex items-center px-4 py-3 rounded-xl bg-white dark:bg-[#1E1E1E] shadow-md hover:shadow-lg border border-[#E4E4E4] dark:border-[#404040] transition-all duration-200 group"
        >
          <Youtube
            size={18}
            className="text-[#FF0000] dark:text-[#FF0000] mr-3 group-hover:scale-110 transition-transform duration-200"
          />
          <span className="text-[14px] font-inter font-semibold text-[#FF0000]">
            {t("kesfetSidebar.youtube")}
          </span>
        </button>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600&family=Inter:wght@400;500;600&display=swap');
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }

        .font-inter {
          font-family: 'Inter', sans-serif;
        }

        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }

        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}} />
    </div>
  );
}