import { useState, useCallback, useEffect, useContext } from "react";
import {
  CircleDollarSign,
  LineChart,
  BarChart4,
  ArrowUpCircle,
  ArrowDownCircle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CircleDot,
  Coins,
  CoinsIcon,
  BarChart3,
  RefreshCw,
  RotateCcw,
  Clock,
  ChevronLeft,
  ChevronRight,
  Users,
  History,
  Wallet,
  DollarSign,
  PieChart,
  ShoppingCart,
  Activity,
} from "lucide-react";
import { ADMIN_API } from "../services/ApiHandlers";
import { AuthContext } from "../context/AuthContext";

// Vibrant color schemes for cards
const colorSchemes = {
  volume: {
    gradient: "from-blue-500 to-cyan-500",
    light: "from-blue-50 to-blue-100",
    accent: "text-blue-600",
    border: "border-blue-100",
    bg: "bg-gradient-to-br from-blue-500/10 to-cyan-500/10",
    glow: "rgba(59, 130, 246, 0.1)",
  },
  lp: {
    gradient: "from-purple-500 to-pink-500",
    light: "from-purple-50 to-purple-100",
    accent: "text-purple-600",
    border: "border-purple-100",
    bg: "bg-gradient-to-br from-purple-500/10 to-pink-500/10",
    glow: "rgba(168, 85, 247, 0.1)",
  },
  transactions: {
    gradient: "from-emerald-500 to-green-500",
    light: "from-emerald-50 to-green-100",
    accent: "text-emerald-600",
    border: "border-emerald-100",
    bg: "bg-gradient-to-br from-emerald-500/10 to-green-500/10",
    glow: "rgba(16, 185, 129, 0.1)",
  },
  buys: {
    gradient: "from-amber-500 to-orange-500",
    light: "from-amber-50 to-orange-100",
    accent: "text-amber-600",
    border: "border-amber-100",
    bg: "bg-gradient-to-br from-amber-500/10 to-orange-500/10",
    glow: "rgba(245, 158, 11, 0.1)",
  },
  sells: {
    gradient: "from-rose-500 to-red-500",
    light: "from-rose-50 to-red-100",
    accent: "text-rose-600",
    border: "border-rose-100",
    bg: "bg-gradient-to-br from-rose-500/10 to-red-500/10",
    glow: "rgba(244, 63, 94, 0.1)",
  },
};

const TokenAnalytics = ({
  tokenAddress,
  networkId,
  tokenInfo,
  liveTokenData,
  lastRefreshTime,
  isRefreshing,
  onRefresh,
  activeTimeframeTab,
  onTimeframeChange,
  totalsData,
}) => {
  const { user } = useContext(AuthContext);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [tokenReports, setTokenReports] = useState([]);

  // Transaction History Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [tokenReportsPagination, setTokenReportsPagination] = useState({
    totalRecords: 0,
    totalPages: 0,
    currentPage: 1,
    limit: 10,
  });

  // Format numbers dynamically
  const formatNumber = (num) => {
    if (!num || num === 0) return "$0";
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else {
      return `$${num?.toFixed(2) || "0"}`;
    }
  };

  const formatCount = (num) => {
    if (!num || num === 0) return "0";
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    } else {
      return num?.toString() || "0";
    }
  };

  // Memoized fetchLiveTokenDataForAll function
  const fetchLiveTokenDataForAll = useCallback(
    async (chainId, tokenAddress) => {
      try {
        const response = await ADMIN_API.GET_LIVE_TOKEN_DATA({
          chainId: chainId,
          tokenAddress: tokenAddress,
        });

        if (
          (response.data.data && response.data.data[0]) ||
          response.data.lpAdd
        ) {
          const liveData =
            response.data.data && response.data.data[0]
              ? response.data.data[0]
              : {};
          const lpAdd = response.data.lpAdd || 0;
          return { liveData, lpAdd };
        }
      } catch (error) {
        console.log("Error fetching live token data:", error);
      }
      return { liveData: null, lpAdd: 0 };
    },
    []
  );

  // Generate analytics data based on timeframe - FIXED: Use proper data sources
  const generateAnalyticsData = (
    timeframe,
    liveData = null,
    totals = null,
    lpAdd = 0
  ) => {
    console.log("🔄 Generating analytics data for:", {
      timeframe,
      hasLiveData: !!liveData,
      hasTotals: !!totals,
      lpAdd,
    });

    // For Overall timeframe, use the totals data from TOKEN_REPORTS_TOTAL
    if (timeframe === "Overall" && totals) {
      console.log("📊 Using totals data for Overall timeframe:", totals);
      const overallData = [
        {
          title: "Total Volume",
          value: formatNumber(totals.totalVolume || 0),
          // change: "0%",
          // trend: "up",
          variant: "volume",
          icon: BarChart4,
          description: "Total cumulative trading volume",
        },
        {
          title: "Pool Fee",
          value: formatNumber(totals.totalPoolRevenue || 0),
          // change: "0%",
          // trend: "up",
          variant: "lp",
          icon: CoinsIcon,
          description: "Total cumulative liquidity provider volume",
        },
        {
          title: "Total Transactions",
          value: formatCount(totals.totalTransactions || 0),
          // change: "0%",
          // trend: "up",
          variant: "transactions",
          icon: History,
          description: "Total cumulative transactions count",
        },
        {
          title: "Total Buys",
          value: formatCount(totals.totalBuys || 0),
          // change: "0%",
          // trend: "up",
          variant: "buys",
          icon: ArrowUpCircle,
          description: "Total cumulative buy orders",
        },
        {
          title: "Total Sells",
          value: formatCount(totals.totalSells || 0),
          // change: "0%",
          // trend: "up",
          variant: "sells",
          icon: ArrowDownCircle,
          description: "Total cumulative sell orders",
        },
      ];
      setAnalyticsData(overallData);
      return;
    }

    // For other timeframes (24h, 6h, 1h, 5m), use live data
    if (!liveData) {
      console.log("❌ No live data available for timeframe:", timeframe);
      const emptyData = [
        {
          title: "Total Volume",
          value: "$0",
          // change: "0%",
          // trend: "up",
          variant: "volume",
          icon: DollarSign,
          description: `Volume in last ${timeframe}`,
        },
        {
          title: "LP Add",
          value: "$0",
          // change: "0%",
          // trend: "up",
          variant: "lp",
          icon: PieChart,
          description: "Liquidity provider volume",
        },
        {
          title: "Total Transactions",
          value: "0",
          // change: "0%",
          // trend: "up",
          variant: "transactions",
          icon: Users,
          description: `Transactions in last ${timeframe}`,
        },
        {
          title: "Total Buys",
          value: "0",
          // change: "0%",
          // trend: "up",
          variant: "buys",
          icon: ShoppingCart,
          description: `Buy transactions in last ${timeframe}`,
        },
        {
          title: "Total Sells",
          value: "0",
          // change: "0%",
          // trend: "up",
          variant: "sells",
          icon: Activity,
          description: `Sell transactions in last ${timeframe}`,
        },
      ];
      setAnalyticsData(emptyData);
      return;
    }

    const timeframeKey =
      timeframe === "5m"
        ? "m5"
        : timeframe === "1h"
        ? "h1"
        : timeframe === "6h"
        ? "h6"
        : "h24";
    const volume = liveData.volume?.[timeframeKey] || 0;
    const txns = liveData.txns?.[timeframeKey] || { buys: 0, sells: 0 };
    const priceChange = liveData.priceChange?.[timeframeKey] || 0;

    // Use constant LPADDED value for dynamic timeframes
    const lpValue = volume * ((lpAdd || 0) / 100);

    console.log("📈 Using live data for timeframe:", {
      timeframe,
      timeframeKey,
      volume,
      buys: txns.buys,
      sells: txns.sells,
      priceChange,
      lpAdd,
      lpValue,
    });

    const dynamicData = [
      {
        title: "Total Volume",
        value: formatNumber(volume),
        // change: `${priceChange >= 0 ? "+" : ""}${
        //   priceChange?.toFixed(2) || "0"
        // }%`,
        // trend: priceChange >= 0 ? "up" : "down",
        variant: "volume",
        icon: DollarSign,
        description: `Volume in last ${timeframe}`,
      },
      {
        title: "LP Add",
        value: formatNumber(lpValue),
        // change: `${priceChange >= 0 ? "+" : ""}${
        //   priceChange?.toFixed(2) || "0"
        // }%`,
        // trend: priceChange >= 0 ? "up" : "down",
        variant: "lp",
        icon: PieChart,
        description: "Liquidity provider volume",
      },
      {
        title: "Total Transactions",
        value: formatCount((txns.buys || 0) + (txns.sells || 0)),
        // change: "0%",
        // trend: "up",
        variant: "transactions",
        icon: Users,
        description: `Transactions in last ${timeframe}`,
      },
      {
        title: "Total Buys",
        value: formatCount(txns.buys || 0),
        // change: "0%",
        // trend: "up",
        variant: "buys",
        icon: ShoppingCart,
        description: `Buy transactions in last ${timeframe}`,
      },
      {
        title: "Total Sells",
        value: formatCount(txns.sells || 0),
        // change: "0%",
        // trend: "up",
        variant: "sells",
        icon: Activity,
        description: `Sell transactions in last ${timeframe}`,
      },
    ];

    setAnalyticsData(dynamicData);
  };

  // Fetch token reports with proper token address and pagination
  const fetchGetTokenReports = async (
    page = currentPage,
    limit = rowsPerPage
  ) => {
    try {
      if (!tokenAddress) return;

      const params = {
        tokenAddress: tokenAddress,
        page: page,
        limit: limit,
      };

      if (dateFilter) {
        params.startTime = dateFilter.replace(/-/g, "");
      }
      if (endDateFilter) {
        params.endTime = endDateFilter.replace(/-/g, "");
      }

      const response = await ADMIN_API.GET_TOKEN_REPORTS(params);

      // console.log("GET_TOKEN_REPORTS Response", response);
      

      if (response.data.data && Array.isArray(response.data.data)) {
        const reports = response.data.data.map((report) => ({
          ...report,
          totalTransactions: report.totalTransactions || 0,
          buys: report.buys || 0,
          sells: report.sells || 0,
          totalVolume: report.totalVolume || 0,
          LPadded: report.LPadded || 0,
          poolLiquidity: report.poolLiquidity || 0,
          poolRevenue: report.poolRevenue || 0,
          usersLiquidity: report.usersLiquidity || 0,
          usersRevenue: report.usersRevenue || 0,
          companysLiquidity: report.companysLiquidity || 0,
          companysRevenue: report.companysRevenue || 0,
          compoundLiquidity: report.compoundLiquidity || 0,
          compoundRevenue: report.compoundRevenue || 0,
          reportsCount: report.reportsCount || 0,
          createdAt: report._id || "N/A",
        }));
        setTokenReports(reports);
        console.log("reports data", reports);

        setTableData(reports);

        const paginationInfo = {
          totalRecords: response.data.totalDates || 0,
          totalPages: response.data.totalPages || 1,
          currentPage: response.data.page || 1,
          limit: response.data.limit || 10,
        };
        console.log("Setting pagination info:", paginationInfo);
        setTokenReportsPagination(paginationInfo);
      } else {
        setTokenReports([]);
        setTableData([]);
        setTokenReportsPagination({
          totalRecords: 0,
          totalPages: 0,
          currentPage: 1,
          limit: 10,
        });
      }
    } catch (error) {
      console.log("Error in fetchGetTokenReports", error);
      setTokenReports([]);
      setTableData([]);
    }
  };

  // Refresh analytics data
  const refreshAnalyticsData = async () => {
    if (!tokenAddress) return;

    console.log(
      "🔄 Refreshing analytics data for timeframe:",
      activeTimeframeTab
    );

    if (activeTimeframeTab === "Overall") {
      // For Overall, we rely on parent to refresh totalsData via onRefresh
      console.log("📊 Using existing totals data for Overall");
      if (totalsData) {
        generateAnalyticsData("Overall", null, totalsData);
      }
    } else {
      // For other timeframes, fetch fresh live data
      if (tokenAddress && tokenInfo?.chainId) {
        console.log(
          "📈 Fetching fresh live data for timeframe:",
          activeTimeframeTab
        );
        const { liveData, lpAdd } = await fetchLiveTokenDataForAll(
          tokenInfo.chainId,
          tokenAddress
        );
        generateAnalyticsData(activeTimeframeTab, liveData, null, lpAdd);
      }
    }
  };

  const resetFilters = () => {
    setDateFilter("");
    setEndDateFilter("");
    setCurrentPage(1);
  };

  // Transaction History Pagination Functions
  const handlePageChange = async (pageNumber) => {
    setCurrentPage(pageNumber);
    await fetchGetTokenReports(pageNumber, rowsPerPage);
  };

  const handleRowsPerPageChange = async (value) => {
    const newLimit = Number(value);
    setRowsPerPage(newLimit);
    setCurrentPage(1);
    await fetchGetTokenReports(1, newLimit);
  };

  const getPageNumbers = () => {
    const totalPages = tokenReportsPagination.totalPages;
    const currentPage = tokenReportsPagination.currentPage;
    const pageNumbers = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }

    // Always include page 1
    pageNumbers.push(1);

    if (currentPage > 4) {
      pageNumbers.push("...");
    }

    // Determine range around current page
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    // Adjust range if at boundaries
    if (currentPage <= 4) {
      start = 2;
      end = 5;
    } else if (currentPage >= totalPages - 3) {
      start = totalPages - 4;
      end = totalPages - 1;
    }

    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }

    if (currentPage < totalPages - 3) {
      pageNumbers.push("...");
    }

    // Always include last page
    pageNumbers.push(totalPages);

    return pageNumbers;
  };

  const formatValue = (val) => val;
  const formatDate = (dateValue) => {
    if (!dateValue || dateValue === "N/A") return "N/A";
    
    const s = dateValue.toString();
    if (/^\d{8}$/.test(s)) {
      const year = s.slice(0, 4);
      const month = s.slice(4, 6);
      const day = s.slice(6, 8);
      const date = new Date(year, parseInt(month) - 1, day);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format last refresh time
  const formatLastRefreshTime = () => {
    if (!lastRefreshTime) return "Never";
    return lastRefreshTime.toLocaleTimeString();
  };

  // Initialize data
  useEffect(() => {
    if (tokenAddress) {
      fetchGetTokenReports(1, rowsPerPage);

      // Generate initial analytics data based on current timeframe
      if (activeTimeframeTab === "Overall" && totalsData) {
        console.log("🎯 Initializing with Overall totals data");
        generateAnalyticsData("Overall", null, totalsData);
      } else if (tokenInfo?.chainId) {
        console.log(
          "🎯 Initializing with live data for timeframe:",
          activeTimeframeTab
        );
        fetchLiveTokenDataForAll(tokenInfo.chainId, tokenAddress).then(
          ({ liveData, lpAdd }) => {
            generateAnalyticsData(activeTimeframeTab, liveData, null, lpAdd);
          }
        );
      }
    }
  }, [tokenAddress, tokenInfo, dateFilter, endDateFilter]);

  // Update analytics when timeframe changes or totalsData updates
  useEffect(() => {
    if (!tokenAddress) return;

    console.log("🔄 Timeframe or totalsData changed:", {
      activeTimeframeTab,
      hasTotalsData: !!totalsData,
      hasTokenInfo: !!tokenInfo,
    });

    if (activeTimeframeTab === "Overall") {
      if (totalsData) {
        console.log("📊 Switching to Overall timeframe with totals data");
        generateAnalyticsData("Overall", null, totalsData);
      }
    } else if (tokenInfo?.chainId) {
      console.log("📈 Switching to live data timeframe:", activeTimeframeTab);
      fetchLiveTokenDataForAll(tokenInfo.chainId, tokenAddress).then(
        ({ liveData, lpAdd }) => {
          generateAnalyticsData(activeTimeframeTab, liveData, null, lpAdd);
        }
      );
    }
  }, [activeTimeframeTab, totalsData]);

  return (
    <div className="space-y-6">
      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {analyticsData.map((item, index) => {
          const IconComponent = item.icon;
          const colors = colorSchemes[item.variant] || colorSchemes.volume;
          // const TrendIcon = item.trend === "up" ? ArrowUpRight : ArrowDownRight;

          return (
            <div
              key={index}
              className="group relative rounded-2xl p-6 hover:shadow-lg transition-all duration-300 hover:scale-105 border"
              style={{
                background: `linear-gradient(135deg, ${colors.bg
                  .split("from-")[1]
                  .split("to-")[0]
                  .replace("/", "")}20, ${colors.bg
                  .split("to-")[1]
                  .replace("/", "")}20)`,
                borderColor: colors.border.replace("border-", ""),
                boxShadow: `0 8px 32px ${colors.glow}`,
              }}
            >
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`p-3 rounded-xl bg-gradient-to-br ${colors.gradient} shadow-lg`}
                  >
                    <IconComponent className="h-6 w-6 text-white" />
                  </div>
                  {/* <div
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      item.trend === "up"
                        ? "bg-green-100 text-green-700 border border-green-200"
                        : "bg-red-100 text-red-700 border border-red-200"
                    }`}
                  >
                    <TrendIcon size={14} />
                    <span>{item.change}</span>
                  </div> */}
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-gray-900">
                    {item.value}
                  </h3>
                  <p className="text-sm font-semibold text-gray-700">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Colorful progress bar */}
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full bg-gradient-to-r ${colors.gradient} shadow-sm`}
                      style={{ width: "75%" }}
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Transaction History Table */}
      {user?.role !== "superuser" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm">
          {/* Table Header */}
          <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-cyan-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Transaction History
              </h2>
              <p className="text-gray-600">
                Detailed breakdown of token transactions
              </p>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <div className="flex items-center gap-2">
                  <Calendar className="text-blue-600 w-4 h-4" />
                  <span className="text-xs sm:text-sm font-semibold text-gray-700 whitespace-nowrap">
                    Date Filter
                  </span>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <input
                    type="date"
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition-all duration-300 bg-white shadow-sm w-full sm:w-auto"
                    title="Start Date"
                  />
                  <span className="text-gray-400 font-bold">-</span>
                  <input
                    type="date"
                    value={endDateFilter}
                    onChange={(e) => setEndDateFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition-all duration-300 bg-white shadow-sm w-full sm:w-auto"
                    title="End Date"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105 group"
                >
                  <RotateCcw
                    size={14}
                    className="text-gray-600 group-hover:text-blue-600 transition-colors"
                  />
                  <span className="text-xs sm:text-sm font-semibold text-gray-700">
                    Reset
                  </span>
                </button>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-700 whitespace-nowrap">
                    Rows:
                  </label>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => handleRowsPerPageChange(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {[10, 25, 50, 100].map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Volume
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  LP Revenue
                </th>
                {user?.role !== "superuser" && (
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Compound Rev
                  </th>
                )}
                {user?.role !== "superuser" && (
                  <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                    Compound Liq
                  </th>
                )}
                {/* <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Users Rev
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Comp Rev
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Pool Liq
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Users Liq
                </th> */}
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Transactions
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Buys
                </th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Sells
                </th>
                {/* <th className="px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Makers
                </th> */}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tableData.length > 0 ? (
                tableData.map((report, index) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Calendar
                          size={16}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(report.createdAt)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <BarChart4
                          size={16}
                          className="text-green-500 flex-shrink-0"
                        />
                        <span className="text-sm font-semibold text-gray-900">
                          {formatValue(report.totalVolume)?.toLocaleString(
                            "en-US",
                            {
                              style: "currency",
                              currency: "USD",
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            }
                          ) || "$0.00"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Coins
                          size={16}
                          className="text-purple-500 flex-shrink-0"
                        />
                        <span className="text-sm font-semibold text-gray-900">
                          ${(report.poolRevenue || 0).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </span>
                      </div>
                    </td>
                    {user?.role !== "superuser" && (
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Coins
                            size={16}
                            className="text-cyan-500 flex-shrink-0"
                          />
                          <span className="text-sm font-semibold text-gray-900">
                            ${(report.compoundRevenue || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </td>
                    )}
                    {user?.role !== "superuser" && (
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Coins
                            size={16}
                            className="text-cyan-500 flex-shrink-0"
                          />
                          <span className="text-sm font-semibold text-gray-900">
                            ${(report.compoundLiquidity || 0).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </span>
                        </div>
                      </td>
                    )}
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      ${(report.usersRevenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      ${(report.compoundRevenue || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      ${(report.poolLiquidity || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                      ${(report.usersLiquidity || 0).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td> */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <History
                          size={16}
                          className="text-blue-500 flex-shrink-0"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {formatValue(report.totalTransactions)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <ArrowUpCircle
                          size={16}
                          className="text-emerald-500 flex-shrink-0"
                        />
                        <span className="text-sm font-medium text-emerald-700">
                          {formatValue(report.buys)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <ArrowDownCircle
                          size={16}
                          className="text-rose-500 flex-shrink-0"
                        />
                        <span className="text-sm font-medium text-rose-700">
                          {formatValue(report.sells)}
                        </span>
                      </div>
                    </td>
                    {/* <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Users
                          size={16}
                          className="text-cyan-500 flex-shrink-0"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {formatCount(report.reportsCount || 0)}
                        </span>
                      </div>
                    </td> */}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={user?.role !== "superuser" ? "8" : "6"}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <div className="flex flex-col items-center gap-3">
                      <BarChart3 size={48} className="text-gray-300" />
                      <p className="text-lg font-medium text-gray-400">
                        No data available
                      </p>
                      <p className="text-sm text-gray-500">
                        No transaction records found for the selected criteria.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(tokenReportsPagination.totalRecords > 0 || tableData.length > 0) && (
          <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-700">
                Showing{" "}
                {(tokenReportsPagination.currentPage - 1) *
                  tokenReportsPagination.limit +
                  1}{" "}
                to{" "}
                {Math.min(
                  tokenReportsPagination.currentPage *
                    tokenReportsPagination.limit,
                  tokenReportsPagination.totalRecords
                )}{" "}
                of {tokenReportsPagination.totalRecords} entries
                {tokenReportsPagination.totalPages > 1 && (
                  <span className="ml-2 text-gray-500">
                    (Page {tokenReportsPagination.currentPage} of{" "}
                    {tokenReportsPagination.totalPages})
                  </span>
                )}
              </div>

              {tokenReportsPagination.totalPages > 1 && (
                <div className="flex items-center gap-2">
                  {/* <button
                    onClick={() => handlePageChange(1)}
                    disabled={tokenReportsPagination.currentPage === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium text-gray-700"
                  >
                    First
                  </button> */}
                  <button
                    onClick={() =>
                      handlePageChange(tokenReportsPagination.currentPage - 1)
                    }
                    disabled={tokenReportsPagination.currentPage === 1}
                    className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {getPageNumbers().map((pageNumber, idx) => 
                    pageNumber === "..." ? (
                      <span key={`dots-${idx}`} className="px-3 py-2 text-gray-500">
                        ...
                      </span>
                    ) : (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          tokenReportsPagination.currentPage === pageNumber
                            ? "bg-blue-500 text-white"
                            : "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  )}
                  <button
                    onClick={() =>
                      handlePageChange(tokenReportsPagination.currentPage + 1)
                    }
                    disabled={
                      tokenReportsPagination.currentPage ===
                      tokenReportsPagination.totalPages
                    }
                    className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                  {/* <button
                    onClick={() =>
                      handlePageChange(tokenReportsPagination.totalPages)
                    }
                    disabled={
                      tokenReportsPagination.currentPage ===
                      tokenReportsPagination.totalPages
                    }
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium text-gray-700"
                  >
                    Last
                  </button> */}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    )}
  </div>
);
};

export default TokenAnalytics;
