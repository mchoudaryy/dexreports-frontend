import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useState } from "react";

export default function VolumeDonutChart({ tokenVolumeData }) {
  const [activeIndex, setActiveIndex] = useState(null);

  // Dynamic color generator
  const generateColors = (count) => {
    const baseColors = [
      "#4F46E5",
      "#10b981",
      "#f59e0b",
      "#ef4444",
      "#8b5cf6",
      "#06b6d4",
      "#ec4899",
      "#84cc16",
      "#f97316",
      "#6366f1",
    ];

    if (count <= baseColors.length) {
      return baseColors.slice(0, count);
    }

    const additionalColors = [];
    for (let i = baseColors.length; i < count; i++) {
      const hue = (i * 137.5) % 360;
      additionalColors.push(`hsl(${hue}, 70%, 60%)`);
    }

    return [...baseColors, ...additionalColors];
  };

  // Format numbers with K, M, B suffixes
  const formatNumber = (value) => {
    if (value >= 1000000000) {
      return "$" + (value / 1000000000).toFixed(1) + "B";
    } else if (value >= 1000000) {
      return "$" + (value / 1000000).toFixed(1) + "M";
    } else if (value >= 1000) {
      return "$" + (value / 1000).toFixed(1) + "K";
    } else {
      return "$" + value.toFixed(0);
    }
  };

  // Format currency for tooltip (full amount)
  const formatCurrency = (value) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    }).format(value);

  // Process dynamic data
  const processTokenData = () => {
    if (!tokenVolumeData || tokenVolumeData.length === 0) {
      return {
        sortedData: [],
        visibleTokens: [],
        others: [],
        othersTotal: 0,
        totalVolume: 0,
      };
    }

    const sortedData = [...tokenVolumeData].sort(
      (a, b) => b.totalVolume - a.totalVolume
    );

    const visibleTokens = sortedData.slice(0, 4); // Show top 4 for better UI
    const others = sortedData.slice(4);
    const othersTotal = others.reduce((sum, t) => sum + t.totalVolume, 0);
    const totalVolume = sortedData.reduce((sum, t) => sum + t.totalVolume, 0);

    return {
      sortedData,
      visibleTokens,
      others,
      othersTotal,
      totalVolume,
    };
  };

  const { sortedData, visibleTokens, others, othersTotal, totalVolume } =
    processTokenData();

  const colors = generateColors(
    visibleTokens.length + (others.length > 0 ? 1 : 0)
  );

  const chartData = [
    ...visibleTokens.map((t, i) => ({
      name: t.tokenName,
      value: t.totalVolume,
      color: colors[i],
    })),
    ...(others.length > 0
      ? [
          {
            name: "Others",
            value: othersTotal,
            color: colors[visibleTokens.length],
          },
        ]
      : []),
  ];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const percentage = totalVolume > 0 ? (data.value / totalVolume) * 100 : 0;

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[160px]">
          <div className="flex items-center gap-2 mb-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: data.color }}
            />
            <p className="font-semibold text-gray-900 text-sm">{data.name}</p>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-bold text-gray-900">
              {formatCurrency(data.value)}
            </p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-600">Percentage</span>
              <span className="text-xs font-semibold text-gray-900">
                {percentage.toFixed(1)}%
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
              <div
                className="h-1.5 rounded-full bg-gray-400 transition-all duration-300 ease-out"
                style={{
                  width: `${percentage}%`,
                }}
              ></div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const onPieEnter = (data, index) => {
    setActiveIndex(index);
  };

  const onPieLeave = () => {
    setActiveIndex(null);
  };

  if (!tokenVolumeData || tokenVolumeData.length === 0) {
    return (
      <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-4 h-full">
        <div className="text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Volume Distribution
          </h2>
          <p className="text-gray-500 text-sm">No token data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-white rounded-xl border border-gray-200 shadow-sm p-4 h-full">
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Volume Distribution</h2>
        <p className="text-gray-500 text-sm mt-1">By token allocation</p>
      </div>

      <div className="flex flex-col lg:flex-row items-center gap-4">
        {/* Donut Chart */}
        <div className="relative w-40 h-40 lg:w-48 lg:h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius="60%"
                outerRadius={activeIndex !== null ? "90%" : "85%"}
                dataKey="value"
                startAngle={90}
                endAngle={450}
                paddingAngle={1}
                onMouseEnter={onPieEnter}
                onMouseLeave={onPieLeave}
              >
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#ffffff"
                    strokeWidth={activeIndex === index ? 3 : 2}
                    className="transition-all duration-200 ease-out cursor-pointer"
                    style={{
                      outline: "none",
                      filter:
                        activeIndex === index
                          ? "brightness(1.1)"
                          : "brightness(1)",
                      transform:
                        activeIndex === index ? "scale(1.05)" : "scale(1)",
                      transformOrigin: "center center",
                    }}
                  />
                ))}
              </Pie>
              <Tooltip
                content={<CustomTooltip />}
                wrapperStyle={{
                  zIndex: 1000,
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <div className="text-center">
              <p className="text-xs font-medium text-gray-500 mb-1">Total</p>
              <p className="text-lg font-bold text-gray-900">
                {formatNumber(totalVolume)}
              </p>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex-1 space-y-2 min-w-0">
          {chartData.map((item, index) => {
            const percentage =
              totalVolume > 0 ? (item.value / totalVolume) * 100 : 0;
            return (
              <div key={item.name} className="group relative">
                <div className="relative flex items-center justify-between rounded-lg p-2 bg-gray-50 border border-gray-200/60 group-hover:bg-gray-100 transition-all duration-200">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="relative">
                      <div
                        className="w-3 h-3 rounded-full border border-white/80 transition-all duration-200 group-hover:scale-110"
                        style={{ backgroundColor: item.color }}
                      />
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="font-medium text-gray-800 text-sm truncate">
                        {item.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="ml-2">
                    <span className="font-semibold text-gray-900 text-sm whitespace-nowrap">
                      {formatNumber(item.value)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
