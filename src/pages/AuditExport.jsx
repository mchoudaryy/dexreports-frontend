import { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import { ADMIN_API } from "../services/ApiHandlers";
import { FileSpreadsheet, Download, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
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
  if (s === "active")   return "bg-green-100 text-green-700 border border-green-300";
  if (s === "expired")  return "bg-red-100 text-red-700 border border-red-300";
  return "bg-yellow-100 text-yellow-700 border border-yellow-300";
}

/** Build Excel workbook with Raw_Data, Filtered, Sums sheets */
function buildExcel(raw, filtered, sums, tokenPrices, walletAddress, date, poolName) {
  const wb = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(raw.length ? raw : [{}]), "Raw_Data");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filtered.length ? filtered : [{}]), "Filtered");

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
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sumsWithPrice.length ? sumsWithPrice : [{}]), "Sums");

  const filename = `${date}_${poolName}_${shortAddr(walletAddress)}.xlsx`
    .replace(/[^a-zA-Z0-9._-]/g, "_");

  XLSX.writeFile(wb, filename);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AuditExport() {
  const [date, setDate]                 = useState(yesterday);
  const [poolType, setPoolType]         = useState("all");
  const [pools, setPools]               = useState([]);
  const [poolsLoading, setPoolsLoading] = useState(true);
  const [selectedPairAddress, setSelectedPairAddress] = useState("");
  const [wallets, setWallets]           = useState([]);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [tokenPrices, setTokenPrices]   = useState({});
  const [pricesLoading, setPricesLoading] = useState(false);
  // per-wallet download state: { [walletId]: 'idle'|'loading'|'done'|'error' }
  const [dlState, setDlState]           = useState({});

  // ── Load pools (MM swapping wallets) when poolType changes ────────────────
  useEffect(() => {
    setPoolsLoading(true);
    setSelectedPairAddress("");
    setWallets([]);
    ADMIN_API.AUDIT_GET_SWAP_POOLS({ poolType })
      .then((res) => setPools(res.data?.pools || []))
      .catch(() => toast.error("Failed to load pools"))
      .finally(() => setPoolsLoading(false));
  }, [poolType]);

  // ── Load wallets when pool is selected ────────────────────────────────────
  useEffect(() => {
    if (!selectedPairAddress) { setWallets([]); return; }
    setWalletsLoading(true);
    ADMIN_API.AUDIT_GET_SWAP_WALLETS({ pairAddress: selectedPairAddress })
      .then((res) => setWallets(res.data?.wallets || []))
      .catch(() => toast.error("Failed to load wallets"))
      .finally(() => setWalletsLoading(false));
  }, [selectedPairAddress]);

  // ── Fetch token prices when wallets or date change ────────────────────────
  useEffect(() => {
    if (!wallets.length || !date) return;
    const addrs = [...new Set(
      wallets.flatMap((w) => [w.tokenAddress, w.solAddress || SOL_MINT].filter(Boolean))
    )];
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
  }, [wallets, date]);

  // ── Unique token addresses for price display ───────────────────────────────
  const tokenAddrsForPrices = useMemo(
    () => [...new Set(wallets.flatMap((w) => [w.tokenAddress, w.solAddress || SOL_MINT].filter(Boolean)))],
    [wallets]
  );

  // ── Save manual price ──────────────────────────────────────────────────────
  async function handlePriceChange(tokenAddress, value) {
    const num = parseFloat(value);
    setTokenPrices((prev) => ({ ...prev, [tokenAddress]: isNaN(num) ? undefined : num }));
    if (!isNaN(num) && num > 0) {
      ADMIN_API.AUDIT_SAVE_TOKEN_PRICE({ date, tokenAddress, avgPrice: num }).catch(() => {});
    }
  }

  // ── Download single wallet ─────────────────────────────────────────────────
  async function downloadWallet(wallet) {
    const id = wallet._id;
    setDlState((s) => ({ ...s, [id]: "loading" }));
    try {
      const res = await ADMIN_API.AUDIT_GET_SWAP_TRANSFERS({
        walletId: id,
        startDate: date,
        endDate: date,
      });
      const { raw, filtered, sums, poolName } = res.data;
      buildExcel(raw, filtered, sums, tokenPrices, wallet.walletAddress, date, poolName || wallet.symbol);
      setDlState((s) => ({ ...s, [id]: "done" }));
      toast.success(`Downloaded: ${shortAddr(wallet.walletAddress)}`);
    } catch {
      setDlState((s) => ({ ...s, [id]: "error" }));
      toast.error(`Failed: ${shortAddr(wallet.walletAddress)}`);
    }
  }

  // ── Download all wallets sequentially ─────────────────────────────────────
  async function downloadAll() {
    for (const w of wallets) await downloadWallet(w);
  }

  const anyLoading = Object.values(dlState).some((s) => s === "loading");

  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <FileSpreadsheet size={26} className="text-blue-500" />
        <div>
          <h1 className="text-xl font-bold text-gray-800">Wallet Audit Export</h1>
          <p className="text-sm text-gray-500">
            Download Solscan transfer data per MM swapping wallet as Excel (Raw / Filtered / Sums)
          </p>
        </div>
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
          <input
            type="date"
            value={date}
            max={yesterday()}
            onChange={(e) => { setDate(e.target.value); setDlState({}); }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Pool Type</label>
          <select
            value={poolType}
            onChange={(e) => setPoolType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
          >
            <option value="all">All Types</option>
            <option value="cpmm">CPMM</option>
            <option value="clmm">CLMM</option>
            <option value="rwa">RWA</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Pool</label>
          {poolsLoading ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm py-2">
              <Loader2 size={14} className="animate-spin" /> Loading…
            </div>
          ) : (
            <select
              value={selectedPairAddress}
              onChange={(e) => { setSelectedPairAddress(e.target.value); setDlState({}); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="">— Select a pool —</option>
              {pools.map((p) => (
                <option key={p.pairAddress} value={p.pairAddress}>
                  {p.symbol} ({(p.poolType || "").toUpperCase()}) — {shortAddr(p.pairAddress)}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ── Token Prices ────────────────────────────────────────────────── */}
      {selectedPairAddress && tokenAddrsForPrices.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-sm font-semibold text-gray-700">Token Avg Prices — {date}</span>
            {pricesLoading && <Loader2 size={13} className="animate-spin text-blue-500" />}
            <span className="text-xs text-gray-400">(auto-fetched · editable · saved per date)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {tokenAddrsForPrices.map((addr) => (
              <div key={addr}>
                <label className="block text-xs text-gray-500 mb-1 font-mono">
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
                    className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm text-gray-800 focus:outline-none focus:border-blue-500 bg-white"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Wallet Table ─────────────────────────────────────────────────── */}
      {selectedPairAddress && (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">
              Swapping Wallets
              {!walletsLoading && ` (${wallets.length})`}
            </span>
            {wallets.length > 0 && !walletsLoading && (
              <button
                onClick={downloadAll}
                disabled={anyLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                {anyLoading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                Download All
              </button>
            )}
          </div>

          {walletsLoading ? (
            <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-8">
              <Loader2 size={16} className="animate-spin" /> Loading wallets…
            </div>
          ) : wallets.length === 0 ? (
            <div className="flex items-center gap-2 text-gray-400 text-sm p-6">
              <AlertCircle size={16} />
              No swapping wallets found for this pool. Add wallets via Admin → Add Wallets.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Wallet Address</th>
                  <th className="px-4 py-2">Inner Wallet</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Token</th>
                  <th className="px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {wallets.map((w, i) => {
                  const state = dlState[w._id] || "idle";
                  return (
                    <tr key={w._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                      <td className="px-4 py-3 font-mono text-xs text-blue-600">
                        {shortAddr(w.walletAddress)}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-400">
                        {w.innerWalletAddress ? shortAddr(w.innerWalletAddress) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(w.status)}`}>
                          {(w.status || "inactive").toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 font-medium">
                        {w.symbol || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => downloadWallet(w)}
                          disabled={state === "loading"}
                          className="flex items-center gap-1.5 border border-gray-300 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed text-gray-600 text-xs px-3 py-1.5 rounded-lg transition-colors bg-white"
                        >
                          {state === "loading" && <Loader2 size={12} className="animate-spin" />}
                          {state === "done"    && <CheckCircle2 size={12} className="text-green-500" />}
                          {state === "error"   && <AlertCircle size={12} className="text-red-500" />}
                          {state === "idle"    && <Download size={12} />}
                          {state === "loading" ? "Fetching…"
                            : state === "done"  ? "Downloaded"
                            : state === "error" ? "Retry"
                            : "Download"}
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

      {/* Empty state */}
      {!selectedPairAddress && !poolsLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FileSpreadsheet size={52} className="mb-4 opacity-20" />
          <p className="text-sm">Select a date, pool type and pool to see swapping wallets</p>
        </div>
      )}
    </div>
  );
}
