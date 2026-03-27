import { Coins, Wallet, TrendingUp, DollarSign, Sparkles } from "lucide-react";

const TokenWalletsSummary = ({ tokenSummaries = [] }) => {
  console.log("tokenSummaries in TokenWalletsSummary:", tokenSummaries);

  // Pull the single summary record we actually need
  const s = tokenSummaries?.[0] ?? null;

  // Guarded numeric helpers
  const n = (v, d = 2) =>
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: d,
      maximumFractionDigits: d,
    }).format(Number.isFinite(+v) ? +v : 0);

  const nLarge = (v) => {
    const x = Number.isFinite(+v) ? +v : 0;
    if (x >= 1_000_000) return (x / 1_000_000).toFixed(2) + "M";
    if (x >= 1_000) return (x / 1_000).toFixed(2) + "K";
    return n(x, 0);
  };

  // Build summary directly from tokenSummaries + wallets length
  const summary = {
    totalIdleTokens: s?.valueInTokens ?? 0, // token count (IdleMine)
    totalSolBalance: s?.solValue ?? 0, // SOL amount
    totalPortfolioValue: s?.total_value ?? 0, // USD
    totalWallets: s?.totalWallets ?? 0, // count
    totalIdleTokensValue: s?.valueInUSD ?? 0, // USD
    totalSolBalanceValue: s?.solValueInUSD ?? 0, // USD
  };

  const cards = [
    {
      title: "Total Tokens",
      value: nLarge(summary.totalIdleTokens),
      usdtValue: `$${n(summary.totalIdleTokensValue)}`,
      icon: Coins,
      gradient: "from-amber-400 to-orange-500",
      bgGradient: "from-amber-50/80 to-orange-50/60",
      borderColor: "border-amber-200/50",
      glowColor: "bg-amber-400/20",
    },
    {
      title: "Total SOL",
      value: n(summary.totalSolBalance, 4),
      suffix: " SOL",
      usdtValue: `$${n(summary.totalSolBalanceValue)}`,
      icon: TrendingUp,
      gradient: "from-purple-400 to-indigo-500",
      bgGradient: "from-purple-50/80 to-indigo-50/60",
      borderColor: "border-purple-200/50",
      glowColor: "bg-purple-400/20",
    },
    {
      title: "Total Value",
      value: `$${n(summary.totalPortfolioValue)}`,
      icon: DollarSign,
      gradient: "from-emerald-400 to-green-500",
      bgGradient: "from-emerald-50/80 to-green-50/60",
      borderColor: "border-emerald-200/50",
      glowColor: "bg-emerald-400/20",
    },
    {
      title: "Total Wallets",
      value: nLarge(summary.totalWallets),
      icon: Wallet,
      gradient: "from-blue-400 to-purple-500",
      bgGradient: "from-blue-50/80 to-purple-50/60",
      borderColor: "border-blue-200/50",
      glowColor: "bg-blue-400/20",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-5 mb-8">
      {cards.map((card, i) => (
        <div
          key={i}
          className="relative group cursor-pointer transform transition-all duration-500 hover:scale-[1.02] h-full"
        >
          {/* Glow */}
          <div
            className={`absolute inset-0 ${card.glowColor} rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-0 group-hover:opacity-100`}
          />
          {/* Card */}
          <div
            className={`relative bg-gradient-to-br ${card.bgGradient} backdrop-blur-2xl rounded-2xl border ${card.borderColor} shadow-2xl shadow-black/5 p-6 overflow-hidden transition-all duration-500 hover:shadow-3xl hover:shadow-black/10 h-full flex flex-col`}
          >
            {/* Background blob */}
            <div className="absolute top-0 right-0 w-32 h-32 -translate-y-16 translate-x-16 opacity-10">
              <div
                className={`w-full h-full bg-gradient-to-br ${card.gradient} rounded-full`}
              />
            </div>

            {/* Header - Fixed height */}
            <div className="flex items-center justify-between mb-6 relative z-10 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg shadow-black/20 group-hover:scale-110 transition-transform duration-300`}
                >
                  <card.icon size={20} className="text-white" />
                </div>
                <p className="text-sm font-semibold text-gray-600 uppercase tracking-wider">
                  {card.title}
                </p>
              </div>
              <Sparkles
                size={16}
                className="text-gray-400 group-hover:text-yellow-500 transition-colors"
              />
            </div>

            {/* Main content - Grow to fill available space */}
            <div className="flex-grow flex flex-col justify-between relative z-10">
              <div>
                {/* Main value */}
                <div className="mb-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                      {card.value}
                    </span>
                    {card.suffix && (
                      <span className="text-sm font-medium text-gray-500">
                        {card.suffix}
                      </span>
                    )}
                  </div>
                </div>

                {/* Sub row (USD / subtitle) */}
                <div className="mb-4">
                  {(card.title === "Total Tokens" ||
                    card.title === "Total SOL") && (
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-green-700">
                        {card.usdtValue}
                      </span>
                    </div>
                  )}
                  {card.title === "Total Wallets" && (
                    <div className="flex items-center gap-2 min-h-[28px]">
                      <span className="text-sm font-medium text-gray-500">
                        {card.subtitle}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer note - Fixed at bottom */}
              <div className="text-xs text-gray-400 font-medium mt-auto pt-4">
                All wallets included
              </div>
            </div>

            {/* Hover border tint */}
            <div
              className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TokenWalletsSummary;
