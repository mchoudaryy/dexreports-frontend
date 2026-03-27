import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  DollarSign,
  BarChart3,
  Coins,
  CreditCard,
  ShoppingBag,
} from "lucide-react";

// Updated color schemes to match Home and WalletPage style
const colorSchemes = {
  primary: {
    gradient: "from-purple-500 to-pink-600",
    overlay: "from-purple-500/5 to-pink-500/5",
    accent: "text-purple-600",
    bg: "bg-purple-50/60",
    iconBg: "bg-gradient-to-br from-purple-500 to-pink-600",
  },
  blue: {
    gradient: "from-blue-500 to-cyan-600",
    overlay: "from-blue-500/5 to-cyan-500/5",
    accent: "text-blue-600",
    bg: "bg-blue-50/60",
    iconBg: "bg-gradient-to-br from-blue-500 to-cyan-600",
  },
  green: {
    gradient: "from-emerald-500 to-green-600",
    overlay: "from-emerald-500/5 to-green-500/5",
    accent: "text-emerald-600",
    bg: "bg-emerald-50/60",
    iconBg: "bg-gradient-to-br from-emerald-500 to-green-600",
  },
  orange: {
    gradient: "from-amber-500 to-orange-600",
    overlay: "from-amber-500/5 to-orange-500/5",
    accent: "text-amber-600",
    bg: "bg-amber-50/60",
    iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
  },
  red: {
    gradient: "from-rose-500 to-red-600",
    overlay: "from-rose-500/5 to-red-500/5",
    accent: "text-rose-600",
    bg: "bg-rose-50/60",
    iconBg: "bg-gradient-to-br from-rose-500 to-red-600",
  },
};

// Updated icon mapping for new card types
const iconMap = {
  "Total Volume": DollarSign,
  "Total Pool Fee": BarChart3,
  "Total Tokens": Coins,
  "Total Transactions": CreditCard,
  "Total Buys": ShoppingBag,
  "Total Sells": ShoppingBag,
};

export function StatCard({ title, value, variant = "blue" }) {
  const IconComponent = iconMap[title] || TrendingUp;
  const colors = colorSchemes[variant] || colorSchemes.blue;

  const formatValue = (val) => {
    const isCount = ["Total Transactions", "Total Buys", "Total Sells"].includes(title);
    
    const formattedVal = (() => {
      if (Math.abs(val) >= 1000000000) {
        return `${(val / 1000000000).toFixed(2)}B`;
      }
      if (Math.abs(val) >= 1000000) {
        return `${(val / 1000000).toFixed(2)}M`;
      }
      if (Math.abs(val) >= 1000) {
        return `${(val / 1000).toFixed(2)}K`;
      }
      return val.toFixed(0);
    })();

    return isCount ? formattedVal : `$${formattedVal}`;
  };

  return (
    <div
      className={`
        group relative overflow-hidden rounded-3xl p-6 sm:p-7 md:p-8
        transition-all duration-500 ease-out
        hover:scale-105 hover:shadow-3xl
        bg-white/70 backdrop-blur-xl
        border border-white/40
        shadow-2xl
        cursor-pointer
        h-full
      `}
    >
      {/* Gradient Overlay */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${colors.overlay} rounded-3xl`}
      ></div>

      {/* Animated Background Elements */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700">
        <div className="absolute top-0 left-0 w-32 h-32 bg-white/50 rounded-full blur-2xl animate-pulse"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-white/30 rounded-full blur-xl animate-pulse delay-300"></div>
      </div>

      {/* Shimmer Effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

      <div className="relative z-10 h-full flex flex-col">
        {/* Header Section */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className={`
                p-3 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-12
                ${colors.iconBg}
                shadow-lg
              `}
            >
              <IconComponent className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3
                className={`
                  text-base font-semibold leading-tight text-balance
                  text-gray-900
                `}
              >
                {title}
              </h3>
            </div>
          </div>
        </div>

        {/* Main Value Section */}
        <div className="mb-4 flex-grow">
          <p
            className={`
              text-2xl sm:text-3xl md:text-4xl font-black tracking-tight
              text-gray-900
              transition-all duration-500 group-hover:translate-x-2
              leading-tight
            `}
          >
            {formatValue(value)}
          </p>
        </div>
      </div>

      {/* Corner Accents */}
      <div className="absolute top-0 right-0 w-12 h-12 bg-white/60 rounded-bl-3xl transition-all duration-500 group-hover:bg-white/80"></div>
      <div className="absolute bottom-0 left-0 w-8 h-8 bg-white/40 rounded-tr-3xl transition-all duration-500 group-hover:bg-white/60"></div>
    </div>
  );
}
