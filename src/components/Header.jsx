import { Bell, Plus } from "lucide-react";

export default function Header() {
  return (
    <header className="bg-white dark:bg-[#1E1E1E] w-full h-[60px] sm:h-[70px] lg:h-[80px] flex items-center px-3 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between w-full">
        {/* Left group - User Preview */}
        <div className="flex items-center">
          {/* Avatar */}
          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 rounded-full overflow-hidden mr-2 sm:mr-3 cursor-pointer hover:ring-2 hover:ring-[#5634EA] dark:hover:ring-[#7C69FF] hover:ring-offset-2 dark:hover:ring-offset-[#1E1E1E] transition-all duration-200">
            <img
              src="https://images.pexels.com/photos/18035231/pexels-photo-18035231/free-photo-of-two-young-men-standing-back-to-back-and-smiling.jpeg?auto=compress&cs=tinysrgb&w=400"
              alt="User avatar"
              className="w-full h-full object-cover"
            />
          </div>

          {/* User Info */}
          <div className="flex flex-col">
            <h1 className="text-black dark:text-white text-[14px] sm:text-[16px] lg:text-[18px] font-poppins font-semibold leading-tight">
              Hoş Geldiniz
            </h1>
            <p className="text-[#6D6D6D] dark:text-[#A0A0A0] text-[11px] sm:text-[12px] lg:text-[14px] font-poppins font-light leading-tight truncate max-w-[120px] sm:max-w-[180px] lg:max-w-[200px]">
              Hayalinizdeki tatilin keşfedin! 🌴
            </p>
          </div>

          {/* Optional divider line on desktop */}
          <div className="hidden lg:block w-px h-12 bg-[#EFEFEF] dark:bg-[#404040] ml-4"></div>
        </div>

        {/* Right group - Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3 lg:space-x-6">
          {/* Notification Button */}
          <button
            className="relative w-8 h-8 sm:w-10 sm:h-10 lg:w-11 lg:h-11 rounded-lg lg:rounded-xl border border-[#EAEAEA] dark:border-[#404040] bg-white dark:bg-[#262626] flex items-center justify-center hover:border-[#D0D0D0] dark:hover:border-[#555555] hover:bg-gray-50 dark:hover:bg-[#2E2E2E] active:bg-gray-100 dark:active:bg-[#333333] transition-all duration-200 cursor-pointer"
            aria-label="Notifications"
          >
            <Bell
              size={16}
              className="text-[#111111] dark:text-white sm:w-[18px] sm:h-[18px] lg:w-[20px] lg:h-[20px]"
            />
            {/* Notification Badge */}
            <div className="absolute -top-0.5 -right-0.5 lg:-top-1 lg:-right-1 w-[8px] h-[8px] lg:w-[10px] lg:h-[10px] bg-[#FF5B5B] rounded-full"></div>
          </button>

          {/* New Trip Button */}
          <button className="bg-[#FF8940] hover:bg-[#FF9D55] active:bg-[#E27134] dark:bg-[#FF7D33] dark:hover:bg-[#FF9148] dark:active:bg-[#E2681F] focus:ring-2 focus:ring-[#FFB88A] focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-[#1E1E1E] rounded-lg lg:rounded-xl flex items-center px-3 sm:px-4 lg:px-7 py-2 sm:py-2.5 lg:py-3 min-w-[80px] sm:min-w-[100px] lg:min-w-[140px] transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]">
            <Plus
              size={16}
              className="text-white mr-1 sm:mr-1.5 lg:mr-2 sm:w-[18px] sm:h-[18px] lg:w-[20px] lg:h-[20px]"
            />
            <span className="text-white text-[12px] sm:text-[14px] lg:text-[16px] font-poppins font-medium">
              Yeni Gezi
            </span>
          </button>
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;600&display=swap');
        .font-poppins {
          font-family: 'Poppins', sans-serif;
        }
      `}</style>
    </header>
  );
}