import { useEffect, useMemo, useState, useRef } from "react";
import { StatCard } from "../components/Cards/StatCard";
import VolumeChart from "../components/Charts/VolumeChart";
import LPAddedChart from "../components/Charts/LPAddedChart";
import VolumeDonutChart from "../components/Charts/VolumeDonutChart";
import LPAddedDonutChart from "../components/Charts/LPAddedDonutChart";
import { ADMIN_API } from "../services/ApiHandlers";
import { ChevronDown } from "lucide-react";

// Custom Select Component for Global Filter
const GlobalTokenSelect = ({ value, onChange, options }) => {
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
    <div ref={selectRef} className="relative w-full sm:w-[200px]">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-semibold bg-white border-2 border-blue-100 rounded-xl hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm"
      >
        <span className="truncate text-gray-700">
          {selectedOption?.label || "Select Token"}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-blue-500 transition-transform duration-300 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-blue-50 rounded-xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-200 max-h-[300px] overflow-y-auto overflow-x-hidden">
          {options.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full px-4 py-2.5 text-sm text-left hover:bg-blue-50 transition-colors first:rounded-t-xl last:rounded-b-xl border-b border-gray-50 last:border-0 ${
                value === option.value
                  ? "bg-blue-50/50 text-blue-600 font-bold"
                  : "text-gray-600"
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

// Map timeframe to API filter type
const getFilterType = (timeframe) => {
  const map = {
    daywise: "day",
    monthly: "month",
    yearly: "year",
  };
  return map[timeframe] || "day";
};

export default function DashboardPage() {
  const [selectedToken, setSelectedToken] = useState("");
  const [timeFrame, setTimeFrame] = useState("daywise");
  const [chartData, setChartData] = useState([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [lastFetchedToken, setLastFetchedToken] = useState("");
  const [lastFetchedTimeFrame, setLastFetchedTimeFrame] = useState("");
  const [dashboardData, setDashboardData] = useState(null);
  const [tokensList, setTokensList] = useState([]);

  const fetchTokensList = async () => {
    try {
      const response = await ADMIN_API.GET_TOKENS();
      console.log(
        "Tokens fetched from /api/v1/main/getActiveTokens:",
        response,
      );
      if (response.data && response.data.data) {
        setTokensList(response.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch tokens list:", error);
    }
  };

  const fetchDashboardData = async (tokenAddress) => {
    if (!tokenAddress) return;
    const token = localStorage.getItem("authToken");

    if (!token) {
      console.log("No auth token found");
      return;
    }
    try {
      const response = await ADMIN_API.TOKEN_REPORTS_TOTAL({ tokenAddress });
      console.log("TOKEN_REPORTS_TOTAL Response", response);

      if (response.data) {
        setDashboardData((prev) => ({
          totals: response.data.totals,
          tokens: response.data.data || prev?.tokens || [],
          tokenCount: response.data.tokenCount || prev?.tokenCount || 0,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  useEffect(() => {
    fetchTokensList();
  }, []);

  // Generate token options from tokensList
  const tokenOptions = useMemo(() => {
    if (!tokensList || !Array.isArray(tokensList)) return [];

    return tokensList.map((token) => ({
      value: token.tokenAddress,
      label: token.name,
    }));
  }, [tokensList]);

  // Set initial selected token when tokenOptions are available
  useEffect(() => {
    if (tokenOptions.length > 0 && !selectedToken) {
      // Try to find IDLEMINe token first
      const idleMineToken = tokenOptions.find(
        (token) => token.label.toLowerCase() === "idlemine",
      );

      // Set IDLEMINe if found, otherwise use first token
      setSelectedToken(
        idleMineToken ? idleMineToken.value : tokenOptions[0].value,
      );
    }
  }, [tokenOptions]);
  // Memoized selected token label to display in header
  const selectedTokenLabel = useMemo(() => {
    const opt = tokenOptions.find((t) => t.value === selectedToken);
    return opt?.label || "";
  }, [tokenOptions, selectedToken]);
  // Fetch data when token changes
  useEffect(() => {
    if (selectedToken) {
      fetchDashboardData(selectedToken);
      const filterType = getFilterType(timeFrame);
      fetchChartData(selectedToken, filterType);
    }
  }, [selectedToken]);

  // Fetch data when timeframe changes
  useEffect(() => {
    if (selectedToken) {
      const filterType = getFilterType(timeFrame);
      fetchChartData(selectedToken, filterType);
    }
  }, [timeFrame]);

  // Fetch filtered reports - optimized to avoid duplicate calls
  const fetchChartData = async (tokenAddress, filterType) => {
    if (!tokenAddress) return;

    // Check if we already have the data for this combination
    if (
      tokenAddress === lastFetchedToken &&
      filterType === getFilterType(lastFetchedTimeFrame)
    ) {
      return;
    }

    setChartLoading(true);
    try {
      const response = await ADMIN_API.GET_FILTERED_REPORTS({
        tokenAddress,
        filterType,
      });

      // console.log("GET_FILTERED_REPORTS Response", response);

      if (response && response.status === 200) {
        // Transform API data to chart format
        const transformedData = response.data.data.map((item) => ({
          month: formatDate(item._id, timeFrame),
          volume: item.totalVolume || 0,
          lpAdd: item.poolRevenue || 0,
          rawData: item,
        }));

        setChartData(transformedData);
        setLastFetchedToken(tokenAddress);
        setLastFetchedTimeFrame(timeFrame);
      }
    } catch (error) {
      console.log("Error in fetchChartData:", error);
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  };

  // Memoize stats to prevent recalculation
  const stats = useMemo(() => {
    if (!dashboardData || !dashboardData.totals) return [];

    const totals = dashboardData.totals;

    return [
      {
        title: "Total Volume",
        value: totals.totalVolume || 0,
        variant: "primary",
      },
      {
        title: "Total Pool Fee",
        value: totals.totalPoolRevenue || 0,
        variant: "blue",
      },
      {
        title: "Total Transactions",
        value: totals.totalTransactions || 0,
        variant: "orange",
      },
      {
        title: "Total Buys",
        value: totals.totalBuys || 0,
        variant: "green",
      },
      {
        title: "Total Sells",
        value: totals.totalSells || 0,
        variant: "red",
      },
    ];
  }, [dashboardData]);

  const isLoading = !dashboardData;

  if (isLoading) {
    return (
      <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
        <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10 mx-auto">
          {/* Header Skeleton */}
          <div className="mb-6">
            <div className="text-center lg:text-left">
              <div className="h-7 bg-gray-200 rounded-lg w-56 mx-auto lg:mx-0 mb-3 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-40 mx-auto lg:mx-0 animate-pulse"></div>
            </div>
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-xl p-4 h-28 border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-8 h-8 bg-gray-300 rounded-xl"></div>
                    <div className="h-3 bg-gray-300 rounded w-16"></div>
                  </div>
                  <div className="h-6 bg-gray-300 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Bar Charts Row Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-xl p-4 h-80 border border-gray-200">
                  <div className="h-5 bg-gray-300 rounded w-1/2 mb-3"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>

          {/* Donut Charts Row Skeleton */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-white rounded-xl p-4 h-80 border border-gray-200">
                  <div className="h-5 bg-gray-300 rounded w-2/3 mb-3"></div>
                  <div className="h-64 bg-gray-200 rounded-xl"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-gradient-to-br from-blue-50 via-white to-purple-50 min-h-screen">
      {/* Simplified background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto">
        {/* Header */}
        <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="text-center lg:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              {selectedTokenLabel ? `${selectedTokenLabel} Analytics` : "Dashboard Analytics"}
            </h1>
            <p className="text-gray-600 text-sm">
              Real-time token and trading insights
            </p>
          </div>

          {/* Global Token Filter */}
          <div className="flex justify-center lg:justify-end">
            <GlobalTokenSelect
              value={selectedToken}
              onChange={setSelectedToken}
              options={tokenOptions}
            />
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="transition-all duration-300 ease-out transform hover:scale-105"
            >
              <StatCard
                title={stat.title}
                value={stat.value}
                variant={stat.variant}
              />
            </div>
          ))}
        </div>

        {/* Bar Charts Row */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-4">
          <VolumeChart
            chartData={chartData}
            loading={chartLoading}
            selectedToken={selectedToken}
            timeFrame={timeFrame}
            onTokenChange={setSelectedToken}
            onTimeFrameChange={setTimeFrame}
            tokenOptions={tokenOptions}
          />
          <LPAddedChart
            chartData={chartData}
            loading={chartLoading}
            selectedToken={selectedToken}
            timeFrame={timeFrame}
            onTokenChange={setSelectedToken}
            onTimeFrameChange={setTimeFrame}
            tokenOptions={tokenOptions}
          />
        </div>

        {/* Donut Charts Row */}
        {/* <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <VolumeDonutChart tokenVolumeData={dashboardData.tokens || []} />
          <LPAddedDonutChart tokenVolumeData={dashboardData.tokens || []} />
        </div> */}
      </div>
    </div>
  );
}
