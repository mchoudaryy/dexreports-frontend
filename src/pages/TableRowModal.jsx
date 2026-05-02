import { useEffect } from "react";
import { useAuth } from "../context/useAuth";
import {
  X,
  DollarSign,
  Users,
  BarChart3,
  Building2,
  User,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Eye,
  TrendingDown,
  Activity,
  Zap,
  Wallet,
  Coins,
  ShieldCheck,
  Fuel,
  TrendingUp,
} from "lucide-react";

const TableRowModal = ({ rowData, isOpen, onClose, type = "report" }) => {
  const { user } = useAuth();
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  // Number formatting function
  const formatNumber = (num) => {
    if (num === null || num === undefined || num === "") return "0";
    const number = parseFloat(num);
    if (isNaN(number)) return "0";

    const trimZeros = (str) =>
      str.replace(/\.0+$|([\.\d]*[1-9])0+$/, "$1").replace(/\.$/, "");

    const absNum = Math.abs(number);
    const sign = number < 0 ? "-" : "";

    if (absNum >= 1e9) {
      return sign + trimZeros((absNum / 1e9).toFixed(4)) + "B";
    } else if (absNum >= 1e6) {
      return sign + trimZeros((absNum / 1e6).toFixed(4)) + "M";
    } else if (absNum >= 1e3) {
      return sign + trimZeros((absNum / 1e3).toFixed(4)) + "K";
    } else {
      return sign + trimZeros(absNum.toFixed(4));
    }
  };

  const formatCompactNumber = (num) => {
    if (num === 0 || num === null || num === undefined) return "$0";
    const isNegative = num < 0;
    const absNum = Math.abs(num);
    const sign = isNegative ? "-" : "";

    if (absNum < 1) return `${sign}$${absNum.toFixed(4)}`;
    if (absNum < 1000) return `${sign}$${absNum.toFixed(2)}`;
    if (absNum < 1000000) return `${sign}$${(absNum / 1000).toFixed(2)}K`;
    if (absNum < 1000000000) return `${sign}$${(absNum / 1000000).toFixed(2)}M`;
    return `${sign}$${(absNum / 1000000).toFixed(2)}B`;
  };

  const formatDate = (dateInput) => {
    if (!dateInput) return "N/A";
    let s = dateInput;
    if (typeof s === "number") s = s.toString();
    if (typeof s === "string" && s.length === 8) {
      const y = s.slice(0, 4);
      const m = s.slice(4, 6);
      const d = s.slice(6, 8);
      const date = new Date(`${y}-${m}-${d}`);
      return `${y} ${date.toLocaleString("en-US", { month: "short" })} ${d}`;
    }
    return s || "N/A";
  };

  if (!isOpen || !rowData) return null;

  // Render Report type modal
  if (type === "report") {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
        />

        <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden transform transition-all duration-300 scale-100">
          {/* Enhanced Header */}
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-6 rounded-t-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-4">
                <div>
                  <h1 className="text-2xl font-bold text-white mb-1">
                    Report Details
                  </h1>
                  <p className="text-blue-100 text-sm">
                    {rowData.endTime ? formatDate(rowData.endTime) : "N/A"}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-200 hover:scale-105 backdrop-blur-sm"
                aria-label="Close"
              >
                <X size={24} className="text-white" />
              </button>
            </div>
          </div>

          {/* Enhanced Content */}
          <div className="p-6 max-h-[calc(95vh-140px)] overflow-y-auto">
            {/* Summary Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
              {/* Total Volume Card */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
                      <DollarSign className="h-6 w-6 text-white" />
                    </div>
                    <div className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-1 rounded-full">
                      VOLUME
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {formatCompactNumber(rowData.totalVolume || 0)}
                    </p>
                    <p className="text-xs text-gray-400">
                      Total trading volume
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Transactions Card */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-br from-green-500 to-green-600 p-3 rounded-xl shadow-md">
                      <BarChart3 className="h-6 w-6 text-white" />
                    </div>
                    <div className="bg-green-50 text-green-600 text-xs font-semibold px-2 py-1 rounded-full">
                      TRANSACTIONS
                    </div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 mb-2">
                      {formatNumber(rowData.totalTransactions || 0)}
                    </p>
                    <p className="text-xs text-gray-400">
                      All time transactions
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Buys Card */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-3 rounded-xl shadow-md">
                      <ArrowUpRight className="h-6 w-6 text-white" />
                    </div>
                    <div className="bg-emerald-50 text-emerald-600 text-xs font-semibold px-2 py-1 rounded-full">
                      TOTAL BUYS
                    </div>
                  </div>
                  <div>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(rowData.totalBuys || rowData.buys || 0)}
                      </p>
                      {rowData.totalTransactions > 0 && (
                        <div className="bg-emerald-50 rounded-lg px-3 py-1">
                          <p className="text-sm font-bold text-emerald-700">
                            {(
                              (rowData.buys / rowData.totalTransactions) *
                              100
                            ).toFixed(1)}
                            %
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      of total transactions
                    </p>
                  </div>
                </div>
              </div>

              {/* Total Sells Card */}
              <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <div className="flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <div className="bg-gradient-to-br from-rose-500 to-rose-600 p-3 rounded-xl shadow-md">
                      <ArrowDownRight className="h-6 w-6 text-white" />
                    </div>
                    <div className="bg-rose-50 text-rose-600 text-xs font-semibold px-2 py-1 rounded-full">
                      TOTAL SELLS
                    </div>
                  </div>
                  <div>
                    <div className="flex items-end justify-between">
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(rowData.totalSells || rowData.sells || 0)}
                      </p>
                      {rowData.totalTransactions > 0 && (
                        <div className="bg-rose-50 rounded-lg px-3 py-1">
                          <p className="text-sm font-bold text-rose-700">
                            {(
                              (rowData.sells / rowData.totalTransactions) *
                              100
                            ).toFixed(1)}
                            %
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      of total transactions
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Information Grid */}
            <div className="flex flex-col gap-6 mt-6">
              {/* Trading Details */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2 rounded-lg mr-3">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  Trading Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "MM BUYS", value: rowData.buys, icon: ArrowUpRight, bg: "bg-indigo-50", border: "border-indigo-100", iconColor: "text-indigo-500" },
                    { label: "MM SELLS", value: rowData.sells, icon: ArrowDownRight, bg: "bg-rose-50", border: "border-rose-100", iconColor: "text-rose-500" },
                    { label: "SOLANA AVG PRICE", value: rowData.solAverage, icon: Coins, bg: "bg-purple-50", border: "border-purple-100", iconColor: "text-purple-500", isCurrency: true },
                    { label: "TOTAL VOLUME", value: rowData.totalVolume, icon: DollarSign, bg: "bg-blue-50", border: "border-blue-100", iconColor: "text-blue-500", isCurrency: true },
                    { label: "MM VOLUME TO POOL", value: rowData.mmTotalVolume, icon: BarChart3, bg: "bg-amber-50", border: "border-amber-100", iconColor: "text-amber-500", isCurrency: true },
                    { label: "ARB(USERS) VOLUME", value: rowData.usersTotalVolume, icon: Users, bg: "bg-emerald-50", border: "border-emerald-100", iconColor: "text-emerald-500", isCurrency: true },
                    { label: "TOTAL REVENUE", value: rowData.poolYeild, icon: Zap, bg: "bg-indigo-50", border: "border-indigo-100", iconColor: "text-indigo-500", isCurrency: true },
                    { label: "REVENUE FROM MM TO POOL", value: rowData.mmYeild, icon: TrendingDown, bg: "bg-rose-50", border: "border-rose-100", iconColor: "text-rose-500", isCurrency: true },
                    { label: "REVENUE FROM ARB(USERS) TO POOL", value: rowData.ARBuserYeild, icon: ShieldCheck, bg: "bg-purple-50", border: "border-purple-100", iconColor: "text-purple-500", isCurrency: true },
                    ...(user?.role !== "superuser" ? [
                      { label: "FINAL COMPANY REVENUE", value: rowData.companysYeild, icon: Building2, bg: "bg-blue-50", border: "border-blue-100", iconColor: "text-blue-500", isCurrency: true },
                      { label: "FINAL CLIENTS REVENUE", value: rowData.usersYeild, icon: User, bg: "bg-green-50", border: "border-green-100", iconColor: "text-green-500", isCurrency: true },
                      { label: "COMPOUND REVENUE", value: rowData.compoundRevenue, icon: Building2, bg: "bg-cyan-50", border: "border-cyan-100", iconColor: "text-cyan-500", isCurrency: true },
                    ] : []),
                    { label: "MM PLATFORM FEE", value: rowData.mmRayFee, icon: Fuel, bg: "bg-orange-50", border: "border-orange-100", iconColor: "text-orange-500", isCurrency: true },
                    { label: "MM TOTAL COST", value: rowData.walletLoss, icon: TrendingDown, bg: "bg-rose-50", border: "border-rose-100", iconColor: "text-rose-500", isCurrency: true },
                    { label: "TOTAL LIQUIDITY", value: rowData.poolLiquidity, icon: Activity, bg: "bg-amber-50", border: "border-amber-100", iconColor: "text-amber-500", isCurrency: true },
                    ...(user?.role !== "superuser" ? [
                      { label: "COMPANY LIQUIDITY", value: rowData.companysLiquidity, icon: Building2, bg: "bg-blue-50", border: "border-blue-100", iconColor: "text-blue-500", isCurrency: true },
                      { label: "COMPOUND LIQUIDITY", value: rowData.compoundLiquidity, icon: Building2, bg: "bg-cyan-50", border: "border-cyan-100", iconColor: "text-cyan-500", isCurrency: true },
                      { label: "USERS LIQUIDITY", value: rowData.usersLiquidity, icon: Users, bg: "bg-emerald-50", border: "border-emerald-100", iconColor: "text-emerald-500", isCurrency: true },
                    ] : []),
                  ].map((item, index) => (
                    <div key={index} className={`flex justify-between items-center p-4 ${item.bg} rounded-xl border ${item.border}`}>
                      <div className="flex items-center">
                        <div className="bg-white p-2 rounded-lg shadow-sm mr-3">
                          <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                        </div>
                        <span className="font-medium text-gray-700 text-sm">{item.label}</span>
                      </div>
                      <span className="font-bold text-gray-900 text-lg">
                        {item.isCurrency ? "$" : ""}
                        {formatNumber(item.value || 0)}
                        {item.suffix || ""}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cost & Fees */}
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 rounded-lg mr-3">
                    <DollarSign className="h-5 w-5 text-white" />
                  </div>
                  Cost & Fees
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: "MM GAS FEE", value: rowData.gasFeeInDollars, icon: Fuel, bg: "bg-indigo-50", border: "border-indigo-100", iconColor: "text-indigo-500", isCurrency: true },
                    { label: "RAY PLATFORM FEE COST", value: rowData.mmRayCost, icon: Zap, bg: "bg-rose-50", border: "border-rose-100", iconColor: "text-rose-500", isCurrency: true },
                    { label: "SLIPPAGE + PL COST", value: rowData.slipageAndloss, icon: TrendingDown, bg: "bg-purple-50", border: "border-purple-100", iconColor: "text-purple-500", isCurrency: true },
                    { label: "CLIENTS REVENUE COST", value: rowData.clientRevenueCost, icon: User, bg: "bg-green-50", border: "border-green-100", iconColor: "text-green-500", isCurrency: true },
                    { label: "NET COMPANY COST", value: rowData.netCompanyCost, icon: DollarSign, bg: "bg-orange-50", border: "border-orange-100", iconColor: "text-orange-500", isCurrency: true },
                  ].map((item, index) => (
                    <div key={index} className={`flex justify-between items-center p-4 ${item.bg} rounded-xl border ${item.border}`}>
                      <div className="flex items-center">
                        <div className="bg-white p-2 rounded-lg shadow-sm mr-3">
                          <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                        </div>
                        <span className="font-medium text-gray-700 text-sm">{item.label}</span>
                      </div>
                      <span className="font-bold text-gray-900 text-lg">
                        {item.isCurrency ? "$" : ""}
                        {formatNumber(item.value || 0)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Pool type modal
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-hidden transform transition-all duration-300 scale-100">
        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 p-6 rounded-t-2xl">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-white mb-1">
                  {rowData.name || "Pool Details"}
                </h1>
                <p className="text-blue-100 text-sm">Pool Information</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-200 hover:scale-105 backdrop-blur-sm"
              aria-label="Close"
            >
              <X size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="p-6 max-h-[calc(95vh-140px)] overflow-y-auto">
          {/* Summary Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {/* Liquidity Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-amber-500 to-yellow-600 p-3 rounded-xl shadow-md">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div className="bg-amber-50 text-amber-600 text-xs font-semibold px-2 py-1 rounded-full">
                    LIQUIDITY
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {formatCompactNumber(
                      rowData.liquidityAmount || rowData.liquidity || 0,
                    )}
                  </p>
                  <p className="text-xs text-gray-400">Total liquidity</p>
                </div>
              </div>
            </div>

            {/* Volume 24H Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-blue-500 to-cyan-600 p-3 rounded-xl shadow-md">
                    <BarChart3 className="h-6 w-6 text-white" />
                  </div>
                  <div className="bg-blue-50 text-blue-600 text-xs font-semibold px-2 py-1 rounded-full">
                    VOLUME 24H
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {formatCompactNumber(rowData.volume24h || 0)}
                  </p>
                  <p className="text-xs text-gray-400">24 hour volume</p>
                </div>
              </div>
            </div>

            {/* Fees 24H Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-gradient-to-br from-purple-500 to-pink-600 p-3 rounded-xl shadow-md">
                    <DollarSign className="h-6 w-6 text-white" />
                  </div>
                  <div className="bg-purple-50 text-purple-600 text-xs font-semibold px-2 py-1 rounded-full">
                    FEES 24H
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {formatCompactNumber(rowData.fees24h || 0)}
                  </p>
                  <p className="text-xs text-gray-400">24 hour fees</p>
                </div>
              </div>
            </div>

            {/* APR 24H Card */}
            <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div
                    className={`bg-gradient-to-br p-3 rounded-xl shadow-md ${
                      (rowData.apr24h || 0) > 0
                        ? rowData.apr24h >= 999
                          ? "from-red-500 to-rose-600"
                          : "from-green-500 to-emerald-600"
                        : "from-gray-500 to-gray-600"
                    }`}
                  >
                    <TrendingUp className="h-6 w-6 text-white" />
                  </div>
                  <div
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      (rowData.apr24h || 0) > 0
                        ? rowData.apr24h >= 999
                          ? "bg-red-50 text-red-600"
                          : "bg-green-50 text-green-600"
                        : "bg-gray-50 text-gray-600"
                    }`}
                  >
                    APR 24H
                  </div>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900 mb-2">
                    {rowData.apr24h >= 999
                      ? ">999.99%"
                      : rowData.apr24h > 0
                        ? `${rowData.apr24h.toFixed(2)}%`
                        : "0%"}
                  </p>
                  <p className="text-xs text-gray-400">
                    Annual percentage rate
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Pool Information */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2 rounded-lg mr-3">
                <Eye className="h-5 w-5 text-white" />
              </div>
              Pool Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "Pool Name", value: rowData.name, icon: BarChart3, bg: "bg-indigo-50", border: "border-indigo-100", iconColor: "text-indigo-500" },
                { label: "Symbol", value: rowData.symbol, icon: Coins, bg: "bg-purple-50", border: "border-purple-100", iconColor: "text-purple-500" },
                { label: "Pool Type", value: rowData.poolType, icon: PieChart, bg: "bg-rose-50", border: "border-rose-100", iconColor: "text-rose-500" },
                { label: "Platform", value: rowData.platform, icon: Building2, bg: "bg-blue-50", border: "border-blue-100", iconColor: "text-blue-500" },
                { label: "Age", value: rowData.age, icon: Activity, bg: "bg-green-50", border: "border-green-100", iconColor: "text-green-500" },
                { label: "Holders", value: rowData.holders, icon: Users, bg: "bg-orange-50", border: "border-orange-100", iconColor: "text-orange-500" },
              ].map((item, index) => (
                <div key={index} className={`flex justify-between items-center p-4 ${item.bg} rounded-xl border ${item.border}`}>
                  <div className="flex items-center">
                    <div className="bg-white p-2 rounded-lg shadow-sm mr-3">
                      <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                    </div>
                    <span className="font-medium text-gray-700 text-sm">{item.label}</span>
                  </div>
                  <span className="font-bold text-gray-900 text-lg">
                    {typeof item.value === 'number' ? formatNumber(item.value) : (item.value || "N/A")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TableRowModal;
