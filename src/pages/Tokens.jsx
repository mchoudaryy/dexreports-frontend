import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import {
  Search,
  TrendingUp,
  TrendingDown,
  ChevronDown,
  Sparkles,
  ExternalLink,
  Loader,
  Clock,
  RefreshCw,
  MoreVertical,
  Zap,
  Crown,
  Filter,
  Copy,
  Check,
} from "lucide-react";
import { ADMIN_API } from "../services/ApiHandlers";

// Debounce hook for search
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const Tokens = () => {
  // Utility to format numbers as k, m, b, etc.
  const formatNumber = (num, opts = {}) => {
    if (num === null || num === undefined || isNaN(num)) return "0";
    const absNum = Math.abs(num);
    if (absNum >= 1e9) return (num / 1e9).toFixed(2).replace(/\.00$/, "") + "B";
    if (absNum >= 1e6) return (num / 1e6).toFixed(2).replace(/\.00$/, "") + "M";
    if (absNum >= 1e3) return (num / 1e3).toFixed(2).replace(/\.00$/, "") + "K";
    if (opts.fixed) return Number(num).toFixed(opts.fixed);
    return num.toString();
  };
  const navigate = useNavigate();
  const { networkId: paramNetworkId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();

  // Debugging logs
  const networkId = paramNetworkId || searchParams.get("network");

  const networkName = searchParams.get("networkName");

  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [timeframe, setTimeframe] = useState("h24");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  // State for data
  const [vNetworks, setVNetworks] = useState({});
  const [vPlatforms, setVPlatforms] = useState([]);
  const [vTokens, setVTokens] = useState([]);
  const [paginationData, setPaginationData] = useState({
    tokensInPage: 0,
    totalPages: 1,
    totalTokens: 0,
  });

  const [tokenAddressFilter, setTokenAddressFilter] = useState("");
  const [copiedAddress, setCopiedAddress] = useState(null);

  // Utility functions for tab color
  const getRandomColor = useCallback((seed) => {
    const colors = [
      "from-purple-500 to-pink-500",
      "from-blue-500 to-cyan-500",
      "from-green-500 to-emerald-500",
      "from-orange-500 to-red-500",
      "from-yellow-500 to-amber-500",
    ];
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }, []);

  const getPlatformColor = useCallback(
    (platformName) => {
      if (!platformName) return "from-purple-500 to-blue-500";
      const platformColors = {
        raydium: "from-green-500 to-emerald-600",
        "pump.fun": "from-orange-500 to-red-600",
        jupiter: "from-purple-500 to-pink-600",
        orca: "from-cyan-500 to-blue-600",
      };
      const normalizedName = platformName.toLowerCase().replace(/\s+/g, "");
      return platformColors[normalizedName] || getRandomColor(platformName);
    },
    [getRandomColor],
  );

  // Tabs are built from vPlatforms, so we need to memoize them after vPlatforms is declared
  const tabs = useMemo(() => {
    const baseTabs = [
      {
        id: "All",
        label: "All Platforms",
        color: "from-purple-500 to-blue-500",
        icon: <Crown size={16} />,
      },
    ];
    console.log("vPlatforms in tabs", vPlatforms);

    const vPlatformTabs = vPlatforms.map((platform) => ({
      id: platform._id,
      label: platform.platform,
      color: getPlatformColor(platform.platform),
      // icon: <Zap size={16} />,
    }));
    return [...baseTabs, ...vPlatformTabs];
  }, [vPlatforms, getPlatformColor]);

  // Get initial tab from URL param
  const platformTabId = searchParams.get("platformTab") || "All";
  const initialTab = useMemo(
    () => tabs.find((t) => t.id === platformTabId) || tabs[0],
    [tabs, platformTabId],
  );
  const [activeTab, setActiveTab] = useState(initialTab);

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // API calls
  const fetchGetActiveNetworks = async () => {
    try {
      const response = await ADMIN_API.GET_ACTIVE_NETWORKS();
      // console.log("GET_ACTIVE_NETWORKS response:", response);
      if (response && response.status === 200 && response.data.data) {
        const networksList = Array.isArray(response.data.data)
          ? response.data.data
          : [response.data.data];

        if (networkId) {
          const selectedNetwork = networksList.find((n) => n._id === networkId);
          if (selectedNetwork) {
            setVNetworks(selectedNetwork);
            return;
          }
        }

        if (networksList.length > 0) {
          setVNetworks(networksList[0]);
        }
      }
    } catch (error) {
      console.error("Error fetching networks:", error);
    }
  };

  const fetchGetActivePlatforms = async () => {
    console.log("networkId in fetch get platforms", networkId);

    try {
      const response = await ADMIN_API.GET_ACTIVE_PLATFORMS({ networkId });
      console.log("GET_ACTIVE_PLATFORMS response:", response);

      if (response && response.status === 200) {
        setVPlatforms(response.data.data);
      } else {
        setVPlatforms([]);
        setError("No platforms found for this network");
      }
    } catch (error) {
      console.error("Error fetching platforms:", error);
      setVPlatforms([]);
    }
  };

  const fetchGetPaginatedTokens = async (
    platformId = activeTab.id,
    page = currentPage,
  ) => {
    setLoading(true);
    console.log("platformId in fetchGetPaginatedTokens:", platformId);
    

    try {
      const response = await ADMIN_API.GET_PAGINATED_TOKENS({
        chainId: vNetworks?.name?.toLowerCase(),
        platformId: platformId === "All" ? undefined : platformId,
        page: page,
        limit: rowsPerPage,
        tokenAddress: tokenAddressFilter,
      });

      console.log("GET_PAGINATED_TOKENS response:", response.data);

      // Make sure we're setting the tokens correctly
      if (response && response.status === 200) {
        setVTokens(response.data.tokens);
      } else {
        setVTokens([]);
      }

      setPaginationData({
        tokensInPage: response.data.tokensInPage || 0,
        totalPages: response.data.totalPages || 1,
        totalTokens: response.data.totalTokens || 0,
      });

      setLastUpdated(new Date());
      setError(null);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      setError("Failed to load tokens");
      setVTokens([]); // Clear tokens on error
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        fetchGetPaginatedTokens();
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [loading, activeTab, currentPage]);

  // Initial data fetch
  useEffect(() => {
    fetchGetActiveNetworks();
    fetchGetActivePlatforms();
  }, [networkId]);

  // Unified effect for token fetching
  useEffect(() => {
    if (vNetworks.name) {
      fetchGetPaginatedTokens();
    }
  }, [vNetworks, currentPage, rowsPerPage, tokenAddressFilter]);

  // Sync activeTab with URL param and tabs
  useEffect(() => {
    // If tabs change (e.g., after platforms load), update activeTab from param
    const tabFromParam = tabs.find((t) => t.id === platformTabId) || tabs[0];
    setActiveTab(tabFromParam);
  }, [tabs, platformTabId]);

  // Event handlers
  const vHandleTabSwitch = async (tab) => {
    setActiveTab(tab);
    setCurrentPage(1);
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("platformTab", tab.id);
      return newParams;
    });
    await fetchGetPaginatedTokens(tab.id, 1);
  };

  const handleTokenClick = useCallback(
    (token) => {
      console.log("token clicked:", token);

      if (token) {
        navigate(
          `/tokens/${token.dbInfo.networkId}/${token.dbInfo.platformId}/${token.dbInfo.tokenId}/${token.baseToken.address}`,
        );
      }
    },
    [networkId, navigate],
  );

  const handleRefresh = () => {
    fetchGetPaginatedTokens();
  };

  const handleCopy = async (address, e) => {
    e.stopPropagation(); // Prevent row/cell click
    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Filter tokens based on search
  const filteredTokens = useMemo(() => {
    if (!vTokens || vTokens.length === 0) return [];

    let result = [...vTokens];

    // Filter by search term
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase();
      result = result.filter((token) => {
        return (
          token.baseToken?.name?.toLowerCase().includes(searchLower) ||
          token.baseToken?.symbol?.toLowerCase().includes(searchLower)
        );
      });
    }

    // Sort by volume descending based on current timeframe
    return result.sort((a, b) => {
      const volA = Number(a.volume?.[timeframe]) || 0;
      const volB = Number(b.volume?.[timeframe]) || 0;
      return volB - volA;
    });
  }, [vTokens, debouncedSearchTerm, timeframe]);

  console.log("filteredTokens filteredTokens", filteredTokens);

  // Paginate tokens
  const paginatedTokens = filteredTokens;

  const truncateAddress = (address) => {
    if (!address || address === "N/A") return "N/A";
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Table columns configuration
  const tableColumns = [
    {
      key: "name",
      label: "Token",
      width: "min-w-[220px]",
      mobilePriority: true,
    },
    {
      key: "tokenAddress",
      label: "Token Address",
      width: "min-w-[200px]",
      mobilePriority: false,
    },
    {
      key: "price",
      label: "Price",
      width: "min-w-[120px]",
      mobilePriority: true,
    },
    {
      key: "change",
      label: "Price Change",
      width: "min-w-[120px]",
      mobilePriority: true,
    },
    {
      key: "volume",
      label: "Volume",
      width: "min-w-[130px]",
      mobilePriority: true,
    },
    {
      key: "marketCap",
      label: "Market Cap",
      width: "min-w-[130px]",
      mobilePriority: false,
    },
    {
      key: "transactions",
      label: "Transactions",
      width: "min-w-[110px]",
      mobilePriority: false,
    },
    {
      key: "buys",
      label: "Buys",
      width: "min-w-[90px]",
      mobilePriority: false,
    },
    {
      key: "sells",
      label: "Sells",
      width: "min-w-[90px]",
      mobilePriority: false,
    },
    /* {
      key: "lpMint",
      label: "LP Mint",
      width: "min-w-[200px]",
      mobilePriority: false,
    }, */
  ];

  // Component for token display
  const TokenDisplay = useCallback(
    ({ token }) => {
      const firstChar = token?.baseToken?.name?.charAt(0)?.toUpperCase() || "T";

      return (
        <div className="flex items-center space-x-3">
          <div className="relative">
            {token?.info?.imageUrl ? (
              <img
                src={token.info.imageUrl}
                alt={token.baseToken.name}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl object-cover shadow-lg border-2 border-white/20"
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.nextSibling.style.display = "flex";
                }}
              />
            ) : null}
            <div
              className={`w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br ${getRandomColor(
                token.baseToken.name,
              )} rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-lg border-2 border-white/20 ${
                token?.info?.imageUrl ? "hidden" : "flex"
              }`}
            >
              {firstChar}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-gray-900 group-hover:text-purple-600 transition-colors truncate max-w-[120px] sm:max-w-[140px]">
                {token?.baseToken?.name || "Unknown Token"}
              </span>
              <ExternalLink
                size={14}
                className="text-gray-400 group-hover:text-purple-500 opacity-0 group-hover:opacity-100 transition-all"
              />
            </div>
            <div className="text-xs text-gray-600 font-medium">
              {token?.baseToken?.symbol || "UNKNOWN"}
            </div>
            <div
              className={`text-xs px-2 py-1 rounded-full mt-1 inline-block border ${
                token?.dexId === "raydium"
                  ? "bg-gradient-to-r from-green-100/80 to-emerald-100/80 text-green-700 border-green-200/50"
                  : token?.dexId === "pump.fun"
                    ? "bg-gradient-to-r from-orange-100/80 to-red-100/80 text-orange-700 border-orange-200/50"
                    : "bg-gradient-to-r from-gray-100/80 to-gray-200/80 text-gray-700 border-gray-200/50"
              }`}
            >
              {token?.dexId || "Unknown"}
            </div>
          </div>
        </div>
      );
    },
    [getRandomColor],
  );

  // Mobile token card component
  const MobileTokenCard = useCallback(
    ({ token, index }) => {
      const change = token.priceChange?.[timeframe] ?? 0;
      const vol = token.volume?.[timeframe] ?? 0;
      const buys = token.txns?.[timeframe]?.buys ?? 0;
      const sells = token.txns?.[timeframe]?.sells ?? 0;
      const totalTxns = buys + sells;

      return (
        <div
          onClick={() => handleTokenClick(token)}
          className="relative bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 p-4 sm:p-6 hover:shadow-2xl transition-all duration-500 cursor-pointer group hover:border-purple-200/50"
          style={{ animation: `slideInUp 0.6s ease-out ${index * 100}ms both` }}
        >
          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4">
              <TokenDisplay token={token} />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-blue-50/80 to-cyan-50/80 rounded-2xl border border-blue-200/50">
                <div className="text-xs text-blue-600 mb-1 sm:mb-2 font-medium">
                  Price
                </div>
                <div className="text-sm font-bold text-gray-900">
                  ${formatNumber(token.priceUsd)}
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-green-50/80 to-emerald-50/80 rounded-2xl border border-green-200/50">
                <div className="text-xs text-green-600 mb-1 sm:mb-2 font-medium">
                  Change
                </div>
                <div
                  className={`text-sm font-bold ${
                    change >= 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {change >= 0 ? "+" : ""}
                  {formatNumber(change)}%
                </div>
              </div>
              <div className="text-center p-3 sm:p-4 bg-gradient-to-br from-purple-50/80 to-pink-50/80 rounded-2xl border border-purple-200/50">
                <div className="text-xs text-purple-600 mb-1 sm:mb-2 font-medium">
                  Volume
                </div>
                <div className="text-sm font-bold text-gray-900">
                  ${formatNumber(vol)}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    },
    [handleTokenClick, TokenDisplay, timeframe],
  );

  const rowsPerPageOptions = [10, 20, 50];
  const totalPages = Math.ceil(filteredTokens.length / rowsPerPage);
  const isLoading = loading;

  // Loading state
  if (loading && vTokens.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden min-h-screen">
        <div className="relative z-10 p-4 sm:p-6 md:p-8">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-600">Loading tokens...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative overflow-hidden">
      <div className="relative z-10 p-4 sm:p-6 md:p-8 mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-6 mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 sm:gap-4 mb-4">
                <div className="relative">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">
                    {networkName ? `${networkName} Tokens` : "All Tokens"}
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base mt-1 sm:mt-2">
                    Real-time analytics and performance metrics
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
              {lastUpdated && (
                <div className="text-xs sm:text-sm text-gray-500 bg-white/80 backdrop-blur-xl px-3 py-2 sm:px-4 sm:py-2.5 rounded-2xl border border-white/20 shadow-lg">
                  <Clock size={12} className="inline mr-1 sm:mr-2" />
                  Updated: {lastUpdated.toLocaleTimeString()}
                </div>
              )}
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl backdrop-blur-sm w-full sm:w-auto justify-center"
              >
                <RefreshCw
                  size={16}
                  className={isLoading ? "animate-spin" : ""}
                />
                Refresh Data
              </button>
            </div>
          </div>

          {networkName && (
            <div className="inline-flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-green-100/80 to-emerald-100/80 backdrop-blur-xl rounded-2xl border border-green-200/50 shadow-lg">
              <div className="w-2 h-2 sm:w-3 sm:h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs sm:text-sm font-semibold text-green-700">
                Network: {networkName}
              </span>
            </div>
          )}
        </div>

        {/* DEX Tabs */}
        <div className="mb-6 sm:mb-8">
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-2 border border-white/20 shadow-2xl">
            <div className="flex overflow-x-auto scrollbar-hide gap-1 sm:gap-2 pb-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => vHandleTabSwitch(tab)}
                  disabled={isLoading}
                  className={`flex-shrink-0 px-4 py-3 sm:px-6 sm:py-4 rounded-2xl text-sm font-bold transition-all duration-500 ${
                    activeTab.id === tab.id
                      ? `text-white bg-gradient-to-r ${tab.color} shadow-lg border border-white/20`
                      : "text-gray-600 hover:text-gray-900 hover:bg-white/50 border border-transparent"
                  } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <div className="flex items-center gap-2 sm:gap-3">
                    {tab.icon}
                    <span className="whitespace-nowrap">{tab.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 items-start lg:items-center justify-between">
            <div className="relative flex-1 w-full lg:max-w-md">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-purple-500 h-4 w-4 sm:h-5 sm:w-5" />
              <input
                type="text"
                placeholder="Search tokens by wallet Address..."
                value={tokenAddressFilter}
                onChange={(e) => setTokenAddressFilter(e.target.value)}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 bg-white/50 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all duration-300 text-gray-900 placeholder-gray-500 backdrop-blur-sm shadow-lg text-sm sm:text-base"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 w-full lg:w-auto">
              <div className="flex items-center gap-2 sm:gap-3 bg-white/50 backdrop-blur-sm rounded-2xl px-3 py-2 sm:px-4 sm:py-3 border border-white/20 shadow-lg">
                <Filter size={14} className="text-purple-500" />
                <span className="text-xs sm:text-sm text-purple-600 font-medium">
                  Show:
                </span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="text-xs sm:text-sm bg-transparent border-none focus:outline-none focus:ring-0 text-gray-900 font-medium"
                >
                  {rowsPerPageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs sm:text-sm text-purple-600 bg-white/80 backdrop-blur-xl px-3 py-2 sm:px-4 sm:py-3 rounded-2xl border border-purple-200/50 shadow-lg">
                <span className="font-bold text-purple-700">
                  {filteredTokens.length}
                </span>{" "}
                tokens found
              </div>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-200 bg-white">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                  Token Analytics
                </h2>
                <div className="flex items-center gap-2 mt-1 sm:mt-2">
                  <span className="text-xs sm:text-sm text-purple-600">
                    {activeTab.label}
                  </span>
                  <span className="text-gray-400">•</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex gap-2">
                  {["m5", "h1", "h6", "h24"].map((tf) => (
                    <button
                      key={tf}
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1 text-xs font-semibold rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-purple-400/50 ${
                        timeframe === tf
                          ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg border border-white/20"
                          : "text-purple-600 hover:bg-purple-100/80 hover:text-purple-900"
                      }`}
                      style={{ minWidth: 40 }}
                    >
                      {tf.toUpperCase()}
                    </button>
                  ))}
                </div>
                {isLoading && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-purple-600 bg-white/50 px-3 py-2 sm:px-4 sm:py-2 rounded-2xl border border-white/20">
                    <Loader size={14} className="animate-spin" />
                    Updating data...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mobile View */}
          <div className="block md:hidden">
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {paginatedTokens.length === 0 && !isLoading ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center border border-purple-200 shadow-2xl">
                    <Search className="h-8 w-8 text-purple-500" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    No tokens found
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {searchTerm
                      ? `No tokens matching "${searchTerm}" found.`
                      : "No tokens available."}
                  </p>
                </div>
              ) : (
                paginatedTokens.map((token, index) => (
                  <MobileTokenCard
                    key={token.id || index}
                    token={token}
                    index={index}
                  />
                ))
              )}
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white border-b border-gray-200">
                  <tr>
                    {tableColumns.map((column, idx) => (
                      <th
                        key={column.key}
                        className={`px-4 sm:px-6 py-4 text-xs font-extrabold text-gray-700 uppercase tracking-wider ${
                          column.width
                        } ${
                          !column.mobilePriority ? "hidden lg:table-cell" : ""
                        } ${
                          column.key === "name" ? "text-center" : "text-center"
                        }`}
                      >
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedTokens.length === 0 && !isLoading ? (
                    <tr>
                      <td
                        colSpan={tableColumns.length}
                        className="px-6 py-12 text-center"
                      >
                        <div className="flex flex-col items-center justify-center">
                          <div className="w-16 h-16 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center border border-purple-200 shadow-2xl mb-4">
                            <Search className="h-8 w-8 text-purple-500" />
                          </div>
                          <h3 className="text-lg font-bold text-gray-900 mb-2">
                            No tokens found
                          </h3>
                          <p className="text-gray-600 max-w-md">
                            {searchTerm
                              ? `No tokens matching "${searchTerm}" found.`
                              : "No tokens available."}
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedTokens.map((token, index) => {
                      const change = token.priceChange?.[timeframe] ?? 0;
                      const vol = token.volume?.[timeframe] ?? 0;
                      const buys = token.txns?.[timeframe]?.buys ?? 0;
                      const sells = token.txns?.[timeframe]?.sells ?? 0;
                      const totalTxns = buys + sells;

                      return (
                        <tr
                          key={token.id || index}
                          className="group transition-all duration-300 bg-white hover:bg-gray-50 border-b border-gray-100"
                          style={{
                            boxShadow: "0 2px 8px 0 rgba(60, 60, 60, 0.04)",
                          }}
                        >
                          <td 
                            className="px-4 sm:px-6 py-4 text-left cursor-pointer"
                            onClick={() => handleTokenClick(token)}
                          >
                            <TokenDisplay token={token} />
                          </td>
                          <td className="px-2 sm:px-4 py-3 hidden lg:table-cell text-center align-middle min-w-[200px]">
                            <div 
                              className="group/copy inline-flex items-center justify-center gap-3 text-sm font-bold text-gray-800 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm cursor-pointer hover:border-blue-200 hover:bg-gray-50 transition-all duration-300 mx-auto"
                              title={token.baseToken?.address}
                              onClick={(e) => handleCopy(token.baseToken?.address, e)}
                            >
                              <span className="truncate max-w-[120px]">{truncateAddress(token.baseToken?.address || "N/A")}</span>
                              <div className="flex-shrink-0">
                                {copiedAddress === token.baseToken?.address ? (
                                  <Check size={14} className="text-green-500" />
                                ) : (
                                  <Copy size={16} className="text-gray-300 group-hover/copy:text-blue-400 transition-colors" />
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-center align-middle min-w-[110px]">
                            <div className="text-sm font-bold text-yellow-700 bg-gradient-to-r from-yellow-50 to-amber-50 px-2 sm:px-3 py-1.5 rounded-xl border border-yellow-100 shadow-sm w-full">
                              ${formatNumber(token.priceUsd)}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-center align-middle min-w-[110px]">
                            <div
                              className={`inline-flex items-center gap-2 px-2 sm:px-3 py-1.5 rounded-xl text-sm font-bold border shadow-sm w-full ${
                                change >= 0
                                  ? "bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-100"
                                  : "bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-100"
                              }`}
                            >
                              {change >= 0 ? (
                                <TrendingUp
                                  size={14}
                                  className="text-green-500"
                                />
                              ) : (
                                <TrendingDown
                                  size={14}
                                  className="text-red-500"
                                />
                              )}
                              {change >= 0 ? "+" : ""}
                              {formatNumber(change)}%
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 text-center align-middle min-w-[110px]">
                            <div className="text-sm font-bold text-blue-700 bg-gradient-to-r from-blue-50 to-cyan-50 px-2 sm:px-3 py-1.5 rounded-xl border border-blue-100 shadow-sm w-full">
                              ${formatNumber(vol)}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 hidden lg:table-cell text-center align-middle min-w-[110px]">
                            <div className="text-sm font-bold text-purple-700 bg-gradient-to-r from-purple-50 to-pink-50 px-2 sm:px-3 py-1.5 rounded-xl border border-purple-100 shadow-sm w-full">
                              ${formatNumber(token.marketCap)}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 hidden lg:table-cell text-center align-middle min-w-[110px]">
                            <div className="text-sm font-semibold text-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 px-2 sm:px-3 py-1.5 rounded-xl border border-gray-100 shadow-sm w-full">
                              {formatNumber(totalTxns)}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 hidden lg:table-cell text-center align-middle min-w-[110px]">
                            <div className="text-sm font-semibold text-green-700 bg-gradient-to-r from-green-50 to-emerald-50 px-2 sm:px-3 py-1.5 rounded-xl border border-green-100 shadow-sm w-full">
                              {formatNumber(buys)}
                            </div>
                          </td>
                          <td className="px-2 sm:px-4 py-3 hidden lg:table-cell text-center align-middle min-w-[110px]">
                            <div className="text-sm font-semibold text-red-700 bg-gradient-to-r from-red-50 to-pink-50 px-2 sm:px-3 py-1.5 rounded-xl border border-red-100 shadow-sm w-full">
                              {formatNumber(sells)}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table Footer */}
          {!loading && paginatedTokens.length > 0 && (
            <div className="px-4 sm:px-6 py-4 sm:py-5 border-t border-white/20 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
                <div className="text-xs sm:text-sm text-gray-600">
                  Showing{" "}
                  <span className="font-bold text-purple-700">
                    {(currentPage - 1) * paginationData.tokensInPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-purple-700">
                    {Math.min(
                      currentPage * paginationData.tokensInPage,
                      paginationData.totalTokens,
                    )}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-purple-700">
                    {paginationData.totalTokens}
                  </span>{" "}
                  tokens
                </div>

                <div className="flex items-center gap-2 sm:gap-3">
                  <button
                    onClick={() => {
                      const newPage = Math.max(currentPage - 1, 1);
                      setCurrentPage(newPage);
                      fetchGetPaginatedTokens(activeTab.id, newPage);
                    }}
                    disabled={currentPage === 1 || loading}
                    className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-gray-700 bg-white/80 border border-white/20 rounded-2xl hover:bg-white hover:border-purple-500/50 hover:text-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    <ChevronDown size={14} className="transform rotate-90" />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from(
                      { length: paginationData.totalPages },
                      (_, index) => {
                        const page = index + 1;
                        // Show first 2 pages, last 2 pages, and current page with neighbors
                        if (
                          page <= 2 ||
                          page > paginationData.totalPages - 2 ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => {
                                setCurrentPage(page);
                                fetchGetPaginatedTokens(activeTab.id, page);
                              }}
                              disabled={loading}
                              className={`w-8 h-8 sm:w-10 sm:h-10 text-xs sm:text-sm font-semibold rounded-2xl transition-all duration-300 ${
                                currentPage === page
                                  ? "bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg shadow-purple-500/25"
                                  : "text-gray-700 hover:bg-white/80 hover:border hover:border-white/20 hover:text-purple-600"
                              } ${
                                loading ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          (page === 3 && currentPage > 3) ||
                          (page === paginationData.totalPages - 2 &&
                            currentPage < paginationData.totalPages - 2)
                        ) {
                          return (
                            <span
                              key={`ellipsis-${page}`}
                              className="px-1 sm:px-2 text-purple-500"
                            >
                              ...
                            </span>
                          );
                        }
                        return null;
                      },
                    )}
                  </div>

                  <button
                    onClick={() => {
                      const newPage = Math.min(
                        currentPage + 1,
                        paginationData.totalPages,
                      );
                      setCurrentPage(newPage);
                      fetchGetPaginatedTokens(activeTab.id, newPage);
                    }}
                    disabled={
                      currentPage === paginationData.totalPages || loading
                    }
                    className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-5 sm:py-3 text-xs sm:text-sm font-semibold text-gray-700 bg-white/80 border border-white/20 rounded-2xl hover:bg-white hover:border-purple-500/50 hover:text-purple-600 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                  >
                    Next
                    <ChevronDown size={14} className="transform -rotate-90" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(40px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
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
};

export default Tokens;
