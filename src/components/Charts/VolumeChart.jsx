import { useState, useMemo, useRef, useEffect } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Cell,
} from "recharts";
import { ChevronDown } from "lucide-react";

// Function to format date based on timeframe
const formatDate = (id, timeframe) => {
  if (timeframe === "daywise") {
    const dateStr = id.toString();
    const year = dateStr.substring(0, 4);
    const month = dateStr.substring(4, 6);
    const day = dateStr.substring(6, 8);
    return `${day}/${month}/${year}`;
  } else if (timeframe === "monthly") {
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    return `${monthNames[parseInt(id.month) - 1]} ${id.year}`;
  } else if (timeframe === "yearly") {
    return id.toString();
  }
  return id;
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 animate-in fade-in-0 zoom-in-95 duration-200">
        <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div
            key={index}
            className="flex items-center justify-between gap-4 text-sm"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-gray-600 capitalize">{entry.dataKey}:</span>
            </div>
            <span className="font-semibold text-gray-900">
              $
              {entry.value.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Card = ({ children, className = "" }) => {
  return (
    <div
      className={`bg-white rounded-xl border border-gray-200 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
};

const Select = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((option) => option.value === value);

  return (
    <div ref={selectRef} className="relative w-full sm:w-[140px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
      >
        <span className="capitalize">{selectedOption?.label || value}</span>
        <ChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg animate-in fade-in-0 zoom-in-95 duration-200">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-3 py-2 text-sm text-left hover:bg-gray-100 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                value === option.value
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : ""
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default function VolumeChart({
  chartData,
  loading,
  selectedToken,
  timeFrame,
  onTokenChange,
  onTimeFrameChange,
  tokenOptions,
}) {
  const [hoveredBar, setHoveredBar] = useState(null);
  const scrollContainerRef = useRef(null);

  const colors = {
    volume: {
      primary: "#4F46E5",
      hover: "#4338CA",
      light: "#6366F1",
    },
    grid: "#E5E7EB",
    text: {
      primary: "#111827",
      secondary: "#6B7280",
    },
  };

  const totalVolume = useMemo(
    () => chartData.reduce((sum, item) => sum + item.volume, 0),
    [chartData]
  );

  const maxValue = useMemo(() => {
    if (chartData.length === 0) return 1000;
    const maxVolume = Math.max(...chartData.map((item) => item.volume));
    return Math.ceil(maxVolume / 1000) * 1000;
  }, [chartData]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || timeFrame === "yearly") return;

    const handleWheel = (e) => {
      e.preventDefault();
      container.scrollLeft += e.deltaY;
    };

    container.addEventListener("wheel", handleWheel, { passive: false });

    setTimeout(() => {
      if (container) {
        container.scrollLeft = container.scrollWidth - container.clientWidth;
      }
    }, 100);

    return () => container.removeEventListener("wheel", handleWheel);
  }, [timeFrame, selectedToken, chartData]);

  const timeFrameOptions = [
    { value: "daywise", label: "day" },
    { value: "monthly", label: "month" },
    { value: "yearly", label: "year" },
  ];

  return (
    <Card className="w-full p-4 h-full">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
        <h2 className="text-lg sm:text-xl font-bold text-gray-900">
          Volume
        </h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select
            value={selectedToken}
            onChange={onTokenChange}
            options={tokenOptions}
          />
          <Select
            value={timeFrame}
            onChange={onTimeFrameChange}
            options={timeFrameOptions}
          />
        </div>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {/* <div
          className="w-4 h-4 rounded-sm"
          style={{ backgroundColor: colors.volume.primary }}
        />
        <span className="text-sm text-gray-600 font-medium">Total Volume:</span>
        <span className="text-sm font-bold text-gray-900">
          $
          {totalVolume.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </span> */}
      </div>

      {loading ? (
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-500 text-sm">Loading chart data...</div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="h-80 flex items-center justify-center">
          <div className="text-gray-500 text-sm">
            No data available for the selected filters
          </div>
        </div>
      ) : (
        <div className="relative flex gap-0">
          <div
            ref={scrollContainerRef}
            className={`flex-1 h-80 ${
              timeFrame !== "yearly"
                ? "overflow-x-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400"
                : ""
            }`}
            style={{
              scrollBehavior: "smooth",
            }}
          >
            <div
              style={{
                width:
                  timeFrame !== "yearly"
                    ? `${Math.max(chartData.length * 80, 800)}px`
                    : "100%",
                height: "100%",
                minWidth: "100%",
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{ top: 15, right: 5, left: 15, bottom: 20 }}
                  barGap={4}
                  barCategoryGap="8%"
                >
                  <CartesianGrid
                    strokeDasharray="2 2"
                    stroke={colors.grid}
                    opacity={0.4}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{
                      fill: colors.text.secondary,
                      fontSize: timeFrame === "daywise" ? 10 : 11,
                      fontWeight: 500,
                    }}
                    dy={10}
                    interval={(index) => index % 2 === 0}
                  />
                  <YAxis hide domain={[0, maxValue]} />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{
                      fill: "#f8fafc",
                      opacity: 0.3,
                      radius: 4,
                    }}
                  />
                  <Bar
                    dataKey="volume"
                    fill={colors.volume.primary}
                    radius={[4, 4, 0, 0]}
                    maxBarSize={50}
                    onMouseEnter={() => setHoveredBar("volume")}
                    onMouseLeave={() => setHoveredBar(null)}
                    animationDuration={600}
                    animationBegin={0}
                  >
                    {chartData.map((entry, index) => (
                      <Cell
                        key={`cell-volume-${index}`}
                        fill={
                          hoveredBar === "volume"
                            ? colors.volume.hover
                            : colors.volume.primary
                        }
                        opacity={
                          hoveredBar === null || hoveredBar === "volume"
                            ? 1
                            : 0.5
                        }
                        style={{
                          transition: "all 0.2s ease-in-out",
                        }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="w-12 h-80 flex flex-col justify-between py-4 pr-2">
            {Array.from({ length: 5 }, (_, i) => {
              const value = maxValue - (maxValue / 4) * i;
              return (
                <div
                  key={i}
                  className="text-right text-xs text-gray-600 font-semibold"
                >
                  {value >= 1000
                    ? `${(value / 1000).toFixed(0)}k`
                    : value.toLocaleString()}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {timeFrame !== "yearly" && chartData.length > 0 && (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-500 flex items-center justify-center gap-1">
            <span className="inline-block w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
            Scroll horizontally to view more data
          </p>
        </div>
      )}
    </Card>
  );
}
