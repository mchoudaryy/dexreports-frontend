import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DollarSign,
  TrendingUp,
  Wallet,
  Zap,
  Activity,
  Download,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  Calendar,
  RotateCcw,
  Loader,
  FileText,
  Table,
  Users,
  Eye,
  X,
  Receipt,
  BarChart3,
  Coins,
  Copy,
  Check,
} from "lucide-react";
import { ADMIN_API } from "../services/ApiHandlers";

const TokenWallet = () => {
  const { walletAddress } = useParams();

  const navigate = useNavigate();
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [dateFilter, setDateFilter] = useState("");
  const [endDateFilter, setEndDateFilter] = useState("");
  const [walletReports, setWalletReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exportDropdownOpen, setExportDropdownOpen] = useState(false);
  const [totalsData, setTotalsData] = useState(null);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const exportDropdownRef = useRef(null);

  const [tokenDetails, setTokenDetails] = useState(null);

  // New state for pagination info from API
  const [paginationInfo, setPaginationInfo] = useState({
    count: 0,
    totalPages: 1,
    page: 1,
    limit: 10,
  });

  const [copied, setCopied] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(event.target)
      ) {
        setExportDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchWalletReportsTotal = async (walletAddress) => {
    try {
      const response = await ADMIN_API.WALLET_REPORTS_TOTAL({
        walletAddress,
      });
      console.log("totals in WALLET_REPORTS_TOTAL", response);
      if (response && response.status === 200 && response.data) {
        const totals = response.data.totals;
        setTokenDetails(response.data);
        setTotalsData(totals);
      }
    } catch (error) {
      console.log("Error in fetchWalletReportsTotal:", error);
      setTotalsData({
        totalVolume: 0,
        lpAdd: 0,
        totalTransactions: 0,
        buys: 0,
        sells: 0,
        walletCost: 0,
      });
    }
  };

  // Modified fetchWalletReport to handle pagination with limit parameter
  const fetchWalletReport = async (page = 1) => {
    console.log("walletAddress", walletAddress);
    console.log("Fetching page:", page, "with limit:", itemsPerPage);

    try {
      setLoading(true);
      const params = {
        walletAddress: walletAddress,
        page: page,
        limit: itemsPerPage,
      };

      if (dateFilter) {
        params.startTime = dateFilter.replace(/-/g, "");
      }
      if (endDateFilter) {
        params.endTime = endDateFilter.replace(/-/g, "");
      }

      const response = await ADMIN_API.GET_WALLET_REPORTS(params);
      console.log("GET_WALLET_REPORTS Response", response);

      if (response && response.status === 200 && response.data) {
        setWalletReports(response.data.data || []);

        // Set pagination info from API response
        setPaginationInfo({
          count: response.data.count || 0,
          totalPages: response.data.totalPages || 1,
          page: response.data.page || 1,
          limit: response.data.limit || itemsPerPage,
        });
      }
    } catch (error) {
      console.log("Error in fetchWalletReport:", error);
      setWalletReports([]);
      setPaginationInfo({
        count: 0,
        totalPages: 1,
        page: 1,
        limit: itemsPerPage,
      });
    } finally {
      setLoading(false);
    }
  };

  // Modified useEffect to fetch both data when itemsPerPage changes
  useEffect(() => {
    if (walletAddress) {
      fetchWalletReportsTotal(walletAddress); // No limit for totals
      fetchWalletReport(currentPage);
    }
  }, [currentPage, itemsPerPage, walletAddress, dateFilter, endDateFilter]);

  const resetFilters = () => {
    setDateFilter("");
    setEndDateFilter("");
    setCurrentPage(1);
    setSortConfig({ key: null, direction: "ascending" });
  };

  // Transform API data to match table structure
  const tableData = useMemo(() => {
    if (!walletReports.length) return [];

    return walletReports.map((report) => ({
      id: report.id || report.startTime, // Use id or startTime as unique identifier
      date: report.startTime
        ? `${report.startTime.toString().slice(0, 4)}-${report.startTime
            .toString()
            .slice(4, 6)}-${report.startTime.toString().slice(6, 8)}`
        : "N/A",
      solanaAvgPrice: report.solAverage || 0,
      totalVolume: report.totalVolume || 0,
      transactions: report.totalTransactions || 0,
      totalBuys: report.buys || 0,
      totalSells: report.sells || 0,
      totalGasFee: report.gasFee || 0,
      gasFeeInDollars: report.gasFeeInDollars || 0,
      totalRaydiumFee: report.rayFee || 0,
      rayFee: report.rayFee || 0,
      slippagePL: report.slipageAndloss || 0,
      poolFee: report.lpAdd || 0,
      totalCost: report.totalCost || 0,
      netCost: report.netCost || 0,
      tokenAverage: report.tokenAverage || 0,
      tokenSymbol: report.tokenSymbol || "TOKEN",
      // Include original report data for popup
      originalReport: report,
    }));
  }, [walletReports]);

  // Filter and sort data (client-side for current page only)
  const filteredAndSortedData = useMemo(() => {
    let filteredData = [...tableData];

    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }

    return filteredData;
  }, [tableData, sortConfig, dateFilter]);

  // Handle view details
  const handleViewDetails = (report) => {
    setSelectedReport(report);
    setShowDetailsPopup(true);
  };

  // Close details popup
  const handleCloseDetails = () => {
    setShowDetailsPopup(false);
    setSelectedReport(null);
  };

  // Export functions (using current page data)
  const exportToCSV = () => {
    const symbol = filteredAndSortedData[0]?.tokenSymbol || "TOKEN";

    const headers = [
      "Date",
      "SOL Price",
      "IDLE Price",
      "Volume",
      "TX Count",
      "Buys",
      "Sells",
      "Gas Fee",
      "Gas Fee In Dollars",
      "Raydium Fee",
      "Slippage + PL",
      "Pool Fee",
      "Total Cost",
      "Net PnL",
    ];

    const csvContent = [
      headers.join(","),
      ...filteredAndSortedData.map((row) =>
        [
          row.date,
          `$${formatNumber(row.solanaAvgPrice, 2)}`,
          `$${formatNumber(row.tokenAverage, 8)}`,
          formatCurrency(row.totalVolume).replace(/,/g, ""),
          row.transactions,
          row.totalBuys,
          row.totalSells,
          `${formatNumber(row.totalGasFee)} SOL`,
          formatCurrency(row.gasFeeInDollars).replace(/,/g, ""),
          formatCurrency(row.totalRaydiumFee).replace(/,/g, ""),
          formatCurrency(row.slippagePL).replace(/,/g, ""),
          formatCurrency(row.poolFee).replace(/,/g, ""),
          formatCurrency(row.totalCost).replace(/,/g, ""),
          formatCurrency(row.netCost).replace(/,/g, ""),
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `wallet_data_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportDropdownOpen(false);
  };

  const exportToExcel = () => {
    const symbol = filteredAndSortedData[0]?.tokenSymbol || "TOKEN";

    // For Excel export, we'll create a CSV with proper formatting that Excel can open
    const headers = [
      "Date",
      "SOL Price",
      "IDLE Price",
      "Volume",
      "TX Count",
      "Buys",
      "Sells",
      "Gas Fee",
      "Gas Fee In Dollars",
      "Raydium Fee",
      "Slippage + PL",
      "Pool Fee",
      "Total Cost",
      "Net PnL",
    ];

    const excelContent = [
      headers.join("\t"),
      ...filteredAndSortedData.map((row) =>
        [
          row.date,
          `$${formatNumber(row.solanaAvgPrice, 2)}`,
          `$${formatNumber(row.tokenAverage, 8)}`,
          formatCurrency(row.totalVolume).replace(/,/g, ""),
          row.transactions,
          row.totalBuys,
          row.totalSells,
          `${formatNumber(row.totalGasFee)} SOL`,
          formatCurrency(row.gasFeeInDollars).replace(/,/g, ""),
          formatCurrency(row.totalRaydiumFee).replace(/,/g, ""),
          formatCurrency(row.slippagePL).replace(/,/g, ""),
          formatCurrency(row.poolFee).replace(/,/g, ""),
          formatCurrency(row.totalCost).replace(/,/g, ""),
          formatCurrency(row.netCost).replace(/,/g, ""),
        ].join("\t"),
      ),
    ].join("\n");

    const blob = new Blob([excelContent], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `wallet_data_${new Date().toISOString().split("T")[0]}.xls`,
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setExportDropdownOpen(false);
  };

  // Pagination - use server-side pagination info
  const totalPages = paginationInfo.totalPages;

  // Generate pagination items
  const getPaginationItems = () => {
    const items = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        items.push(i);
      }
    } else {
      items.push(1);

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) {
        end = 4;
      }

      if (currentPage >= totalPages - 2) {
        start = totalPages - 3;
      }

      if (start > 2) {
        items.push("...");
      }

      for (let i = start; i <= end; i++) {
        items.push(i);
      }

      if (end < totalPages - 1) {
        items.push("...");
      }

      items.push(totalPages);
    }

    return items;
  };

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  const handleItemsPerPageChange = (value) => {
    const newLimit = Number(value);
    setItemsPerPage(newLimit);
    setCurrentPage(1); // Reset to first page
    // The useEffect will automatically trigger the API calls
  };

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      // The useEffect will automatically trigger the API call
    }
  };

  const formatNumber = (num, decimals = 4) => {
    if (num === 0 || num === null || num === undefined) return "0.0000";
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(num);
  };

  const formatCurrency = (num) => {
    if (num === 0 || num === null || num === undefined) return "$0.00";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const formatCompactCurrency = (num) => {
    if (num === 0 || num === null || num === undefined) return "$0";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num);
  };

  const formatCompactNumber = (num) => {
    if (num === 0 || num === null || num === undefined) return "0";
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(num);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key)
      return <ArrowUpDown size={14} className="text-gray-400" />;
    return sortConfig.direction === "ascending" ? (
      <ChevronUp size={14} className="text-blue-600" />
    ) : (
      <ChevronDown size={14} className="text-blue-600" />
    );
  };

  const paginationItems = getPaginationItems();

  // Loading spinner
  if (loading) {
    return (
      <div className="flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
        <div className="text-center">
          <Loader className="h-12 w-12 animate-spin text-blue-500 mx-auto mb-4" />
          <p className="text-black font-semibold text-base sm:text-lg">
            Loading wallet data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4 md:p-6 lg:p-8 bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Enhanced Background Elements - Responsive */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-20 -right-20 sm:-top-40 sm:-right-40 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-2xl sm:blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-20 -left-20 sm:-bottom-40 sm:-left-40 w-40 h-40 sm:w-80 sm:h-80 bg-gradient-to-r from-cyan-200/20 to-emerald-200/20 rounded-full blur-2xl sm:blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 left-1/4 sm:top-1/4 sm:left-1/3 w-32 h-32 sm:w-60 sm:h-60 bg-gradient-to-r from-amber-200/15 to-orange-200/15 rounded-full blur-xl sm:blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-30 mx-auto">
        {/* Combined Header Row */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 sm:mb-8 bg-white/40 backdrop-blur-xl p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-white/40 shadow-lg relative z-40">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            {/* Back Button - Icon Only */}
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 text-black hover:text-blue-600 transition-all duration-300 bg-white/80 backdrop-blur-xl rounded-lg sm:rounded-xl border border-white/40 shadow-md hover:shadow-xl hover:scale-105 group"
              title="Back to Wallets"
            >
              <ChevronLeft
                size={24}
                className="group-hover:-translate-x-1 transition-transform"
              />
            </button>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight text-gray-900 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 bg-clip-text text-transparent whitespace-nowrap">
                Wallet Analytics
              </h1>
              {walletAddress && (
                <div
                  onClick={() => handleCopy(walletAddress)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-full shadow-sm hover:shadow-md hover:bg-blue-100 transition-all cursor-pointer group"
                  title="Click to copy address"
                >
                  <Wallet size={14} className="text-blue-600" />
                  {(tokenDetails?.tokenSymbol || tableData[0]?.tokenSymbol) && (
                    <span className="text-xs font-bold text-blue-900 bg-blue-100/50 px-2 py-0.5 rounded-md border border-blue-200">
                      {tokenDetails?.tokenSymbol || tableData[0]?.tokenSymbol}
                    </span>
                  )}
                  <span className="text-xs sm:hidden font-mono font-semibold text-blue-800">
                    {`${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`}
                  </span>
                  <span className="hidden sm:inline lg:hidden text-xs font-mono font-semibold text-blue-800">
                    {`${walletAddress.slice(0, 8)}...${walletAddress.slice(-8)}`}
                  </span>
                  <span className="hidden lg:inline text-xs font-mono font-semibold text-blue-800">
                    {`${walletAddress.slice(0, 12)}...${walletAddress.slice(-12)}`}
                  </span>
                  {copied ? (
                    <Check
                      size={14}
                      className="text-green-600 animate-in zoom-in"
                    />
                  ) : (
                    <Copy
                      size={12}
                      className="text-blue-400 group-hover:text-blue-600 transition-colors"
                    />
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3">
            {/* Export Button with Dropdown */}
            <div className="relative w-full sm:w-auto" ref={exportDropdownRef}>
              <button
                onClick={() => setExportDropdownOpen(!exportDropdownOpen)}
                className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg sm:rounded-xl border border-blue-400 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all duration-300 hover:scale-105 group w-full sm:w-auto justify-center"
              >
                <Download
                  size={16}
                  className="group-hover:scale-110 transition-transform"
                />
                <span className="text-xs sm:text-sm font-semibold">
                  Export Data
                </span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${
                    exportDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Export Dropdown Menu */}
              {exportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white/95 backdrop-blur-xl rounded-xl border border-white/40 shadow-2xl z-50 overflow-hidden">
                  <button
                    onClick={exportToCSV}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-black hover:bg-blue-50/50 transition-all duration-200 hover:scale-105 group"
                  >
                    <FileText
                      size={16}
                      className="text-blue-600 group-hover:scale-110 transition-transform"
                    />
                    <span>Export as CSV</span>
                  </button>
                  <button
                    onClick={exportToExcel}
                    className="flex items-center gap-3 w-full px-4 py-3 text-sm font-semibold text-black hover:bg-green-50/50 transition-all duration-200 hover:scale-105 group"
                  >
                    <div className="p-1.5 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                      <Table
                        size={16}
                        className="text-green-600 group-hover:scale-110 transition-transform"
                      />
                    </div>
                    <span>Export to Excel</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modern Design 2 - Alternative Style */}
        {totalsData && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Design 2: Total Volume */}
            <div className="relative group overflow-hidden bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-blue-500/5 hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500">
                <DollarSign size={120} className="text-blue-900" />
              </div>
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 flex items-center justify-center bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20">
                    <DollarSign size={24} className="text-white" />
                  </div>
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg border border-blue-100">
                    VOLUME
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-tight mb-1">
                    Total Volume
                  </h3>
                  <div className="text-4xl font-black text-gray-900 tracking-tight">
                    {formatCompactCurrency(totalsData.totalVolume || 0)}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                  <span className="text-[11px] font-medium text-gray-500">
                    Live network data
                  </span>
                </div>
              </div>
            </div>

            {/* Design 2: Pool Fee */}
            <div className="relative group overflow-hidden bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-emerald-500/5 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500">
                <Zap size={120} className="text-emerald-900" />
              </div>
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 flex items-center justify-center bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/20">
                    <Zap size={24} className="text-white" />
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100">
                    POOL FEE
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-tight mb-1">
                    Pool Fee
                  </h3>
                  <div className="text-4xl font-black text-gray-900 tracking-tight">
                    {formatCompactCurrency(totalsData.lpAdd || 0)}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                  <span className="text-[11px] font-medium text-gray-500">
                    Active pool fee
                  </span>
                </div>
              </div>
            </div>

            {/* Design 2: Total Transactions */}
            <div className="relative group overflow-hidden bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-purple-500/5 hover:shadow-2xl hover:shadow-purple-500/10 transition-all duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500">
                <Users size={120} className="text-purple-900" />
              </div>
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 flex items-center justify-center bg-purple-600 rounded-2xl shadow-lg shadow-purple-600/20">
                    <Users size={24} className="text-white" />
                  </div>
                  <span className="px-3 py-1 bg-purple-50 text-purple-600 text-[10px] font-black rounded-lg border border-purple-100">
                    ACTIVITY
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-tight mb-1">
                    Transactions
                  </h3>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-4xl font-black text-gray-900">
                      {formatCompactNumber(totalsData.totalTransactions || 0)}
                    </span>
                    <span className="text-sm font-black text-gray-400 uppercase tracking-wider">
                      Total
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-100 shadow-sm">
                      <div className="text-xl font-black text-emerald-600 leading-tight">
                        {formatCompactNumber(totalsData.buys || 0)}
                      </div>
                      <div className="text-[11px] font-black text-emerald-500 uppercase tracking-widest mt-0.5">
                        Buys
                      </div>
                    </div>
                    <div className="bg-red-50/80 p-3 rounded-2xl border border-red-100 shadow-sm">
                      <div className="text-xl font-black text-red-600 leading-tight">
                        {formatCompactNumber(totalsData.sells || 0)}
                      </div>
                      <div className="text-[11px] font-black text-red-500 uppercase tracking-widest mt-0.5">
                        Sells
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Design 2: Total Cost */}
            <div className="relative group overflow-hidden bg-white p-6 rounded-[2rem] border border-gray-100 shadow-xl shadow-amber-500/5 hover:shadow-2xl hover:shadow-amber-500/10 transition-all duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity duration-500">
                <BarChart3 size={120} className="text-amber-900" />
              </div>
              <div className="relative flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 flex items-center justify-center bg-amber-500 rounded-2xl shadow-lg shadow-amber-500/20">
                    <BarChart3 size={24} className="text-white" />
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black rounded-lg border border-amber-100">
                    PROFIT & LOSS
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-tight mb-1">
                    Net PnL
                  </h3>
                  <div className="text-4xl font-black text-emerald-600 tracking-tight">
                    {formatCompactCurrency(totalsData.totalCost || 0)}
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                  <TrendingUp size={14} className="text-emerald-500" />
                  <span className="text-[11px] font-medium text-gray-500">
                    Positive performance
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Enhanced Filters Section - Responsive */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-white/40 shadow-lg sm:shadow-xl mb-4 sm:mb-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4">
            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <Calendar className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5" />
                <span className="text-xs sm:text-sm font-semibold text-black whitespace-nowrap">
                  Date Filter
                </span>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
                <input
                  type="date"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition-all duration-300 bg-white/90 shadow-sm w-full sm:w-auto"
                  title="Start Date"
                />
                <span className="hidden sm:inline text-gray-400 font-bold">
                  -
                </span>
                <input
                  type="date"
                  value={endDateFilter}
                  onChange={(e) => setEndDateFilter(e.target.value)}
                  className="px-3 py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition-all duration-300 bg-white/90 shadow-sm w-full sm:w-auto"
                  title="End Date"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-between sm:justify-end">
              <button
                onClick={resetFilters}
                className="flex items-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-2.5 bg-white/80 backdrop-blur-xl rounded-lg sm:rounded-xl border border-gray-200/60 shadow-md hover:shadow-xl transition-all duration-300 hover:scale-105 group w-full sm:w-auto justify-center"
              >
                <RotateCcw
                  size={16}
                  className="text-black group-hover:text-blue-600 transition-colors"
                />
                <span className="text-xs sm:text-sm font-semibold text-black">
                  Reset
                </span>
              </button>
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-semibold text-black whitespace-nowrap">
                  Show
                </span>
                <div className="relative">
                  <select
                    value={itemsPerPage}
                    onChange={(e) => handleItemsPerPageChange(e.target.value)}
                    className="px-2 py-2 text-xs sm:text-sm rounded-lg sm:rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200/50 transition-all duration-300 bg-white/90 appearance-none pr-6 sm:pr-8 shadow-sm"
                  >
                    <option value="10">10 rows</option>
                    <option value="20">20 rows</option>
                    <option value="50">50 rows</option>
                    <option value="100">100 rows</option>
                  </select>
                  <ChevronDown className="absolute right-1 sm:right-2 top-1/2 transform -translate-y-1/2 text-gray-400 w-3 h-3 sm:w-4 sm:h-4" />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Enhanced Table - Responsive with horizontal scrolling */}
        <div className="bg-white/80 backdrop-blur-xl rounded-xl sm:rounded-2xl border border-white/40 shadow-lg sm:shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[1200px]">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200/60 bg-gradient-to-r from-blue-50/80 to-purple-50/80">
                    {[
                      { key: "actions", label: "View" },
                      { key: "date", label: "Date" },
                      {
                        key: "solanaAvgPrice",
                        label: "SOL Price",
                      },
                      {
                        key: "tokenAverage",
                        label: "IDLE Price",
                      },
                      { key: "totalVolume", label: "Volume" },
                      { key: "transactions", label: "TX Count" },
                      { key: "totalBuys", label: "Buys" },
                      { key: "totalSells", label: "Sells" },
                      { key: "poolFee", label: "Pool Fee" },
                      // { key: "netCost", label: "Net PnL" },
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        className="px-2 sm:px-3 md:px-4 py-3 sm:py-4 text-center text-xs sm:text-sm font-bold text-black uppercase tracking-wider cursor-pointer hover:bg-blue-100/50 transition-colors duration-200 whitespace-nowrap"
                        onClick={() => key !== "actions" && handleSort(key)}
                      >
                        <div className="flex items-center justify-center gap-1 sm:gap-2">
                          <span className="text-xs sm:text-sm">{label}</span>
                          {key !== "actions" && getSortIcon(key)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200/60">
                  {filteredAndSortedData.length > 0 ? (
                    filteredAndSortedData.map((item, index) => (
                      <tr
                        key={`${item.date}-${index}`}
                        className="hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 transition-all duration-200 group"
                      >
                        <td className="px-2 sm:px-3 md:px-4 py-3">
                          <div className="flex justify-center">
                            <button
                              onClick={() => handleViewDetails(item)}
                              className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 bg-transparent border border-gray-300 text-gray-500 rounded-lg sm:rounded-xl hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition-all duration-300 group"
                            >
                              <Eye
                                size={16}
                                className="group-hover:scale-110 transition-transform"
                              />
                            </button>
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 md:px-4 py-3">
                          <div className="text-xs sm:text-sm font-semibold text-black bg-gray-50/60 px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-lg border border-gray-100 whitespace-nowrap text-center">
                            {item.date}
                          </div>
                        </td>
                        {/* <td className="px-2 sm:px-3 md:px-4 py-3">
                          <div className="text-xs sm:text-sm font-bold text-blue-700 bg-blue-50/60 px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-lg border border-blue-100 whitespace-nowrap text-center">
                            ${formatNumber(item.solanaAvgPrice, 2)}
                          </div>
                        </td> */}
                        <td className="px-2 sm:px-3 md:px-4 py-3">
                          <div
                            className="text-xs sm:text-sm font-medium text-gray-900 
  bg-gray-50/60 px-2 py-1 sm:px-3 sm:py-2 
  rounded-md sm:rounded-lg border border-gray-100 
  whitespace-nowrap text-center"
                          >
                            ${formatNumber(item.solanaAvgPrice, 2)}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 md:px-4 py-3">
                          <div
                            className="text-xs sm:text-sm font-medium text-gray-900 
  bg-gray-50/60 px-2 py-1 sm:px-3 sm:py-2 
  rounded-md sm:rounded-lg border border-gray-100 
  whitespace-nowrap text-center"
                          >
                            ${formatNumber(item.tokenAverage, 8)}
                          </div>
                        </td>

                        {/* <td className="px-2 sm:px-3 md:px-4 py-3">
                          <div className="text-xs sm:text-sm font-bold text-purple-600 bg-purple-50/60 px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-lg border border-purple-100 whitespace-nowrap text-center">
                            {formatCurrency(item.totalVolume)}
                          </div>
                        </td> */}

                        <td className="px-2 sm:px-3 md:px-4 py-3">
                          <div
                            className="text-xs sm:text-sm font-semibold text-black 
  bg-gray-50/60 px-2 py-1 sm:px-3 sm:py-2 
  rounded-md sm:rounded-lg border border-gray-100 
  whitespace-nowrap text-center"
                          >
                            {formatCurrency(item.totalVolume)}
                          </div>
                        </td>

                        {/* <td className="px-2 sm:px-3 md:px-4 py-3">
                          <div className="text-xs sm:text-sm font-semibold text-black bg-gray-50/60 px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-lg border border-gray-100 whitespace-nowrap text-center">
                            {item.transactions.toLocaleString()}
                          </div>
                        </td> */}

                        <td className="px-2 sm:px-3 md:px-4 py-3">
                          <div
                            className="text-xs sm:text-sm font-semibold text-black 
  bg-gray-50/60 px-2 py-1 sm:px-3 sm:py-2 
  rounded-md sm:rounded-lg border border-gray-100 
  whitespace-nowrap text-center"
                          >
                            {item.transactions.toLocaleString()}
                          </div>
                        </td>

                        <td className="px-2 sm:px-3 md:px-4 py-3">
                          <div className="text-xs sm:text-sm font-bold text-green-600 bg-green-50/60 px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-lg border border-green-100 whitespace-nowrap text-center">
                            {item.totalBuys.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 md:px-4 py-3">
                          <div className="text-xs sm:text-sm font-bold text-red-600 bg-red-50/60 px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-lg border border-red-100 whitespace-nowrap text-center">
                            {item.totalSells.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-2 sm:px-3 md:px-4 py-3">
                          <div className="text-xs sm:text-sm font-bold text-emerald-600 bg-emerald-50/60 px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-lg border border-emerald-100 whitespace-nowrap text-center">
                            {formatCurrency(item.poolFee)}
                          </div>
                        </td>
                        {/* <td className="px-2 sm:px-3 md:px-4 py-3">
                          <div
                            className={`text-xs sm:text-sm font-bold px-2 py-1 sm:px-3 sm:py-2 rounded-md sm:rounded-lg border whitespace-nowrap text-center ${
                              item.netCost >= 0
                                ? "text-green-600 bg-green-50/60 border-green-100"
                                : "text-red-600 bg-red-50/60 border-red-100"
                            }`}
                          >
                            {formatCurrency(item.netCost)}
                          </div>
                        </td> */}

                        {/* <td className="px-2 sm:px-3 md:px-4 py-3">
                          <div
                            className="text-xs sm:text-sm font-semibold text-black 
  bg-gray-50/60 px-2 py-1 sm:px-3 sm:py-2 
  rounded-md sm:rounded-lg border border-gray-100 
  whitespace-nowrap text-center"
                          >
                            {formatCurrency(item.netCost)}
                          </div>
                        </td> */}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="9" className="px-4 py-6 sm:py-8 text-center">
                        <div className="text-black font-semibold text-sm sm:text-base">
                          No wallet data available
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Pagination Controls */}
        {totalPages > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 p-4 bg-white/80 backdrop-blur-xl rounded-xl border border-white/40 shadow-lg">
            {/* Show entries info */}
            <div className="text-sm text-gray-600">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, paginationInfo.count)} of{" "}
              {paginationInfo.count} entries
            </div>

            {/* Pagination buttons */}
            <div className="flex items-center gap-2">
              {/* Previous button */}
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              >
                <ChevronLeft size={16} />
                Previous
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {paginationItems.map((item, index) => (
                  <button
                    key={index}
                    onClick={() =>
                      typeof item === "number" ? handlePageChange(item) : null
                    }
                    className={`min-w-[40px] h-10 flex items-center justify-center text-sm font-medium rounded-lg transition-all duration-200 ${
                      item === currentPage
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25"
                        : typeof item === "number"
                          ? "text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 hover:scale-105"
                          : "text-gray-400 cursor-default"
                    }`}
                    disabled={item === "..."}
                  >
                    {item}
                  </button>
                ))}
              </div>

              {/* Next button */}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105"
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Wallet Details Popup */}
      {showDetailsPopup && selectedReport && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl border-2 border-gray-200 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header - Modern Gradient */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-5 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                    <Receipt className="text-white w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">
                      Transaction Details
                    </h2>
                    <p className="text-blue-100 text-sm font-medium mt-1">
                      {selectedReport.date} • Complete Activity Breakdown
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseDetails}
                  className="p-2 hover:bg-white/20 rounded-xl transition-all duration-200 hover:scale-110"
                >
                  <X className="text-white w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable with proper mobile handling */}
            <div className="flex-1 overflow-y-auto bg-white">
              {/* Key Metrics - Modern Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                {/* Volume Card */}
                <div className="bg-indigo-50/50 rounded-2xl p-6 border border-indigo-100 shadow-lg shadow-indigo-500/5 hover:shadow-xl transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <BarChart3 className="text-indigo-500 w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-indigo-900/40 text-sm uppercase tracking-wider">
                      Total Volume
                    </h3>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-indigo-600">
                      {formatCurrency(selectedReport.totalVolume)}
                    </p>
                  </div>
                </div>

                {/* Pool Fee Card */}
                <div className="bg-emerald-50/50 rounded-2xl p-6 border border-emerald-100 shadow-lg shadow-emerald-500/5 hover:shadow-xl transition-all">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white rounded-xl shadow-sm">
                      <Coins className="text-emerald-500 w-5 h-5" />
                    </div>
                    <h3 className="font-bold text-emerald-900/40 text-sm uppercase tracking-wider">Pool Fee</h3>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-black text-emerald-500">
                      {formatCurrency(selectedReport.poolFee)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Detailed Sections */}
              <div className="px-6 pb-6 space-y-6">
                {/* Wallet Balance - Full Card Width */}
                <div className="bg-blue-50/50 rounded-2xl p-6 border border-blue-100 shadow-xl shadow-blue-500/5">
                  <h3 className="font-bold text-blue-900 text-lg mb-4 flex items-center gap-2">
                    <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-sm">
                      <Wallet className="text-blue-500 w-5 h-5" />
                    </div>
                    <span className="text-blue-900">Wallet Details</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-2">
                    {[
                      { label: "Gas Fee", value: `${formatNumber(selectedReport.totalGasFee)} SOL`, color: "text-gray-900" },
                      { label: "Slippage + PL", value: formatCurrency(selectedReport.slippagePL), color: "text-gray-900" },
                      { label: "SOL Price", value: `$${formatNumber(selectedReport.solanaAvgPrice, 2)}`, color: "text-blue-600" },
                      { label: "IDLE Price", value: `$${formatNumber(selectedReport.tokenAverage, 8)}`, color: "text-blue-600" },
                    ].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2.5 px-2 hover:bg-white/50 rounded-xl transition-colors border-b border-blue-100/30 last:border-0 md:last:border-b">
                        <span className="text-blue-900/60 font-medium">
                          {item.label}
                        </span>
                        <span className={`${item.color} font-black`}>
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Cost Card */}
                  <div className="bg-purple-50/50 rounded-2xl p-6 border border-purple-100 shadow-xl shadow-purple-500/5">
                    <h3 className="font-bold text-purple-900 text-lg mb-4 flex items-center gap-2">
                      <div className="p-2 bg-white rounded-xl border border-purple-100 shadow-sm">
                        <DollarSign className="text-purple-500 w-5 h-5" />
                      </div>
                      <span className="text-purple-900">Cost</span>
                    </h3>
                    <div className="space-y-2">
                      {[
                        { label: "Gas Fee", value: formatCurrency(selectedReport.gasFeeInDollars) },
                        { label: "Ray Fee", value: formatCurrency(selectedReport.rayFee) },
                        { label: "Slippage + PL", value: formatCurrency(selectedReport.slippagePL) },
                      ].map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2.5 px-2 hover:bg-white/50 rounded-xl transition-colors border-b border-purple-100/30 last:border-0">
                          <span className="text-purple-900/60 font-medium">
                            {item.label}
                          </span>
                          <span className="text-gray-900 font-black">
                            {item.value}
                          </span>
                        </div>
                      ))}
                      <div className="flex justify-between items-center mt-4 py-3 px-4 bg-white/60 rounded-xl border border-purple-100/50 shadow-sm">
                        <span className="text-purple-900 font-bold">
                          Total Cost
                        </span>
                        <span className="text-purple-900 font-black text-xl">
                          {formatCurrency(selectedReport.totalCost)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Transaction Activity */}
                  <div className="bg-green-50/50 rounded-2xl p-6 border border-green-100 shadow-xl shadow-green-500/5">
                    <h3 className="font-bold text-green-900 text-lg mb-4 flex items-center gap-2">
                      <div className="p-2 bg-white rounded-xl border border-green-100 shadow-sm">
                        <Activity className="text-green-500 w-5 h-5" />
                      </div>
                      <span className="text-green-900">Transaction Activity</span>
                    </h3>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center py-2.5 px-2 hover:bg-white/50 rounded-xl transition-colors border-b border-green-100/30">
                        <span className="text-green-900/60 font-medium">
                          Total Transactions
                        </span>
                        <span className="text-gray-900 font-black">
                          {selectedReport.transactions.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2.5 px-2 hover:bg-white/50 rounded-xl transition-colors border-b border-green-100/30">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-green-600 font-medium">
                            Buys
                          </span>
                        </div>
                        <span className="text-green-600 font-black">
                          {selectedReport.totalBuys.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2.5 px-2 hover:bg-white/50 rounded-xl transition-colors">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          <span className="text-red-600 font-medium">
                            Sells
                          </span>
                        </div>
                        <span className="text-red-600 font-black">
                          {selectedReport.totalSells.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TokenWallet;
