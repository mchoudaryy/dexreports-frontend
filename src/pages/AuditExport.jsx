import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { ADMIN_API } from "../services/ApiHandlers";
import { FileSpreadsheet, Download, RefreshCw, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

const SOL_MINT = "So11111111111111111111111111111111111111112";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function shortAddr(addr) {
  if (!addr || addr.length < 10) return addr || "N/A";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function statusBadge(status) {
  const s = (status || "").toLowerCase();
  if (s === "active")   return "bg-green-500/20 text-green-400 border border-green-500/30";
  if (s === "expired")  return "bg-red-500/20 text-red-400 border border-red-500/30";
  return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
}

/** Build Excel workbook with Raw_Data, Filtered, Sums sheets */
function buildExcel(raw, filtered, sums, tokenPrices, walletAddress, date, poolName) {
  const wb = XLSX.utils.book_new();

  // Raw_Data sheet
  const rawSheet = XLSX.utils.json_to_sheet(raw.length ? raw : [{}]);
  XLSX.utils.book_append_sheet(wb, rawSheet, "Raw_Data");

  // Filtered sheet
  const filtSheet = XLSX.utils.json_to_sheet(filtered.length ? filtered : [{}]);
  XLSX.utils.book_append_sheet(wb, filtSheet, "Filtered");

  // Sums sheet — add avg_price column from tokenPrices
  const sumsWithPrice = sums.map((s) => ({
    case:          s.case,
    token_address: s.token_address,
    token_symbol:  s.token_symbol,
    flow:          s.flow,
    balance_sum:   s.balance_sum,
    avg_price_usd: tokenPrices[s.token_address] ?? "",
    value_usd:
      tokenPrices[s.token_address] != null
        ? (s.balance_sum * tokenPrices[s.token_address]).toFixed(4)
        : "",
  }));
  const sumsSheet = XLSX.utils.json_to_sheet(sumsWithPrice.length ? sumsWithPrice : [{}]);
  XLSX.utils.book_append_sheet(wb, sumsSheet, "Sums");

  const filename = `${date}_${poolName}_${shortAddr(walletAddress)}.xlsx`
    .replace(/[^a-zA-Z0-9._-]/g, "_");

  XLSX.writeFile(wb, filename);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuditExport() {
  const [date, setDate]           = useState(yesterday);
  const [poolType, setPoolType]   = useState("all");
  const [allPools, setAllPools]   = useState([]);
  const [poolsLoading, setPoolsLoading] = useState(true);
  const [selectedPoolId, setSelectedPoolId] = useState("");

  // token prices: { tokenAddress: number }
  const [tokenPrices, setTokenPrices]   = useState({});
  const [pricesLoading, setPricesLoading] = useState(false);

  // per-wallet download state: { [poolWalletDataId]: 'idle'|'loading'|'done'|'error' }
  const [dlState, setDlState] = useState({});

  // ── Load all pool-wallet configs once ──────────────────────────────────────
  useEffect(() => {
    setPoolsLoading(true);
    ADMIN_API.AUDIT_GET_SOLSCAN_POOLS()
      .then((res) => setAllPools(res.data?.pools || []))
      .catch(() => toast.error("Failed to load pool wallet data"))
      .finally(() => setPoolsLoading(false));
  }, []);

  // ── Unique pools for dropdown (by pairAddress / poolId), filtered by type ──
  const filteredPoolOptions = useMemo(() => {
    const seen = new Set();
    const result = [];
    for (const p of allPools) {
      const type = (p.poolType || "").toLowerCase();
      if (poolType !== "all" && type !== poolType) continue;
      const key = p.poolId || p.pairAddress;
      if (seen.has(key)) continue;
      seen.add(key);
      result.push({ poolId: p.poolId, pairAddress: p.pairAddress, poolName: p.poolName, poolType: p.poolType });
    }
    return result;
  }, [allPools, poolType]);

  // ── Wallets for selected pool ──────────────────────────────────────────────
  const walletsForPool = useMemo(() => {
    if (!selectedPoolId) return [];
    return allPools.filter((p) => p.poolId === selectedPoolId);
  }, [allPools, selectedPoolId]);

  // ── When pool selection changes, fetch token prices ───────────────────────
  useEffect(() => {
    if (!walletsForPool.length || !date) return;

    // Collect unique token addresses across all wallets in this pool
    const addrs = [
      ...new Set(walletsForPool.flatMap((w) => w.tokenAddresses || [])),
    ];
    if (!addrs.length) return;

    setPricesLoading(true);
    ADMIN_API.AUDIT_GET_TOKEN_PRICES({ date, tokenAddresses: addrs.join(",") })
      .then((res) => {
        const map = {};
        for (const p of res.data?.prices || []) {
          if (p.avgPrice != null) map[p.tokenAddress] = p.avgPrice;
        }
        setTokenPrices(map);
      })
      .catch(() => {})
      .finally(() => setPricesLoading(false));
  }, [walletsForPool, date]);

  // ── Reset wallet selection when pool type changes ─────────────────────────
  useEffect(() => {
    setSelectedPoolId("");
  }, [poolType]);

  // ── Download single wallet ─────────────────────────────────────────────────
  async function downloadWallet(wallet) {
    const id = wallet._id;
    setDlState((s) => ({ ...s, [id]: "loading" }));
    try {
      const res = await ADMIN_API.AUDIT_GET_SOLSCAN_TRANSFERS({
        poolWalletDataId: id,
        startDate: date,
        endDate: date,
      });
      const { raw, filtered, sums, poolName } = res.data;
      buildExcel(raw, filtered, sums, tokenPrices, wallet.poolWalletAddress, date, poolName || wallet.poolName);
      setDlState((s) => ({ ...s, [id]: "done" }));
      toast.success(`Downloaded: ${shortAddr(wallet.poolWalletAddress)}`);
    } catch (err) {
      setDlState((s) => ({ ...s, [id]: "error" }));
      toast.error(`Failed: ${shortAddr(wallet.poolWalletAddress)}`);
    }
  }

  // ── Download all wallets sequentially ─────────────────────────────────────
  async function downloadAll() {
    for (const wallet of walletsForPool) {
      await downloadWallet(wallet);
    }
  }

  // ── Save manual token price ────────────────────────────────────────────────
  async function handlePriceChange(tokenAddress, value) {
    const num = parseFloat(value);
    setTokenPrices((prev) => ({ ...prev, [tokenAddress]: isNaN(num) ? undefined : num }));
    if (!isNaN(num) && num > 0) {
      try {
        await ADMIN_API.AUDIT_SAVE_TOKEN_PRICE({ date, tokenAddress, avgPrice: num });
      } catch {
        // non-critical, ignore
      }
    }
  }

  // ── Unique token addresses for price display ───────────────────────────────
  const tokenAddrsForDisplay = useMemo(
    () => [...new Set(walletsForPool.flatMap((w) => w.tokenAddresses || []))],
    [walletsForPool]
  );

  const anyLoading = Object.values(dlState).some((s) => s === "loading");

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 min-h-screen text-white">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FileSpreadsheet size={28} className="text-blue-400" />
        <div>
          <h1 className="text-2xl font-bold">Wallet Audit Export</h1>
          <p className="text-sm text-gray-400">
            Download Solscan transfer data per wallet as Excel (Raw / Filtered / Sums)
          </p>
        </div>
      </div>

      {/* ── Step 1 & 2: Date + Pool Type ─────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Date</label>
          <input
            type="date"
            value={date}
            max={yesterday()}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Pool Type</label>
          <select
            value={poolType}
            onChange={(e) => setPoolType(e.target.value)}
            className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Types</option>
            <option value="cpmm">CPMM</option>
            <option value="clmm">CLMM</option>
            <option value="rwa">RWA</option>
          </select>
        </div>

        {/* ── Step 3: Pool selector ───────────────────────────────────── */}
        <div>
          <label className="block text-xs text-gray-400 mb-1">Pool</label>
          {poolsLoading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
              <Loader2 size={14} className="animate-spin" /> Loading pools…
            </div>
          ) : (
            <select
              value={selectedPoolId}
              onChange={(e) => setSelectedPoolId(e.target.value)}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">— Select a pool —</option>
              {filteredPoolOptions.map((p) => (
                <option key={p.poolId || p.pairAddress} value={p.poolId || p.pairAddress}>
                  {p.poolName} ({(p.poolType || "").toUpperCase()}) — {shortAddr(p.pairAddress)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Token Prices section ─────────────────────────────────────────── */}
      {selectedPoolId && tokenAddrsForDisplay.length > 0 && (
        <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-gray-200">Token Avg Prices for {date}</span>
            {pricesLoading && <Loader2 size={14} className="animate-spin text-blue-400" />}
            <span className="text-xs text-gray-500">(auto-fetched · editable)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {tokenAddrsForDisplay.map((addr) => (
              <div key={addr} className="flex flex-col gap-1">
                <label className="text-xs text-gray-400 font-mono">
                  {addr === SOL_MINT ? "SOL" : shortAddr(addr)}
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="Enter price"
                    value={tokenPrices[addr] ?? ""}
                    onChange={(e) => handlePriceChange(addr, e.target.value)}
                    className="flex-1 bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Step 4: Wallet table + download ──────────────────────────────── */}
      {selectedPoolId && (
        <div className="bg-gray-800/40 border border-gray-700 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <span className="text-sm font-semibold text-gray-200">
              Wallets ({walletsForPool.length})
            </span>
            {walletsForPool.length > 0 && (
              <button
                onClick={downloadAll}
                disabled={anyLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                {anyLoading ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Download size={14} />
                )}
                Download All
              </button>
            )}
          </div>

          {walletsForPool.length === 0 ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm p-6">
              <AlertCircle size={16} />
              No wallets found for this pool. Configure wallets in Pool Wallets admin page.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-400 border-b border-gray-700">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Wallet Address</th>
                  <th className="px-4 py-2">Inner Wallet</th>
                  <th className="px-4 py-2">Tokens Configured</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {walletsForPool.map((w, i) => {
                  const state = dlState[w._id] || "idle";
                  return (
                    <tr
                      key={w._id}
                      className="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors"
                    >
                      <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-300">
                        {shortAddr(w.poolWalletAddress)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">
                        {shortAddr(w.innerWalletAddress)}
                      </td>
                      <td className="px-4 py-3">
                        {w.tokenAddresses?.length > 0 ? (
                          <span className="text-xs text-gray-300">
                            {w.tokenAddresses.length} token{w.tokenAddresses.length > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="text-xs text-yellow-400">Not configured</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => downloadWallet(w)}
                          disabled={state === "loading"}
                          className="flex items-center gap-1.5 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs px-3 py-1.5 rounded-lg transition-colors"
                        >
                          {state === "loading" && <Loader2 size={12} className="animate-spin" />}
                          {state === "done"    && <CheckCircle2 size={12} className="text-green-400" />}
                          {state === "error"   && <AlertCircle size={12} className="text-red-400" />}
                          {state === "idle"    && <Download size={12} />}
                          {state === "loading" ? "Fetching…" : state === "done" ? "Downloaded" : state === "error" ? "Retry" : "Download"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {!selectedPoolId && !poolsLoading && (
        <div className="flex flex-col items-center justify-center py-16 text-gray-500">
          <FileSpreadsheet size={48} className="mb-4 opacity-30" />
          <p className="text-sm">Select a date, pool type and pool to see wallets</p>
        </div>
      )}
    </div>
  );
}
