import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronUp,
  X,
  Users,
  LayoutDashboard,
  Network,
  Coins,
  Layers,
  Wallet,
  LogOut,
  Settings,
} from "lucide-react";
import clsx from "clsx";
import { useAuth } from "../../context/useAuth";

export const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const adminMenu = [
    {
      title: "User Management",
      icon: <Users size={20} />,
      path: "/admin/users",
    },
    {
      title: "Network",
      icon: <Network size={20} />,
      path: "/admin/network",
    },
    {
      title: "Platform",
      icon: <Layers size={20} />,
      path: "/admin/platform",
    },
    {
      title: "Tokens",
      icon: <Coins size={20} />,
      path: "/admin/tokens",
    },
    {
      title: "Wallets Data",
      icon: <Wallet size={20} />,
      path: "/admin/wallets-data",
    },
    {
      title: "Pools Wallets Data",
      icon: <Wallet size={20} />,
      path: "/admin/pools-wallets-data",
    },
    {
      title: "Settings",
      icon: <Settings size={20} />,
      path: "/admin/settings",
    },
  ];

  // Check if a path is active
  const isPathActive = (path) => {
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  // Check if a parent menu has active children
  const hasActiveChild = (menuItem) => {
    if (!menuItem.children) return false;
    return menuItem.children.some((child) => isPathActive(child.path));
  };

  // Auto-open dropdown for active route and set active parent
  useEffect(() => {
    const activeParent = adminMenu.find(
      (item) => item.children && hasActiveChild(item)
    );
    setOpenMenu(activeParent ? activeParent.title : null);
  }, [location.pathname]);

  const handleToggle = (menuTitle) => {
    setOpenMenu((prev) => (prev === menuTitle ? null : menuTitle));
  };

  const handleLogout = async () => {
    try {
      localStorage.clear();
      sessionStorage.clear();
      await logout();
      setShowLogoutModal(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarOpen && !event.target.closest(".sidebar-container")) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [sidebarOpen, setSidebarOpen]);

  return (
    <>
      {/* Desktop Sidebar - Visible on large screens */}
      <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-white via-orange-50 to-orange-50/30 text-gray-800 shadow-xl border-r border-gray-200/60 backdrop-blur-sm">
        {/* Header */}
        <div className="h-24 flex items-center px-6 border-b border-gray-200/60 bg-white/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-amber-600 p-2 shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform duration-500">
              <img
                src="/StringMetaverseLogo-1.png"
                alt="Logo"
                className="w-full h-full object-contain brightness-0 invert"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-black bg-gradient-to-r from-[#FF6B00] to-[#FFB800] bg-clip-text text-transparent tracking-tight leading-none">
                String DEX
              </span>
              <span className="text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase mt-1">
                Admin Panel
              </span>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {adminMenu.map((item, index) => {
            const isActiveParent = hasActiveChild(item);
            const isDirectActive = !item.children && isPathActive(item.path);
            const isOpen = openMenu === item.title;

            return (
              <div key={index} className="space-y-1">
                {!item.children ? (
                  <NavLink
                    to={item.path}
                    className={({ isActive }) =>
                      clsx(
                        "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-500 ease-out border-2 border-transparent relative",
                        isActive || isDirectActive
                          ? "bg-gradient-to-r from-[#FF6B00] to-[#FFB800] text-white shadow-2xl shadow-orange-500/40 scale-[1.02] border-orange-400 transform transition-all duration-500"
                          : "text-gray-600 hover:bg-white/90 hover:shadow-lg hover:scale-[1.02] hover:text-gray-900 hover:border-orange-200/60 bg-white/50 backdrop-blur-sm"
                      )
                    }
                  >
                    {/* Active indicator bar */}
                    {(isPathActive(item.path) || isDirectActive) && (
                      <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-orange-400 to-amber-500 rounded-r-full shadow-lg shadow-orange-500/50 transition-all duration-500"></div>
                    )}

                    <div
                      className={clsx(
                        "transition-all duration-500 ease-out group-hover:scale-110 z-10",
                        isPathActive(item.path) || isDirectActive
                          ? "text-white scale-110"
                          : "text-gray-500 group-hover:text-orange-600"
                      )}
                    >
                      {item.icon}
                    </div>
                    <span className="flex-1 font-medium z-10">
                      {item.title}
                    </span>
                    {(isPathActive(item.path) || isDirectActive) && (
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse z-10"></div>
                    )}
                  </NavLink>
                ) : (
                  <>
                    <button
                      onClick={() => handleToggle(item.title)}
                      className={clsx(
                        "group flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-500 ease-out border-2 relative",
                        isOpen || isActiveParent
                          ? "bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-700 shadow-lg scale-[1.02] border-orange-300/60 backdrop-blur-sm"
                          : "text-gray-600 hover:bg-white/90 hover:shadow-lg hover:scale-[1.02] hover:text-gray-900 border-transparent hover:border-orange-200/60 bg-white/50 backdrop-blur-sm"
                      )}
                    >
                      {/* Active indicator bar for parent */}
                      {isActiveParent && (
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-orange-400 to-amber-500 rounded-r-full shadow-lg shadow-orange-500/50 transition-all duration-500"></div>
                      )}

                      <div className="flex items-center gap-3 z-10">
                        <div
                          className={clsx(
                            "transition-all duration-500 ease-out group-hover:scale-110",
                            isOpen || isActiveParent
                              ? "text-orange-600 scale-110"
                              : "text-gray-500 group-hover:text-orange-600"
                          )}
                        >
                          {item.icon}
                        </div>
                        <span
                          className={clsx(
                            "font-medium transition-colors duration-300",
                            isOpen || isActiveParent
                              ? "text-orange-700"
                              : "text-gray-600"
                          )}
                        >
                          {item.title}
                        </span>
                      </div>
                      {isOpen || isActiveParent ? (
                        <ChevronUp
                          size={16}
                          className="text-orange-600 transition-all duration-500 ease-out scale-110 z-10"
                        />
                      ) : (
                        <ChevronDown
                          size={16}
                          className="text-gray-400 transition-all duration-500 ease-out group-hover:text-orange-600 group-hover:scale-110 z-10"
                        />
                      )}
                    </button>

                    {/* Dropdown Menu */}
                    <div
                      className={clsx(
                        "ml-4 pl-4 border-l-2 border-gray-200/60 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] space-y-1",
                        isOpen || isActiveParent
                          ? "max-h-96 opacity-100 mt-2 translate-y-0"
                          : "max-h-0 opacity-0 -translate-y-2"
                      )}
                    >
                      {item.children.map((child, i) => {
                        const isChildActive = isPathActive(child.path);

                        return (
                          <NavLink
                            key={i}
                            to={child.path}
                            className={clsx(
                              "block px-4 py-2.5 text-sm rounded-lg transition-all duration-500 ease-out font-medium border-2 border-transparent relative",
                              isChildActive
                                ? "bg-gradient-to-r from-[#FF6B00] to-[#FFB800] text-white font-semibold scale-[1.02] shadow-lg border-orange-400 backdrop-blur-sm"
                                : "text-gray-500 hover:text-gray-700 hover:bg-white/80 hover:scale-[1.01] hover:border-orange-200/60 backdrop-blur-sm"
                            )}
                          >
                            {/* Active indicator for child */}
                            {isChildActive && (
                              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-lg transition-all duration-500"></div>
                            )}

                            <div className="flex items-center gap-3 z-10">
                              <div
                                className={clsx(
                                  "w-2 h-2 rounded-full transition-all duration-500 ease-out",
                                  isChildActive
                                    ? "bg-white scale-125"
                                    : "bg-gray-300 group-hover:bg-orange-400 group-hover:scale-110"
                                )}
                              />
                              <span
                                className={clsx(
                                  "transition-colors duration-300",
                                  isChildActive ? "text-white" : "text-gray-500"
                                )}
                              >
                                {child.title}
                              </span>
                              {isChildActive && (
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse ml-auto transition-all duration-500"></div>
                              )}
                            </div>
                          </NavLink>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200/60 bg-transparent space-y-3">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse transition-all duration-500"></div>
              <span className="text-xs text-gray-500 font-medium">Admin</span>
            </div>
            <p className="text-xs text-gray-400">v1.0.0</p>
          </div>
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full px-4 py-2.5 text-sm text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:scale-[1.02] transform font-bold active:scale-95"
          >
            <LogOut size={18} className="text-white font-bold" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      <div
        className={clsx(
          "fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-all duration-500 ease-out lg:hidden",
          sidebarOpen ? "opacity-100 visible" : "opacity-0 invisible"
        )}
        onClick={() => setSidebarOpen(false)}
      ></div>

      {/* Mobile Sidebar */}
      <aside
        className={clsx(
          "sidebar-container fixed inset-y-0 left-0 w-80 bg-gradient-to-b from-white via-orange-50 to-orange-50/30 text-gray-800 shadow-2xl border-r border-gray-200/60 backdrop-blur-sm transform transition-all duration-500 ease-out z-50 lg:hidden",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Mobile Header */}
        <div className="h-24 flex items-center justify-between border-b border-gray-200/60 bg-white/80 backdrop-blur-sm px-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-amber-600 p-2 shadow-lg shadow-orange-200">
              <img
                src="/StringMetaverseLogo-1.png"
                alt="Logo"
                className="w-full h-full object-contain brightness-0 invert"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black bg-gradient-to-r from-[#FF6B00] to-[#FFB800] bg-clip-text text-transparent tracking-tight leading-none">
                String DEX
              </span>
              <span className="text-[9px] font-bold text-gray-400 tracking-[0.2em] uppercase mt-1">
                Admin Panel
              </span>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="p-2 rounded-xl hover:bg-gray-100/80 transition-all duration-500 ease-out hover:scale-110 border border-gray-200/60"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {adminMenu.map((item, index) => {
            const isActiveParent = hasActiveChild(item);
            const isDirectActive = !item.children && isPathActive(item.path);
            const isOpen = openMenu === item.title;

            return (
              <div key={index} className="space-y-1">
                {!item.children ? (
                  <NavLink
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={({ isActive }) =>
                      clsx(
                        "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-500 ease-out border-2 border-transparent relative",
                        isActive || isDirectActive
                          ? "bg-gradient-to-r from-[#FF6B00] to-[#FFB800] text-white shadow-2xl shadow-orange-500/40 scale-[1.02] border-orange-400"
                          : "text-gray-600 hover:bg-white/90 hover:shadow-lg hover:scale-[1.02] hover:text-gray-900 hover:border-orange-200/60 bg-white/50 backdrop-blur-sm"
                      )
                    }
                  >
                    <div
                      className={clsx(
                        "transition-all duration-500 ease-out group-hover:scale-110 z-10",
                        isPathActive(item.path) || isDirectActive
                          ? "text-white scale-110"
                          : "text-gray-500 group-hover:text-orange-600"
                      )}
                    >
                      {item.icon}
                    </div>
                    <span className="flex-1 font-medium z-10">
                      {item.title}
                    </span>
                  </NavLink>
                ) : (
                  <>
                    <button
                      onClick={() => handleToggle(item.title)}
                      className={clsx(
                        "group flex items-center justify-between w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-500 ease-out border-2 relative",
                        isOpen || isActiveParent
                          ? "bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-700 shadow-lg scale-[1.02] border-orange-300/60 backdrop-blur-sm"
                          : "text-gray-600 hover:bg-white/90 hover:shadow-lg hover:scale-[1.02] hover:text-gray-900 border-transparent hover:border-orange-200/60 bg-white/50 backdrop-blur-sm"
                      )}
                    >
                      <div className="flex items-center gap-3 z-10">
                        <div
                          className={clsx(
                            "transition-all duration-500 ease-out group-hover:scale-110",
                            isOpen || isActiveParent
                              ? "text-orange-600 scale-110"
                              : "text-gray-500 group-hover:text-orange-600"
                          )}
                        >
                          {item.icon}
                        </div>
                        <span className="font-medium">{item.title}</span>
                      </div>
                      {isOpen || isActiveParent ? (
                        <ChevronUp size={16} className="text-orange-600" />
                      ) : (
                        <ChevronDown size={16} className="text-gray-400" />
                      )}
                    </button>

                    <div
                      className={clsx(
                        "ml-4 pl-4 border-l-2 border-gray-200/60 overflow-hidden transition-all duration-300 space-y-1",
                        isOpen || isActiveParent
                          ? "max-h-96 opacity-100 mt-2"
                          : "max-h-0 opacity-0"
                      )}
                    >
                      {item.children.map((child, i) => (
                        <NavLink
                          key={i}
                          to={child.path}
                          onClick={() => setSidebarOpen(false)}
                          className={({ isActive }) =>
                            clsx(
                              "block px-4 py-2.5 text-sm rounded-lg transition-all duration-200 font-medium",
                              isActive
                                ? "bg-orange-100 text-orange-700"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                            )
                          }
                        >
                          {child.title}
                        </NavLink>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl max-w-md w-full p-6 border border-gray-200/60">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 mb-4">
                <LogOut className="h-6 w-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Confirm Logout
              </h3>
              <p className="text-gray-600 mb-6">
                Are you sure you want to logout? You'll need to sign in again to
                access your account.
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100/80 hover:bg-gray-200/80 rounded-xl transition-colors duration-200 border border-gray-200/60"
                >
                  Cancel
                </button>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors duration-200 flex items-center gap-2"
                >
                  <LogOut size={16} />
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
