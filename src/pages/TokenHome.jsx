import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  BarChart3,
  Wallet,
  Users,
  ChevronLeft,
  RefreshCw,
  Clock,
  Loader,
  Copy,
} from "lucide-react";
import { ADMIN_API } from "../services/ApiHandlers";

// Import the new components
import TokenAnalytics from "./TokenAnalytics";
import TokenHolders from "./TokenHolders";
import toast from "react-hot-toast";

const TokenHome = () => {
  const { networkId, tokenId, platformId, tokenAddress } = useParams();
  const navigate = useNavigate();

  const [activeMainTab, setActiveMainTab] = useState("analytics");
  const [tokenInfo, setTokenInfo] = useState(null);
  const [liveTokenData, setLiveTokenData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [totalsData, setTotalsData] = useState(null);

  // Timeframe state for analytics
  const [activeTimeframeTab, setActiveTimeframeTab] = useState("Overall");
  const timeframeTabs = ["Overall", "24h", "6h", "1h", "5m"];

  // Fetch token reports total
  const fetchTokenReportsTotal = async (tokenAddress) => {
    if (!tokenAddress) return null;
    try {
      const response = await ADMIN_API.TOKEN_REPORTS_TOTAL({ tokenAddress });
      const totals = response.data.totals;
      console.log("RESPONSE TOKEN_REPORTS_TOTAL", response);
      
      setTotalsData(totals);
      return totals;
    } catch (error) {
      console.log("Error in fetchTokenReportsTotal:", error);
      return null;
    }
  };

  // Fetch live token data
  const fetchLiveTokenDataForAll = useCallback(
    async (chainId, tokenAddress) => {
      try {
        const response = await ADMIN_API.GET_LIVE_TOKEN_DATA({
          chainId: chainId,
          tokenAddress: tokenAddress,
        });

        if (
          (response.data.data && response.data.data[0]) ||
          response.data.lpAdd
        ) {
          const liveData =
            response.data.data && response.data.data[0]
              ? response.data.data[0]
              : {};
          const lpAdd = response.data.lpAdd || 0;
          setLiveTokenData(liveData);
          setLastRefreshTime(new Date());
          return { liveData, lpAdd };
        }
      } catch (error) {
        console.log("Error fetching live token data:", error);
      }
      return { liveData: null, lpAdd: 0 };
    },
    []
  );

  // Main token data fetch function
  const fetchTokens = async () => {
    try {
      setLoading(true);

      if (!tokenAddress) {
        console.error("No token address in URL params");
        setLoading(false);
        return;
      }

      const response = await ADMIN_API.GET_TOKENS({
        platformId: platformId,
        networkId: networkId,
        tokenId: tokenId,
        tokenAddress: tokenAddress,
      });

      console.log("GET_TOKENS response:", response);
      

      const tokenData = response.data.data;
      if (!tokenData) {
        console.error("No token data received");
        setLoading(false);
        return;
      }

      setTokenInfo(tokenData);

      // Fetch both totals and live data
      const [totals, liveDataResult] = await Promise.all([
        fetchTokenReportsTotal(tokenAddress),
        fetchLiveTokenDataForAll(tokenData?.chainId, tokenAddress),
      ]);

      console.log("All data loaded successfully");
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tokens:", error);
      setLoading(false);
    }
  };

  // Function to refresh data
  const refreshData = useCallback(async () => {
    if (!tokenAddress) return;

    setIsRefreshing(true);
    try {
      if (activeTimeframeTab === "Overall") {
        // For Overall tab, refresh the totals data
        await fetchTokenReportsTotal(tokenAddress);
      } else {
        // For other timeframes, refresh live data
        if (tokenInfo?.chainId) {
          await fetchLiveTokenDataForAll(tokenInfo.chainId, tokenAddress);
        }
      }
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [tokenAddress, tokenInfo, activeTimeframeTab, fetchLiveTokenDataForAll]);

  // Handle tab change
  const handleMainTabChange = (tab) => {
    setActiveMainTab(tab);
  };

  // Handle timeframe tab change
  const handleTimeframeTabChange = (tab) => {
    setActiveTimeframeTab(tab);
  };

  // Format last refresh time
  const formatLastRefreshTime = () => {
    if (!lastRefreshTime) return "Never";
    return lastRefreshTime.toLocaleTimeString();
  };

  // Effects
  useEffect(() => {
    fetchTokens();
  }, [networkId, platformId, tokenId]);

  // Set up automatic refresh every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(intervalId);
  }, [refreshData]);

  const handleCopy = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      toast.success("Token address copied");
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading token data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 md:p-8">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-50 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-50 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:text-gray-900 transition-all duration-300 bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md hover:scale-105 group"
          >
            <ChevronLeft
              size={20}
              className="group-hover:-translate-x-1 transition-transform"
            />
            <span className="font-semibold">Back to Tokens</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-gray-200 shadow-sm">
              <Clock size={16} className="text-gray-500" />
              <span className="text-sm text-gray-600">
                Last updated: {formatLastRefreshTime()}
              </span>
            </div>
            <button
              onClick={refreshData}
              disabled={isRefreshing}
              className="flex items-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-2xl hover:bg-blue-600 disabled:opacity-50 transition-all duration-300 shadow-sm hover:shadow-md"
            >
              <RefreshCw
                size={16}
                className={isRefreshing ? "animate-spin" : ""}
              />
              <span className="font-medium">
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </span>
            </button>
          </div>
        </div>

        {/* Token Header */}
        <div className="bg-white rounded-3xl border border-gray-200 shadow-sm p-8 mb-8">
          <div className="flex items-center gap-6">
            {/* Token Logo */}
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ring-2 ring-white overflow-hidden bg-transparent">
              {liveTokenData?.info?.imageUrl ? (
                <img
                  src={liveTokenData.info.imageUrl}
                  alt={liveTokenData.baseToken?.name}
                  className="w-full h-full rounded-2xl object-cover"
                />
              ) : (
                <div className="text-gray-400 font-bold text-2xl">
                  {liveTokenData?.baseToken?.symbol?.charAt(0) || "T"}
                </div>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {liveTokenData?.baseToken?.name || tokenInfo?.name}
              </h1>
              <div className="flex items-center gap-4 flex-wrap">
                <span className="text-lg text-gray-600 font-medium">
                  {liveTokenData?.baseToken?.symbol || tokenInfo?.symbol}
                </span>
                <div className="px-3 py-1 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-full text-sm font-medium">
                  {liveTokenData?.dexId || "Unknown DEX"}
                </div>
                <div
                  onClick={() => handleCopy(tokenAddress)}
                  className="flex items-center gap-2 text-sm text-gray-500 font-mono bg-gray-100 px-3 py-1 rounded-lg cursor-pointer hover:bg-gray-200 transition-all"
                  title="Click to copy address"
                >
                  <span>
                    {tokenAddress?.slice(0, 8)}...{tokenAddress?.slice(-6)}
                  </span>
                  <Copy
                    size={14}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Combined Main Tabs and Timeframe Tabs */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
          {/* Main Tabs */}
          <div className="flex gap-2">
            {[
              {
                id: "analytics",
                label: "Analytics",
                icon: BarChart3,
                color: "from-blue-500 to-cyan-500",
              },
              // {
              //   id: "wallets",
              //   label: "Wallets",
              //   icon: Wallet,
              //   color: "from-purple-500 to-pink-500",
              // },
              {
                id: "tokenHolders",
                label: "Token Holders",
                icon: Users,
                color: "from-yellow-500 to-orange-500",
              },
            ].map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleMainTabChange(tab.id)}
                  className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-semibold transition-all duration-300 ${
                    activeMainTab === tab.id
                      ? `bg-gradient-to-r ${tab.color} text-white shadow-md`
                      : "text-gray-600 hover:text-gray-900 bg-white hover:bg-gray-50 border border-gray-200"
                  }`}
                >
                  <IconComponent size={20} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Timeframe Tabs - Only show when Analytics tab is active */}
          {activeMainTab === "analytics" && (
            <div className="flex gap-2">
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-1">
                <div className="flex flex-wrap gap-1">
                  {timeframeTabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => handleTimeframeTabChange(tab)}
                      className={`px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                        activeTimeframeTab === tab
                          ? "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md"
                          : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Render Active Tab Content */}
        {activeMainTab === "analytics" && (
          <TokenAnalytics
            tokenAddress={tokenAddress}
            networkId={networkId}
            tokenInfo={tokenInfo}
            liveTokenData={liveTokenData}
            lastRefreshTime={lastRefreshTime}
            isRefreshing={isRefreshing}
            onRefresh={refreshData}
            activeTimeframeTab={activeTimeframeTab}
            onTimeframeChange={handleTimeframeTabChange}
            totalsData={totalsData}
          />
        )}

        {/* {activeMainTab === "wallets" && (
          <TokenWallets
            tokenId={tokenId}
            tokenAddress={tokenAddress}
            networkId={networkId}
            platformId={platformId}
          />
        )} */}

        {activeMainTab === "tokenHolders" && (
          <TokenHolders
            tokenAddress={tokenAddress}
            tokenInfo={tokenInfo}
            liveTokenData={liveTokenData}
          />
        )}
      </div>
    </div>
  );
};

export default TokenHome;
