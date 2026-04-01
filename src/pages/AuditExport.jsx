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
  BarChart3,
  Link,
  Settings,
  X,
  Save,
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
  const [activeTab,      setActiveTab]      = useState("wallet"); // "wallet" | "pool" | "solscan"

  // ── Solscan tab state ─────────────────────────────────────────────────────
  const [ssPools,        setSsPools]        = useState([]);   // pools from poolWalletData + LiquidityPool
  const [ssPoolId,       setSsPoolId]       = useState("");   // selected poolWalletDataId (_id)
  const [ssPool,         setSsPool]         = useState(null); // selected pool object
  const [ssStartDate,    setSsStartDate]    = useState(thirtyDaysAgo);
  const [ssEndDate,      setSsEndDate]      = useState(today);
  const [ssData,         setSsData]         = useState(null);
  const [ssLoading,      setSsLoading]      = useState(false);
  const [ssExporting,    setSsExporting]    = useState(false);
  const [ssError,        setSsError]        = useState("");
  // Token address editor for the selected pool
  const [ssTokensEdit,   setSsTokensEdit]   = useState("");   // newline-separated for textarea
  const [ssTokensSaving, setSsTokensSaving] = useState(false);
  const [showTokenEdit,  setShowTokenEdit]  = useState(false);

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

  // ── Solscan: load pools on mount ────────────────────────────────────────
  useEffect(() => {
    ADMIN_API.AUDIT_SOLSCAN_GET_POOLS()
      .then(r => { if (r?.data?.pools) setSsPools(r.data.pools); })
      .catch(() => {});
  }, []);

  // ── Solscan: select pool → populate state ────────────────────────────────
  const handlePoolSelect = (poolWalletDataId) => {
    setSsPoolId(poolWalletDataId);
    setSsData(null);
    setSsError("");
    const pool = ssPools.find(p => p._id === poolWalletDataId) || null;
    setSsPool(pool);
    setSsTokensEdit((pool?.tokenAddresses || []).join("\n"));
    setShowTokenEdit(false);
  };

  // ── Solscan: fetch transfers ──────────────────────────────────────────────
  const fetchSolscanTransfers = async () => {
    if (!ssPoolId) { setSsError("Please select a pool."); return; }
    setSsLoading(true);
    setSsError("");
    setSsData(null);
    try {
      const r = await ADMIN_API.AUDIT_SOLSCAN_GET_TRANSFERS({
        poolWalletDataId: ssPoolId,
        startDate: ssStartDate,
        endDate: ssEndDate,
      });
      if (r?.data?.success) setSsData(r.data);
      else setSsError(r?.data?.message || "Fetch failed");
    } catch (e) {
      setSsError(e?.response?.data?.message || "Solscan fetch failed. Check API key / pool.");
    } finally {
      setSsLoading(false);
    }
  };

  // ── Solscan: download Excel (mirrors Python script output) ───────────────
  const downloadSolscanExcel = async () => {
    if (!ssData) return;
    setSsExporting(true);
    try {
      const wb = XLSX.utils.book_new();

      // Sheet 1 — Raw_Data (all API records)
      if (ssData.raw?.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ssData.raw), "Raw_Data");
      }

      // Sheet 2 — Filtered (same logic as Python filtered_df)
      if (ssData.filtered?.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ssData.filtered), "Filtered");
      }

      // Sheet 3 — Sums (same as Python sums_df)
      const sumsSheet = XLSX.utils.json_to_sheet(
        ssData.sums?.map(s => ({ Case: s.case, Balance_Sum: s.balance_sum, Token: s.token_symbol || s.token_address, Flow: s.flow })) || []
      );
      XLSX.utils.book_append_sheet(wb, sumsSheet, "Sums");

      const poolLabel = (ssPool?.poolName || "pool").replace(/\s+/g, "_").slice(0, 20);
      XLSX.writeFile(wb, `Solscan_${poolLabel}_${ssStartDate}_to_${ssEndDate}.xlsx`);
    } finally {
      setSsExporting(false);
    }
  };

  // ── Solscan: save token addresses for selected pool ───────────────────────
  const savePoolTokens = async () => {
    if (!ssPoolId) return;
    setSsTokensSaving(true);
    try {
      const tokenAddresses = ssTokensEdit.split("\n").map(s => s.trim()).filter(Boolean);
      await ADMIN_API.AUDIT_SOLSCAN_SAVE_POOL_TOKENS({ poolWalletDataId: ssPoolId, tokenAddresses });
      // Refresh pool list
      const r = await ADMIN_API.AUDIT_SOLSCAN_GET_POOLS();
      if (r?.data?.pools) {
        setSsPools(r.data.pools);
        const updated = r.data.pools.find(p => p._id === ssPoolId);
        if (updated) setSsPool(updated);
      }
      setShowTokenEdit(false);
    } catch { /* ignore */ }
    finally { setSsTokensSaving(false); }
  };

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
        {[["wallet", "Wallet-wise"], ["pool", "Pool-wise"], ["solscan", "Solscan Transfer"]].map(([key, label]) => (
          <button key={key} onClick={() => setActiveTab(key)}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${activeTab === key ? "bg-blue-600 text-white" : "text-gray-400 hover:text-white"}`}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Solscan Transfer Panel ── */}
      {activeTab === "solscan" && (
        <div className="space-y-4">

          {/* Controls */}
          <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
            <div className="flex flex-wrap gap-3 items-end">
              {/* Pool selector */}
              <div className="flex flex-col gap-1 min-w-[220px]">
                <label className="text-xs text-gray-400">Pool</label>
                <select value={ssPoolId} onChange={e => handlePoolSelect(e.target.value)}
                  className="bg-[#1e293b] border border-[#2d3f55] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                  <option value="">Select pool…</option>
                  {ssPools.map(p => (
                    <option key={p._id} value={p._id}>
                      {p.poolName}{p.poolType ? ` (${p.poolType.toUpperCase()})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">Start Date</label>
                <input type="date" value={ssStartDate} max={ssEndDate}
                  onChange={e => setSsStartDate(e.target.value)}
                  className="bg-[#1e293b] border border-[#2d3f55] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-gray-400">End Date</label>
                <input type="date" value={ssEndDate} min={ssStartDate} max={today}
                  onChange={e => setSsEndDate(e.target.value)}
                  className="bg-[#1e293b] border border-[#2d3f55] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
              </div>

              <button onClick={fetchSolscanTransfers} disabled={ssLoading || !ssPoolId}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                {ssLoading ? <Loader2 size={14} className="animate-spin" /> : <Link size={14} />}
                Fetch Transfers
              </button>

              {ssData && (
                <button onClick={downloadSolscanExcel} disabled={ssExporting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors">
                  {ssExporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                  Download Excel
                </button>
              )}

              {ssPool && (
                <button onClick={() => setShowTokenEdit(v => !v)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-[#1e293b] hover:bg-[#273347] text-gray-300 rounded-lg text-sm transition-colors ml-auto">
                  <Settings size={14} />
                  {showTokenEdit ? "Hide Token Config" : "Configure Tokens"}
                </button>
              )}
            </div>

            {ssError && (
              <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />{ssError}
              </div>
            )}

            {/* Pool info — auto-derived from DB */}
            {ssPool && (
              <div className="mt-4 pt-4 border-t border-[#1e293b] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <p className="text-gray-500 mb-1">Wallet Address (WALLET_ADDRESS)</p>
                  <p className="font-mono text-blue-300 break-all">{ssPool.poolWalletAddress || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Inner Wallet (valid_addresses[1])</p>
                  <p className="font-mono text-purple-300 break-all">{ssPool.innerWalletAddress || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-500 mb-1">Token Addresses (valid_tokens)</p>
                  {(ssPool.tokenAddresses || []).length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {ssPool.tokenAddresses.map(t => (
                        <span key={t} className="font-mono bg-teal-500/10 text-teal-300 px-1.5 py-0.5 rounded break-all">{shortAddr(t)}</span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-yellow-500">No tokens configured — all tokens included</span>
                  )}
                </div>
              </div>
            )}

            {/* Token address editor */}
            {showTokenEdit && ssPool && (
              <div className="mt-4 pt-4 border-t border-[#1e293b]">
                <p className="text-xs text-gray-400 mb-2 font-medium">
                  Token Addresses (valid_tokens) — one per line. Leave empty to include all tokens.
                </p>
                <textarea value={ssTokensEdit} onChange={e => setSsTokensEdit(e.target.value)} rows={5}
                  placeholder={"So11111111111111111111111111111111111111112\nBjcRmwm8e25RgjkyaFE56fc7bxRgGPw96JUkXRJFEroT"}
                  className="w-full bg-[#1e293b] border border-[#2d3f55] rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500 resize-none" />
                <div className="flex gap-2 mt-2">
                  <button onClick={savePoolTokens} disabled={ssTokensSaving}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm disabled:opacity-50 transition-colors">
                    {ssTokensSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save Tokens
                  </button>
                  <button onClick={() => setShowTokenEdit(false)}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#1e293b] hover:bg-[#273347] text-gray-300 rounded-lg text-sm transition-colors">
                    <X size={14} />Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Loading */}
          {ssLoading && (
            <div className="flex items-center justify-center py-16 bg-[#0f172a] border border-[#1e293b] rounded-xl">
              <Loader2 size={28} className="animate-spin text-blue-400 mr-3" />
              <span className="text-gray-400 text-sm">Fetching from Solscan API… (may take a moment for large ranges)</span>
            </div>
          )}

          {/* Results */}
          {ssData && !ssLoading && (
            <div className="space-y-4">
              {/* Pool + date info */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                <span className="text-white font-medium">{ssData.poolName}</span>
                {ssData.poolType && <span className={`px-1.5 py-0.5 rounded font-medium ${POOL_TYPE_COLOR[ssData.poolType?.toLowerCase()] || "bg-gray-500/20 text-gray-400"}`}>{ssData.poolType.toUpperCase()}</span>}
                <span>{ssData.startDate} → {ssData.endDate}</span>
                <span className="text-gray-600">{ssData.meta?.generatedAt}</span>
              </div>

              {/* Stats cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
                  <p className="text-xs text-gray-400">Raw Records</p>
                  <p className="text-2xl font-bold text-white mt-1">{ssData.meta?.rawCount?.toLocaleString()}</p>
                </div>
                <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
                  <p className="text-xs text-gray-400">Filtered Records</p>
                  <p className="text-2xl font-bold text-blue-400 mt-1">{ssData.meta?.filteredCount?.toLocaleString()}</p>
                </div>
                {ssData.sums?.map(s => (
                  <div key={s.case} className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
                    <p className="text-xs text-gray-400">{s.case}</p>
                    <p className={`text-lg font-bold mt-1 ${s.flow === "in" ? "text-green-400" : "text-red-400"}`}>
                      {Number(s.balance_sum).toFixed(6)}
                    </p>
                    <p className="text-xs text-gray-600 truncate">{s.token_symbol || s.token_address?.slice(0, 12)}</p>
                  </div>
                ))}
              </div>

              {/* Filtered table preview */}
              <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e293b]">
                  <span className="text-sm font-medium text-gray-300">Filtered Transfers Preview</span>
                  <span className="text-xs text-gray-500">{ssData.filtered?.length} rows (first 100 shown)</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-400 bg-[#0a1221] border-b border-[#1e293b]">
                        <th className="px-3 py-2 text-left">Time</th>
                        <th className="px-3 py-2 text-left">From</th>
                        <th className="px-3 py-2 text-left">To</th>
                        <th className="px-3 py-2 text-left">Token</th>
                        <th className="px-3 py-2 text-right">Balance</th>
                        <th className="px-3 py-2 text-center">Flow</th>
                        <th className="px-3 py-2 text-left">Tx Hash</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(ssData.filtered || []).slice(0, 100).map((r, i) => (
                        <tr key={i} className="border-b border-[#1e293b] hover:bg-[#131f35]">
                          <td className="px-3 py-2 text-gray-400 whitespace-nowrap">
                            {r.block_time ? new Date(r.block_time * 1000).toLocaleString() : "—"}
                          </td>
                          <td className="px-3 py-2 text-gray-300 font-mono">{shortAddr(r.from_address)}</td>
                          <td className="px-3 py-2 text-gray-300 font-mono">{shortAddr(r.to_address)}</td>
                          <td className="px-3 py-2 text-gray-300">{r.token_symbol || shortAddr(r.token_address)}</td>
                          <td className="px-3 py-2 text-right font-medium text-white whitespace-nowrap">
                            {Number(r.balance || 0).toFixed(6)}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${r.flow === "in" ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                              {r.flow}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-blue-400 font-mono">{shortAddr(r.trans_id || r.tx_hash || r.signature)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table (wallet + pool tabs only) */}
      {activeTab !== "solscan" && (
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
      )} {/* end activeTab !== "solscan" */}

      <p className="mt-4 text-xs text-gray-600 text-center">
        Data sourced from daily market making reports stored in the database.
      </p>
    </div>
  );
};

export default AuditExport;
