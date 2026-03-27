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
  Activity,
  Zap,
  Wallet,
  TrendingDown,
  Percent,
  Coins,
  ShieldCheck,
  Fuel,
} from "lucide-react";

const RWAReportModal = ({ reportData, isOpen, onClose }) => {
  const { user } = useAuth();
  // console.log("reportData in RWAReportModal:", reportData);

  // Handle case-insensitive MMObject access
  const mmObj = reportData?.MMobject || reportData?.MMObject || {};

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
    if (!num && num !== 0) return "0";

    const number = parseFloat(num);
    const trimZeros = (str) =>
      str.replace(/\.0+$|([.\d]*[1-9])0+$/, "$1").replace(/\.$/, "");
    if (Math.abs(number) >= 1e9) {
      return trimZeros((number / 1e9).toFixed(4)) + "B";
    } else if (Math.abs(number) >= 1e6) {
      return trimZeros((number / 1e6).toFixed(4)) + "M";
    } else if (Math.abs(number) >= 1e3) {
      return trimZeros((number / 1e3).toFixed(4)) + "K";
    } else {
      return trimZeros(number.toFixed(4));
    }
  };

  const formatDate = (dateInput) => {
    let s = dateInput;
    if (typeof s === "number") s = s.toString();
    if (typeof s === "string" && s.length === 8) {
      const y = s.slice(0, 4);
      const m = s.slice(4, 6);
      const d = s.slice(6, 8);
      const date = new Date(`${y}-${m}-${d}`);
      return `${y} ${date.toLocaleString("en-US", {
        month: "short",
      })} ${d}`;
    }
    return s || "";
  };

  if (!isOpen) return null;

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
                  {reportData.name}
                </h1>
                <p className="text-blue-100 text-sm">
                  {formatDate(reportData.startTime)}
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
                    ${formatNumber(reportData.totalVolume)}
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
                    {formatNumber(reportData.totalTransactions)}
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
                    BUYS
                  </div>
                </div>
                <div>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(reportData.buys)}
                    </p>
                  </div>
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
                    SELLS
                  </div>
                </div>
                <div>
                  <div className="flex items-end justify-between">
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(reportData.sells)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trading Details Section */}
          <div className="w-full">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <div className="bg-gradient-to-br from-indigo-500 to-purple-500 p-2 rounded-lg mr-3">
                    <BarChart3 className="h-5 w-5 text-white" />
                  </div>
                  Trading Details
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "MM BUYS", value: mmObj.buys, icon: ArrowUpRight, bg: "bg-indigo-50", border: "border-indigo-100", iconColor: "text-indigo-500" },
                  { label: "MM SELLS", value: mmObj.sells, icon: ArrowDownRight, bg: "bg-rose-50", border: "border-rose-100", iconColor: "text-rose-500" },
                  { label: "SOLANA AVG PRICE", value: mmObj.solAverage, icon: Coins, bg: "bg-purple-50", border: "border-purple-100", iconColor: "text-purple-500", isCurrency: true },
                  { label: "TOTAL VOLUME", value: mmObj.totalVolume, icon: DollarSign, bg: "bg-blue-50", border: "border-blue-100", iconColor: "text-blue-500", isCurrency: true },
                  { label: "MM VOLUME TO POOL", value: mmObj.mmTotalVolume, icon: BarChart3, bg: "bg-amber-50", border: "border-amber-100", iconColor: "text-amber-500", isCurrency: true },
                  { label: "ARB(USERS) VOLUME", value: mmObj.usersTotalVolume, icon: Users, bg: "bg-emerald-50", border: "border-emerald-100", iconColor: "text-emerald-500", isCurrency: true },
                  { label: "TOTAL REVENUE", value: mmObj.poolYeild, icon: Zap, bg: "bg-indigo-50", border: "border-indigo-100", iconColor: "text-indigo-500", isCurrency: true },
                  { label: "REVENUE FROM MM TO POOL", value: mmObj.mmYeild, icon: TrendingDown, bg: "bg-rose-50", border: "border-rose-100", iconColor: "text-rose-500", isCurrency: true },
                  { label: "REVENUE FROM ARB(USERS) TO POOL", value: mmObj.ARBuserYeild, icon: ShieldCheck, bg: "bg-purple-50", border: "border-purple-100", iconColor: "text-purple-500", isCurrency: true },
                  ...(user?.role !== "superuser" ? [
                    { label: "FINAL COMPANY REVENUE", value: mmObj.companysYeild, icon: Building2, bg: "bg-blue-50", border: "border-blue-100", iconColor: "text-blue-500", isCurrency: true },
                    { label: "FINAL CLIENTS REVENUE", value: mmObj.usersYeild, icon: User, bg: "bg-green-50", border: "border-green-100", iconColor: "text-green-500", isCurrency: true },
                  ] : []),
                  { label: "MM PLATFORM FEE", value: mmObj.mmRayFee, icon: Fuel, bg: "bg-orange-50", border: "border-orange-100", iconColor: "text-orange-500", isCurrency: true },
                  { label: "MM TOTAL COST", value: mmObj.walletLoss, icon: TrendingDown, bg: "bg-rose-50", border: "border-rose-100", iconColor: "text-rose-500", isCurrency: true },
                  { label: "TOTAL LIQUIDITY", value: mmObj.poolLiquidity, icon: Activity, bg: "bg-amber-50", border: "border-amber-100", iconColor: "text-amber-500", isCurrency: true },
                  ...(user?.role !== "superuser" ? [
                    { label: "COMPANY LIQUIDITY", value: mmObj.companysLiquidity, icon: Building2, bg: "bg-blue-50", border: "border-blue-100", iconColor: "text-blue-500", isCurrency: true },
                    { label: "USERS LIQUIDITY", value: mmObj.usersLiquidity, icon: Users, bg: "bg-emerald-50", border: "border-emerald-100", iconColor: "text-emerald-500", isCurrency: true },
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
          </div>

          {/* Company Section */}
          {/* <div className="w-full mt-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <div className="bg-gradient-to-br from-blue-500 to-indigo-500 p-2 rounded-lg mr-3">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  Company
                </h3>
                <div className="bg-blue-50 text-blue-600 text-xs font-semibold px-3 py-1 rounded-full">
                  CORPORATE
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  {
                    label: "Buys",
                    value: mmObj.buys,
                    icon: ArrowUpRight,
                    bg: "bg-indigo-50/50",
                    border: "border-indigo-100",
                    iconColor: "text-indigo-500",
                  },
                  {
                    label: "Sells",
                    value: mmObj.sells,
                    icon: ArrowDownRight,
                    bg: "bg-purple-50/50",
                    border: "border-purple-100",
                    iconColor: "text-purple-500",
                  },
                  {
                    label: "Sol Average",
                    value: mmObj.solAverage || mmObj.pooledSolAverage,
                    icon: Coins,
                    bg: "bg-purple-50/50",
                    border: "border-purple-100",
                    iconColor: "text-purple-500",
                  },
                                    {
                    label: "Total Volume",
                    value: mmObj.mmTotalVolume || mmObj.mmtotalVolume,
                    icon: DollarSign,
                    isCurrency: true,
                    bg: "bg-orange-50/50",
                    border: "border-orange-100",
                    iconColor: "text-orange-500",
                  },
                  {
                    label: "Total Transactions",
                    value: mmObj.totalTransactions,
                    icon: BarChart3,
                    isCurrency: true,
                    bg: "bg-green-50/50",
                    border: "border-green-100",
                    iconColor: "text-green-500",
                  },
                  {
                    label: "Gas Fee",
                    value: mmObj.gasFee,
                    icon: Fuel,
                    bg: "bg-blue-50/50",
                    border: "border-blue-100",
                    iconColor: "text-blue-500",
                  },
                  {
                    label: "Gas Fee In Dollars",
                    value: mmObj.gasFeeInDollars,
                    icon: DollarSign,
                    isCurrency: true,
                    bg: "bg-rose-50/50",
                    border: "border-rose-100",
                    iconColor: "text-rose-500",
                  },
                  {
                    label: "MM Ray Fee",
                    value: mmObj.mmRayFee,
                    icon: Zap,
                    bg: "bg-emerald-50/50",
                    border: "border-emerald-100",
                    iconColor: "text-emerald-500",
                  },
                  {
                    label: "LP Add",
                    value: mmObj.lpAdd,
                    icon: Activity,
                    bg: "bg-amber-50/50",
                    border: "border-amber-100",
                    iconColor: "text-amber-500",
                  },
                  {
                    label: "Company's Yield",
                    value: mmObj.companysYeild,
                    icon: Percent,
                    isCurrency: true,
                    bg: "bg-indigo-50/50",
                    border: "border-indigo-100",
                    iconColor: "text-indigo-500",
                  },
                  {
                    label: "Wallet Loss",
                    value: mmObj.walletLoss,
                    icon: TrendingDown,
                    bg: "bg-blue-50/50",
                    border: "border-blue-100",
                    iconColor: "text-blue-500",
                  },
                  {
                    label: "Expected Cost",
                    value: mmObj.ExpectedCost,
                    icon: ShieldCheck,
                    isCurrency: true,
                    bg: "bg-rose-50/50",
                    border: "border-rose-100",
                    iconColor: "text-rose-500",
                  },
                  {
                    label: "Slipage and Loss",
                    value: mmObj.slipageAndloss,
                    icon: TrendingDown,
                    bg: "bg-emerald-50/50",
                    border: "border-emerald-100",
                    iconColor: "text-emerald-500",
                  },
                  {
                    label: "MM Ray Cost",
                    value: mmObj.mmRayCost,
                    icon: Activity,
                    isCurrency: true,
                    bg: "bg-amber-50/50",
                    border: "border-amber-100",
                    iconColor: "text-amber-500",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className={`flex justify-between items-center p-4 ${item.bg} rounded-xl border ${item.border}`}
                  >
                    <div className="flex items-center">
                      <div className="bg-white p-2 rounded-lg shadow-sm mr-3">
                        <item.icon className={`h-4 w-4 ${item.iconColor}`} />
                      </div>
                      <span className="font-medium text-gray-700">
                        {item.label}
                      </span>
                    </div>
                    <span className="font-bold text-gray-900 text-lg">
                      {item.isCurrency ? "$" : ""}
                      {formatNumber(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div> */}
          {/* Cost & Fees Section */}
          <div className="w-full mt-8">
            <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-lg hover:shadow-xl transition-all duration-300">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
                <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 rounded-lg mr-3">
                  <DollarSign className="h-5 w-5 text-white" />
                </div>
                Cost & Fees
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "MM GAS FEE", value: mmObj.gasFeeInDollars, icon: Fuel, bg: "bg-indigo-50", border: "border-indigo-100", iconColor: "text-indigo-500", isCurrency: true },
                  { label: "RAY PLATFORM FEE COST", value: mmObj.mmRayCost, icon: Zap, bg: "bg-rose-50", border: "border-rose-100", iconColor: "text-rose-500", isCurrency: true },
                  { label: "SLIPPAGE + PL COST", value: mmObj.slipageAndloss, icon: TrendingDown, bg: "bg-purple-50", border: "border-purple-100", iconColor: "text-purple-500", isCurrency: true },
                  { label: "CLIENTS REVENUE COST", value: mmObj.clientRevenueCost, icon: User, bg: "bg-green-50", border: "border-green-100", iconColor: "text-green-500", isCurrency: true },
                  { label: "NET COMPANY COST", value: mmObj.netCompanyCost, icon: DollarSign, bg: "bg-orange-50", border: "border-orange-100", iconColor: "text-orange-500", isCurrency: true },
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
};

export default RWAReportModal;
