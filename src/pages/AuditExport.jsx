import { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Download,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Fuel,
  Wallet,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  BarChart3,
} from "lucide-react";
import { ADMIN_API } from "../services/ApiHandlers";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt  = (n, d = 2) => (n == null || isNaN(n) ? "0.00" : Number(n).toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }));
const fmtUSD = (n) => `$${fmt(n)}`;
const fmtN   = (n) => (n == null || isNaN(n) ? "0" : Number(n).toLocaleString("en-US"));
const shortAddr = (a) => (a && a.length > 12 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a || "—");

const STATUS_COLOR = {
  active:   "bg-green-500/20 text-green-400 border border-green-500/30",
  inactive: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
};
const POOL_TYPE_COLOR = {
  cpmm:    "bg-blue-500/20 text-blue-300",
  clmm:    "bg-purple-500/20 text-purple-300",
  rwa:     "bg-teal-500/20 text-teal-300",
};

// ─── Summary card ─────────────────────────────────────────────────────────────
const Card = ({ icon: Icon, title, value, sub, color }) => (
  <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 flex gap-3 items-start">
    <div className={`p-2 rounded-lg shrink-0 ${color}`}><Icon size={18} /></div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400 truncate">{title}</p>
      <p className="text-lg font-semibold text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Main component ───────────────────────────────────────────────────────────
const AuditExport = () => {
  const today        = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000).toISOString().slice(0, 10);

  // Filters
  const [startDate,      setStartDate]      = useState(thirtyDaysAgo);
  const [endDate,        setEndDate]        = useState(today);
  const [walletStatus,   setWalletStatus]   = useState("all");
  const [poolType,       setPoolType]       = useState("all");
  const [selectedWallet, setSelectedWallet] = useState("");
  const [activeTab,      setActiveTab]      = useState("wallet"); // "wallet" | "pool"

  // Data
  const [summary,     setSummary]     = useState(null);
  const [rows,        setRows]        = useState([]);
  const [total,       setTotal]       = useState(0);
  const [page,        setPage]        = useState(1);
  const [totalPages,  setTotalPages]  = useState(1);
  const LIMIT = 50;

  // UI
  const [loading,        setLoading]        = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [exportLoading,  setExportLoading]  = useState(false);
  const [error,          setError]          = useState("");
  const [walletList,     setWalletList]     = useState([]);
  const [expandedRow,    setExpandedRow]    = useState(null);
  const [showFilters,    setShowFilters]    = useState(true);

  const fetchingRef = useRef(false);

  // ── Fetch wallets for dropdown ────────────────────────────────────────────
  useEffect(() => {
    ADMIN_API.AUDIT_GET_WALLETS()
      .then((r) => { if (r?.data?.wallets) setWalletList(r.data.wallets); })
      .catch(() => {});
  }, []);

  // ── Fetch summary ─────────────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const r = await ADMIN_API.AUDIT_GET_SUMMARY({
        startDate, endDate,
        walletStatus: walletStatus === "all" ? undefined : walletStatus,
        poolType:     poolType     === "all" ? undefined : poolType,
        walletAddress: selectedWallet || undefined,
      });
      if (r?.data?.data) setSummary(r.data.data);
    } catch { setSummary(null); }
    finally { setSummaryLoading(false); }
  }, [startDate, endDate, walletStatus, poolType, selectedWallet]);

  // ── Fetch table rows ──────────────────────────────────────────────────────
  const fetchRows = useCallback(async (pg = 1) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setLoading(true);
    setError("");
    setExpandedRow(null);
    try {
      const fn = activeTab === "wallet" ? ADMIN_API.AUDIT_GET_DATA : ADMIN_API.AUDIT_GET_POOL_DATA;
      const r = await fn({
        startDate, endDate,
        walletStatus: walletStatus === "all" ? undefined : walletStatus,
        poolType:     poolType     === "all" ? undefined : poolType,
        walletAddress: selectedWallet || undefined,
        page: pg,
        limit: LIMIT,
      });
      if (r?.data) {
        setRows(r.data.rows || []);
        setTotal(r.data.total || 0);
        setTotalPages(r.data.totalPages || 1);
        setPage(pg);
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Failed to load data");
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [startDate, endDate, walletStatus, poolType, selectedWallet, activeTab]);

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    fetchSummary();
    fetchRows(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch rows when tab changes
  useEffect(() => {
    fetchRows(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const applyFilters = () => { fetchSummary(); fetchRows(1); };

  // ── Excel export ──────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExportLoading(true);
    setError("");
    try {
      const r = await ADMIN_API.AUDIT_EXPORT({
        startDate, endDate,
        walletStatus: walletStatus === "all" ? undefined : walletStatus,
        poolType:     poolType     === "all" ? undefined : poolType,
        walletAddress: selectedWallet || undefined,
      });

      if (!r?.data?.success) throw new Error("No export data");
      const { walletRows, poolRows, meta } = r.data;
      const wb = XLSX.utils.book_new();

      // ── Sheet 1: Summary ────────────────────────────────────────────────
      if (summary) {
        const statsSheet = XLSX.utils.aoa_to_sheet([
          ["Market Making Audit Summary"],
          ["Date Range", `${startDate}  →  ${endDate}`],
          ["Generated At", meta?.generatedAt || new Date().toISOString()],
          [],
          ["Metric", "Value"],
          ["Wallets",             summary.walletCount],
          ["Pools",               summary.poolCount],
          ["Total Transactions",  summary.totalTransactions],
          ["Total Buys",          summary.totalBuys],
          ["Total Sells",         summary.totalSells],
          [],
          ["Total Volume (USD)",  summary.totalVolume?.toFixed(2)],
          ["Buy Volume (USD)",    summary.totalBuyVolume?.toFixed(2)],
          ["Sell Volume (USD)",   summary.totalSellVolume?.toFixed(2)],
          [],
          ["Gas Fee (SOL)",       summary.totalGasFeeSOL?.toFixed(6)],
          ["Gas Fee (USD)",       summary.totalGasFeeUSD?.toFixed(2)],
          ["Ray Fee (USD)",       summary.totalRayFee?.toFixed(2)],
          ["Ray Cost (USD)",      summary.totalRayCost?.toFixed(2)],
          [],
          ["Net Cost (USD)",      summary.totalNetCost?.toFixed(2)],
          ["Total Cost (USD)",    summary.totalCost?.toFixed(2)],
          ["Wallet Loss (USD)",   summary.totalWalletLoss?.toFixed(2)],
          ["Slippage & Loss (USD)", summary.totalSlippage?.toFixed(2)],
          ["Yield (USD)",         summary.totalYield?.toFixed(2)],
          ["Funds Added (USD)",   summary.totalAddedAmount?.toFixed(2)],
        ]);
        XLSX.utils.book_append_sheet(wb, statsSheet, "Summary");
      }

      // ── Sheet 2: Wallet-Level Daily ──────────────────────────────────────
      const wHeaders = [
        "Date", "Wallet Address", "Wallet Label", "Wallet Status",
        "Token", "Symbol", "Pool Address", "Pool Type",
        "Buys", "Sells", "Total Txns",
        "Buy Volume (USD)", "Sell Volume (USD)", "Total Volume (USD)",
        "Gas Fee (SOL)", "Gas Fee (USD)",
        "Ray Fee (USD)", "Ray Cost (USD)",
        "Wallet Start Bal (SOL)", "Wallet Start Bal (USD)",
        "Funds Added (USD)",
        "Wallet End Bal (SOL)", "Wallet End Bal (USD)",
        "Net Cost (USD)", "Total Cost (USD)",
        "Wallet Loss (USD)", "Slippage & Loss (USD)",
        "Yield (USD)",
        "Expected Cost (USD)", "Price Impact",
      ];
      const wRows = walletRows.map((r) => [
        r.date, r.walletAddress, r.walletLabel || "", r.walletStatus || "",
        r.tokenName, r.tokenSymbol, r.pairAddress || "", r.poolType || "",
        r.buys, r.sells, r.totalTransactions,
        r.BuyVolume?.toFixed(2), r.SellVolume?.toFixed(2), r.totalVolume?.toFixed(2),
        r.gasFee?.toFixed(6), r.gasFeeInDollars?.toFixed(2),
        r.rayFee?.toFixed(2), r.rayCost?.toFixed(2),
        r.walletStartBalance?.toFixed(4), r.walletStartBalanceInUSDT?.toFixed(2),
        r.addedAmountInUSDT?.toFixed(2),
        r.walletEndBalance?.toFixed(4), r.walletEndBalanceInUSDT?.toFixed(2),
        r.netCost?.toFixed(2), r.totalCost?.toFixed(2),
        r.walletLoss?.toFixed(2), r.slipageAndloss?.toFixed(2),
        r.yeild?.toFixed(2),
        r.ExpectedCost?.toFixed(2), r.priceImpact?.toFixed(4),
      ]);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([wHeaders, ...wRows]), "Wallet Daily");

      // ── Sheet 3: Pool-Level Daily ────────────────────────────────────────
      const pHeaders = [
        "Date", "Pool Address", "Pool Type", "Token", "Symbol",
        "Buys", "Sells", "Total Txns", "Wallet Count",
        "Total Volume (USD)", "MM Volume (USD)", "Users Volume (USD)",
        "MM Yield (USD)", "Company Yield (USD)", "Users Yield (USD)",
        "Gas Fee (USD)", "MM Ray Cost (USD)", "MM Ray Fee (USD)",
        "Net Cost (USD)", "Net Company Cost (USD)",
        "Slippage & Loss (USD)", "Wallet Loss (USD)",
      ];
      const pRows = poolRows.map((r) => [
        r.date, r.pairAddress, r.poolType || "", r.tokenName, r.tokenSymbol,
        r.buys, r.sells, r.totalTransactions, r.walletCount,
        r.totalVolume?.toFixed(2), r.mmTotalVolume?.toFixed(2), r.usersTotalVolume?.toFixed(2),
        r.mmYeild?.toFixed(2), r.companysYeild?.toFixed(2), r.usersYeild?.toFixed(2),
        r.gasFeeInDollars?.toFixed(2), r.mmRayCost?.toFixed(2), r.mmRayFee?.toFixed(2),
        r.netCost?.toFixed(2), r.netCompanyCost?.toFixed(2),
        r.slipageAndloss?.toFixed(2), r.walletLoss?.toFixed(2),
      ]);
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([pHeaders, ...pRows]), "Pool Daily");

      XLSX.writeFile(wb, `MM_Audit_${startDate}_to_${endDate}.xlsx`);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#070d1b] text-white px-4 py-6 md:px-8">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Market Making Audit Export</h1>
          <p className="text-sm text-gray-400 mt-1">Daily swap data — wallet-wise & pool-wise, all statuses</p>
        </div>
        <button
          onClick={handleExport}
          disabled={exportLoading || rows.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm font-medium disabled:opacity-50 transition-colors"
        >
          {exportLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
          Download Excel
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />{error}
        </div>
      )}

      {/* Filters */}
      <div className="mb-4 bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
        <button
          onClick={() => setShowFilters(v => !v)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm text-gray-300 hover:bg-[#131f35] transition-colors"
        >
          <span className="flex items-center gap-2"><Filter size={14} />Filters</span>
          {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </button>

        {showFilters && (
          <div className="px-4 pb-4 border-t border-[#1e293b]">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Start Date</label>
                <input type="date" value={startDate} max={endDate}
                  onChange={e => setStartDate(e.target.value)}
                  className="bg-[#1e293b] border border-[#2d3f55] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">End Date</label>
                <input type="date" value={endDate} min={startDate} max={today}
                  onChange={e => setEndDate(e.target.value)}
                  className="bg-[#1e293b] border border-[#2d3f55] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Wallet Status</label>
                <select value={walletStatus} onChange={e => setWalletStatus(e.target.value)}
                  className="bg-[#1e293b] border border-[#2d3f55] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="all">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Pool Type</label>
                <select value={poolType} onChange={e => setPoolType(e.target.value)}
                  className="bg-[#1e293b] border border-[#2d3f55] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="all">All Types</option>
                  <option value="cpmm">CPMM</option>
                  <option value="clmm">CLMM</option>
                  <option value="rwa">RWA</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Wallet</label>
                <select value={selectedWallet} onChange={e => setSelectedWallet(e.target.value)}
                  className="bg-[#1e293b] border border-[#2d3f55] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="">All Wallets</option>
                  {walletList.map(w => (
                    <option key={w.walletAddress} value={w.walletAddress}>
                      {shortAddr(w.walletAddress)} ({w.status})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1 justify-end">
                <button onClick={applyFilters}
                  className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors">
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Summary cards */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#0f172a] border border-[#1e293b] rounded-xl h-20 animate-pulse" />
          ))}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <Card icon={BarChart3}    title="Total Volume"        value={fmtUSD(summary.totalVolume)}       sub={`${fmtN(summary.totalTransactions)} txns`}   color="bg-blue-500/20 text-blue-400" />
          <Card icon={TrendingUp}   title="Buy Volume"          value={fmtUSD(summary.totalBuyVolume)}    sub={`${fmtN(summary.totalBuys)} buys`}           color="bg-green-500/20 text-green-400" />
          <Card icon={TrendingDown} title="Sell Volume"         value={fmtUSD(summary.totalSellVolume)}   sub={`${fmtN(summary.totalSells)} sells`}         color="bg-red-500/20 text-red-400" />
          <Card icon={Fuel}         title="Gas Fees"            value={fmtUSD(summary.totalGasFeeUSD)}    sub={`${fmt(summary.totalGasFeeSOL, 4)} SOL`}     color="bg-orange-500/20 text-orange-400" />
          <Card icon={ArrowLeftRight} title="Ray Cost"          value={fmtUSD(summary.totalRayCost)}      sub="Platform fees"                               color="bg-yellow-500/20 text-yellow-400" />
          <Card icon={TrendingDown} title="Net Cost"            value={fmtUSD(summary.totalNetCost)}      color="bg-pink-500/20 text-pink-400" />
          <Card icon={TrendingDown} title="Slippage & Loss"     value={fmtUSD(summary.totalSlippage)}     color="bg-purple-500/20 text-purple-400" />
          <Card icon={Wallet}       title="Wallets / Pools"     value={`${summary.walletCount} wallets`}  sub={`${summary.poolCount} pools`}                color="bg-teal-500/20 text-teal-400" />
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-[#0f172a] border border-[#1e293b] rounded-xl p-1 w-fit">
        {[["wallet", "Wallet-wise"], ["pool", "Pool-wise"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === key ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e293b]">
          <span className="text-sm font-medium text-gray-300">
            {activeTab === "wallet" ? "Wallet-Level Daily Swap Data" : "Pool-Level Daily Aggregates"}
          </span>
          <span className="text-xs text-gray-500">{total.toLocaleString()} records · {startDate} → {endDate}</span>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-blue-400" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <AlertCircle size={36} className="mb-3 opacity-40" />
              <p className="text-sm">No data found for the selected filters.</p>
            </div>
          ) : activeTab === "wallet" ? (
            /* ── Wallet table ── */
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 bg-[#0a1221] border-b border-[#1e293b]">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Wallet</th>
                  <th className="px-4 py-3 text-left">Pool / Token</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-right">Buys / Sells</th>
                  <th className="px-4 py-3 text-right">Buy Vol (USD)</th>
                  <th className="px-4 py-3 text-right">Sell Vol (USD)</th>
                  <th className="px-4 py-3 text-right">Gas (USD)</th>
                  <th className="px-4 py-3 text-right">Ray Cost</th>
                  <th className="px-4 py-3 text-right">Net Cost</th>
                  <th className="px-4 py-3 text-center">More</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const exp = expandedRow === idx;
                  return (
                    <>
                      <tr key={idx} className={`border-b border-[#1e293b] hover:bg-[#131f35] transition-colors ${exp ? "bg-[#131f35]" : ""}`}>
                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{row.date}</td>
                        <td className="px-4 py-3">
                          <div className="text-white font-medium">{shortAddr(row.walletAddress)}</div>
                          {row.walletLabel && <div className="text-xs text-gray-500">{row.walletLabel}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-gray-200">{row.tokenSymbol} · {shortAddr(row.pairAddress)}</div>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${POOL_TYPE_COLOR[row.poolType?.toLowerCase()] || "bg-gray-500/20 text-gray-400"}`}>
                            {(row.poolType || "—").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLOR[row.walletStatus] || STATUS_COLOR.inactive}`}>
                            {row.walletStatus || "inactive"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-green-400">{fmtN(row.buys)}↑</span>
                          <span className="text-gray-500 mx-1">/</span>
                          <span className="text-red-400">{fmtN(row.sells)}↓</span>
                        </td>
                        <td className="px-4 py-3 text-right text-green-400 font-medium whitespace-nowrap">{fmtUSD(row.BuyVolume)}</td>
                        <td className="px-4 py-3 text-right text-red-400 font-medium whitespace-nowrap">{fmtUSD(row.SellVolume)}</td>
                        <td className="px-4 py-3 text-right text-orange-300 whitespace-nowrap">
                          {fmtUSD(row.gasFeeInDollars)}
                          <div className="text-xs text-gray-500">{fmt(row.gasFee, 4)} SOL</div>
                        </td>
                        <td className="px-4 py-3 text-right text-yellow-300 whitespace-nowrap">{fmtUSD(row.rayCost)}</td>
                        <td className="px-4 py-3 text-right font-semibold whitespace-nowrap text-pink-400">{fmtUSD(row.netCost)}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => setExpandedRow(exp ? null : idx)} className="text-gray-400 hover:text-blue-400 transition-colors">
                            {exp ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </td>
                      </tr>
                      {exp && (
                        <tr key={`exp-${idx}`} className="bg-[#0a1221] border-b border-[#1e293b]">
                          <td colSpan={11} className="px-6 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 text-xs">
                              <div><p className="text-gray-500 mb-0.5">Total Volume</p><p className="text-white font-medium">{fmtUSD(row.totalVolume)}</p></div>
                              <div><p className="text-gray-500 mb-0.5">Ray Fee</p><p className="text-yellow-300 font-medium">{fmtUSD(row.rayFee)}</p></div>
                              <div><p className="text-gray-500 mb-0.5">Total Cost</p><p className="text-pink-400 font-medium">{fmtUSD(row.totalCost)}</p></div>
                              <div><p className="text-gray-500 mb-0.5">Wallet Loss</p><p className="text-red-400 font-medium">{fmtUSD(row.walletLoss)}</p></div>
                              <div><p className="text-gray-500 mb-0.5">Slippage & Loss</p><p className="text-red-400 font-medium">{fmtUSD(row.slipageAndloss)}</p></div>
                              <div><p className="text-gray-500 mb-0.5">Yield</p><p className="text-green-400 font-medium">{fmtUSD(row.yeild)}</p></div>
                              <div><p className="text-gray-500 mb-0.5">Start Balance (SOL)</p><p className="text-gray-300 font-medium">{fmt(row.walletStartBalance, 4)}</p></div>
                              <div><p className="text-gray-500 mb-0.5">Start Bal (USD)</p><p className="text-gray-300 font-medium">{fmtUSD(row.walletStartBalanceInUSDT)}</p></div>
                              <div><p className="text-gray-500 mb-0.5">Funds Added (USD)</p><p className="text-teal-300 font-medium">{fmtUSD(row.addedAmountInUSDT)}</p></div>
                              <div><p className="text-gray-500 mb-0.5">End Balance (SOL)</p><p className="text-gray-300 font-medium">{fmt(row.walletEndBalance, 4)}</p></div>
                              <div><p className="text-gray-500 mb-0.5">End Bal (USD)</p><p className="text-gray-300 font-medium">{fmtUSD(row.walletEndBalanceInUSDT)}</p></div>
                              <div><p className="text-gray-500 mb-0.5">Price Impact</p><p className="text-gray-300 font-medium">{fmt(row.priceImpact, 4)}</p></div>
                              <div className="col-span-2 sm:col-span-4"><p className="text-gray-500 mb-0.5">Full Wallet Address</p><p className="text-gray-300 font-mono break-all">{row.walletAddress}</p></div>
                              <div className="col-span-2"><p className="text-gray-500 mb-0.5">Pool Address</p><p className="text-gray-300 font-mono break-all">{row.pairAddress || "—"}</p></div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          ) : (
            /* ── Pool table ── */
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 bg-[#0a1221] border-b border-[#1e293b]">
                  <th className="px-4 py-3 text-left">Date</th>
                  <th className="px-4 py-3 text-left">Pool / Token</th>
                  <th className="px-4 py-3 text-right">Buys / Sells</th>
                  <th className="px-4 py-3 text-right">Total Volume</th>
                  <th className="px-4 py-3 text-right">MM Volume</th>
                  <th className="px-4 py-3 text-right">MM Yield</th>
                  <th className="px-4 py-3 text-right">Company Yield</th>
                  <th className="px-4 py-3 text-right">Gas (USD)</th>
                  <th className="px-4 py-3 text-right">MM Ray Cost</th>
                  <th className="px-4 py-3 text-right">Net Co. Cost</th>
                  <th className="px-4 py-3 text-center">More</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const exp = expandedRow === idx;
                  return (
                    <>
                      <tr key={idx} className={`border-b border-[#1e293b] hover:bg-[#131f35] transition-colors ${exp ? "bg-[#131f35]" : ""}`}>
                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{row.date}</td>
                        <td className="px-4 py-3">
                          <div className="text-gray-200">{row.tokenSymbol} · {shortAddr(row.pairAddress)}</div>
                          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${POOL_TYPE_COLOR[row.poolType?.toLowerCase()] || "bg-gray-500/20 text-gray-400"}`}>
                            {(row.poolType || "—").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-green-400">{fmtN(row.buys)}↑</span>
                          <span className="text-gray-500 mx-1">/</span>
                          <span className="text-red-400">{fmtN(row.sells)}↓</span>
                        </td>
                        <td className="px-4 py-3 text-right text-white font-medium whitespace-nowrap">{fmtUSD(row.totalVolume)}</td>
                        <td className="px-4 py-3 text-right text-blue-300 whitespace-nowrap">{fmtUSD(row.mmTotalVolume)}</td>
                        <td className="px-4 py-3 text-right text-green-400 whitespace-nowrap">{fmtUSD(row.mmYeild)}</td>
                        <td className="px-4 py-3 text-right text-teal-300 whitespace-nowrap">{fmtUSD(row.companysYeild)}</td>
                        <td className="px-4 py-3 text-right text-orange-300 whitespace-nowrap">{fmtUSD(row.gasFeeInDollars)}</td>
                        <td className="px-4 py-3 text-right text-yellow-300 whitespace-nowrap">{fmtUSD(row.mmRayCost)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-pink-400 whitespace-nowrap">{fmtUSD(row.netCompanyCost)}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => setExpandedRow(exp ? null : idx)} className="text-gray-400 hover:text-blue-400 transition-colors">
                            {exp ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                        </td>
                      </tr>
                      {exp && (
                        <tr key={`exp-${idx}`} className="bg-[#0a1221] border-b border-[#1e293b]">
                          <td colSpan={11} className="px-6 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                              <div><p className="text-gray-500 mb-0.5">Users Volume</p><p className="text-blue-300 font-medium">{fmtUSD(row.usersTotalVolume)}</p></div>
                              <div><p className="text-gray-500 mb-0.5">Users Yield</p><p className="text-green-300 font-medium">{fmtUSD(row.usersYeild)}</p></div>
                              <div><p className="text-gray-500 mb-0.5">MM Ray Fee</p><p className="text-yellow-300 font-medium">{fmtUSD(row.mmRayFee)}</p></div>
                              <div><p className="text-gray-500 mb-0.5">Net Cost</p><p className="text-pink-400 font-medium">{fmtUSD(row.netCost)}</p></div>
                              <div><p className="text-gray-500 mb-0.5">Wallet Loss</p><p className="text-red-400 font-medium">{fmtUSD(row.walletLoss)}</p></div>
                              <div><p className="text-gray-500 mb-0.5">Slippage & Loss</p><p className="text-red-400 font-medium">{fmtUSD(row.slipageAndloss)}</p></div>
                              <div><p className="text-gray-500 mb-0.5">Wallets</p><p className="text-gray-300 font-medium">{row.walletCount}</p></div>
                              <div><p className="text-gray-500 mb-0.5">Total Txns</p><p className="text-gray-300 font-medium">{fmtN(row.totalTransactions)}</p></div>
                              <div className="col-span-2 sm:col-span-4"><p className="text-gray-500 mb-0.5">Pool Address</p><p className="text-gray-300 font-mono break-all">{row.pairAddress}</p></div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e293b] text-sm">
            <span className="text-xs text-gray-400">Page {page} of {totalPages} · {total.toLocaleString()} records</span>
            <div className="flex gap-1">
              <button onClick={() => fetchRows(page - 1)} disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg bg-[#1e293b] text-gray-300 hover:bg-[#273347] disabled:opacity-40">
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const p = totalPages <= 7 ? i + 1 : page <= 4 ? i + 1 : page >= totalPages - 3 ? totalPages - 6 + i : page - 3 + i;
                return (
                  <button key={p} onClick={() => fetchRows(p)} disabled={loading}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${p === page ? "bg-blue-600 text-white" : "bg-[#1e293b] text-gray-400 hover:bg-[#273347]"}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => fetchRows(page + 1)} disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg bg-[#1e293b] text-gray-300 hover:bg-[#273347] disabled:opacity-40">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-gray-600 text-center">
        Data sourced from daily market making reports stored in the database.
      </p>
    </div>
  );
};

export default AuditExport;
