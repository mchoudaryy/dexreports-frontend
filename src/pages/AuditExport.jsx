import { useState, useEffect, useCallback, useRef } from "react";
import * as XLSX from "xlsx";
import {
  Download,
  RefreshCw,
  Filter,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowLeftRight,
  Fuel,
  Wallet,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
} from "lucide-react";
import { ADMIN_API } from "../services/ApiHandlers";
import { API_CONFIG } from "../services/ApiConfig";

// ─── helpers ──────────────────────────────────────────────────────────────────

const fmt = (n, decimals = 2) => {
  if (n == null || isNaN(n)) return "0.00";
  return Number(n).toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const fmtUSD = (n) => `$${fmt(n)}`;

const shortAddr = (addr) =>
  addr && addr.length > 12 ? `${addr.slice(0, 6)}...${addr.slice(-4)}` : addr || "—";

const statusColor = {
  active: "bg-green-500/20 text-green-400 border border-green-500/30",
  inactive: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
  expired: "bg-red-500/20 text-red-400 border border-red-500/30",
};

const poolTypeColor = {
  CPMM: "bg-blue-500/20 text-blue-300",
  CLMM: "bg-purple-500/20 text-purple-300",
  RWA: "bg-teal-500/20 text-teal-300",
  UNKNOWN: "bg-gray-500/20 text-gray-400",
};

const txTypeLabel = {
  SWAP_BUY: "Swap Buy",
  SWAP_SELL: "Swap Sell",
  ADD_LP: "Add LP",
  REMOVE_LP: "Remove LP",
  INTERNAL_TRANSFER: "Internal",
  EXTERNAL_INFLOW: "Ext. Inflow",
  EXTERNAL_OUTFLOW: "Ext. Outflow",
  FEE: "Fee",
  UNKNOWN: "Unknown",
};

// ─── Summary Cards ────────────────────────────────────────────────────────────

const SummaryCard = ({ icon: Icon, title, value, sub, color }) => (
  <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 flex gap-3 items-start">
    <div className={`p-2 rounded-lg ${color} shrink-0`}>
      <Icon size={18} />
    </div>
    <div className="min-w-0">
      <p className="text-xs text-gray-400 truncate">{title}</p>
      <p className="text-lg font-semibold text-white mt-0.5">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  </div>
);

// ─── Component ────────────────────────────────────────────────────────────────

const AuditExport = () => {
  // ── Filters ────────────────────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10);
  const thirtyDaysAgo = new Date(Date.now() - 30 * 86400_000)
    .toISOString()
    .slice(0, 10);

  const [startDate, setStartDate] = useState(thirtyDaysAgo);
  const [endDate, setEndDate] = useState(today);
  const [walletStatus, setWalletStatus] = useState("all");
  const [poolType, setPoolType] = useState("all");
  const [selectedWallet, setSelectedWallet] = useState("");

  // ── UI state ───────────────────────────────────────────────────────────────
  const [summaryStats, setSummaryStats] = useState(null);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const LIMIT = 50;

  const [loading, setLoading] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [error, setError] = useState("");
  const [syncMessage, setSyncMessage] = useState("");

  const [walletList, setWalletList] = useState([]);
  const [syncStatus, setSyncStatus] = useState(null);

  const [expandedRow, setExpandedRow] = useState(null);
  const [showFilters, setShowFilters] = useState(true);

  const fetchingRef = useRef(false);

  // ── Fetch wallet list for dropdown ─────────────────────────────────────────
  const fetchWallets = useCallback(async () => {
    try {
      const res = await ADMIN_API.AUDIT_GET_WALLETS();
      if (res?.data?.wallets) setWalletList(res.data.wallets);
    } catch {
      // non-critical
    }
  }, []);

  // ── Fetch sync status ──────────────────────────────────────────────────────
  const fetchSyncStatus = useCallback(async () => {
    try {
      const res = await ADMIN_API.AUDIT_SYNC_STATUS();
      if (res?.data) setSyncStatus(res.data);
    } catch {
      // non-critical
    }
  }, []);

  // ── Fetch summary stats ────────────────────────────────────────────────────
  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await ADMIN_API.AUDIT_GET_SUMMARY({
        startDate,
        endDate,
        walletStatus: walletStatus === "all" ? undefined : walletStatus,
        poolType: poolType === "all" ? undefined : poolType,
      });
      if (res?.data?.data) setSummaryStats(res.data.data);
    } catch {
      setSummaryStats(null);
    } finally {
      setSummaryLoading(false);
    }
  }, [startDate, endDate, walletStatus, poolType]);

  // ── Fetch table data ───────────────────────────────────────────────────────
  const fetchData = useCallback(
    async (pg = 1) => {
      if (fetchingRef.current) return;
      fetchingRef.current = true;
      setLoading(true);
      setError("");
      try {
        const res = await ADMIN_API.AUDIT_GET_DATA({
          startDate,
          endDate,
          walletStatus: walletStatus === "all" ? undefined : walletStatus,
          poolType: poolType === "all" ? undefined : poolType,
          walletAddress: selectedWallet || undefined,
          page: pg,
          limit: LIMIT,
        });
        if (res?.data) {
          setRows(res.data.rows || []);
          setTotal(res.data.total || 0);
          setTotalPages(res.data.totalPages || 1);
          setPage(pg);
        }
      } catch (err) {
        setError(err?.response?.data?.message || "Failed to load audit data");
      } finally {
        setLoading(false);
        fetchingRef.current = false;
      }
    },
    [startDate, endDate, walletStatus, poolType, selectedWallet]
  );

  // ── Apply filters ──────────────────────────────────────────────────────────
  const applyFilters = () => {
    fetchSummary();
    fetchData(1);
  };

  // ── On mount ───────────────────────────────────────────────────────────────
  useEffect(() => {
    fetchWallets();
    fetchSyncStatus();
    fetchSummary();
    fetchData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Trigger on-demand sync ─────────────────────────────────────────────────
  const handleSync = async () => {
    setSyncLoading(true);
    setSyncMessage("");
    try {
      const res = await ADMIN_API.AUDIT_SYNC({ startDate, endDate });
      setSyncMessage(
        res?.data?.message || "Sync started. Data will update in a few minutes."
      );
      // Refresh status after a short delay
      setTimeout(() => {
        fetchSyncStatus();
        fetchSummary();
        fetchData(1);
      }, 8000);
    } catch (err) {
      setSyncMessage(
        err?.response?.data?.message || "Sync failed. Please try again."
      );
    } finally {
      setSyncLoading(false);
    }
  };

  // ── Excel export ───────────────────────────────────────────────────────────
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await ADMIN_API.AUDIT_EXPORT({
        startDate,
        endDate,
        walletStatus: walletStatus === "all" ? undefined : walletStatus,
        poolType: poolType === "all" ? undefined : poolType,
        walletAddress: selectedWallet || undefined,
      });

      if (!res?.data?.success) throw new Error("Export data unavailable");

      const { summary, transactions, meta } = res.data;

      const wb = XLSX.utils.book_new();

      // ── Sheet 1: Summary stats ────────────────────────────────────────────
      const statsData = summaryStats
        ? [
            ["Metric", "Value"],
            ["Date Range", `${startDate} to ${endDate}`],
            ["Generated At", meta?.generatedAt || new Date().toISOString()],
            ["Total Wallets", summaryStats.walletCount],
            ["Total Transactions", summaryStats.totalTxCount],
            ["Total Tokens IN (USD)", summaryStats.totalTokensInUSD?.toFixed(2)],
            ["Total Tokens OUT (USD)", summaryStats.totalTokensOutUSD?.toFixed(2)],
            ["Net Flow (USD)", summaryStats.totalNetFlowUSD?.toFixed(2)],
            ["Gas Fees (SOL)", summaryStats.totalGasFeeSOL?.toFixed(6)],
            ["Gas Fees (USD)", summaryStats.totalGasFeeUSD?.toFixed(2)],
            ["Platform Fees (USD)", summaryStats.totalPlatformFeeUSD?.toFixed(2)],
            ["Internal Transfers (USD)", summaryStats.totalInternalTransferUSD?.toFixed(2)],
            ["External Inflows (USD)", summaryStats.totalExternalInflowUSD?.toFixed(2)],
            ["External Outflows (USD)", summaryStats.totalExternalOutflowUSD?.toFixed(2)],
            ["LP Added (USD)", summaryStats.totalLpAddedUSD?.toFixed(2)],
            ["LP Removed (USD)", summaryStats.totalLpRemovedUSD?.toFixed(2)],
            ["Total Swap Volume (USD)", summaryStats.totalSwapVolumeUSD?.toFixed(2)],
          ]
        : [["No summary data available"]];
      XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(statsData), "Summary");

      // ── Sheet 2: Daily Wallet-Pool Summary ───────────────────────────────
      const summaryHeaders = [
        "Date",
        "Wallet Address",
        "Wallet Label",
        "Wallet Status",
        "Pool Name",
        "Pool Type",
        "Tokens In (Amount)",
        "Tokens In (USD)",
        "Tokens Out (Amount)",
        "Tokens Out (USD)",
        "Net Flow (USD)",
        "Gas Fee (SOL)",
        "Gas Fee (USD)",
        "Platform Fee (USD)",
        "Total Fees (USD)",
        "Internal Transfer (USD)",
        "External Inflow (USD)",
        "External Outflow (USD)",
        "LP Added (USD)",
        "LP Removed (USD)",
        "Swap Buy Vol (USD)",
        "Swap Sell Vol (USD)",
        "Total Swap Vol (USD)",
        "Tx Count",
        "Swap Count",
        "LP Event Count",
        "Transfer Count",
      ];

      const summarySheetRows = summary.map((r) => [
        r.date,
        r.walletAddress,
        r.walletLabel,
        r.walletStatus,
        r.poolName || "—",
        r.poolType,
        r.tokensInAmount?.toFixed(4),
        r.tokensInUSD?.toFixed(2),
        r.tokensOutAmount?.toFixed(4),
        r.tokensOutUSD?.toFixed(2),
        r.netFlowUSD?.toFixed(2),
        r.gasFeeSOL?.toFixed(6),
        r.gasFeeUSD?.toFixed(2),
        r.platformFeeUSD?.toFixed(2),
        r.totalFeesUSD?.toFixed(2),
        r.internalTransferUSD?.toFixed(2),
        r.externalInflowUSD?.toFixed(2),
        r.externalOutflowUSD?.toFixed(2),
        r.lpAddedUSD?.toFixed(2),
        r.lpRemovedUSD?.toFixed(2),
        r.swapBuyVolumeUSD?.toFixed(2),
        r.swapSellVolumeUSD?.toFixed(2),
        r.totalSwapVolumeUSD?.toFixed(2),
        r.txCount,
        r.swapCount,
        r.lpEventCount,
        r.transferCount,
      ]);

      const summarySheet = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summarySheetRows]);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Wallet-Pool Daily");

      // ── Sheet 3: Raw Transactions ─────────────────────────────────────────
      const txHeaders = [
        "Date",
        "Tx Hash",
        "Block Time",
        "Wallet Address",
        "Wallet Label",
        "Wallet Status",
        "Pool Name",
        "Pool Type",
        "Tx Type",
        "Direction",
        "Token A Symbol",
        "Token A Amount",
        "Token A USD",
        "Token B Symbol",
        "Token B Amount",
        "Token B USD",
        "Total USD In",
        "Total USD Out",
        "Net USD",
        "Gas Fee (SOL)",
        "Gas Fee (USD)",
        "Platform Fee (USD)",
        "Internal Transfer",
        "Counterparty Wallet",
      ];

      const txSheetRows = transactions.map((t) => [
        t.date,
        t.txHash,
        t.blockTime ? new Date(t.blockTime).toISOString() : "",
        t.walletAddress,
        t.walletLabel,
        t.walletStatus,
        t.poolName || "—",
        t.poolType,
        txTypeLabel[t.txType] || t.txType,
        t.direction,
        t.tokenASymbol,
        t.tokenAAmount?.toFixed(6),
        t.tokenAUSD?.toFixed(2),
        t.tokenBSymbol,
        t.tokenBAmount?.toFixed(6),
        t.tokenBUSD?.toFixed(2),
        t.totalUSDIn?.toFixed(2),
        t.totalUSDOut?.toFixed(2),
        t.netUSD?.toFixed(2),
        t.gasFeeSOL?.toFixed(6),
        t.gasFeeUSD?.toFixed(2),
        t.platformFeeUSD?.toFixed(2),
        t.isInternalTransfer ? "Yes" : "No",
        t.counterpartyWallet || "—",
      ]);

      const txSheet = XLSX.utils.aoa_to_sheet([txHeaders, ...txSheetRows]);
      XLSX.utils.book_append_sheet(wb, txSheet, "Transaction Detail");

      // ── Download ──────────────────────────────────────────────────────────
      const filename = `MM_Audit_${startDate}_to_${endDate}.xlsx`;
      XLSX.writeFile(wb, filename);
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || "Export failed");
    } finally {
      setExportLoading(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const hasData = rows.length > 0;

  return (
    <div className="min-h-screen bg-[#070d1b] text-white px-4 py-6 md:px-8">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">
            Market Making Audit Export
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            On-chain wallet activity — all pools, date-wise, wallet-wise
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#1e293b] text-gray-300 text-sm hover:bg-[#273347] transition-colors"
          >
            <Filter size={14} />
            Filters
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={handleSync}
            disabled={syncLoading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm disabled:opacity-50 transition-colors"
          >
            {syncLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
            Sync On-Chain
          </button>
          <button
            onClick={handleExport}
            disabled={exportLoading || !hasData}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white text-sm disabled:opacity-50 transition-colors"
          >
            {exportLoading ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Download size={14} />
            )}
            Download Excel
          </button>
        </div>
      </div>

      {/* ── Sync message ── */}
      {syncMessage && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-sm">
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <span>{syncMessage}</span>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm">
          <AlertCircle size={16} className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Filters panel ── */}
      {showFilters && (
        <div className="mb-6 bg-[#0f172a] border border-[#1e293b] rounded-xl p-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {/* Start date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Start Date</label>
              <input
                type="date"
                value={startDate}
                max={endDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-[#1e293b] border border-[#2d3f55] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* End date */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">End Date</label>
              <input
                type="date"
                value={endDate}
                min={startDate}
                max={today}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-[#1e293b] border border-[#2d3f55] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Wallet status */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Wallet Status</label>
              <select
                value={walletStatus}
                onChange={(e) => setWalletStatus(e.target.value)}
                className="bg-[#1e293b] border border-[#2d3f55] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="expired">Expired</option>
              </select>
            </div>

            {/* Pool type */}
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-400">Pool Type</label>
              <select
                value={poolType}
                onChange={(e) => setPoolType(e.target.value)}
                className="bg-[#1e293b] border border-[#2d3f55] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="all">All Pool Types</option>
                <option value="CPMM">CPMM</option>
                <option value="CLMM">CLMM</option>
                <option value="RWA">RWA</option>
              </select>
            </div>

            {/* Wallet address */}
            <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
              <label className="text-xs text-gray-400">Wallet</label>
              <select
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className="bg-[#1e293b] border border-[#2d3f55] rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Wallets</option>
                {walletList.map((w) => (
                  <option key={w.walletAddress} value={w.walletAddress}>
                    {w.walletLabel || shortAddr(w.walletAddress)} ({w.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Apply button */}
            <div className="flex flex-col gap-1 justify-end">
              <button
                onClick={applyFilters}
                className="bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Apply Filters
              </button>
            </div>
          </div>

          {/* Sync status row */}
          {syncStatus && (
            <div className="mt-3 pt-3 border-t border-[#1e293b] flex flex-wrap gap-4 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Clock size={12} />
                {syncStatus.wallets?.length || 0} wallets tracked
              </span>
              {syncStatus.syncInProgress && (
                <span className="flex items-center gap-1 text-yellow-400">
                  <Loader2 size={12} className="animate-spin" />
                  Sync in progress…
                </span>
              )}
              {syncStatus.wallets?.[0]?.lastSyncedAt && (
                <span>
                  Last sync:{" "}
                  {new Date(syncStatus.wallets[0].lastSyncedAt).toLocaleString()}
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Summary cards ── */}
      {summaryLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="bg-[#0f172a] border border-[#1e293b] rounded-xl p-4 h-20 animate-pulse"
            />
          ))}
        </div>
      ) : summaryStats ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
          <SummaryCard
            icon={TrendingDown}
            title="Total Tokens OUT (USD)"
            value={fmtUSD(summaryStats.totalTokensOutUSD)}
            color="bg-red-500/20 text-red-400"
          />
          <SummaryCard
            icon={TrendingUp}
            title="Total Tokens IN (USD)"
            value={fmtUSD(summaryStats.totalTokensInUSD)}
            color="bg-green-500/20 text-green-400"
          />
          <SummaryCard
            icon={ArrowLeftRight}
            title="Net Flow (USD)"
            value={fmtUSD(summaryStats.totalNetFlowUSD)}
            sub={summaryStats.totalNetFlowUSD >= 0 ? "Net positive" : "Net negative"}
            color={
              summaryStats.totalNetFlowUSD >= 0
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }
          />
          <SummaryCard
            icon={Fuel}
            title="Gas Fees"
            value={fmtUSD(summaryStats.totalGasFeeUSD)}
            sub={`${fmt(summaryStats.totalGasFeeSOL, 4)} SOL`}
            color="bg-orange-500/20 text-orange-400"
          />
          <SummaryCard
            icon={ArrowLeftRight}
            title="Internal Transfers (USD)"
            value={fmtUSD(summaryStats.totalInternalTransferUSD)}
            sub="Between company wallets"
            color="bg-yellow-500/20 text-yellow-400"
          />
          <SummaryCard
            icon={TrendingDown}
            title="LP Added (USD)"
            value={fmtUSD(summaryStats.totalLpAddedUSD)}
            color="bg-blue-500/20 text-blue-400"
          />
          <SummaryCard
            icon={TrendingUp}
            title="LP Removed (USD)"
            value={fmtUSD(summaryStats.totalLpRemovedUSD)}
            color="bg-purple-500/20 text-purple-400"
          />
          <SummaryCard
            icon={Wallet}
            title="Wallets / Tx Count"
            value={`${summaryStats.walletCount} wallets`}
            sub={`${summaryStats.totalTxCount?.toLocaleString()} transactions`}
            color="bg-teal-500/20 text-teal-400"
          />
        </div>
      ) : null}

      {/* ── Table ── */}
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-xl overflow-hidden">
        {/* Table header row */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1e293b]">
          <div className="text-sm text-gray-300 font-medium">
            Daily Wallet-Pool Summary
          </div>
          <div className="text-xs text-gray-500">
            {total.toLocaleString()} records ·{" "}
            {startDate} → {endDate}
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={28} className="animate-spin text-blue-400" />
            </div>
          ) : !hasData ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500">
              <AlertCircle size={36} className="mb-3 opacity-40" />
              <p className="text-sm">No audit data found for the selected filters.</p>
              <p className="text-xs mt-1 opacity-70">
                Try syncing on-chain data first, or widen the date range.
              </p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 bg-[#0a1221] border-b border-[#1e293b]">
                  <th className="px-4 py-3 text-left font-medium">Date</th>
                  <th className="px-4 py-3 text-left font-medium">Wallet</th>
                  <th className="px-4 py-3 text-left font-medium">Pool</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-right font-medium">Tokens In (USD)</th>
                  <th className="px-4 py-3 text-right font-medium">Tokens Out (USD)</th>
                  <th className="px-4 py-3 text-right font-medium">Net Flow</th>
                  <th className="px-4 py-3 text-right font-medium">Gas Fee</th>
                  <th className="px-4 py-3 text-right font-medium">Internal Xfer</th>
                  <th className="px-4 py-3 text-right font-medium">Txns</th>
                  <th className="px-4 py-3 text-center font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => {
                  const isExpanded = expandedRow === idx;
                  return (
                    <>
                      <tr
                        key={`row-${idx}`}
                        className={`border-b border-[#1e293b] hover:bg-[#131f35] transition-colors ${
                          isExpanded ? "bg-[#131f35]" : ""
                        }`}
                      >
                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                          {row.date}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-white font-medium">
                              {row.walletLabel || shortAddr(row.walletAddress)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {shortAddr(row.walletAddress)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-gray-200">
                              {row.poolName || "—"}
                            </span>
                            <span
                              className={`text-xs px-1.5 py-0.5 rounded w-fit font-medium ${
                                poolTypeColor[row.poolType] || poolTypeColor.UNKNOWN
                              }`}
                            >
                              {row.poolType}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              statusColor[row.walletStatus] || statusColor.inactive
                            }`}
                          >
                            {row.walletStatus}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-green-400 font-medium whitespace-nowrap">
                          {fmtUSD(row.tokensInUSD)}
                        </td>
                        <td className="px-4 py-3 text-right text-red-400 font-medium whitespace-nowrap">
                          {fmtUSD(row.tokensOutUSD)}
                        </td>
                        <td
                          className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${
                            row.netFlowUSD >= 0 ? "text-green-400" : "text-red-400"
                          }`}
                        >
                          {row.netFlowUSD >= 0 ? "+" : ""}
                          {fmtUSD(row.netFlowUSD)}
                        </td>
                        <td className="px-4 py-3 text-right text-orange-300 whitespace-nowrap">
                          {fmtUSD(row.gasFeeUSD)}
                          <div className="text-xs text-gray-500">
                            {fmt(row.gasFeeSOL, 4)} SOL
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-yellow-300 whitespace-nowrap">
                          {fmtUSD(row.internalTransferUSD)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-400">
                          <div>{row.txCount}</div>
                          <div className="text-xs text-gray-600">
                            {row.swapCount} swaps
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() =>
                              setExpandedRow(isExpanded ? null : idx)
                            }
                            className="text-gray-400 hover:text-blue-400 transition-colors"
                          >
                            {isExpanded ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr
                          key={`expanded-${idx}`}
                          className="bg-[#0a1221] border-b border-[#1e293b]"
                        >
                          <td colSpan={11} className="px-6 py-4">
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
                              <div>
                                <p className="text-gray-500 mb-0.5">LP Added</p>
                                <p className="text-blue-300 font-medium">
                                  {fmtUSD(row.lpAddedUSD)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-0.5">LP Removed</p>
                                <p className="text-purple-300 font-medium">
                                  {fmtUSD(row.lpRemovedUSD)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-0.5">Swap Buy Vol</p>
                                <p className="text-green-400 font-medium">
                                  {fmtUSD(row.swapBuyVolumeUSD)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-0.5">Swap Sell Vol</p>
                                <p className="text-red-400 font-medium">
                                  {fmtUSD(row.swapSellVolumeUSD)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-0.5">Platform Fees</p>
                                <p className="text-orange-300 font-medium">
                                  {fmtUSD(row.platformFeeUSD)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-0.5">Ext. Inflow</p>
                                <p className="text-teal-300 font-medium">
                                  {fmtUSD(row.externalInflowUSD)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-0.5">Ext. Outflow</p>
                                <p className="text-pink-400 font-medium">
                                  {fmtUSD(row.externalOutflowUSD)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-0.5">LP Events</p>
                                <p className="text-gray-300 font-medium">
                                  {row.lpEventCount}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500 mb-0.5">Transfers</p>
                                <p className="text-gray-300 font-medium">
                                  {row.transferCount}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-gray-500 mb-0.5">Full Wallet Address</p>
                                <p className="text-gray-300 font-mono break-all">
                                  {row.walletAddress}
                                </p>
                              </div>
                              <div className="col-span-2">
                                <p className="text-gray-500 mb-0.5">Pool Address</p>
                                <p className="text-gray-300 font-mono break-all">
                                  {row.poolAddress || "—"}
                                </p>
                              </div>
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

        {/* ── Pagination ── */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#1e293b] text-sm">
            <span className="text-gray-400 text-xs">
              Page {page} of {totalPages} · {total.toLocaleString()} records
            </span>
            <div className="flex gap-1">
              <button
                onClick={() => fetchData(page - 1)}
                disabled={page <= 1 || loading}
                className="p-1.5 rounded-lg bg-[#1e293b] text-gray-300 hover:bg-[#273347] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} />
              </button>
              {/* Page number pills */}
              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                const p =
                  totalPages <= 7
                    ? i + 1
                    : page <= 4
                    ? i + 1
                    : page >= totalPages - 3
                    ? totalPages - 6 + i
                    : page - 3 + i;
                return (
                  <button
                    key={p}
                    onClick={() => fetchData(p)}
                    disabled={loading}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                      p === page
                        ? "bg-blue-600 text-white"
                        : "bg-[#1e293b] text-gray-400 hover:bg-[#273347]"
                    }`}
                  >
                    {p}
                  </button>
                );
              })}
              <button
                onClick={() => fetchData(page + 1)}
                disabled={page >= totalPages || loading}
                className="p-1.5 rounded-lg bg-[#1e293b] text-gray-300 hover:bg-[#273347] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Footer note ── */}
      <p className="mt-4 text-xs text-gray-600 text-center">
        Data sourced from Helius RPC. Nightly sync runs at 02:00 UTC.
        USD values are approximate (SOL price at time of transaction).
      </p>
    </div>
  );
};

export default AuditExport;
