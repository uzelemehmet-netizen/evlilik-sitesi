import {
  LayoutGrid,
  CalendarCheck,
  Search,
  MapPin,
  Users,
  UserCircle,
  Settings,
  Mic,
  LogOut,
  X,
} from "lucide-react";

export default function Sidebar({ isOpen, onClose }) {
  const navigationItems = [
    {
      name: "Dashboard",
      icon: LayoutGrid,
      color: "#FF7849",
      darkColor: "#FF8A5C",
      isActive: false,
      href: "/",
    },
    {
      name: "Keşfet",
      icon: Search,
      color: "#5634EA",
      darkColor: "#7C69FF",
      isActive: true,
      href: "/kesfet",
    },
    {
      name: "Rehber",
      icon: MapPin,
      color: "#5634EA",
      darkColor: "#7C69FF",
      href: "#",
    },
    {
      name: "Topluluk",
      icon: Users,
      color: "#5634EA",
      darkColor: "#7C69FF",
      href: "#",
    },
    {
      name: "Profil",
      icon: UserCircle,
      color: "#5634EA",
      darkColor: "#7C69FF",
      href: "#",
    },
    {
      name: "Ayarlar",
      icon: Settings,
      color: "#5634EA",
      darkColor: "#7C69FF",
      href: "#",
    },
  ];

  return (
    <div
      className={`w-[280px] bg-white dark:bg-[#1E1E1E] shadow-sm border-r border-gray-200 dark:border-gray-700 fixed left-0 top-0 h-full flex flex-col font-inter z-50 transition-transform duration-300 ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      {/* Mobile Close Button */}
      <div className="lg:hidden absolute top-4 right-4 z-10">
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 active:bg-gray-200 dark:active:bg-gray-600 transition-colors duration-200"
          aria-label="Close menu"
        >
          <X size={20} className="text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      {/* Brand Row */}
      <div className="pt-6 px-6 pb-8 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center">
          {/* Logo */}
          <div className="w-12 h-12 mr-4 bg-gradient-to-br from-orange-400 to-red-400 dark:from-orange-300 dark:to-red-300 rounded-lg flex items-center justify-center relative">
            <div className="w-8 h-8 bg-blue-500 dark:bg-blue-400 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-green-400 dark:bg-green-300 rounded-full"></div>
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-purple-500 dark:bg-purple-400 rounded-full flex items-center justify-center">
              <MapPin size={8} className="text-white" />
            </div>
          </div>
          <h1 className="text-[28px] font-poppins font-semibold text-black dark:text-white tracking-tight">
            TripGuider
          </h1>
        </div>
      </div>

      {/* Menu Section */}
      <div className="flex-1 px-6 py-6 overflow-y-auto scrollbar-hide">
        {/* Section Label */}
        <h2 className="text-[14px] font-poppins font-semibold text-black dark:text-white uppercase tracking-[0.02em] mb-4">
          MENÜ
        </h2>

        {/* Navigation List */}
        <div className="space-y-[14px]">
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            const itemColor = item.color;
            return (
              <div key={item.name}>
                <a
                  href={item.href}
                  className={`
                    flex items-center w-full px-5 py-[10px] rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md
                    ${
                      item.isActive
                        ? `bg-white dark:bg-[#262626] shadow-sm border-2`
                        : "bg-white dark:bg-[#262626] shadow-sm border border-transparent hover:shadow-lg active:shadow-sm hover:border-gray-200 dark:hover:border-gray-600"
                    }
                  `}
                  style={{
                    borderColor: item.isActive ? itemColor : "transparent",
                    boxShadow: item.isActive
                      ? `0 0 0 2px ${itemColor}`
                      : "0 1px 3px rgba(0, 0, 0, 0.04)",
                  }}
                  onClick={() => {
                    if (window.innerWidth < 1024) {
                      onClose();
                    }
                  }}
                >
                  {/* Icon Block */}
                  <div
                    className={`
                      w-11 h-11 rounded-xl flex items-center justify-center mr-4 transition-all duration-200
                    `}
                    style={{
                      backgroundColor: item.isActive
                        ? itemColor
                        : `${itemColor}20`,
                    }}
                  >
                    <IconComponent
                      size={20}
                      className={item.isActive ? "text-white" : "text-current"}
                      style={{ color: item.isActive ? "white" : itemColor }}
                    />
                  </div>

                  {/* Text Label */}
                  <span className="text-[15px] font-inter text-black dark:text-white flex-1">
                    {item.name}
                  </span>
                </a>
              </div>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600&family=Inter:wght@400;500&display=swap');
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
      `}</style>
    </div>
  );
}