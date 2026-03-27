import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";
import { ADMIN_API } from "../services/ApiHandlers";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  ExternalLink,
  BarChart3,
  DollarSign,
  TrendingUp,
  Zap,
  Copy,
  CheckCircle,
  PieChart,
  Activity,
  Building2,
  Eye,
  RefreshCw,
  AlertCircle,
  Download,
  Filter,
  ChevronDown,
  X,
} from "lucide-react";
import RWAReportModal from "./RWAReportModal";

const RWADetails = () => {
  const { user } = useAuth();
  const { pairAddress, tokenAddress, chainId } = useParams();
  const navigate = useNavigate();
  const [poolData, setPoolData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialLoad, setInitialLoad] = useState(true);
  const [copiedField, setCopiedField] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [rwaReports, setRwaReports] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [reportsCurrentPage, setReportsCurrentPage] = useState(1);
  const [reportsLimit, setReportsLimit] = useState(10);
  const [reportsTotalPages, setReportsTotalPages] = useState(1);
  const [reportsTotalCount, setReportsTotalCount] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalSummary, setTotalSummary] = useState(null);
  const [globalLatestReport, setGlobalLatestReport] = useState(null);

  // Refs to prevent duplicate API calls
  const isFetchingPoolDetails = useRef(false);
  const isFetchingReports = useRef(false);

  // Add this state to the RWADetails component
  const [selectedReport, setSelectedReport] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Add this function to handle report click
  const handleReportClick = (report) => {
    setSelectedReport({
      ...report,
      name: `${formatSymbol(poolData?.mintA?.symbol)}-${formatSymbol(poolData?.mintB?.symbol)}`,
      // Ensure MMobject is explicitly passed for modal consumption
      MMobject: report.MMobject || report.MMObject || {},
      // Normalize revenue property names if they differ from API
      poolRevenue: report.poolRevenue ?? report.totalRevenue ?? 0,
      companysRevenue: report.companysRevenue ?? report.companyRevenue ?? 0,
      usersRevenue: report.usersRevenue ?? report.clientRevenue ?? 0,
      // Normalize liquidity property names
      companysLiquidity:
        report.companysLiquidity ?? report.companyLiquidity ?? 0,
      usersLiquidity: report.usersLiquidity ?? report.clientLiquidity ?? 0,
    });
    setIsModalOpen(true);
  };

  // Fetch pool details from API
  const fetchPoolDetails = async (isAutoRefresh = false) => {
    if (isFetchingPoolDetails.current) {
      console.log("⏭️ Skipping fetchPoolDetails - already fetching");
      return;
    }

    try {
      isFetchingPoolDetails.current = true;
      if (!isAutoRefresh && initialLoad) {
        setLoading(true);
      }

      // Try GET_LIVE_POOLS_DATA first (for RWA pools)
      let response;
      try {
        response = await ADMIN_API.GET_LIVE_POOLS_DATA({
          tokenAddress: tokenAddress,
          pairAddress: pairAddress,
          chainId: chainId,
        });
        console.log("GET_LIVE_POOLS_DATA Response", response?.data);
      } catch (err) {
        console.log(
          "GET_LIVE_POOLS_DATA failed, will try CLMM API",
          err.message,
        );
      }

      if (response?.data?.success && response.data.pools.length > 0) {
        setPoolData(response.data.pools[0].fullPoolData);
      } else {
        // If not found or error occurred, try GET_LIVE_POOLS_NOT_RWA_DATA (for CLMM pools)
        console.log(
          "🔄 Pool not found in RWA data or API failed, trying CLMM data...",
        );
        try {
          response = await ADMIN_API.GET_LIVE_POOLS_NOT_RWA_DATA({
            tokenAddress: tokenAddress,
            pairAddress: pairAddress,
            chainId: chainId,
          });
          console.log("GET_LIVE_POOLS_NOT_RWA_DATA Response", response?.data);

          if (
            response?.data?.success &&
            response.data.pools &&
            response.data.pools.length > 0
          ) {
            setPoolData(response.data.pools[0].fullPoolData);
          } else if (
            response &&
            response.status === 200 &&
            response.data.pools &&
            response.data.pools.length > 0
          ) {
            setPoolData(response.data.pools[0].fullPoolData);
          } else {
            setPoolData(null);
          }
        } catch (clmmErr) {
          console.error("GET_LIVE_POOLS_NOT_RWA_DATA failed as well", clmmErr);
          setPoolData(null);
        }
      }

      // Add a small delay for smoother transition if initial load
      if (initialLoad) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error("Error fetching pool details:", error);
      setPoolData(null);
    } finally {
      if (initialLoad) {
        setLoading(false);
        setInitialLoad(false);
      }
      isFetchingPoolDetails.current = false;
    }
  };

  const fetchDailyRWAPoolsReports = async (isAutoRefresh = false) => {
    if (isFetchingReports.current) {
      // console.log("⏭️ Skipping fetchDailyRWAPoolsReports - already fetching");
      return;
    }

    try {
      isFetchingReports.current = true;
      if (!isAutoRefresh) {
        setReportsLoading(true);
      }

      const numericStartTime = convertDateToNumeric(startDate);
      const numericEndTime = convertDateToNumeric(endDate);

      if (startDate && endDate) {
        console.log("Selected Date Range (Numeric):", {
          startTime: numericStartTime,
          endTime: numericEndTime,
        });
      }

      const fetchPromise =
        startDate && endDate
          ? ADMIN_API.GET_RWA_POOL_DATE_RANGE_REPORT({
              startTime: numericStartTime,
              endTime: numericEndTime,
              pairAddress: pairAddress,
              page: reportsCurrentPage,
              limit: reportsLimit,
            })
          : ADMIN_API.GET_DAILY_RWA_POOLS_REPORTS({
              tokenAddress: tokenAddress,
              pairAddress: pairAddress,
              chainId: chainId,
              page: reportsCurrentPage,
              limit: reportsLimit,
            });

      const [response] = await Promise.all([
        fetchPromise,
        new Promise((resolve) => setTimeout(resolve, 2000)),
      ]);

      console.log("Reports Response", response.data);

      // Handle both standard reports and date range reports structures
      if (response?.data) {
        const responseData = response.data;
        if (
          startDate &&
          endDate &&
          responseData.summary &&
          (responseData.daily?.data || responseData.dailyReports)
        ) {
          // Date range report structure
          const summary = responseData.summary[0];
          const dailyReports =
            responseData.daily?.data ||
            responseData.dailyReports[0]?.dailyReports ||
            [];

          setRwaReports(dailyReports);
          setTotalSummary(summary || null);
          const apiCount = responseData.daily?.count || dailyReports.length;
          setReportsTotalCount(apiCount);
          setReportsTotalPages(
            responseData.daily?.totalPages || Math.max(1, Math.ceil(apiCount / reportsLimit)),
          );
          // Ensure pagination state reflects API response when date-range is used
          setReportsCurrentPage(
            responseData.daily?.currentPage || responseData.daily?.page || 1,
          );
          setReportsLimit(responseData.daily?.limit || reportsLimit);
        } else {
          // Standard report structure
          const dataToProcess = responseData.data || responseData;
          const reportsData = Array.isArray(dataToProcess)
            ? dataToProcess
            : dataToProcess.data || [];

          if (reportsData.length > 0) {
            // console.log("🔍 Sample Report Object:", reportsData[0]);
          }

          setRwaReports(reportsData);
          setTotalSummary(null);
          setReportsTotalPages(
            responseData.totalPages || responseData.data?.totalPages || 1,
          );
          setReportsTotalCount(
            responseData.count ||
              responseData.data?.count ||
              reportsData.length ||
              0,
          );

          // Capture absolute latest report when no date filter is applied
          if (
            !startDate &&
            !endDate &&
            reportsData.length > 0 &&
            reportsCurrentPage === 1
          ) {
            setGlobalLatestReport(reportsData[0]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching daily RWA pools reports:", error);
      setRwaReports([]);
    } finally {
      if (!isAutoRefresh) {
        setReportsLoading(false);
      }
      isFetchingReports.current = false;
    }
  };

  // Auto refresh function (without showing loading states)
  const handleAutoRefresh = async () => {
    if (isFetchingPoolDetails.current || isFetchingReports.current) {
      console.log("⏭️ Skipping auto refresh - already fetching");
      return;
    }

    try {
      // console.log("🔄 Auto-refreshing pool data...");

      // Fetch pool details without affecting loading states
      // Try GET_LIVE_POOLS_DATA first (for RWA pools)
      let poolResponse;
      try {
        poolResponse = await ADMIN_API.GET_LIVE_POOLS_DATA({
          tokenAddress: tokenAddress,
          pairAddress: pairAddress,
          chainId: chainId,
        });
      } catch (err) {
        console.log("Auto-refresh: GET_LIVE_POOLS_DATA failed", err.message);
      }

      if (poolResponse?.data?.success && poolResponse.data.pools.length > 0) {
        setPoolData(poolResponse.data.pools[0].fullPoolData);
      } else {
        // If not found or error occurred, try GET_LIVE_POOLS_NOT_RWA_DATA (for CLMM pools)
        try {
          poolResponse = await ADMIN_API.GET_LIVE_POOLS_NOT_RWA_DATA({
            tokenAddress: tokenAddress,
            pairAddress: pairAddress,
            chainId: chainId,
          });

          if (
            poolResponse?.data?.success &&
            poolResponse.data.pools &&
            poolResponse.data.pools.length > 0
          ) {
            setPoolData(poolResponse.data.pools[0].fullPoolData);
          } else if (
            poolResponse &&
            poolResponse.status === 200 &&
            poolResponse.data.pools &&
            poolResponse.data.pools.length > 0
          ) {
            setPoolData(poolResponse.data.pools[0].fullPoolData);
          }
        } catch (clmmErr) {
          console.log(
            "Auto-refresh: GET_LIVE_POOLS_NOT_RWA_DATA failed",
            clmmErr.message,
          );
        }
      }

      // Fetch reports without affecting loading states
      const numericStartTime = convertDateToNumeric(startDate);
      const numericEndTime = convertDateToNumeric(endDate);

      const reportsFetchPromise =
        startDate && endDate
          ? ADMIN_API.GET_RWA_POOL_DATE_RANGE_REPORT({
              startTime: numericStartTime,
              endTime: numericEndTime,
              pairAddress: pairAddress,
              page: reportsCurrentPage,
              limit: reportsLimit,
            })
          : ADMIN_API.GET_DAILY_RWA_POOLS_REPORTS({
              tokenAddress: tokenAddress,
              pairAddress: pairAddress,
              chainId: chainId,
              page: reportsCurrentPage,
              limit: reportsLimit,
            });

      const reportsResponse = await reportsFetchPromise;
      console.log("reportsResponse ", reportsResponse);

      if (reportsResponse?.data) {
        const responseData = reportsResponse.data;
        if (
          startDate &&
          endDate &&
          responseData.summary &&
          (responseData.daily?.data || responseData.dailyReports)
        ) {
          // Date range report structure
          const summary = responseData.summary[0];
          const dailyReports =
            responseData.daily?.data ||
            responseData.dailyReports[0]?.dailyReports ||
            [];

          setRwaReports(dailyReports);
          setTotalSummary(summary || null);
          const apiCount = responseData.daily?.count || dailyReports.length;
          setReportsTotalCount(apiCount);
          setReportsTotalPages(
            responseData.daily?.totalPages || Math.max(1, Math.ceil(apiCount / reportsLimit)),
          );
          // Keep pagination synced when auto-refreshing with date-range filters
          setReportsCurrentPage(
            responseData.daily?.currentPage || responseData.daily?.page || 1,
          );
          setReportsLimit(responseData.daily?.limit || reportsLimit);
        } else {
          // Standard report structure
          const dataToProcess = responseData.data || responseData;
          const reportsData = Array.isArray(dataToProcess)
            ? dataToProcess
            : dataToProcess.data || [];
          setRwaReports(reportsData);
          setTotalSummary(null);
          setReportsTotalPages(
            responseData.totalPages || responseData.data?.totalPages || 1,
          );
          setReportsTotalCount(
            responseData.count ||
              responseData.data?.count ||
              reportsData.length ||
              0,
          );

          // Capture absolute latest report when no date filter is applied
          if (
            !startDate &&
            !endDate &&
            reportsData.length > 0 &&
            reportsCurrentPage === 1
          ) {
            setGlobalLatestReport(reportsData[0]);
          }
        }
      }
    } catch (error) {
      console.error("Error during auto-refresh:", error);
    }
  };

  // Manual refresh with loading indicator on button only
  const handleManualRefresh = async () => {
    setRefreshing(true);
    await handleAutoRefresh();
    setRefreshing(false);
    toast.success("Data refreshed successfully");
  };

  useEffect(() => {
    fetchPoolDetails(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chainId, pairAddress, tokenAddress]);

  useEffect(() => {
    fetchDailyRWAPoolsReports(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chainId,
    pairAddress,
    tokenAddress,
    reportsCurrentPage,
    reportsLimit,
    startDate,
    endDate,
  ]);

  // Auto-refresh interval - every 60 seconds
  useEffect(() => {
    const intervalId = setInterval(() => {
      handleAutoRefresh();
    }, 60000); // 60 seconds

    return () => clearInterval(intervalId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    chainId,
    pairAddress,
    tokenAddress,
    reportsCurrentPage,
    reportsLimit,
    startDate,
    endDate,
  ]);

  const formatCompactNumber = (num, isCurrency = false) => {
    if (num === null || num === undefined || num === 0)
      return isCurrency ? "$0" : "0";
    const prefix = isCurrency ? "$" : "";
    if (num >= 1000000000) return `${prefix}${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${prefix}${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${prefix}${(num / 1000).toFixed(1)}K`;
    return `${prefix}${num.toLocaleString()}`;
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copied");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const formatNumber = (num) => {
    if (!num || num === 0) return "$0";
    if (num >= 1000000000) return `$${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `$${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `$${(num / 1000).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
  };

  // Format symbol: replace WSOL with SOL
  const formatSymbol = (symbol) => {
    if (!symbol) return symbol;
    return symbol.startsWith("WSOL") ? symbol.replace(/^WSOL/, "SOL") : symbol;
  };

  const formatDate = (dateValue) => {
    if (dateValue === null || dateValue === undefined) return "N/A";

    // If it's already a string with dashes, just return the date part
    const dateStr = dateValue.toString();
    if (dateStr.includes("-")) {
      return dateStr.split("T")[0];
    }

    // If it's a numeric string of length 8 (YYYYMMDD)
    if (dateStr.length === 8 && !isNaN(dateStr)) {
      return `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`;
    }

    // Try to parse as a date if it's something else
    try {
      const d = new Date(dateValue);
      if (!isNaN(d.getTime())) {
        return d.toISOString().split("T")[0];
      }
    } catch {
      // Ignore parsing errors
    }

    return dateValue;
  };

  const formatVolume = (volume) => {
    return `$${volume.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const convertDateToNumeric = (dateStr) => {
    if (!dateStr) return undefined;
    return parseInt(dateStr.replace(/-/g, ""));
  };

  const exportToCSV = () => {
    const isSuperUser = user?.role === "superuser";
    const headers = [
      "Date",
      "Total Volume",
      "Pool Fee",
      "Transactions",
      "Buys",
      "Sells",
    ];
    const csvData = rwaReports.map((report) => [
      formatDate(
        report.startTime ||
          report.endTime ||
          report.date ||
          report.day ||
          report.timestamp,
      ),
      typeof report.totalVolume === "number"
        ? report.totalVolume.toFixed(2)
        : "0.00",
      typeof report.poolFee === "number" ? report.poolFee.toFixed(2) : "0.00",
      report.totalTransactions || 0,
      report.buys || 0,
      report.sells || 0,
    ]);

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rwa-reports-${pairAddress}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin mx-auto mb-6"></div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Loading Pool Details
            </h3>
            <p className="text-gray-600">
              Fetching the latest pool analytics...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!poolData) {
    return (
      <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 p-6">
        <div className="text-center py-20">
          <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-red-100 to-pink-100 rounded-full flex items-center justify-center shadow-lg">
            <AlertCircle className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Pool Not Found
          </h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            The requested pool could not be found. It may have been removed or
            the address is incorrect.
          </p>
          <button
            onClick={() => navigate(-1)}
            className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-2xl hover:from-blue-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl"
          >
            Back to Pools
          </button>
        </div>
      </div>
    );
  }

  const latestReport = rwaReports.length > 0 ? rwaReports[0] : null;
  const targetReport = globalLatestReport || latestReport;
  const latestMMObject = targetReport?.MMobject || targetReport?.MMObject || {};

  // Prioritize absolute latest report data for the top 5 cards
  const totalTVL =
    latestMMObject.poolLiquidity || targetReport?.poolLiquidity || 0;
  const companyTVL =
    latestMMObject.companysLiquidity ||
    targetReport?.companysLiquidity ||
    targetReport?.companyLiquidity ||
    0;

  return (
    <div className="bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 relative overflow-hidden min-h-screen">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/3 left-1/4 w-60 h-60 bg-cyan-200/20 rounded-full blur-2xl"></div>
      </div>

      <div className="relative z-10 p-4 sm:p-5 lg:p-6 mx-auto">
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={() => navigate(-1)}
              className="group flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <ArrowLeft
                size={18}
                className="text-gray-600 group-hover:text-blue-600 transition-colors"
              />
              <span className="text-sm text-gray-700 font-medium group-hover:text-blue-600 transition-colors">
                Back to Pools
              </span>
            </button>

            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2.5 bg-white/80 backdrop-blur-xl rounded-2xl border border-white/20 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw
                size={18}
                className={`text-blue-600 ${refreshing ? "animate-spin" : ""}`}
              />
              <span className="text-sm text-gray-700 font-medium">
                {refreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>
          </div>

          {/* Pool Header Info */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 p-5 sm:p-6 shadow-2xl mb-5">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
              <div className="flex items-start gap-4 sm:gap-5">
                <div
                  className="relative flex items-center"
                  style={{ width: "80px", height: "56px" }}
                >
                  <div className="absolute left-0 w-14 h-14 rounded-full shadow-2xl border-4 border-white overflow-hidden bg-gradient-to-br from-red-500 to-pink-600 animate-shine-border">
                    {poolData.mintA.logoURI ? (
                      <img
                        src={poolData.mintA.logoURI}
                        alt={poolData.mintA.symbol}
                        className="w-full h-full object-cover"
                        style={{ imageRendering: "auto" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-xl">${poolData.mintA.symbol.charAt(
                            0,
                          )}</div>`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                        {poolData.mintA.symbol.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="absolute left-10 w-14 h-14 rounded-full shadow-2xl border-4 border-white z-10 overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600 animate-shine-border">
                    {poolData.mintB.logoURI ? (
                      <img
                        src={poolData.mintB.logoURI}
                        alt={poolData.mintB.symbol}
                        className="w-full h-full object-cover"
                        style={{ imageRendering: "auto" }}
                        onError={(e) => {
                          e.target.style.display = "none";
                          e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-xl">${poolData.mintB.symbol.charAt(
                            0,
                          )}</div>`;
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white font-bold text-xl">
                        {poolData.mintB.symbol.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4 mb-3">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-gray-900 mb-2 sm:mb-0">
                      {poolData.mintA.symbol}-{poolData.mintB.symbol}
                    </h1>
                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                        {poolData.type}
                      </div>
                      <div className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                        {poolData.pooltype.join(", ")}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-gray-600">
                    <span className="font-semibold text-gray-700">
                      {poolData.mintA.name} / {poolData.mintB.name}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 min-w-max">
                {/* <div className="text-center p-3 bg-white/50 rounded-2xl border border-white/20">
                  <div className="text-lg sm:text-xl font-bold text-gray-900">
                    {poolData.day.apr}%
                  </div>
                  <div className="text-xs text-gray-600">24h APR</div>
                </div> */}
                <div className="text-center p-3 bg-white/50 rounded-2xl border border-white/20 col-span-2 sm:col-span-1">
                  <div className="text-lg sm:text-xl font-bold text-gray-900">
                    {(poolData.feeRate * 100).toFixed(2)}%
                  </div>
                  <div className="text-xs text-gray-600">Fee Rate</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Key Metrics Grid - Now Full Width */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5 mb-6">
          {/* Volume Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 p-4 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-600">
                  24h Volume
                </h3>
                <p className="text-xl font-bold text-gray-900">
                  {formatNumber(poolData.day.volume)}
                </p>
              </div>
            </div>
          </div>

          {/* Fees Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 p-4 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <PieChart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-600">
                  24h Fees
                </h3>
                <p className="text-xl font-bold text-gray-900">
                  {formatNumber(poolData.day.volumeFee)}
                </p>
              </div>
            </div>
          </div>

          {/* APR Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 p-4 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Zap className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-600">
                  APR 24h
                </h3>
                <p className="text-xl font-bold text-green-600">
                  {poolData.day.apr}%
                </p>
              </div>
            </div>
          </div>

          {/* Total TVL Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 p-4 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Activity className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-600">
                  Total TVL
                </h3>
                <p className="text-xl font-bold text-gray-900">
                  {formatNumber(totalTVL)}
                </p>
              </div>
            </div>
          </div>

          {/* Company TVL Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 p-4 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 group">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-600">
                  String TVL
                </h3>
                <p className="text-xl font-bold text-gray-900">
                  {formatNumber(companyTVL)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 lg:gap-6 mb-6">
          {/* Left Column */}
          <div className="xl:col-span-2 space-y-4 lg:space-y-5">
            {/* RWA Reports Table */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 p-5 lg:p-6 shadow-2xl">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2 mb-2 sm:mb-0">
                  <BarChart3 className="h-5 w-5 text-blue-500" />
                  Pool Reports
                </h3>
                <div className="flex flex-wrap items-center gap-4">
                  {/* Date Range Filters */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 bg-white border border-gray-300 rounded-xl px-2.5 py-1 shadow-sm hover:border-blue-400 transition-all duration-300">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                          From
                        </span>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            const newStartDate = e.target.value;
                            setStartDate(newStartDate);
                            setReportsCurrentPage(1);
                            // console.log("📅 Start Date Selected:", newStartDate);
                            if (endDate) {
                              const range = {
                                startTime: parseInt(
                                  newStartDate.replace(/-/g, ""),
                                ),
                                endTime: parseInt(endDate.replace(/-/g, "")),
                              };
                              console.log(
                                "📊 API Date Range Filter (Numeric):",
                                range,
                              );
                            }
                          }}
                          className="bg-transparent border-none p-0 text-sm font-semibold text-gray-700 focus:ring-0 cursor-pointer w-[115px]"
                        />
                      </div>
                      <div className="w-px h-3 bg-gray-200 mx-0.5"></div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">
                          To
                        </span>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            const newEndDate = e.target.value;
                            setEndDate(newEndDate);
                            setReportsCurrentPage(1);
                            console.log("📅 End Date Selected:", newEndDate);
                            if (startDate) {
                              const range = {
                                startTime: parseInt(
                                  startDate.replace(/-/g, ""),
                                ),
                                endTime: parseInt(newEndDate.replace(/-/g, "")),
                              };
                              console.log(
                                "📊 API Date Range Filter (Numeric):",
                                range,
                              );
                            }
                          }}
                          className="bg-transparent border-none p-0 text-sm font-semibold text-gray-700 focus:ring-0 cursor-pointer w-[115px]"
                        />
                      </div>
                      {(startDate || endDate) && (
                        <button
                          onClick={() => {
                            setStartDate("");
                            setEndDate("");
                            setReportsCurrentPage(1);
                          }}
                          className="ml-1 p-0.5 text-gray-400 hover:text-red-500 transition-colors"
                          title="Clear Dates"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>

                    {totalSummary?.daysCount && (
                      <div className="flex items-center animate-in zoom-in duration-300">
                        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md shadow-blue-200 flex items-center gap-2 whitespace-nowrap border border-blue-700">
                          <Activity size={14} />
                          {totalSummary.daysCount} DAYS
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rows per page filter */}
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                      Show:
                    </label>
                    <select
                      value={reportsLimit}
                      onChange={(e) => {
                        setReportsLimit(Number(e.target.value));
                        setReportsCurrentPage(1);
                      }}
                      className="px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300"
                    >
                      <option value={10}>10 rows</option>
                      <option value={20}>20 rows</option>
                      <option value={50}>50 rows</option>
                      <option value={100}>100 rows</option>
                    </select>
                  </div>

                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors duration-300 whitespace-nowrap shadow-md hover:shadow-lg"
                  >
                    <Download size={16} />
                  </button>
                </div>
              </div>

              {/* Total Summary Card for Date Range */}
              {totalSummary && (
                <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3 shadow-lg text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <Activity size={18} className="opacity-80" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider opacity-80">
                        Total Volume
                      </h4>
                    </div>
                    <p className="text-xl font-bold">
                      {formatCompactNumber(totalSummary.totalVolume, true)}
                    </p>
                  </div>

                  {/* <div className="bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl p-3 shadow-lg text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign size={18} className="opacity-80" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider opacity-80">Pool Liquidity</h4>
                    </div>
                    <p className="text-xl font-bold">{formatCompactNumber(totalSummary.poolLiquidity, true)}</p>
                  </div> */}

                  <div className="bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl p-3 shadow-lg text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <DollarSign size={18} className="opacity-80" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider opacity-80">
                        Pool Fee
                      </h4>
                    </div>
                    <p className="text-xl font-bold">
                      {formatCompactNumber(totalSummary.poolFee, true)}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-3 shadow-lg text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 size={18} className="opacity-80" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider opacity-80">
                        Transactions
                      </h4>
                    </div>
                    <p className="text-xl font-bold">
                      {formatCompactNumber(totalSummary.totalTransactions)}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-3 shadow-lg text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp size={18} className="opacity-80" />
                      <h4 className="text-xs font-semibold uppercase tracking-wider opacity-80">
                        Total Buys
                      </h4>
                    </div>
                    <p className="text-xl font-bold">
                      {formatCompactNumber(totalSummary.buys)}
                    </p>
                    {/* <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white" 
                          style={{ width: `${(totalSummary.buys / totalSummary.totalTransactions * 100) || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs opacity-70">
                        {((totalSummary.buys / totalSummary.totalTransactions * 100) || 0).toFixed(1)}%
                      </span>
                    </div> */}
                  </div>

                  <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-3 shadow-lg text-white">
                    <div className="flex items-center gap-3 mb-2">
                      <TrendingUp
                        size={18}
                        className="opacity-80 transform rotate-180"
                      />
                      <h4 className="text-xs font-semibold uppercase tracking-wider opacity-80">
                        Total Sells
                      </h4>
                    </div>
                    <p className="text-xl font-bold">
                      {formatCompactNumber(totalSummary.sells)}
                    </p>
                    {/* <div className="flex items-center gap-2 mt-1">
                      <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-white" 
                          style={{ width: `${(totalSummary.sells / totalSummary.totalTransactions * 100) || 0}%` }}
                        ></div>
                      </div>
                      <span className="text-xs opacity-70">
                        {((totalSummary.sells / totalSummary.totalTransactions * 100) || 0).toFixed(1)}%
                      </span>
                    </div> */}
                  </div>
                </div>
              )}

              {reportsLoading ? (
                <div className="flex justify-center items-center py-12">
                  <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-600 rounded-full animate-spin"></div>
                </div>
              ) : rwaReports.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-8 w-8 text-gray-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-700 mb-2">
                    No Reports Available
                  </h4>
                  <p className="text-gray-500">
                    There are no RWA pool reports for this pool yet.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-gray-200/50">
                  <table className="w-full min-w-[1000px] lg:min-w-full">
                    <thead>
                      <tr className="bg-gray-50/80 border-b border-gray-200/50">
                        <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm">
                          Date
                        </th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm">
                          Total Volume
                        </th>
                        {/* <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm">
                          Pool Liquidity
                        </th> */}
                        <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm">
                          Pool Fee
                        </th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm">
                          Transactions
                        </th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm">
                          Buys
                        </th>
                        <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm">
                          Sells
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200/30">
                      {rwaReports.map((report, index) => (
                        <tr
                          key={report._id || index}
                          className="hover:bg-gray-50/50 transition-colors duration-200"
                        >
                          <td className="py-4 px-4 text-sm font-medium text-gray-900 whitespace-nowrap text-center">
                            <div className="flex items-center gap-2 justify-center">
                              <span>
                                {formatDate(
                                  report.startTime ||
                                    report.endTime ||
                                    report.date ||
                                    report.day ||
                                    report.timestamp,
                                )}
                              </span>
                              {user?.role !== "superuser" && (
                                <button
                                  onClick={() => handleReportClick(report)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 transition-all duration-200 hover:scale-110 hover:bg-blue-50 rounded-lg"
                                  title="View Report Details"
                                >
                                  <Eye size={16} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm font-medium text-gray-900 whitespace-nowrap text-center">
                            {formatVolume(report.totalVolume)}
                          </td>
                          {/* <td className="py-4 px-4 text-sm font-semibold text-blue-600 whitespace-nowrap text-center">
                            {formatVolume(report.poolLiquidity)}
                          </td> */}
                          <td className="py-4 px-4 text-sm font-semibold text-purple-600 whitespace-nowrap text-center">
                            {formatVolume(report.poolFee)}
                          </td>
                          <td className="py-4 px-4 text-sm font-medium text-gray-700 whitespace-nowrap text-center">
                            {report.totalTransactions?.toLocaleString("en-US")}
                          </td>
                          <td className="py-4 px-4 text-sm font-medium text-emerald-600 whitespace-nowrap text-center">
                            {report.buys?.toLocaleString("en-US")}
                          </td>
                          <td className="py-4 px-4 text-sm font-medium text-red-600 whitespace-nowrap text-center">
                            {report.sells?.toLocaleString("en-US")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Controls */}
              {!reportsLoading && rwaReports.length > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-gray-200/50">
                  <div className="text-sm text-gray-600">
                    Showing{" "}
                    <span className="font-bold text-purple-700">
                      {reportsTotalCount === 0
                        ? 0
                        : (reportsCurrentPage - 1) * reportsLimit + 1}
                    </span>{" "}
                    to{" "}
                    <span className="font-bold text-purple-700">
                      {reportsTotalCount === 0
                        ? 0
                        : Math.min(
                            reportsCurrentPage * reportsLimit,
                            reportsTotalCount,
                          )}
                    </span>{" "}
                    of{" "}
                    <span className="font-bold text-purple-700">
                      {reportsTotalCount}
                    </span>{" "}
                    reports
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        setReportsCurrentPage((prev) => Math.max(prev - 1, 1))
                      }
                      disabled={reportsCurrentPage === 1}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-purple-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronDown size={16} className="transform rotate-90" />
                      Previous
                    </button>

                    <div className="flex items-center gap-2">
                      {[...Array(reportsTotalPages)].map((_, index) => {
                        const page = index + 1;
                        if (
                          page === 1 ||
                          page === reportsTotalPages ||
                          (page >= reportsCurrentPage - 1 &&
                            page <= reportsCurrentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setReportsCurrentPage(page)}
                              className={`w-10 h-10 text-sm font-semibold rounded-xl transition-all duration-300 ${
                                reportsCurrentPage === page
                                  ? "bg-gradient-to-r from-purple-500 to-blue-600 text-white shadow-lg"
                                  : "text-gray-700 hover:bg-gray-100 border border-gray-200"
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === reportsCurrentPage - 2 ||
                          page === reportsCurrentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-2 text-purple-500">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    <button
                      onClick={() =>
                        setReportsCurrentPage((prev) =>
                          Math.min(prev + 1, reportsTotalPages),
                        )
                      }
                      disabled={reportsCurrentPage === reportsTotalPages}
                      className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 hover:border-purple-300 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                      <ChevronDown size={16} className="transform -rotate-90" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Token Information */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 p-5 lg:p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                Token Information
              </h3>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Token A */}
                <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-5 border border-blue-200/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-500 to-cyan-500">
                        {poolData.mintA.logoURI ? (
                          <img
                            src={poolData.mintA.logoURI}
                            alt={poolData.mintA.symbol}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.parentElement.innerHTML = `<span class='text-white font-bold text-xl'>${poolData.mintA.symbol.charAt(
                                0,
                              )}</span>`;
                            }}
                          />
                        ) : (
                          <span className="text-white font-bold text-xl">
                            {poolData.mintA.symbol.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {poolData.mintA.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {poolData.mintA.symbol}
                        </p>
                      </div>
                    </div>
                    {/* <ExternalLink
                      size={16}
                      className="text-gray-400 hover:text-blue-600 cursor-pointer"
                    /> */}
                  </div>

                  <div className="space-y-3">
                    <div
                      onClick={() =>
                        copyToClipboard(poolData.mintA.address, "tokenA")
                      }
                      className="flex justify-between items-center cursor-pointer hover:bg-blue-100/50 p-2 rounded-xl transition-colors"
                    >
                      <span className="text-sm text-gray-600">Address</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-gray-600 truncate max-w-[120px]">
                          {poolData.mintA.address.slice(0, 8)}...
                          {poolData.mintA.address.slice(-8)}
                        </code>
                        <Copy size={14} className="text-gray-400" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Decimals</span>
                      <span className="font-semibold text-gray-900">
                        {poolData.mintA.decimals}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Amount in Pool
                      </span>
                      <span className="font-semibold text-gray-900">
                        {poolData.mintAmountA.toFixed(8)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Token B */}
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-2xl p-5 border border-gray-200/50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center bg-gradient-to-br from-gray-600 to-blue-600">
                        {poolData.mintB.logoURI ? (
                          <img
                            src={poolData.mintB.logoURI}
                            alt={poolData.mintB.symbol}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = "none";
                              e.target.parentElement.innerHTML = `<span class='text-white font-bold text-xl'>${poolData.mintB.symbol.charAt(
                                0,
                              )}</span>`;
                            }}
                          />
                        ) : (
                          <span className="text-white font-bold text-xl">
                            {poolData.mintB.symbol.charAt(0)}
                          </span>
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">
                          {poolData.mintB.name}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {poolData.mintB.symbol}
                        </p>
                      </div>
                    </div>
                    {/* <ExternalLink
                      size={16}
                      className="text-gray-400 hover:text-blue-600 cursor-pointer"
                    /> */}
                  </div>

                  <div className="space-y-3">
                    <div
                      onClick={() =>
                        copyToClipboard(poolData.mintB.address, "tokenB")
                      }
                      className="flex justify-between items-center cursor-pointer hover:bg-blue-100/50 p-2 rounded-xl transition-colors"
                    >
                      <span className="text-sm text-gray-600">Address</span>
                      <div className="flex items-center gap-2">
                        <code className="text-xs font-mono text-gray-600 truncate max-w-[120px]">
                          {poolData.mintB.address.slice(0, 8)}...
                          {poolData.mintB.address.slice(-8)}
                        </code>
                        <Copy size={14} className="text-gray-400" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Decimals</span>
                      <span className="font-semibold text-gray-900">
                        {poolData.mintB.decimals}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">
                        Amount in Pool
                      </span>
                      <span className="font-semibold text-gray-900">
                        {poolData.mintAmountB.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Price Range Information */}
            {/* <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 p-5 lg:p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                Price Range & Liquidity
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-2xl">
                    <span className="text-sm text-gray-600">Current Price</span>
                    <span className="font-bold text-gray-900">
                      {formatNumber(poolData.price)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-green-50/50 rounded-2xl">
                    <span className="text-sm text-gray-600">24h Min Price</span>
                    <span className="font-bold text-gray-900">
                      {formatNumber(poolData.day.priceMin)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-red-50/50 rounded-2xl">
                    <span className="text-sm text-gray-600">24h Max Price</span>
                    <span className="font-bold text-gray-900">
                      {formatNumber(poolData.day.priceMax)}
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-purple-50/50 rounded-2xl">
                    <span className="text-sm text-gray-600">
                      Trade Fee Rate
                    </span>
                    <span className="font-bold text-gray-900">
                      {(poolData.config.tradeFeeRate / 10000).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-orange-50/50 rounded-2xl">
                    <span className="text-sm text-gray-600">
                      Protocol Fee Rate
                    </span>
                    <span className="font-bold text-gray-900">
                      {(poolData.config.protocolFeeRate / 10000).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-cyan-50/50 rounded-2xl">
                    <span className="text-sm text-gray-600">Tick Spacing</span>
                    <span className="font-bold text-gray-900">
                      {poolData.config.tickSpacing || "N/A"}
                    </span>
                  </div>
                </div>
              </div>
            </div> */}
          </div>

          {/* Right Column - Performance & Addresses */}
          <div className="space-y-5 lg:space-y-6">
            {/* Performance Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 p-5 lg:p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-orange-500" />
                Performance APR
              </h3>

              <div className="space-y-4">
                {[
                  {
                    period: "24 Hours",
                    value: poolData.day.apr,
                    color: "from-green-400 to-emerald-500",
                  },
                  {
                    period: "7 Days",
                    value: poolData.week.apr,
                    color: "from-blue-400 to-cyan-500",
                  },
                  {
                    period: "30 Days",
                    value: poolData.month.apr,
                    color: "from-purple-400 to-pink-500",
                  },
                ].map((item, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">
                        {item.period}
                      </span>
                      <span className="font-semibold text-green-600">
                        {item.value}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200/50 rounded-full h-3 backdrop-blur-sm">
                      <div
                        className={`bg-gradient-to-r ${item.color} h-3 rounded-full transition-all duration-1000 ease-out`}
                        style={{ width: `${Math.min(item.value / 10, 100)}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Volume Performance */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 p-5 lg:p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                Volume Analytics
              </h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-blue-50/50 rounded-2xl">
                  <span className="text-gray-600">24h Volume</span>
                  <span className="font-semibold text-blue-600">
                    {formatNumber(poolData.day.volume)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-green-50/50 rounded-2xl">
                  <span className="text-gray-600">7d Volume</span>
                  <span className="font-semibold text-green-600">
                    {formatNumber(poolData.week.volume)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-purple-50/50 rounded-2xl">
                  <span className="text-gray-600">30d Volume</span>
                  <span className="font-semibold text-purple-600">
                    {formatNumber(poolData.month.volume)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-3 bg-orange-50/50 rounded-2xl">
                  <span className="text-gray-600">30d Fees</span>
                  <span className="font-semibold text-orange-600">
                    {formatNumber(poolData.month.volumeFee)}
                  </span>
                </div>
              </div>
            </div>

            {/* Contract Addresses */}
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 p-5 lg:p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-gray-900 mb-5 flex items-center gap-2">
                <Eye className="h-5 w-5 text-purple-500" />
                Contract Addresses
              </h3>

              <div className="space-y-4">
                {[
                  {
                    label: "Pool Address",
                    value: poolData.id,
                    field: "pool",
                  },
                  {
                    label: "Token A Address",
                    value: poolData.mintA.address,
                    field: "tokenA",
                  },
                  {
                    label: "Token B Address",
                    value: poolData.mintB.address,
                    field: "tokenB",
                  },
                ].map((item, index) => (
                  <div key={index} className="group">
                    <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                      {item.label}
                    </label>
                    <div className="flex items-center gap-2 p-2.5 bg-gray-50/50 rounded-2xl border border-gray-200/50 group-hover:border-blue-300 transition-colors duration-300">
                      <code className="flex-1 text-sm font-mono text-gray-600 truncate">
                        {item.value}
                      </code>
                      <button
                        onClick={() => copyToClipboard(item.value, item.field)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors duration-200 hover:scale-110"
                      >
                        {copiedField === item.field ? (
                          <CheckCircle size={18} className="text-green-500" />
                        ) : (
                          <Copy size={18} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <RWAReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        reportData={selectedReport}
      />
    </div>
  );
};

export default RWADetails;
