import { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Loader2,
  Copy,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
} from "lucide-react";
import { ADMIN_API } from "../../services/ApiHandlers";

const STATUS_TABS = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "inactive", label: "Inactive" },
  { key: "expired", label: "Expired" },
];

const statusBadgeClasses = (status) => {
  switch (status) {
    case "active":
      return "bg-green-100 text-green-700 border-green-200";
    case "expired":
      return "bg-red-100 text-red-700 border-red-200";
    case "inactive":
      return "bg-amber-100 text-amber-700 border-amber-200";
    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
};

const shortAddr = (addr) => {
  if (!addr || typeof addr !== "string") return "N/A";
  if (addr.length <= 12) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};

const formatDate = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString();
};

export default function MMWallets() {
  const [wallets, setWallets] = useState([]);
  const [summary, setSummary] = useState({ active: 0, expired: 0, inactive: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [copyFeedback, setCopyFeedback] = useState({});

  const fetchWallets = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ADMIN_API.GET_ALL_MM_WALLETS({
        status: statusFilter,
        search: search || undefined,
        page,
        limit,
      });
      const payload = res?.data || {};
      setWallets(Array.isArray(payload.data) ? payload.data : []);
      setSummary(payload.summary || { active: 0, expired: 0, inactive: 0 });
      setTotalPages(payload.totalPages || 1);
      setTotalCount(payload.count || 0);
    } catch (err) {
      console.error("Error fetching MM wallets:", err);
      setError(err?.response?.data?.message || "Failed to fetch wallets");
      setWallets([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search, page, limit]);

  useEffect(() => {
    fetchWallets();
  }, [fetchWallets]);

  const handleCopy = async (address, key) => {
    try {
      await navigator.clipboard.writeText(address);
      setCopyFeedback((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopyFeedback((prev) => ({ ...prev, [key]: false }));
      }, 1500);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-xl shadow-md mr-4">
            <Wallet className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">MM Wallets</h1>
            <p className="text-sm text-gray-500">
              All market maker wallets with active / inactive / expired status
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={fetchWallets}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl shadow-sm hover:bg-gray-50 text-sm font-medium text-gray-700"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide">
            Active
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{summary.active}</p>
          <p className="text-xs text-gray-400 mt-1">Active and within last 3 days</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-amber-600 uppercase tracking-wide">
            Inactive
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{summary.inactive}</p>
          <p className="text-xs text-gray-400 mt-1">
            Marked active but older than 3 days (likely stale)
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <p className="text-xs font-semibold text-red-600 uppercase tracking-wide">
            Expired
          </p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{summary.expired}</p>
          <p className="text-xs text-gray-400 mt-1">Explicitly expired via webhook</p>
        </div>
      </div>

      {/* Status tabs + search */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {STATUS_TABS.map((tab) => {
            const isActive = statusFilter === tab.key;
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setStatusFilter(tab.key);
                  setPage(1);
                }}
                className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
                  isActive
                    ? "bg-indigo-600 border-indigo-600 text-white shadow-sm"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search address, pair, symbol..."
              className="pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm w-72 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700"
          >
            Search
          </button>
        </form>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Token</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Wallet Address</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Pair</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Pool Type</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Created</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-600">Expired</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    <Loader2 className="h-5 w-5 animate-spin inline mr-2" />
                    Loading wallets...
                  </td>
                </tr>
              )}
              {!loading && wallets.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                    No wallets found.
                  </td>
                </tr>
              )}
              {!loading &&
                wallets.map((w, idx) => {
                  const rowKey = w._id || `${w.walletAddress}-${idx}`;
                  const derived = w.derivedStatus || w.status || "active";
                  const tokenSymbol =
                    w.tokenId?.symbol || w.symbol || w.tokenId?.name || "—";
                  return (
                    <tr key={rowKey} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500">
                        {(page - 1) * limit + idx + 1}
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {tokenSymbol}
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{shortAddr(w.walletAddress)}</span>
                          {w.walletAddress && (
                            <button
                              type="button"
                              onClick={() => handleCopy(w.walletAddress, `w-${rowKey}`)}
                              className="text-gray-400 hover:text-indigo-600"
                              title="Copy"
                            >
                              {copyFeedback[`w-${rowKey}`] ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700 font-mono">
                        {shortAddr(w.pairAddress)}
                      </td>
                      <td className="px-4 py-3 text-gray-700 uppercase">
                        {w.poolType || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full border ${statusBadgeClasses(
                            derived
                          )}`}
                        >
                          {derived}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(w.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDate(w.expiredAt)}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50">
          <p className="text-sm text-gray-600">
            Showing page {page} of {totalPages} ({totalCount} wallets)
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3 py-1 text-sm border border-gray-200 rounded-lg bg-white disabled:opacity-50 hover:bg-gray-100"
            >
              Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3 py-1 text-sm border border-gray-200 rounded-lg bg-white disabled:opacity-50 hover:bg-gray-100"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
