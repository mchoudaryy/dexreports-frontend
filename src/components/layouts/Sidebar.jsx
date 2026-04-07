// Sidebar.jsx
import { useState, useEffect, useMemo } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, ChevronUp, Network, X, Wallet, LogOut, Coins, Users, Settings, Layers, FileSpreadsheet } from "lucide-react";
import clsx from "clsx";
import { sidebarMenu } from "./sidebarMenu";
import { ADMIN_API } from "../../services/ApiHandlers";
import { useAuth } from "../../context/useAuth";

export const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const [openMenu, setOpenMenu] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();
  const [tokens, setTokens] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [tokensLoading, setTokensLoading] = useState(true);
  const [tokensError, setTokensError] = useState(null);
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    const fetchNetworks = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.log("No auth token found");
        return;
      }
      try {
        const response = await ADMIN_API.GET_ACTIVE_NETWORKS();
        // console.log("GET_ACTIVE_NETWORKS API response:", response);

        if (response.data?.data) {
          setNetworks(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch networks:", error);
      }
    };

    fetchNetworks();
  }, []);

  const fetchGetTokens = async () => {
    try {
      setTokensLoading(true);
      setTokensError(null);
      const response = await ADMIN_API.GET_TOKENS();
      // console.log("Tokens API response:", response);

      if (response && response.status === 200) {
        // Handle different response structures
        let tokensData = [];
        if (response.data && Array.isArray(response.data.data)) {
          tokensData = response.data.data;
        } else if (Array.isArray(response.data)) {
          tokensData = response.data;
        } else if (Array.isArray(response)) {
          tokensData = response;
        }

        const normalizedTokens = tokensData.map((token) => ({
          _id: token._id,
          name: token.name,
          chainId: token.chainId,
          networkId: token.networkId,
          platformId: token.platformId,
          address: token.tokenAddress,
          token_logo_url: token.token_logo_url,
        }));

        // Save networkId to localStorage only if chainId is "solana"
        if (normalizedTokens.length > 0) {
          const solanaToken = normalizedTokens.find(
            (token) => token.chainId === "solana" && token.networkId
          );
          if (solanaToken) {
            window.localStorage.setItem(
              "RaydiumNetworkId",
              solanaToken.networkId
            );
          }
        }

        setTokens(normalizedTokens);
      }
    } catch (error) {
      console.error("Error in fetchGetTokens:", error);
      setTokensError(error.message || "Failed to load tokens");
      setTokens([]);
    } finally {
      setTokensLoading(false);
    }
  };

  useEffect(() => {
    fetchGetTokens();
  }, []);

  // Memoize the menu to prevent unnecessary recalculations
  const menu = useMemo(() => {
    if (tokensLoading) {
      // console.log("Still loading, returning sidebarMenu");
      return sidebarMenu;
    }

    // console.log("networks from menu", networks);

    const networksMenuItem =
      networks && networks.length > 0
        ? {
            title: "Tokens",
            icon: <Coins size={20} />,
            children: networks.map((network) => ({
              title: network.name,
              path: `/network=${network._id}`,
              networkId: network._id,
              networkName: network.name,
            })),
          }
        : null;

    const tokensMenuItem =
      tokens && tokens.length > 0 && user?.role !== "superuser"
        ? {
            title: "Wallets",
            icon: <Wallet size={20} />,
            children: tokens.map((token) => ({
              title: `${token.name}`,
              path: `/wallet/${token._id}/${token.address}`,
              tokenId: token._id,
              tokenName: token.name,
            })),
          }
        : null;

    const adminMenuItem =
      user?.role?.toLowerCase() === "superadmin" || user?.role?.toLowerCase() === "admin"
        ? {
            title: "Admin",
            icon: <Users size={20} />,
            children: [
              { title: "User Management", path: "/admin/users" },
              { title: "Add Network", path: "/admin/network" },
              { title: "Add Platform", path: "/admin/platform" },
              { title: "Add Tokens", path: "/admin/tokens" },
              { title: "Add wallets", path: "/admin/wallets-data" },
              { title: "Add Pool Wallets", path: "/admin/pools-wallets-data" },
              { title: "MM Wallets", path: "/admin/mm-wallets" },
              { title: "Settings", path: "/admin/settings" },
            ],
          }
        : null;

    const auditMenuItem =
      user?.role?.toLowerCase() === "superadmin"
        ? {
            title: "Wallet Audit",
            icon: <FileSpreadsheet size={20} />,
            path: "/audit",
          }
        : null;

    const newMenu = [
      ...sidebarMenu.slice(0, 3), // Dashboard, Tollgate Pools, Cross Engine Pools
      ...(networksMenuItem ? [networksMenuItem] : []),
      ...(tokensMenuItem ? [tokensMenuItem] : []),
      ...(auditMenuItem ? [auditMenuItem] : []),
      ...(adminMenuItem ? [adminMenuItem] : []),
      ...sidebarMenu.slice(3),
    ];

    // console.log("Final menu structure:", newMenu);
    return newMenu;
  }, [networks, tokens, tokensLoading, user?.role]);

  // Derived flags for presence of networks/tokens
  const hasNetworks = networks && networks.length > 0;
  const hasTokens = tokens && tokens.length > 0;

  // Log rendering information only when these specific values change
  useEffect(() => {
    // console.log("Rendering sidebar with:", {
    //   menuItems: menu.length,
    //   hasNetworks,
    //   hasTokens,
    //   tokensError,
    // });
  }, [menu.length, hasNetworks, hasTokens, tokensError]);

  // Handle network click - navigate to tokens page with network ID
  const handleNetworkClick = (networkId, e) => {
    e.preventDefault();
    navigate(`/tokens/${networkId}`);
    setOpenMenu(null); // Close all dropdowns
  };

  // Handle token click - navigate to wallet page with token ID
  const handleTokenClick = (child, e) => {
    console.log("child", child);
    e.preventDefault();
    navigate(child.path);
    setOpenMenu(null); // Close all dropdowns
  };

  // Check if a path is active
  const isPathActive = (path) => {
    // Special handling for /tokens and /wallet
    if (path === "/tokens") {
      return location.pathname.includes("/tokens");
    }
    if (path === "/wallet") {
      return location.pathname.includes("/wallet");
    }
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  // Check if a parent menu has active children
  const hasActiveChild = (menuItem) => {
    if (!menuItem.children) return false;
    return menuItem.children.some((child) => {
      if (child.networkId) {
        // For network items, check both query param and path param
        const urlParams = new URLSearchParams(location.search);
        const pathParts = location.pathname.split("/");
        const pathNetworkId = pathParts.includes("tokens") ? pathParts[pathParts.indexOf("tokens") + 1] : null;
        
        return urlParams.get("network") === child.networkId || pathNetworkId === child.networkId;
      }
      if (child.tokenId) {
        // For token items, check if current path matches the wallet path pattern
        return location.pathname.startsWith(`/wallet/${child.tokenId}`);
      }
      return isPathActive(child.path);
    });
  };

  // Auto-open dropdown for active route and set active parent
  useEffect(() => {
    const activeParent = menu.find(
      (item) => item.children && hasActiveChild(item)
    );
    if (activeParent) {
      setOpenMenu(activeParent.title);
    }
  }, [location.pathname, location.search, menu]);

  const handleToggle = (menuTitle) => {
    setOpenMenu((prev) => (prev === menuTitle ? null : menuTitle));
  };

  // Handle direct navigation click (for non-dropdown items)
  const handleDirectNavigation = () => {
    setOpenMenu(null); // Close all dropdowns
    if (window.innerWidth < 1024) {
      setSidebarOpen(false); // Close sidebar on mobile
    }
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

  // Show loading state ONLY if both networks and tokens are loading
  if (tokensLoading) {
    return (
      <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-white via-gray-50 to-orange-50/30 text-gray-800 shadow-xl border-r border-gray-200/60 backdrop-blur-sm">
        <div className="h-20 flex items-center justify-center border-b border-gray-200/60 bg-white/80 backdrop-blur-sm px-4">
          <div className="flex items-center gap-3">
            <img src="/StringMetaverseLogo-1.png" alt="String DEX Logo" className="w-10 h-10 object-contain" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-[#FF6B00] to-[#FFB800] bg-clip-text text-transparent tracking-wide">
              String DEX
            </h1>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-2">Loading data...</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Desktop Sidebar - Visible on large screens */}
      <aside className="hidden lg:flex flex-col w-64 bg-gradient-to-b from-white via-gray-50 to-orange-50/30 text-gray-800 shadow-xl border-r border-gray-200/60 backdrop-blur-sm">
        {/* Header */}
        <div className="h-20 flex items-center justify-center border-b border-gray-200/60 bg-white/80 backdrop-blur-sm px-4">
          <div className="flex items-center gap-3">
            <img src="/StringMetaverseLogo-1.png" alt="String DEX Logo" className="w-10 h-10 object-contain" />
            <h1 className="text-2xl font-black bg-gradient-to-r from-[#FF6B00] to-[#FFB800] bg-clip-text text-transparent tracking-wide">
              String DEX
            </h1>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {menu.map((item, index) => {
            const isActiveParent = hasActiveChild(item);
            const isDirectActive = !item.children && isPathActive(item.path);
            const isOpen = openMenu === item.title;

            return (
              <div key={index} className="space-y-1">
                {!item.children ? (
                  item.externalUrl ? (
                    <button
                      onClick={() => (window.location.href = item.externalUrl)}
                      className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-500 ease-out border-2 border-transparent relative w-full text-left text-gray-600 hover:bg-white/90 hover:shadow-lg hover:scale-[1.02] hover:text-gray-900 hover:border-orange-200/60 bg-white/50 backdrop-blur-sm"
                    >
                      <div className="transition-all duration-500 ease-out group-hover:scale-110 z-10 text-gray-500 group-hover:text-orange-600">
                        {item.icon}
                      </div>
                      <span className="flex-1 font-medium z-10">
                        {item.title}
                      </span>
                    </button>
                  ) : (
                    <NavLink
                      to={item.path}
                      onClick={handleDirectNavigation}
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
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-r-full shadow-lg shadow-orange-500/50 transition-all duration-500"></div>
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
                  )
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
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-orange-400 to-orange-600 rounded-r-full shadow-lg shadow-orange-500/50 transition-all duration-500"></div>
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

                    <div
                      className={clsx(
                        "ml-4 pl-4 border-l-2 border-gray-200/60 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] space-y-1",
                        isOpen || isActiveParent
                          ? "max-h-96 opacity-100 mt-2 translate-y-0"
                          : "max-h-0 opacity-0 -translate-y-2"
                      )}
                    >
                      {item.children.map((child, i) => {
                        const isChildActive = child.networkId
                          ? (new URLSearchParams(location.search).get("network") === child.networkId || 
                             (location.pathname.startsWith("/tokens/") && location.pathname.split("/")[2] === child.networkId))
                          : child.tokenId
                          ? location.pathname.startsWith(
                              `/wallet/${child.tokenId}`
                            )
                          : isPathActive(child.path);

                        return child.networkId ? (
                          <button
                            key={i}
                            onClick={(e) => {
                              handleNetworkClick(child.networkId, e);
                              handleDirectNavigation();
                            }}
                            className={clsx(
                              "block w-full text-left px-4 py-2.5 text-sm rounded-lg transition-all duration-500 ease-out font-medium border-2 border-transparent relative group",
                              isChildActive
                                ? "bg-gradient-to-r from-[#FF6B00] to-[#FFB800] text-white shadow-2xl shadow-orange-500/40 scale-[1.02] border-orange-400 transform transition-all duration-500"
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
                                  isChildActive
                                    ? "text-white font-medium"
                                    : "text-gray-600"
                                )}
                              >
                                {child.title}
                              </span>
                              {isChildActive && (
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse ml-auto transition-all duration-500"></div>
                              )}
                            </div>
                          </button>
                        ) : child.tokenId ? (
                          <button
                            key={i}
                            onClick={(e) => {
                              handleTokenClick(child, e);
                              handleDirectNavigation();
                            }}
                            className={clsx(
                              "block w-full text-left px-4 py-2.5 text-sm rounded-lg transition-all duration-500 ease-out font-medium border-2 border-transparent relative group",
                              isChildActive
                                ? "bg-gradient-to-r from-[#FF6B00] to-[#FFB800] text-white shadow-2xl shadow-orange-500/40 scale-[1.02] border-orange-400 transform transition-all duration-500"
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
                                  isChildActive
                                    ? "text-white font-medium"
                                    : "text-gray-600"
                                )}
                              >
                                {child.title}
                              </span>
                              {isChildActive && (
                                <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse ml-auto transition-all duration-500"></div>
                              )}
                            </div>
                          </button>
                        ) : (
                          <NavLink
                            key={i}
                            to={child.path}
                            onClick={handleDirectNavigation}
                            className={clsx(
                              "block px-4 py-2.5 text-sm rounded-lg transition-all duration-500 ease-out font-medium border-2 border-transparent relative group",
                              isChildActive
                                ? "bg-gradient-to-r from-[#FF6B00] to-[#FFB800] text-white shadow-2xl shadow-orange-500/40 scale-[1.02] border-orange-400 transform transition-all duration-500"
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
                                  isChildActive
                                    ? "text-white font-medium"
                                    : "text-gray-600"
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
          {menu.map((item, index) => {
            const isActiveParent = hasActiveChild(item);
            const isDirectActive = !item.children && isPathActive(item.path);
            const isOpen = openMenu === item.title;

            return (
              <div key={index} className="space-y-1">
                {!item.children ? (
                  item.externalUrl ? (
                    <button
                      onClick={() => {
                        window.location.href = item.externalUrl;
                        setSidebarOpen(false);
                      }}
                      className="group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-500 ease-out border-2 border-transparent relative w-full text-left text-gray-600 hover:bg-white/90 hover:shadow-lg hover:scale-[1.02] hover:text-gray-900 hover:border-orange-200/60 bg-white/50 backdrop-blur-sm"
                    >
                      <div className="transition-all duration-500 ease-out group-hover:scale-110 z-10 text-gray-500 group-hover:text-orange-600">
                        {item.icon}
                      </div>
                      <span className="flex-1 font-medium z-10">
                        {item.title}
                      </span>
                    </button>
                  ) : (
                    <NavLink
                      to={item.path}
                      onClick={handleDirectNavigation}
                      className={({ isActive }) =>
                        clsx(
                          "group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-500 ease-out border-2 border-transparent relative",
                          isActive || isDirectActive
                            ? "bg-gradient-to-r from-[#FF6B00] to-[#FFB800] text-white shadow-2xl shadow-orange-500/40 scale-[1.02] border-orange-400"
                            : "text-gray-600 hover:bg-white/90 hover:shadow-lg hover:scale-[1.02] hover:text-gray-900 hover:border-orange-200/60 bg-white/50 backdrop-blur-sm"
                        )}
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
                  )
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
                        "ml-4 pl-4 border-l-2 border-gray-200/60 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] space-y-1",
                        isOpen || isActiveParent
                          ? "max-h-96 opacity-100 mt-2 translate-y-0"
                          : "max-h-0 opacity-0 -translate-y-2"
                      )}
                    >
                      {item.children.map((child, i) => {
                        const isChildActive = child.networkId
                          ? (new URLSearchParams(location.search).get("network") === child.networkId || 
                             (location.pathname.startsWith("/tokens/") && location.pathname.split("/")[2] === child.networkId))
                          : child.tokenId
                          ? location.pathname.startsWith(
                              `/wallet/${child.tokenId}`
                            )
                          : isPathActive(child.path);

                        return child.networkId ? (
                          <button
                            key={i}
                            onClick={(e) => {
                              handleNetworkClick(child.networkId, e);
                              handleDirectNavigation();
                            }}
                            className={clsx(
                              "block w-full text-left px-4 py-2.5 text-sm rounded-lg transition-all duration-500 ease-out font-medium border-2 border-transparent relative group",
                              isChildActive
                                ? "bg-gradient-to-r from-[#FF6B00] to-[#FFB800] text-white shadow-2xl shadow-orange-500/40 scale-[1.02] border-orange-400 transform transition-all duration-500"
                                : "text-gray-500 hover:text-gray-700 hover:bg-white/80 hover:scale-[1.01] hover:border-orange-200/60 backdrop-blur-sm"
                            )}
                          >
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
                                  isChildActive ? "text-white" : "text-gray-600"
                                )}
                              >
                                {child.title}
                              </span>
                            </div>
                          </button>
                        ) : child.tokenId ? (
                          <button
                            key={i}
                            onClick={(e) => {
                              handleTokenClick(child, e);
                              handleDirectNavigation();
                            }}
                            className={clsx(
                              "block w-full text-left px-4 py-2.5 text-sm rounded-lg transition-all duration-500 ease-out font-medium border-2 border-transparent relative group",
                              isChildActive
                                ? "bg-gradient-to-r from-[#FF6B00] to-[#FFB800] text-white shadow-2xl shadow-orange-500/40 scale-[1.02] border-orange-400 transform transition-all duration-500"
                                : "text-gray-500 hover:text-gray-700 hover:bg-white/80 hover:scale-[1.01] hover:border-orange-200/60 backdrop-blur-sm"
                            )}
                          >
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
                                  isChildActive ? "text-white" : "text-gray-600"
                                )}
                              >
                                {child.title}
                              </span>
                            </div>
                          </button>
                        ) : (
                          <NavLink
                            key={i}
                            to={child.path}
                            onClick={handleDirectNavigation}
                            className={clsx(
                              "block px-4 py-2.5 text-sm rounded-lg transition-all duration-500 ease-out font-medium border-2 border-transparent relative group",
                              isChildActive
                                ? "bg-gradient-to-r from-[#FF6B00] to-[#FFB800] text-white shadow-2xl shadow-orange-500/40 scale-[1.02] border-orange-400 transform transition-all duration-500"
                                : "text-gray-500 hover:text-gray-700 hover:bg-white/80 hover:scale-[1.01] hover:border-orange-200/60 backdrop-blur-sm"
                            )}
                          >
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
                                  isChildActive ? "text-white" : "text-gray-600"
                                )}
                              >
                                {child.title}
                              </span>
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

        {/* Mobile Footer */}
        <div className="p-4 border-t border-orange-200/60 bg-transparent">
          <button
            onClick={() => setShowLogoutModal(true)}
            className="w-full px-4 py-2.5 text-sm text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 flex items-center justify-center gap-2 rounded-xl shadow-lg shadow-orange-200 hover:shadow-orange-300 hover:scale-[1.02] transform font-bold active:scale-95"
          >
            <LogOut size={18} className="text-white font-bold" />
            Logout
          </button>
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white/90 backdrop-blur-lg rounded-2xl shadow-xl max-w-md w-full p-6 border border-orange-200/60">
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
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors duration-200 flex items-center gap-2"
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
