import { useState, useEffect, Component } from "react";
import * as XLSX from "xlsx";
import api, { ADMIN_API } from "../services/ApiHandlers";
import { API_CONFIG } from "../services/ApiConfig";
import {
  FileSpreadsheet, Download, AlertCircle, CheckCircle2,
  Loader2, DollarSign, RefreshCw, Save,
} from "lucide-react";
import toast from "react-hot-toast";

class TabErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(err) { return { error: err }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 rounded-xl border border-red-200 bg-red-50 text-red-700 text-sm">
          <p className="font-semibold mb-1">Error loading tab</p>
          <pre className="text-xs whitespace-pre-wrap">{this.state.error?.message}</pre>
          <button onClick={() => this.setState({ error: null })}
            className="mt-3 px-3 py-1 text-xs bg-red-100 border border-red-300 rounded hover:bg-red-200">
            Retry
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

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

function sourceBadge(source) {
  if (source === "coingecko") return "bg-orange-100 text-orange-700";
  if (source === "solscan")   return "bg-blue-100 text-blue-700";
  if (source === "raydium")   return "bg-purple-100 text-purple-700";
  return "bg-gray-100 text-gray-600";
}

function buildExcel(raw, filtered, sums, walletAddress, date, poolName) {
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(raw.length ? raw : [{}]), "Raw_Data");
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filtered.length ? filtered : [{}]), "Filtered");
  const sumsRows = sums.map((s) => ({
    Case: s.case, Token_Address: s.token_address,
    Token_Symbol: s.token_symbol, Flow: s.flow, Balance_Sum: s.balance_sum,
  }));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sumsRows.length ? sumsRows : [{}]), "Sums");
  const filename = `${date}_${poolName}_${shortAddr(walletAddress)}.xlsx`.replace(/[^a-zA-Z0-9._-]/g, "_");
  XLSX.writeFile(wb, filename);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 1 — Wallet Download
// ═══════════════════════════════════════════════════════════════════════════════

function WalletDownloadTab() {
  const [date, setDate]               = useState(yesterday);
  const [poolType, setPoolType]       = useState("all");
  const [pools, setPools]             = useState([]);
  const [poolsLoading, setPoolsLoading] = useState(true);
  const [selectedPairAddress, setSelectedPairAddress] = useState("");
  const [wallets, setWallets]         = useState([]);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [dlState, setDlState]         = useState({});

  useEffect(() => {
    setPoolsLoading(true);
    setSelectedPairAddress("");
    setWallets([]);
    ADMIN_API.AUDIT_GET_SWAP_POOLS({ poolType })
      .then((res) => setPools(res.data?.pools || []))
      .catch(() => toast.error("Failed to load pools"))
      .finally(() => setPoolsLoading(false));
  }, [poolType]);

  useEffect(() => {
    if (!selectedPairAddress) { setWallets([]); return; }
    setWalletsLoading(true);
    ADMIN_API.AUDIT_GET_SWAP_WALLETS({ pairAddress: selectedPairAddress })
      .then((res) => setWallets(res.data?.wallets || []))
      .catch(() => toast.error("Failed to load wallets"))
      .finally(() => setWalletsLoading(false));
  }, [selectedPairAddress]);

  async function downloadWallet(wallet) {
    const id = wallet._id;
    setDlState((s) => ({ ...s, [id]: "loading" }));
    try {
      const res = await ADMIN_API.AUDIT_GET_SWAP_TRANSFERS({ walletId: id, startDate: date, endDate: date });
      const { raw, filtered, sums, poolName, walletAddress } = res.data;
      buildExcel(raw, filtered, sums, walletAddress || wallet.walletAddress, date, poolName || wallet.symbol);
      setDlState((s) => ({ ...s, [id]: "done" }));
      toast.success(`Downloaded ${raw.length} records — ${shortAddr(wallet.walletAddress)}`);
    } catch {
      setDlState((s) => ({ ...s, [id]: "error" }));
      toast.error(`Failed: ${shortAddr(wallet.walletAddress)}`);
    }
  }

  async function downloadAll() {
    for (const w of wallets) await downloadWallet(w);
  }

  const anyLoading = Object.values(dlState).some((s) => s === "loading");

  return (
    <div>
      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
          <input type="date" value={date} max={yesterday()}
            onChange={(e) => { setDate(e.target.value); setDlState({}); }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 bg-white" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Pool Type</label>
          <select value={poolType} onChange={(e) => setPoolType(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 bg-white">
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
            <select value={selectedPairAddress}
              onChange={(e) => { setSelectedPairAddress(e.target.value); setDlState({}); }}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 bg-white">
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

      {/* Wallet Table */}
      {selectedPairAddress && (
        <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
            <span className="text-sm font-semibold text-gray-700">
              Swapping Wallets{!walletsLoading && ` (${wallets.length})`}
            </span>
            {wallets.length > 0 && !walletsLoading && (
              <button onClick={downloadAll} disabled={anyLoading}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-1.5 rounded-lg transition-colors">
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
              <AlertCircle size={16} /> No swapping wallets found for this pool.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
                  <th className="px-4 py-2">#</th>
                  <th className="px-4 py-2">Wallet Address</th>
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
                      <td className="px-4 py-3 font-mono text-xs text-blue-600">{shortAddr(w.walletAddress)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600 font-medium">{w.symbol || "—"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => downloadWallet(w)} disabled={state === "loading"}
                          className="flex items-center gap-1.5 border border-gray-300 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50 text-gray-600 text-xs px-3 py-1.5 rounded-lg transition-colors bg-white">
                          {state === "loading" && <Loader2 size={12} className="animate-spin" />}
                          {state === "done"    && <CheckCircle2 size={12} className="text-green-500" />}
                          {state === "error"   && <AlertCircle size={12} className="text-red-500" />}
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

      {!selectedPairAddress && !poolsLoading && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <FileSpreadsheet size={52} className="mb-4 opacity-20" />
          <p className="text-sm">Select a date, pool type and pool to see swapping wallets</p>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TAB 2 — Token Prices
// ═══════════════════════════════════════════════════════════════════════════════

function TokenPricesTab() {
  const [date, setDate]       = useState(yesterday);
  const [tokens, setTokens]   = useState([]);   // all tokens from Token collection
  const [loading, setLoading] = useState(true);
  // priceMap: { tokenAddress: { avgPrice, priceSource, dirty } }
  const [priceMap, setPriceMap] = useState({});
  const [fetchingSol, setFetchingSol] = useState(false);
  const [savingMap, setSavingMap]     = useState({});

  // Load all tokens once on mount
  useEffect(() => {
    api.get(API_CONFIG.AUDIT_GET_TOKEN_LIST)
      .then((res) => setTokens(res.data?.tokens || []))
      .catch(() => toast.error("Failed to load token list"))
      .finally(() => setLoading(false));
  }, []);

  // Load stored prices from DB whenever date changes
  useEffect(() => {
    api.get(API_CONFIG.AUDIT_GET_ALL_TOKEN_PRICES, { params: { date } })
      .then((res) => {
        const map = {};
        for (const p of res.data?.prices || []) {
          map[p.tokenAddress] = { avgPrice: p.avgPrice, priceSource: p.priceSource || "manual", dirty: false };
        }
        setPriceMap(map);
      })
      .catch(() => {});
  }, [date]);

  // Fetch SOL price from CoinGecko (only SOL is auto-fetchable)
  async function fetchSolPrice() {
    setFetchingSol(true);
    try {
      const res = await ADMIN_API.AUDIT_GET_TOKEN_PRICES({ date, tokenAddresses: SOL_MINT });
      const p = res.data?.prices?.[0];
      if (p && p.avgPrice != null) {
        setPriceMap((prev) => ({
          ...prev,
          [SOL_MINT]: { avgPrice: p.avgPrice, priceSource: p.priceSource || "coingecko", dirty: false },
        }));
        toast.success(`SOL: $${p.avgPrice}`);
      } else {
        toast.error("SOL price not available for this date");
      }
    } catch {
      toast.error("Failed to fetch SOL price");
    } finally {
      setFetchingSol(false);
    }
  }

  // Handle manual price input
  function handleInput(tokenAddress, value) {
    setPriceMap((prev) => ({
      ...prev,
      [tokenAddress]: {
        ...(prev[tokenAddress] || {}),
        avgPrice:    value === "" ? null : parseFloat(value),
        priceSource: "manual",
        dirty:       true,
      },
    }));
  }

  // Save single token price to DB
  async function savePrice(token) {
    const entry = priceMap[token.tokenAddress];
    if (!entry || entry.avgPrice == null || isNaN(entry.avgPrice)) {
      toast.error("Enter a valid price first");
      return;
    }
    setSavingMap((s) => ({ ...s, [token.tokenAddress]: true }));
    try {
      await ADMIN_API.AUDIT_SAVE_TOKEN_PRICE({
        date,
        tokenAddress: token.tokenAddress,
        symbol: token.symbol,
        avgPrice: entry.avgPrice,
      });
      setPriceMap((prev) => ({
        ...prev,
        [token.tokenAddress]: { ...prev[token.tokenAddress], priceSource: "manual", dirty: false },
      }));
      toast.success(`Saved ${token.symbol}`);
    } catch {
      toast.error(`Failed to save ${token.symbol}`);
    } finally {
      setSavingMap((s) => ({ ...s, [token.tokenAddress]: false }));
    }
  }

  // Save all dirty prices at once
  async function saveAll() {
    const dirty = tokens.filter((t) => priceMap[t.tokenAddress]?.dirty && priceMap[t.tokenAddress]?.avgPrice != null);
    if (!dirty.length) { toast("No unsaved changes"); return; }
    for (const t of dirty) await savePrice(t);
  }

  const dirtyCount = tokens.filter((t) => priceMap[t.tokenAddress]?.dirty).length;

  return (
    <div>
      {/* Controls row */}
      <div className="flex flex-wrap items-end gap-3 mb-4">
        <div>
          <label className="block text-xs font-medium text-gray-500 mb-1">Date</label>
          <input type="date" value={date} max={yesterday()}
            onChange={(e) => setDate(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-blue-500 bg-white" />
        </div>
        <button onClick={fetchSolPrice} disabled={fetchingSol || loading}
          className="flex items-center gap-2 border border-orange-300 text-orange-600 hover:bg-orange-50 disabled:opacity-50 text-sm font-medium px-4 py-2 rounded-lg transition-colors bg-white">
          {fetchingSol ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Fetch SOL (CoinGecko)
        </button>
        {dirtyCount > 0 && (
          <button onClick={saveAll}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            <Save size={14} /> Save All ({dirtyCount})
          </button>
        )}
      </div>

      {/* Token Price Table */}
      <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50">
          <span className="text-sm font-semibold text-gray-700">Token Prices — {date}</span>
          <span className="text-xs text-gray-400">Enter prices manually · SOL auto-fetches from CoinGecko</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-10">
            <Loader2 size={16} className="animate-spin" /> Loading tokens…
          </div>
        ) : tokens.length === 0 ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm p-6">
            <AlertCircle size={16} /> No tokens found.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200 bg-gray-50">
                <th className="px-4 py-2">#</th>
                <th className="px-4 py-2">Token</th>
                <th className="px-4 py-2">Address</th>
                <th className="px-4 py-2">Source</th>
                <th className="px-4 py-2">Avg Price (USD)</th>
                <th className="px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token, i) => {
                const addr  = token.tokenAddress || token.solAddress || "";
                const entry = priceMap[addr] || {};
                const isSol = addr === SOL_MINT;
                const saving = savingMap[addr] || false;
                const hasPrice = entry.avgPrice != null && !isNaN(entry.avgPrice);

                return (
                  <tr key={addr || i} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-semibold text-gray-700 text-xs">{token.symbol}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-400">{shortAddr(addr)}</td>
                    <td className="px-4 py-3">
                      {hasPrice ? (
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${sourceBadge(entry.priceSource)}`}>
                          {entry.priceSource || "manual"}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <span className="text-gray-400 text-xs">$</span>
                        <input
                          type="number" min="0" step="any"
                          placeholder="0.00"
                          value={entry.avgPrice ?? ""}
                          onChange={(e) => handleInput(addr, e.target.value)}
                          className={`w-36 border rounded px-2 py-1 text-xs text-gray-800 focus:outline-none focus:border-blue-500 bg-white ${entry.dirty ? "border-orange-400" : "border-gray-300"}`}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => savePrice({ ...token, tokenAddress: addr })}
                          disabled={saving || !entry.dirty}
                          className="flex items-center gap-1 border border-green-300 text-green-600 hover:bg-green-50 disabled:opacity-40 text-xs px-2 py-1 rounded transition-colors bg-white">
                          {saving ? <Loader2 size={11} className="animate-spin" /> : <Save size={11} />}
                          Save
                        </button>
                        {isSol && (
                          <button onClick={fetchSolPrice} disabled={fetchingSol}
                            className="flex items-center gap-1 border border-orange-300 text-orange-500 hover:bg-orange-50 disabled:opacity-40 text-xs px-2 py-1 rounded transition-colors bg-white">
                            <RefreshCw size={11} /> Fetch
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main Page — Tab navigation
// ═══════════════════════════════════════════════════════════════════════════════

export default function AuditExport() {
  const [tab, setTab] = useState("download");

  const tabs = [
    { id: "download", label: "Wallet Download",  icon: <FileSpreadsheet size={15} /> },
    { id: "prices",   label: "Token Prices",     icon: <DollarSign size={15} /> },
  ];

  return (
    <div className="p-6 min-h-screen">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <FileSpreadsheet size={26} className="text-blue-500" />
        <div>
          <h1 className="text-xl font-bold text-gray-800">Wallet Audit</h1>
          <p className="text-sm text-gray-500">Download Excel reports & manage token prices</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 border-b border-gray-200">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 -mb-px
              ${tab === t.id
                ? "border-blue-500 text-blue-600 bg-white"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"}`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <TabErrorBoundary key={tab}>
        {tab === "download" && <WalletDownloadTab />}
        {tab === "prices"   && <TokenPricesTab />}
      </TabErrorBoundary>
    </div>
  );
}
