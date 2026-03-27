// import { useState, useMemo, useEffect, useCallback, useRef } from "react";
// import {
//   TrendingUp,
//   ChevronDown,
//   RefreshCw,
//   Loader,
//   BarChart3,
//   ArrowRight,
//   FileText,
//   Eye,
// } from "lucide-react";
// import { useNavigate, useParams, useSearchParams } from "react-router-dom";
// import { ADMIN_API } from "../services/ApiHandlers";
// import TableRowModal from "./TableRowModal";
// import { useAuth } from "../context/useAuth";

// const PoolTable = () => {
//   const { user } = useAuth();
//   const initialTab = user?.role === "superuser" ? "Pools" : "Reports";
//   const [currentPage, setCurrentPage] = useState(1);
//   const [rowsPerPage, setRowsPerPage] = useState(initialTab === "Pools" ? 20 : 10);
//   const [sortConfig, setSortConfig] = useState({
//     key: "volume24h",
//     direction: "desc",
//   });
//   const [loading, setLoading] = useState(false);
//   const [poolsTotalPages, setPoolsTotalPages] = useState(1);
//   const [poolsTotalCount, setPoolsTotalCount] = useState(0);
//   const [selectedPoolToken, setSelectedPoolToken] = useState(null);
//   const navigate = useNavigate();
//   const [pooledTokensData, setPooledTokensData] = useState([]);
//   const [liquidityPools, setLiquidityPools] = useState([]);
//   const [livePoolData, setLivePoolData] = useState({});
//   const [activeTab, setActiveTab] = useState(initialTab);
//   const [reportsSubTab, setReportsSubTab] = useState("cpmm");
//   const [poolsSubTab, setPoolsSubTab] = useState("cpmm");
//   const [reportsData, setReportsData] = useState([]);
//   const [reportsLoading, setReportsLoading] = useState(false);
//   const [reportsTotalPages, setReportsTotalPages] = useState(1);
//   const [reportsTotalCount, setReportsTotalCount] = useState(0);
//   const [searchParams] = useSearchParams();
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedRowData, setSelectedRowData] = useState(null);
//   // const networkId = searchParams.get("network");

//   // Get networkId from localStorage instead of URL params
//   const networkId = localStorage.getItem("RaydiumNetworkId");

//   // Refs to prevent duplicate API calls
//   const isFetchingPools = useRef(false);
//   const isFetchingTokens = useRef(false);
//   const isFetchingLiveData = useRef(false);
//   const isFetchingDailyPoolReportsAggregates = useRef(false);

//   // GET_LIQUIDITY_POOLS (server-side pagination)
//   const fetchLiquidityPools = async (
//     tokenAddress,
//     page = currentPage,
//     limit = rowsPerPage
//   ) => {
//     if (!tokenAddress) return;

//     // Prevent duplicate calls
//     if (isFetchingPools.current) {
//       return;
//     }

//     try {
//       isFetchingPools.current = true;
//       setLoading(true);

//       // Determine poolType filter based on poolsSubTab
//       let poolTypeFilter = "cpmm"; // Default
//       if (poolsSubTab === "clmm") {
//         poolTypeFilter = "clmm";
//       } else if (poolsSubTab === "cpmm") {
//         poolTypeFilter = "cpmm";
//       }

//       // For "cpmm" or "clmm" filters, use single API call
//       // Construct full API URL with query parameters
//       const baseURL = import.meta.env.VITE_API_URL;
//       const endpoint = "/api/v1/main/getLiquidityPools";
//       const queryParams = new URLSearchParams({
//         tokenAddress,
//         page: page.toString(),
//         limit: limit.toString(),
//         poolType: poolTypeFilter,
//       });
//       const fullUrl = `${baseURL}${endpoint}?${queryParams.toString()}`;

//       // Log API endpoint information
//       console.log("===========================================");
//       console.log("📊 FETCHING LIQUIDITY POOLS DATA");
//       console.log("===========================================");
//       console.log("API Endpoint:", endpoint);
//       console.log("Full URL:", fullUrl);
//       console.log("Query Parameters:", {
//         tokenAddress,
//         page,
//         limit,
//         poolType: poolTypeFilter,
//       });
//       console.log("===========================================");

//       const response = await ADMIN_API.GET_LIQUIDITY_POOLS({
//         tokenAddress,
//         page,
//         limit,
//         poolType: poolTypeFilter,
//       });

//       if (response && response.status === 200) {
//         // Display response data formatted as JSON
//         console.log("✅ API Response Status:", response.status);
//         console.log(
//           "📦 API Response Data:",
//           JSON.stringify(response.data, null, 2)
//         );
//         console.log("===========================================");
//         const pools = response?.data?.data || [];
//         const apiTotal = response?.data?.total ?? 0;
//         const apiLimit = response?.data?.limit ?? rowsPerPage;
//         // Calculate total pages from total and limit
//         const apiTotalPages =
//           apiTotal > 0 ? Math.ceil(apiTotal / apiLimit) : 1;
//         setPoolsTotalPages(apiTotalPages);
//         setPoolsTotalCount(apiTotal);

//         // Transform the API data to match our table structure
//         const transformedPools = pools.map((pool, index) => ({
//           id: pool._id,
//           name: pool.name,
//           symbol: pool.symbol,
//           liquidity: 0, // Will be updated from live data
//           liquidityAmount: 0, // Will be updated from live data
//           volume24h: 0, // Will be updated from live data
//           fees24h: 0, // Will be updated from live data
//           apr24h: 0, // Will be updated from live data
//           color: getRandomGradientColor(index),
//           gradient: getGradientStyle(index),
//           platform: "raydium", // Default platform
//           holders: 0,
//           age: calculateAge(pool.createdAt),
//           poolAddress: pool.pairAddress,
//           pairAddress: pool.pairAddress,
//           tokenAddress: pool.tokenAddress,
//           rwaAddress: pool.address,
//           poolType: pool.poolType || pool.pool_type || null, // Add poolType from API response
//         }));

//         setLiquidityPools(transformedPools);

//         // Fetch live data for each pool
//         if (transformedPools.length > 0) {
//           fetchLivePoolData(transformedPools, tokenAddress);
//         }
//       }
//     } catch (error) {
//       setLiquidityPools([]);
//     } finally {
//       setLoading(false);
//       isFetchingPools.current = false;
//     }
//   };

//   // Fetch live pool data from GET_LIVE_POOLS_DATA API
//   const fetchLivePoolData = async (pools, tokenAddress) => {
//     // Prevent duplicate calls
//     if (isFetchingLiveData.current) {
//       return;
//     }

//     try {
//       isFetchingLiveData.current = true;

//       console.log("===========================================");
//       console.log("📈 FETCHING LIVE POOL DATA");
//       console.log("===========================================");
//       console.log("Number of pools to fetch:", pools.length);
//       console.log("API Endpoint: /api/v1/main/livePoolsNotRWA");

//       const liveDataPromises = pools.map(async (pool) => {
//         try {
//           // Construct full URL for live pool data
//           const baseURL = import.meta.env.VITE_API_URL;
//           const liveEndpoint = "/api/v1/main/livePoolsNotRWA";
//           const liveQueryParams = new URLSearchParams({
//             tokenAddress: pool.tokenAddress,
//             pairAddress: pool.pairAddress,
//             chainId: "solana",
//           });
//           const liveFullUrl = `${baseURL}${liveEndpoint}?${liveQueryParams.toString()}`;

//           console.log(
//             `\n🔄 Fetching live data for pool: ${pool.name || pool.symbol}`
//           );
//           console.log("   Full URL:", liveFullUrl);
//           console.log("   Parameters:", {
//             tokenAddress: pool.tokenAddress,
//             pairAddress: pool.pairAddress,
//             chainId: "solana",
//           });

//           const response = await ADMIN_API.GET_LIVE_POOLS_NOT_RWA_DATA({
//             tokenAddress: pool.tokenAddress,
//             pairAddress: pool.pairAddress,
//             chainId: "solana", // Using solana as default chainId
//           });

//           if (response?.data?.success && response.data.pools.length > 0) {
//             console.log(
//               `   ✅ Live data fetched for: ${pool.name || pool.symbol}`
//             );
//             const livePool = response.data.pools[0];
//             const fullPoolData = livePool.fullPoolData;

//             return {
//               poolId: pool.id,
//               pairAddress: pool.pairAddress,
//               data: {
//                 liquidity: fullPoolData.tvl || 0,
//                 liquidityAmount: fullPoolData.tvl || 0,
//                 volume24h: fullPoolData.day?.volume || 0,
//                 fees24h: fullPoolData.day?.volumeFee || 0,
//                 apr24h: fullPoolData.day?.apr || 0,
//                 mintA: fullPoolData.mintA,
//                 mintB: fullPoolData.mintB,
//                 price: fullPoolData.price,
//                 mintAmountA: fullPoolData.mintAmountA,
//                 mintAmountB: fullPoolData.mintAmountB,
//                 feeRate: fullPoolData.feeRate,
//                 openTime: fullPoolData.openTime,
//                 tvl: fullPoolData.tvl,
//                 day: fullPoolData.day,
//                 week: fullPoolData.week,
//                 month: fullPoolData.month,
//               },
//             };
//           }
//         } catch (error) {
//           console.error(
//             `Error fetching live data for pool ${pool.pairAddress}:`,
//             error
//           );
//         }
//         return null;
//       });

//       const liveDataResults = await Promise.all(liveDataPromises);
//       const liveDataMap = {};

//       liveDataResults.forEach((result) => {
//         if (result && result.data) {
//           liveDataMap[result.poolId] = result.data;
//         }
//       });

//       setLivePoolData(liveDataMap);

//       // Update liquidity pools with live data
//       setLiquidityPools((prevPools) =>
//         prevPools.map((pool) => {
//           const liveData = liveDataMap[pool.id];
//           if (liveData) {
//             return {
//               ...pool,
//               liquidity: liveData.liquidity,
//               liquidityAmount: liveData.liquidityAmount,
//               volume24h: liveData.volume24h,
//               fees24h: liveData.fees24h,
//               apr24h: liveData.apr24h,
//             };
//           }
//           return pool;
//         })
//       );
//     } catch (error) {
//       console.error("Error in fetchLivePoolData:", error);
//     } finally {
//       isFetchingLiveData.current = false;
//     }
//   };

//   // Refresh all data
//   const refreshData = useCallback(() => {
//     if (selectedPoolToken) {
//       if (activeTab === "Pools") {
//         fetchLiquidityPools(selectedPoolToken, currentPage, rowsPerPage);
//       } else if (activeTab === "Reports") {
//         fetchDailyPoolReportsAggregates(selectedPoolToken, currentPage, rowsPerPage);
//       }
//     }
//   }, [selectedPoolToken, currentPage, rowsPerPage, activeTab]);

//   // Handle page change
//   const handlePageChange = (newPage) => {
//     const maxPages = activeTab === "Pools" ? poolsTotalPages : reportsTotalPages;
//     if (newPage < 1 || newPage > maxPages || newPage === currentPage) {
//       return;
//     }
//     setCurrentPage(newPage);
//   };

//   // Helper functions for data transformation
//   const calculateAge = (createdAt) => {
//     if (!createdAt) return "N/A";
//     const created = new Date(createdAt);
//     const now = new Date();
//     const diffTime = Math.abs(now - created);
//     const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
//     return `${diffDays} days`;
//   };

//   const getRandomGradientColor = (index) => {
//     const colors = [
//       "from-blue-500 to-cyan-500",
//       "from-green-500 to-emerald-500",
//       "from-purple-500 to-pink-500",
//       "from-orange-500 to-red-500",
//       "from-yellow-500 to-amber-500",
//       "from-gray-500 to-blue-500",
//     ];
//     return colors[index % colors.length];
//   };

//   const getGradientStyle = (index) => {
//     const gradients = [
//       "linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)",
//       "linear-gradient(135deg, #10B981 0%, #059669 100%)",
//       "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
//       "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
//       "linear-gradient(135deg, #EAB308 0%, #D97706 100%)",
//       "linear-gradient(135deg, #6B7280 0%, #3B82F6 100%)",
//     ];
//     return gradients[index % gradients.length];
//   };

//    // Get current pools - use API data
//    const currentPools = liquidityPools.filter((pool) => {
//      // Keep existing volume filter
//      if (pool.volume24h <= 0) return false;
//      return true;
//    });
//   // Get current pools - use API data (show all pools from API, don't filter by volume24h)
//   // const currentPools = liquidityPools;

//   const fetchGetActiveTokens = async () => {
//     // Prevent duplicate calls
//     if (isFetchingTokens.current) {
//       return;
//     }

//     try {
//       isFetchingTokens.current = true;

//       const response = await ADMIN_API.GET_TOKENS({
//         networkId: networkId,
//       });

//       const tokens = response?.data?.data || [];
//       const simplified = tokens.map((token) => ({
//         name: token.name,
//         tokenAddress: token.tokenAddress,
//         token_logo_url: token.token_logo_url,
//         chainId: token.chainId,
//       })).sort((a, b) => {
//         if (a.name === "IdleMine") return -1;
//         if (b.name === "IdleMine") return 1;
//         return 0;
//       });
//       setPooledTokensData(simplified);

//       // Set first token as selected by default
//       if (simplified.length > 0 && !selectedPoolToken) {
//         setSelectedPoolToken(simplified[0].tokenAddress);
//       }
//     } catch (error) {
//       // Error handling
//     } finally {
//       isFetchingTokens.current = false;
//     }
//   };

//   useEffect(() => {
//     if (networkId) {
//       fetchGetActiveTokens();
//     }
//   }, [networkId]);

//   // Reset to page 1 when token or sub-tabs change
//   useEffect(() => {
//     if (selectedPoolToken) {
//       setCurrentPage(1);
//     }
//   }, [selectedPoolToken, reportsSubTab, poolsSubTab]);

//   // Update rowsPerPage based on activeTab
//   useEffect(() => {
//     setRowsPerPage(activeTab === "Pools" ? 20 : 10);
//     setCurrentPage(1);
//   }, [activeTab]);

//   // Fetch liquidity pools when token/page/limit changes and Pools tab is active
//   useEffect(() => {
//     if (selectedPoolToken && activeTab === "Pools") {
//       fetchLiquidityPools(selectedPoolToken, currentPage, rowsPerPage);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [selectedPoolToken, currentPage, rowsPerPage, activeTab, poolsSubTab]); // Only depend on values, not the function

//   // Fetch daily pool reports aggregates when token/page/limit/reportsSubTab changes and Reports tab is active
//   useEffect(() => {
//     if (selectedPoolToken && activeTab === "Reports") {
//       fetchDailyPoolReportsAggregates(
//         selectedPoolToken,
//         currentPage,
//         rowsPerPage
//       );
//     }
//   }, [selectedPoolToken, currentPage, rowsPerPage, activeTab, reportsSubTab]);

//   // Fetch daily pool reports aggregates
//   const fetchDailyPoolReportsAggregates = async (
//     tokenAddress,
//     page = currentPage,
//     limit = rowsPerPage
//   ) => {
//     if (!tokenAddress) return;

//     // Prevent duplicate calls
//     if (isFetchingDailyPoolReportsAggregates.current) {
//       return;
//     }

//     try {
//       isFetchingDailyPoolReportsAggregates.current = true;
//       setReportsLoading(true);

//       // Find the token to get chainId
//       const selectedToken = pooledTokensData.find(
//         (t) => t.tokenAddress === tokenAddress
//       );

//       if (!selectedToken) {
//         console.warn("Token not found for reports fetch");
//         return;
//       }

//       // Determine poolType based on reportsSubTab
//       let poolType = "cpmm+clmm"; // Default for "All" tab if added, or general case
//       if (reportsSubTab === "cpmm") {
//         poolType = "cpmm";
//       } else if (reportsSubTab === "clmm") {
//         poolType = "clmm";
//       }

//       // Construct full URL for reports data
//       const baseURL = import.meta.env.VITE_API_URL;
//       const reportsEndpoint = "/api/v1/main/getDailyWalletReportsAggregates";
//       const reportsQueryParams = new URLSearchParams({
//         chainId: selectedToken.chainId,
//         tokenAddress: tokenAddress,
//         page: page.toString(),
//         limit: limit.toString(),
//         poolType: poolType,
//       });
//       const reportsFullUrl = `${baseURL}${reportsEndpoint}?${reportsQueryParams.toString()}`;

//       // Log API endpoint information
//       console.log("===========================================");
//       console.log("📊 FETCHING DAILY POOL REPORTS AGGREGATES");
//       console.log("===========================================");
//       console.log("API Endpoint:", reportsEndpoint);
//       console.log("Full URL:", reportsFullUrl);
//       console.log("Parameters:", {
//         chainId: selectedToken.chainId,
//         tokenAddress: tokenAddress,
//         page: page,
//         limit: limit,
//         poolType: poolType,
//       });
//       console.log("===========================================");

//       const response = await ADMIN_API.GET_DAILY_POOL_REPORTS_AGGREGATES({
//         chainId: selectedToken.chainId,
//         tokenAddress: tokenAddress,
//         page: page,
//         limit: limit,
//         poolType: poolType,
//       });

//       if (response && response.status === 200) {
//         // Display response data formatted as JSON
//         console.log("✅ Reports API Response Status:", response.status);
//         console.log(
//           "📦 Reports API Response Data:",
//           JSON.stringify(response.data, null, 2)
//         );
//         console.log("===========================================");
//         const reports = response?.data?.data || [];

//         // Use pagination values directly from API response
//         const apiTotal = response?.data?.poolsTotalCount || 0;
//         const apiTotalPages = response?.data?.poolsTotalPages || 1;

//         // Update local rowsPerPage if API returned a different limit
//         if (response?.data?.limit && response.data.limit !== rowsPerPage) {
//           setRowsPerPage(response.data.limit);
//         }

//         setReportsData(reports);
//         setReportsTotalPages(apiTotalPages);
//         setReportsTotalCount(apiTotal);
//       }
//     } catch (error) {
//       console.error("Error in fetchDailyPoolReportsAggregates:", error);
//       setReportsData([]);
//     } finally {
//       setReportsLoading(false);
//       isFetchingDailyPoolReportsAggregates.current = false;
//     }
//   };

//   // Sort function
//   const sortedPools = useMemo(() => {
//     const sortablePools = [...currentPools];
//     if (sortConfig.key) {
//       sortablePools.sort((a, b) => {
//         if (a[sortConfig.key] < b[sortConfig.key]) {
//           return sortConfig.direction === "asc" ? -1 : 1;
//         }
//         if (a[sortConfig.key] > b[sortConfig.key]) {
//           return sortConfig.direction === "asc" ? 1 : -1;
//         }
//         return 0;
//       });
//     }
//     return sortablePools;
//   }, [currentPools, sortConfig]);

//   const handleSort = (key) => {
//     setSortConfig({
//       key,
//       direction:
//         sortConfig.key === key && sortConfig.direction === "asc"
//           ? "desc"
//           : "asc",
//     });
//   };

//   // Pagination handled by server: use current (already-paginated) list
//   const paginatedPools = useMemo(() => {
//     return sortedPools;
//   }, [sortedPools]);

//   // Utility function
//   const formatCompactNumber = (num) => {
//     if (num === 0) return "$0";
//     if (num < 1) return `$${num.toFixed(4)}`;
//     if (num < 1000) return `$${num.toFixed(2)}`;
//     if (num < 1000000) return `$${(num / 1000).toFixed(2)}K`;
//     if (num < 1000000000) return `$${(num / 1000000).toFixed(2)}M`;
//     return `$${(num / 1000000000).toFixed(2)}B`;
//   };

//   // Format symbol: replace WSOL with SOL
//   const formatSymbol = (symbol) => {
//     if (!symbol) return symbol;
//     return symbol.startsWith("WSOL") ? symbol.replace(/^WSOL/, "SOL") : symbol;
//   };

//   // Table columns configuration for Pools
//   const tableColumns = [
//     {
//       key: "name",
//       label: "Pool",
//       width: "min-w-[200px]",
//       sortable: true,
//     },
//     {
//       key: "liquidityAmount",
//       label: "Liquidity",
//       width: "min-w-[100px]",
//       sortable: true,
//     },
//     {
//       key: "volume24h",
//       label: "Volume 24H",
//       width: "min-w-[100px]",
//       sortable: true,
//     },
//     {
//       key: "fees24h",
//       label: "Fees 24H",
//       width: "min-w-[90px]",
//       sortable: true,
//     },
//     {
//       key: "apr24h",
//       label: "APR 24H",
//       width: "min-w-[100px]",
//       sortable: true,
//     },
//   ];

//   // Table columns configuration for Reports
//   const reportsTableColumns = [
//     { key: "endTime", label: "Date", width: "min-w-[40px]", sortable: true },
//     { key: "totalTransactions", label: "Total\nTransactions", width: "min-w-[50px]", sortable: true },
//     { key: "totalVolume", label: "Total\nVolume", width: "min-w-[48px]", sortable: true },
//     { key: "buys", label: "Buys", width: "min-w-[38px]", sortable: true },
//     { key: "sells", label: "Sells", width: "min-w-[38px]", sortable: true },
//     { key: "agentsVolume", label: "Agents\nVolume", width: "min-w-[48px]", sortable: true },
//     { key: "agentBuys", label: "Agent\nBuys", width: "min-w-[42px]", sortable: true },
//     { key: "agentSells", label: "Agent\nSells", width: "min-w-[42px]", sortable: true },
//     { key: "resetsVolume", label: "Resets\nVolume", width: "min-w-[48px]", sortable: true },
//     { key: "resetBuys", label: "Reset\nBuys", width: "min-w-[42px]", sortable: true },
//     { key: "resetSells", label: "Reset\nSells", width: "min-w-[42px]", sortable: true },
//     { key: "bundles", label: "Bundles", width: "min-w-[38px]", sortable: true },
//     // { key: "walletCount", label: "Wallet Count", width: "min-w-[130px]", sortable: true },
//     // { key: "poolCount", label: "Pool Count", width: "min-w-[120px]", sortable: true },
//     // { key: "poolType", label: "Pool Type", width: "min-w-[120px]", sortable: true },
//     // { key: "priceImpact", label: "Price Impact", width: "min-w-[130px]", sortable: true },
//     { key: "slipageAndloss", label: "Slippage\n& Loss", width: "min-w-[48px]", sortable: true },
//     { key: "gasFee", label: "Gas\nFee", width: "min-w-[38px]", sortable: true },
//     { key: "gasFeeInDollars", label: "Gas Fee\n($)", width: "min-w-[42px]", sortable: true },
//     { key: "rayFee", label: "Ray\nFee", width: "min-w-[38px]", sortable: true },
//     { key: "tip", label: "Tip", width: "min-w-[35px]", sortable: true },
//     { key: "cost", label: "Cost", width: "min-w-[38px]", sortable: true },
//     // { key: "expectedCost", label: "Expected Cost", width: "min-w-[140px]", sortable: true },
//     // { key: "netCost", label: "Net Cost", width: "min-w-[120px]", sortable: true },
//     { key: "totalCost", label: "Total\nCost", width: "min-w-[42px]", sortable: true },
//     { key: "walletStartBalance", label: "Wallet Start\nBalance", width: "min-w-[52px]", sortable: true },
//     { key: "walletEndBalance", label: "Wallet End\nBalance", width: "min-w-[52px]", sortable: true },
//     // { key: "walletLoss", label: "Wallet\nLoss", width: "min-w-[45px]", sortable: true },
//     { key: "pP", label: "pP", width: "min-w-[35px]", sortable: true },
//     { key: "lpAdd", label: "LP Add", width: "min-w-[38px]", sortable: true },
//     // { key: "pooledSolAverage", label: "Pooled SOL Avg", width: "min-w-[150px]", sortable: true },
//     // { key: "pooledTokenAverage", label: "Pooled Token Avg", width: "min-w-[170px]", sortable: true },
//     { key: "solAverage", label: "SOL\nAverage", width: "min-w-[45px]", sortable: true },
//     // { key: "tokenAverage", label: "Token Average", width: "min-w-[140px]", sortable: true },
//   ];

//   // Format date from endTime (YYYYMMDD format)
//   const formatDate = (endTime) => {
//     if (!endTime) return "N/A";
//     const dateStr = endTime.toString();
//     if (dateStr.length === 8) {
//       const year = dateStr.substring(0, 4);
//       const month = dateStr.substring(4, 6);
//       const day = dateStr.substring(6, 8);
//       return `${year}-${month}-${day}`;
//     }
//     return dateStr;
//   };

//   const handlePoolClick = (pool) => {
//     // Find the selected token to get its chainId
//     const selectedToken = pooledTokensData.find(
//       (token) => token.tokenAddress === selectedPoolToken
//     );

//     if (selectedToken && pool.pairAddress && pool.tokenAddress) {
//       // Preserve the current tab in the URL when navigating
//       const currentTab = searchParams.get("tab") || "RWA";
//       const networkId = searchParams.get("network");
//       const networkName = searchParams.get("networkName");

//       // Build the query string with preserved parameters
//       const queryParams = new URLSearchParams();
//       if (currentTab) queryParams.set("tab", currentTab);
//       if (networkId) queryParams.set("network", networkId);
//       if (networkName) queryParams.set("networkName", networkName);

//       // Use the chainId from the selected token and addresses from the pool
//       navigate(
//         `/pool/${selectedToken.chainId}/${pool.pairAddress}/${pool.tokenAddress}`
//       );
//     } else {
//       console.warn("Missing required parameters for pool navigation:", {
//         selectedToken,
//         pairAddress: pool.pairAddress,
//         tokenAddress: pool.tokenAddress,
//       });
//     }
//   };

//   const handleViewDetails = (rowData, event) => {
//     if (event) {
//       event.stopPropagation(); // Prevent row click when clicking eye icon
//     }
//     setSelectedRowData(rowData);
//     setIsModalOpen(true);
//   };

//   const handleCloseModal = () => {
//     setIsModalOpen(false);
//     setSelectedRowData(null);
//   };

//   // Pool Display Component
//   const PoolDisplay = ({ pool }) => {
//     const [token1, token2] = pool.name.split("x-");
//     const liveData = livePoolData[pool.id];

//     return (
//       <div className="flex items-center gap-4">
//         {/* Overlapping token icons */}
//         <div
//           className="relative flex items-center"
//           style={{ width: "72px", height: "48px" }}
//         >
//           {/* First token circle - mintA at back */}
//           <div className="absolute left-0 w-12 h-12 rounded-full shadow-2xl border-4 border-white overflow-hidden bg-gradient-to-br from-red-500 to-pink-600">
//             {liveData?.mintA?.logoURI ? (
//               <img
//                 src={liveData.mintA.logoURI}
//                 alt={liveData.mintA.symbol || token1}
//                 className="w-full h-full object-cover"
//                 style={{ imageRendering: "auto" }}
//                 onError={(e) => {
//                   e.target.style.display = "none";
//                   e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-base">${
//                     liveData.mintA.symbol?.charAt(0) || token1?.charAt(0) || "T"
//                   }</div>`;
//                 }}
//               />
//             ) : (
//               <div className="w-full h-full flex items-center justify-center text-white font-bold text-base">
//                 {token1?.charAt(0) || "T"}
//               </div>
//             )}
//           </div>
//           {/* Second token circle - mintB on top, overlapping */}
//           <div className="absolute left-7 w-12 h-12 rounded-full shadow-2xl border-4 border-white z-10 overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600">
//             {liveData?.mintB?.logoURI ? (
//               <img
//                 src={liveData.mintB.logoURI}
//                 alt={liveData.mintB.symbol || token2}
//                 className="w-full h-full object-cover"
//                 style={{ imageRendering: "auto" }}
//                 onError={(e) => {
//                   e.target.style.display = "none";
//                   e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-base">${
//                     liveData.mintB.symbol?.charAt(0) || token2?.charAt(0) || "I"
//                   }</div>`;
//                 }}
//               />
//             ) : (
//               <div className="w-full h-full flex items-center justify-center text-white font-bold text-base">
//                 {token2?.charAt(0) || "I"}
//               </div>
//             )}
//           </div>
//         </div>

//         {/* Pool name and percentage */}
//         <div className="min-w-0 flex-1">
//           <div className="flex items-center gap-2 mb-1">
//             <span className="text-base font-bold text-gray-900">
//               {liveData?.mintA?.symbol && liveData?.mintB?.symbol
//                 ? `${formatSymbol(liveData.mintA.symbol)}-${formatSymbol(
//                     liveData.mintB.symbol
//                   )}`
//                 : pool.name}
//             </span>
//           </div>
//           <div className="text-sm font-medium text-purple-600">
//             {pool.apr24h >= 999
//               ? ">999.99%"
//               : pool.apr24h > 0
//               ? `${pool.apr24h.toFixed(2)}%`
//               : "0%"}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   // Simplified Pool Token Card Component
//   const PoolTokenCard = ({ token, isSelected, onClick }) => {
//     return (
//       <button
//         onClick={onClick}
//         className={`w-full p-3.5 rounded-2xl transition-all duration-500 ease-out text-left group relative overflow-hidden transform ${
//           isSelected
//             ? "bg-white shadow-2xl scale-[1.03]"
//             : "bg-white/60 hover:bg-white border-2 border-gray-200/60 hover:border-purple-300/50 hover:shadow-xl hover:scale-[1.02]"
//         }`}
//         style={
//           isSelected
//             ? {
//                 animation: "slideIn 0.4s ease-out",
//               }
//             : {}
//         }
//       >
//         {/* Animated gradient border for selected state */}
//         {isSelected && (
//           <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 animate-shine-border">
//             <div className="w-full h-full bg-white rounded-2xl"></div>
//           </div>
//         )}

//         {/* Animated gradient overlay for selected state */}
//         {isSelected && (
//           <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-50/30 via-yellow-50/30 to-orange-50/30 animate-pulse-slow"></div>
//         )}

//         <div className="flex items-center gap-3 relative z-10">
//           <div
//             className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-500 shadow-md ${
//               isSelected
//                 ? "bg-gradient-to-br from-orange-50 to-yellow-50"
//                 : "bg-gradient-to-r from-purple-50 to-blue-50"
//             }`}
//           >
//             {token.token_logo_url ? (
//               <img
//                 src={token.token_logo_url}
//                 alt={token.name}
//                 className="w-full h-full object-cover"
//                 style={{ border: "none", outline: "none" }}
//                 onError={(e) => {
//                   e.target.style.display = "none";
//                   e.target.parentElement.innerHTML = `<span class="text-sm font-bold ${
//                     isSelected ? "text-orange-600" : "text-purple-600"
//                   }">${token.name?.charAt(0) || "T"}</span>`;
//                 }}
//               />
//             ) : (
//               <span
//                 className={`text-base font-bold transition-colors duration-500 ${
//                   isSelected ? "text-orange-600" : "text-purple-600"
//                 }`}
//               >
//                 {token.name?.charAt(0) || "T"}
//               </span>
//             )}
//           </div>
//           <div className="flex-1 min-w-0">
//             <h3
//               className={`font-bold text-base truncate transition-all duration-500 ${
//                 isSelected ? "text-gray-900" : "text-gray-800"
//               }`}
//             >
//               {token.name}
//             </h3>
//           </div>
//           {isSelected && (
//             <ArrowRight
//               size={18}
//               className="text-orange-500 flex-shrink-0 animate-bounce-x"
//             />
//           )}
//         </div>

//         {/* Hover effect */}
//         <div
//           className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-5 transition-all duration-500 ${
//             isSelected ? "hidden" : ""
//           }`}
//         ></div>
//       </button>
//     );
//   };

//   return (
//     <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 p-6">
//       {/* Animated Background */}
//       <div className="fixed inset-0 overflow-hidden pointer-events-none">
//         <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl"></div>
//         <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
//       </div>

//       <div className="relative z-10">
//         {/* Enhanced Header */}
//         <div className="mb-8">
//           <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
//             <div>
//               <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
//                 CPMM Trading Pools
//               </h1>
//               <p className="text-gray-600 text-lg">
//                 Explore trading pools across multiple platforms
//               </p>
//             </div>

//             <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
//               <div className="flex items-center gap-3">
//                 {activeTab === "Pools" && (
//                   <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/20 shadow-lg">
//                     <div className="w-2 h-2 bg-green-500 rounded-full"></div>
//                     <span className="text-sm font-medium text-gray-700">
//                       {currentPools.length} Active Pools
//                     </span>
//                   </div>
//                 )}

//                 <button
//                   onClick={refreshData}
//                   disabled={loading}
//                   className="flex items-center gap-2 px-6 py-3 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm"
//                 >
//                   <RefreshCw
//                     size={16}
//                     className={loading ? "animate-spin" : ""}
//                   />
//                   Refresh
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Main Content - Two Column Layout */}
//         <div className="flex flex-col lg:flex-row gap-8">
//           {/* Left Sidebar - Pool Tokens */}
//           <div className="lg:w-80">
//             <div className="bg-gradient-to-br from-white via-white to-purple-50/20 backdrop-blur-xl rounded-3xl border-2 border-purple-300/40 shadow-2xl p-6 transition-all duration-300 hover:shadow-3xl hover:border-purple-400/50">
//               <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-5 flex items-center gap-2 pb-3 border-b-2 border-purple-200/50">
//                 <BarChart3 size={20} className="text-purple-500" />
//                 Tokens
//               </h2>
//               <div className="space-y-3">
//                 {pooledTokensData.length > 0 ? (
//                   pooledTokensData.map((token) => (
//                     <PoolTokenCard
//                       key={token.tokenAddress}
//                       token={token}
//                       isSelected={selectedPoolToken === token.tokenAddress}
//                       onClick={() => setSelectedPoolToken(token.tokenAddress)}
//                     />
//                   ))
//                 ) : (
//                   <div className="text-center py-8 text-gray-500">
//                     <Loader size={24} className="animate-spin mx-auto mb-2" />
//                     <p className="text-sm">Loading tokens...</p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>

//           {/* Right Content - Pools Table */}
//           <div className="flex-1">
//             <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
//               {/* Enhanced Table Header */}
//               <div className="px-8 py-6 border-b border-white/20 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
//                 <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
//                   <div className="flex items-center gap-4">
//                     <h2 className="text-2xl font-bold text-gray-900">
//                       {
//                         pooledTokensData.find(
//                           (t) => t.tokenAddress === selectedPoolToken
//                         )?.name
//                       }
//                     </h2>
//                     {/* Tabs */}
//                     <div className="flex gap-2">
//                       {user?.role !== "superuser" && (
//                         <button
//                           onClick={() => setActiveTab("Reports")}
//                           className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
//                             activeTab === "Reports"
//                               ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
//                               : "text-gray-600 hover:text-gray-900 bg-white/50 hover:bg-white border border-gray-200"
//                           }`}
//                         >
//                           <FileText size={18} />
//                           Reports
//                         </button>
//                       )}
//                       <button
//                         onClick={() => setActiveTab("Pools")}
//                         className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
//                           activeTab === "Pools"
//                             ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
//                             : "text-gray-600 hover:text-gray-900 bg-white/50 hover:bg-white border border-gray-200"
//                         }`}
//                       >
//                         <BarChart3 size={18} />
//                         Pool-Wise Ledger
//                       </button>
//                     </div>
//                   </div>

//                   {(loading || reportsLoading) && (
//                     <div className="flex items-center gap-3 text-sm text-purple-600 bg-white/50 px-4 py-2 rounded-2xl border border-white/20">
//                       <Loader size={16} className="animate-spin" />
//                       Updating data...
//                     </div>
//                   )}
//                 </div>
//               </div>

//               {/* Conditional Table Rendering */}
//               {activeTab === "Reports" ? (
//                 <>
//                   {/* Reports Sub-Tabs */}
//                   <div className="px-8 py-4 border-b border-gray-200 bg-white">
//                     <div className="flex gap-2">
//                       <button
//                         onClick={() => setReportsSubTab("cpmm")}
//                         className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
//                           reportsSubTab === "cpmm"
//                             ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
//                             : "text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-300"
//                         }`}
//                       >
//                         CPMM
//                       </button>
//                       {/* <button
//                         onClick={() => setReportsSubTab("clmm")}
//                         className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
//                           reportsSubTab === "clmm"
//                             ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
//                             : "text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-300"
//                         }`}
//                       >
//                         CLMM
//                       </button> */}
//                     </div>
//                   </div>

//                   {/* Reports Table Container - Separate Div with Bottom Scrollbar */}
//                   <div className="w-full border-t border-gray-200">
//                     {reportsData.length > 0 ? (
//                       <div
//                         className="flex-1 overflow-x-scroll overflow-y-visible pb-2"
//                         style={{
//                           scrollbarWidth: "thin",
//                           scrollbarColor: "#8B5CF6 #f1f5f9"
//                         }}
//                       >
//                         <table className="w-full border-collapse" style={{ minWidth: "3000px" }}>
//                           <thead className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 border-b-2 border-purple-200">
//                             <tr>
//                               {reportsTableColumns.map((column) => (
//                                 <th
//                                   key={column.key}
//                                   className={`px-1 py-2 text-center text-xs font-bold text-purple-700 uppercase tracking-wider whitespace-normal ${column.width} bg-gradient-to-r from-purple-50/50 to-blue-50/50`}
//                                   style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}
//                                 >
//                                   {column.label.split('\n').map((line, i) => (
//                                     <div key={i}>{line}</div>
//                                   ))}
//                                 </th>
//                               ))}
//                             </tr>
//                           </thead>
//                           <tbody className="bg-white divide-y divide-gray-100">
//                             {reportsData.map((report, index) => (
//                               <tr
//                                 key={report._id || index}
//                                 className="hover:bg-purple-50/50 transition-colors duration-150"
//                               >
//                                 {reportsTableColumns.map((column) => {
//                                   const value = report[column.key];
//                                   let displayValue = "N/A";

//                                   if (value !== null && value !== undefined && value !== "") {
//                                     if (column.key === "endTime") {
//                                       displayValue = formatDate(value);
//                                     } else if (
//                                       column.key === "totalVolume" ||
//                                       column.key === "agentsVolume" ||
//                                       column.key === "resetsVolume" ||
//                                       column.key === "gasFeeInDollars" ||
//                                       column.key === "cost" ||
//                                       column.key === "expectedCost" ||
//                                       column.key === "netCost" ||
//                                       column.key === "totalCost" ||
//                                       column.key === "walletStartBalance" ||
//                                       column.key === "walletEndBalance" ||
//                                       // column.key === "walletLoss" ||
//                                       column.key === "pP" ||
//                                       column.key === "lpAdd" ||
//                                       column.key === "rayFee" ||
//                                       column.key === "slipageAndloss"
//                                     ) {
//                                       displayValue = formatCompactNumber(value);
//                                     } else if (typeof value === "number") {
//                                       displayValue = value.toLocaleString('en-US', {
//                                         maximumFractionDigits: 4,
//                                         minimumFractionDigits: 0
//                                       });
//                                     } else {
//                                       displayValue = String(value);
//                                     }
//                                   }

//                                   return (
//                                     <td
//                                       key={column.key}
//                                       className={`px-1 py-2 text-center text-sm text-gray-900 whitespace-nowrap ${column.width}`}
//                                     >
//                                       {column.key === "endTime" ? (
//                                         <div className="flex items-center justify-center gap-2">
//                                           <span className="font-medium text-gray-900">
//                                             {displayValue}
//                                           </span>
//                                           <button
//                                             onClick={(e) => handleViewDetails(report, e)}
//                                             className="p-1 hover:bg-purple-100 rounded-full transition-colors duration-200 text-purple-600 hover:text-purple-700"
//                                             title="View Details"
//                                           >
//                                             <Eye size={16} />
//                                           </button>
//                                         </div>
//                                       ) : (
//                                         <span className={
//                                           typeof value === "number" && (
//                                             column.key.includes("Volume") ||
//                                             column.key.includes("Cost") ||
//                                             column.key.includes("Fee") ||
//                                             column.key.includes("Balance") ||
//                                             column.key.includes("Loss")
//                                           )
//                                             ? "font-semibold text-gray-900"
//                                             : "text-gray-700"
//                                         }>
//                                           {displayValue}
//                                         </span>
//                                       )}
//                                     </td>
//                                   );
//                                 })}
//                               </tr>
//                             ))}
//                           </tbody>
//                         </table>
//                       </div>
//                     ) : (
//                       <div className="px-8 py-20 text-center">
//                         <div className="flex flex-col items-center justify-center">
//                           <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center border border-purple-200 shadow-2xl">
//                             <FileText className="h-12 w-12 text-purple-500" />
//                           </div>
//                           <h3 className="text-2xl font-bold text-gray-900 mb-3">
//                             No reports found
//                           </h3>
//                           <p className="text-gray-600 max-w-md mx-auto text-lg">
//                             {`No reports available for ${
//                               pooledTokensData.find(
//                                 (t) => t.tokenAddress === selectedPoolToken
//                               )?.name || "this token"
//                             }.`}
//                           </p>
//                         </div>
//                       </div>
//                     )}
//                   </div>

//                   {/* Reports Table Footer */}
//                   <div className="px-8 py-6 border-t border-white/20 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
//                     {reportsData.length > 0 && (
//                       <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
//                         <p className="text-sm text-gray-600">
//                           Showing{" "}
//                           <span className="font-semibold text-gray-900">
//                             {(currentPage - 1) * rowsPerPage + 1}
//                           </span>{" "}
//                           to{" "}
//                           <span className="font-semibold text-gray-900">
//                             {Math.min(currentPage * rowsPerPage, reportsTotalCount)}
//                           </span>{" "}
//                           of{" "}
//                           <span className="font-semibold text-gray-900">
//                             {reportsTotalCount}
//                           </span>{" "}
//                           reports
//                         </p>
//                         <div className="flex items-center gap-2">
//                           <button
//                             onClick={() => handlePageChange(currentPage - 1)}
//                             disabled={currentPage === 1}
//                             className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
//                               currentPage === 1
//                                 ? "border-gray-200 text-gray-400 cursor-not-allowed"
//                                 : "border-gray-300 hover:bg-gray-50 text-gray-700"
//                             }`}
//                           >
//                             &lt; Previous
//                           </button>
//                           <div className="flex items-center gap-1">
//                             {Array.from({ length: Math.min(5, reportsTotalPages) }, (_, i) => {
//                               let pageNum;
//                               if (reportsTotalPages <= 5) {
//                                 pageNum = i + 1;
//                               } else if (currentPage <= 3) {
//                                 pageNum = i + 1;
//                               } else if (currentPage >= reportsTotalPages - 2) {
//                                 pageNum = reportsTotalPages - 4 + i;
//                               } else {
//                                 pageNum = currentPage - 2 + i;
//                               }
//                               return (
//                                 <button
//                                   key={pageNum}
//                                   onClick={() => handlePageChange(pageNum)}
//                                   className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
//                                     currentPage === pageNum
//                                       ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
//                                       : "border border-gray-300 hover:bg-gray-50 text-gray-700"
//                                   }`}
//                                 >
//                                   {pageNum}
//                                 </button>
//                               );
//                             })}
//                             {reportsTotalPages > 5 && currentPage < reportsTotalPages - 2 && (
//                               <span className="px-2 text-gray-500">...</span>
//                             )}
//                             {reportsTotalPages > 5 && currentPage < reportsTotalPages - 1 && (
//                               <button
//                                 onClick={() => handlePageChange(reportsTotalPages)}
//                                 className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
//                               >
//                                 {reportsTotalPages}
//                               </button>
//                             )}
//                           </div>
//                           <button
//                             onClick={() => handlePageChange(currentPage + 1)}
//                             disabled={currentPage === reportsTotalPages}
//                             className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
//                               currentPage === reportsTotalPages
//                                 ? "border-gray-200 text-gray-400 cursor-not-allowed"
//                                 : "border-gray-300 hover:bg-gray-50 text-gray-700"
//                             }`}
//                           >
//                             Next &gt;
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </>
//               ) : (
//                 <>
//                   {/* Pools Sub-Tabs */}
//                   <div className="px-8 py-4 border-b border-gray-200 bg-white">
//                     <div className="flex gap-2">
//                       <button
//                         onClick={() => setPoolsSubTab("cpmm")}
//                         className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
//                           poolsSubTab === "cpmm"
//                             ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
//                             : "text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-300"
//                         }`}
//                       >
//                         CPMM
//                       </button>
//                       {/* <button
//                         onClick={() => setPoolsSubTab("clmm")}
//                         className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
//                           poolsSubTab === "clmm"
//                             ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
//                             : "text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-300"
//                         }`}
//                       >
//                         CLMM
//                       </button> */}
//                     </div>
//                   </div>

//                   {/* Pools Table */}
//                   <div className="flex-1 overflow-x-auto overflow-y-visible">
//                     <table className="w-full min-w-[800px]">
//                       <thead className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 border-b border-white/20">
//                         <tr>
//                           {tableColumns.map((column) => (
//                             <th
//                               key={column.key}
//                               className={`px-1 py-2 text-left text-xs font-bold text-purple-700 uppercase tracking-wider ${column.width}`}
//                             >
//                               <button
//                                 onClick={() =>
//                                   column.sortable && handleSort(column.key)
//                                 }
//                                 className={`flex items-center gap-2 transition-all duration-200 ${
//                                   column.sortable
//                                     ? "cursor-pointer hover:text-purple-900 hover:scale-105"
//                                     : ""
//                                 }`}
//                               >
//                                 {column.label}
//                                 {column.sortable && (
//                                   <ChevronDown
//                                     size={16}
//                                     className={`transition-transform ${
//                                       sortConfig.key === column.key &&
//                                       sortConfig.direction === "desc"
//                                         ? "rotate-0"
//                                         : "rotate-180"
//                                     }`}
//                                   />
//                                 )}
//                               </button>
//                             </th>
//                           ))}
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-white/20">
//                         {paginatedPools.length > 0 ? (
//                           paginatedPools.map((pool, index) => (
//                               <tr
//                                 key={pool.id}
//                                 onClick={() => handlePoolClick(pool)}
//                                 className="group hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-blue-50/30 transition-all duration-500 cursor-pointer"
//                                 style={{
//                                   animation: `fadeInUp 0.6s ease-out ${
//                                     index * 50
//                                   }ms both`,
//                                 }}
//                               >
//                                 {/* Pool */}
//                                 <td className="px-1 py-2">
//                                   <PoolDisplay pool={pool} />
//                                 </td>

//                               {/* Liquidity */}
//                               <td className="px-1 py-2">
//                                 <div className="text-sm font-bold text-gray-900 bg-gradient-to-r from-amber-50/80 to-yellow-50/80 px-2 py-2 rounded-2xl border border-amber-200/50 text-center backdrop-blur-sm shadow-sm">
//                                   {formatCompactNumber(pool.liquidityAmount)}
//                                 </div>
//                               </td>

//                               {/* Volume 24H */}
//                               <td className="px-1 py-2">
//                                 <div className="text-sm font-bold text-gray-900 bg-gradient-to-r from-blue-50/80 to-cyan-50/80 px-2 py-2 rounded-2xl border border-blue-200/50 text-center backdrop-blur-sm shadow-sm">
//                                   {formatCompactNumber(pool.volume24h)}
//                                 </div>
//                               </td>

//                               {/* Fees 24H */}
//                               <td className="px-1 py-2">
//                                 <div className="text-sm font-bold text-gray-900 bg-gradient-to-r from-purple-50/80 to-pink-50/80 px-2 py-2 rounded-2xl border border-purple-200/50 text-center backdrop-blur-sm shadow-sm">
//                                   {formatCompactNumber(pool.fees24h)}
//                                 </div>
//                               </td>

//                               {/* APR 24H */}
//                               <td className="px-1 py-2">
//                                 <div
//                                   className={`inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border transition-all duration-300 backdrop-blur-sm ${
//                                     pool.apr24h > 0
//                                       ? pool.apr24h >= 999
//                                         ? "bg-gradient-to-r from-red-50/80 to-pink-50/80 text-red-700 border-red-200/50"
//                                         : "bg-gradient-to-r from-green-50/80 to-emerald-50/80 text-green-700 border-green-200/50"
//                                       : "bg-gray-50/80 text-gray-600 border-gray-200/50"
//                                   }`}
//                                 >
//                                   {pool.apr24h > 0 && (
//                                     <TrendingUp
//                                       size={16}
//                                       className={
//                                         pool.apr24h >= 999
//                                           ? "text-red-500"
//                                           : "text-green-500"
//                                       }
//                                     />
//                                   )}
//                                   {pool.apr24h >= 999
//                                     ? ">999.99%"
//                                     : pool.apr24h > 0
//                                     ? `${pool.apr24h.toFixed(2)}%`
//                                     : "0%"}
//                                 </div>
//                               </td>
//                             </tr>
//                           ))
//                         ) : (
//                           <tr>
//                             <td
//                               colSpan={tableColumns.length}
//                               className="px-8 py-20"
//                             >
//                               <div className="text-center">
//                                 <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center border border-purple-200 shadow-2xl">
//                                   <BarChart3 className="h-12 w-12 text-purple-500" />
//                                 </div>
//                                 <h3 className="text-2xl font-bold text-gray-900 mb-3">
//                                   No pools found
//                                 </h3>
//                                 <p className="text-gray-600 max-w-md mx-auto text-lg mb-6">
//                                   {`No pools available in ${
//                                     pooledTokensData.find(
//                                       (t) => t.tokenAddress === selectedPoolToken
//                                     )?.name || "this token"
//                                   }.`}
//                                 </p>
//                               </div>
//                             </td>
//                           </tr>
//                         )}
//                       </tbody>
//                     </table>
//                   </div>

//                   {/* Pools Table Footer */}
//                   <div className="px-8 py-6 border-t border-white/20 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
//                     {paginatedPools.length > 0 && (
//                       <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
//                         <p className="text-xs text-gray-600">
//                           Showing{" "}
//                           <span className="font-semibold text-gray-900">
//                             {paginatedPools.length}
//                           </span>{" "}
//                           of{" "}
//                           <span className="font-semibold text-gray-900">
//                             {currentPools.length}
//                           </span>{" "}
//                           pools (Page {currentPage} of {poolsTotalPages})
//                         </p>
//                         <div className="flex gap-2">
//                           <button
//                             onClick={() => handlePageChange(currentPage - 1)}
//                             disabled={currentPage === 1}
//                             className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
//                               currentPage === 1
//                                 ? "border-gray-200 text-gray-400 cursor-not-allowed"
//                                 : "border-gray-300 hover:bg-gray-50 text-gray-700"
//                             }`}
//                           >
//                             Previous
//                           </button>
//                           <div className="flex items-center gap-1">
//                             {Array.from({ length: Math.min(5, poolsTotalPages) }, (_, i) => {
//                               let pageNum;
//                               if (poolsTotalPages <= 5) {
//                                 pageNum = i + 1;
//                               } else if (currentPage <= 3) {
//                                 pageNum = i + 1;
//                               } else if (currentPage >= poolsTotalPages - 2) {
//                                 pageNum = poolsTotalPages - 4 + i;
//                               } else {
//                                 pageNum = currentPage - 2 + i;
//                               }
//                               return (
//                                 <button
//                                   key={pageNum}
//                                   onClick={() => handlePageChange(pageNum)}
//                                   className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-colors ${
//                                     currentPage === pageNum
//                                       ? "bg-blue-600 text-white"
//                                       : "border border-gray-300 hover:bg-gray-50 text-gray-700"
//                                   }`}
//                                 >
//                                   {pageNum}
//                                 </button>
//                               );
//                             })}
//                           </div>
//                           <button
//                             onClick={() => handlePageChange(currentPage + 1)}
//                             disabled={currentPage === poolsTotalPages}
//                             className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
//                               currentPage === poolsTotalPages
//                                 ? "border-gray-200 text-gray-400 cursor-not-allowed"
//                                 : "border-gray-300 hover:bg-gray-50 text-gray-700"
//                             }`}
//                           >
//                             Next
//                           </button>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* TableRowModal */}
//       <TableRowModal
//         isOpen={isModalOpen}
//         onClose={handleCloseModal}
//         rowData={selectedRowData}
//         type={activeTab === "Reports" ? "report" : "pool"}
//       />

//       <style>{`
//         @keyframes fadeInUp {
//           from {
//             opacity: 0;
//             transform: translateY(30px);
//           }
//           to {
//             opacity: 1;
//             transform: translateY(0);
//           }
//         }

//         @keyframes shine-border {
//           0%, 100% {
//             background: linear-gradient(135deg, #FF6B00, #FFD700, #FF8C00);
//             filter: drop-shadow(0 0 10px rgba(255, 107, 0, 0.5)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.3));
//           }
//           50% {
//             background: linear-gradient(135deg, #FFD700, #FF8C00, #FFD700);
//             filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.7)) drop-shadow(0 0 30px rgba(255, 140, 0, 0.4));
//           }
//         }

//         @keyframes slideIn {
//           from {
//             opacity: 0;
//             transform: translateX(-10px);
//           }
//           to {
//             opacity: 1;
//             transform: translateX(0);
//           }
//         }

//         @keyframes bounce-x {
//           0%, 100% {
//             transform: translateX(0);
//           }
//           50% {
//             transform: translateX(4px);
//           }
//         }

//         @keyframes pulse-slow {
//           0%, 100% {
//             opacity: 0.3;
//           }
//           50% {
//             opacity: 0.5;
//           }
//         }

//         .animate-bounce-x {
//           animation: bounce-x 1.5s ease-in-out infinite;
//         }

//         .animate-pulse-slow {
//           animation: pulse-slow 3s ease-in-out infinite;
//         }

//         .animate-shine-border {
//           animation: shine-border 2.5s ease-in-out infinite;
//         }

//         .shadow-3xl {
//           box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
//         }

//         /* Custom Scrollbar Styles for Reports Table */
//         .overflow-x-scroll::-webkit-scrollbar,
//         .overflow-x-auto::-webkit-scrollbar {
//           height: 14px;
//         }

//         .overflow-x-scroll::-webkit-scrollbar-track,
//         .overflow-x-auto::-webkit-scrollbar-track {
//           background: #f1f5f9;
//           border-radius: 8px;
//           border: 1px solid #e2e8f0;
//         }

//         .overflow-x-scroll::-webkit-scrollbar-thumb,
//         .overflow-x-auto::-webkit-scrollbar-thumb {
//           background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
//           border-radius: 8px;
//           border: 2px solid #f1f5f9;
//           min-width: 50px;
//         }

//         .overflow-x-scroll::-webkit-scrollbar-thumb:hover,
//         .overflow-x-auto::-webkit-scrollbar-thumb:hover {
//           background: linear-gradient(135deg, #7C3AED 0%, #2563EB 100%);
//         }

//         /* Firefox scrollbar */
//         .overflow-x-scroll {
//           scrollbar-width: thin;
//           scrollbar-color: #8B5CF6 #f1f5f9;
//         }

//         .flex-1 {
//           flex: 1 1 0%;
//           overflow: auto;
//         }
//       `}</style>
//     </div>
//   );
// };
// export default PoolTable;

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import {
  TrendingUp,
  ChevronDown,
  RefreshCw,
  Loader,
  BarChart3,
  ArrowRight,
  FileText,
  Eye,
} from "lucide-react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ADMIN_API } from "../services/ApiHandlers";
import TableRowModal from "./TableRowModal";
import { useAuth } from "../context/useAuth";

const PoolTable = () => {
  const { user } = useAuth();
  // Separate pagination states for Pools and Reports
  const [poolsCurrentPage, setPoolsCurrentPage] = useState(1);
  const [poolsRowsPerPage, setPoolsRowsPerPage] = useState(10);
  const [reportsCurrentPage, setReportsCurrentPage] = useState(1);
  const [reportsRowsPerPage, setReportsRowsPerPage] = useState(10);

  const [sortConfig, setSortConfig] = useState({
    key: "volume24h",
    direction: "desc",
  });
  const [loading, setLoading] = useState(false);
  const [poolsTotalPages, setPoolsTotalPages] = useState(1);
  const [poolsTotalCount, setPoolsTotalCount] = useState(0);
  const [selectedPoolToken, setSelectedPoolToken] = useState(null);
  const navigate = useNavigate();
  const [pooledTokensData, setPooledTokensData] = useState([]);
  const [liquidityPools, setLiquidityPools] = useState([]);
  const [livePoolData, setLivePoolData] = useState({});
  const [activeTab, setActiveTab] = useState(
    user?.role === "superuser" ? "Pools" : "Reports",
  );
  const [reportsSubTab, setReportsSubTab] = useState("cpmm");
  const [poolsSubTab, setPoolsSubTab] = useState("cpmm");
  const [reportsData, setReportsData] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsTotalPages, setReportsTotalPages] = useState(1);
  const [reportsTotalCount, setReportsTotalCount] = useState(0);
  const [searchParams] = useSearchParams();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRowData, setSelectedRowData] = useState(null);
  // const networkId = searchParams.get("network");

  // Get networkId from localStorage instead of URL params
  const networkId = localStorage.getItem("RaydiumNetworkId");

  // Refs to prevent duplicate API calls
  const isFetchingPools = useRef(false);
  const isFetchingTokens = useRef(false);
  const isFetchingLiveData = useRef(false);
  const isFetchingDailyPoolReportsAggregates = useRef(false);

  // GET_LIQUIDITY_POOLS (server-side pagination)
  const fetchLiquidityPools = async (
    tokenAddress,
    page = poolsCurrentPage,
    limit = poolsRowsPerPage,
  ) => {
    if (!tokenAddress) return;

    // Prevent duplicate calls
    if (isFetchingPools.current) {
      return;
    }

    try {
      isFetchingPools.current = true;
      setLoading(true);

      // Determine poolType filter based on poolsSubTab
      let poolTypeFilter = "cpmm"; // Default
      if (poolsSubTab === "clmm") {
        poolTypeFilter = "clmm";
      } else if (poolsSubTab === "cpmm") {
        poolTypeFilter = "cpmm";
      }

      // For "cpmm" or "clmm" filters, use single API call
      // Construct full API URL with query parameters
      const baseURL = import.meta.env.VITE_API_URL;
      const endpoint = "/api/v1/main/getLiquidityPools";
      const queryParams = new URLSearchParams({
        tokenAddress,
        page: page.toString(),
        limit: limit.toString(),
        poolType: poolTypeFilter,
      });
      const fullUrl = `${baseURL}${endpoint}?${queryParams.toString()}`;

      // Log API endpoint information
      console.log("===========================================");
      console.log("📊 FETCHING LIQUIDITY POOLS DATA");
      console.log("===========================================");
      console.log("API Endpoint:", endpoint);
      console.log("Full URL:", fullUrl);
      console.log("Query Parameters:", {
        tokenAddress,
        page,
        limit,
        poolType: poolTypeFilter,
      });
      console.log("===========================================");

      const response = await ADMIN_API.GET_LIQUIDITY_POOLS({
        tokenAddress,
        page,
        limit,
        poolType: poolTypeFilter,
      });

      if (response && response.status === 200) {
        // Display response data formatted as JSON
        console.log("✅ API Response Status:", response.status);
        console.log(
          "📦 API Response Data:",
          JSON.stringify(response.data, null, 2),
        );
        console.log("===========================================");
        const pools = response?.data?.data || [];
        const apiTotal = response?.data?.total ?? 0;
        const apiLimit = response?.data?.limit ?? poolsRowsPerPage;
        // Calculate total pages from total and limit
        const apiTotalPages = apiTotal > 0 ? Math.ceil(apiTotal / apiLimit) : 1;
        setPoolsTotalPages(apiTotalPages);
        setPoolsTotalCount(apiTotal);

        // Transform the API data to match our table structure
        const transformedPools = pools.map((pool, index) => ({
          id: pool._id,
          name: pool.name,
          symbol: pool.symbol,
          liquidity: 0, // Will be updated from live data
          liquidityAmount: 0, // Will be updated from live data
          volume24h: 0, // Will be updated from live data
          fees24h: 0, // Will be updated from live data
          apr24h: 0, // Will be updated from live data
          color: getRandomGradientColor(index),
          gradient: getGradientStyle(index),
          platform: "raydium", // Default platform
          holders: 0,
          age: calculateAge(pool.createdAt),
          poolAddress: pool.pairAddress,
          pairAddress: pool.pairAddress,
          tokenAddress: pool.tokenAddress,
          rwaAddress: pool.address,
          poolType: pool.poolType || pool.pool_type || null, // Add poolType from API response
        }));

        setLiquidityPools(transformedPools);

        // Fetch live data for each pool
        if (transformedPools.length > 0) {
          fetchLivePoolData(transformedPools, tokenAddress);
        }
      }
    } catch (error) {
      setLiquidityPools([]);
    } finally {
      setLoading(false);
      isFetchingPools.current = false;
    }
  };

  // Fetch live pool data from GET_LIVE_POOLS_DATA API
  const fetchLivePoolData = async (pools, tokenAddress) => {
    // Prevent duplicate calls
    if (isFetchingLiveData.current) {
      return;
    }

    try {
      isFetchingLiveData.current = true;

      console.log("===========================================");
      console.log("📈 FETCHING LIVE POOL DATA");
      console.log("===========================================");
      console.log("Number of pools to fetch:", pools.length);
      console.log("API Endpoint: /api/v1/main/livePoolsNotRWA");

      const liveDataPromises = pools.map(async (pool) => {
        try {
          // Construct full URL for live pool data
          const baseURL = import.meta.env.VITE_API_URL;
          const liveEndpoint = "/api/v1/main/livePoolsNotRWA";
          const liveQueryParams = new URLSearchParams({
            tokenAddress: pool.tokenAddress,
            pairAddress: pool.pairAddress,
            chainId: "solana",
          });
          const liveFullUrl = `${baseURL}${liveEndpoint}?${liveQueryParams.toString()}`;

          console.log(
            `\n🔄 Fetching live data for pool: ${pool.name || pool.symbol}`,
          );
          console.log("   Full URL:", liveFullUrl);
          console.log("   Parameters:", {
            tokenAddress: pool.tokenAddress,
            pairAddress: pool.pairAddress,
            chainId: "solana",
          });

          const response = await ADMIN_API.GET_LIVE_POOLS_NOT_RWA_DATA({
            tokenAddress: pool.tokenAddress,
            pairAddress: pool.pairAddress,
            chainId: "solana", // Using solana as default chainId
          });

          if (response?.data?.success && response.data.pools.length > 0) {
            console.log(
              `   ✅ Live data fetched for: ${pool.name || pool.symbol}`,
            );
            const livePool = response.data.pools[0];
            const fullPoolData = livePool.fullPoolData;

            return {
              poolId: pool.id,
              pairAddress: pool.pairAddress,
              data: {
                liquidity: fullPoolData.tvl || 0,
                liquidityAmount: fullPoolData.tvl || 0,
                volume24h: fullPoolData.day?.volume || 0,
                fees24h: fullPoolData.day?.volumeFee || 0,
                apr24h: fullPoolData.day?.apr || 0,
                mintA: fullPoolData.mintA,
                mintB: fullPoolData.mintB,
                price: fullPoolData.price,
                mintAmountA: fullPoolData.mintAmountA,
                mintAmountB: fullPoolData.mintAmountB,
                feeRate: fullPoolData.feeRate,
                openTime: fullPoolData.openTime,
                tvl: fullPoolData.tvl,
                day: fullPoolData.day,
                week: fullPoolData.week,
                month: fullPoolData.month,
              },
            };
          }
        } catch (error) {
          console.error(
            `Error fetching live data for pool ${pool.pairAddress}:`,
            error,
          );
        }
        return null;
      });

      const liveDataResults = await Promise.all(liveDataPromises);
      const liveDataMap = {};

      liveDataResults.forEach((result) => {
        if (result && result.data) {
          liveDataMap[result.poolId] = result.data;
        }
      });

      setLivePoolData(liveDataMap);

      // Update liquidity pools with live data
      setLiquidityPools((prevPools) =>
        prevPools.map((pool) => {
          const liveData = liveDataMap[pool.id];
          if (liveData) {
            return {
              ...pool,
              liquidity: liveData.liquidity,
              liquidityAmount: liveData.liquidityAmount,
              volume24h: liveData.volume24h,
              fees24h: liveData.fees24h,
              apr24h: liveData.apr24h,
            };
          }
          return pool;
        }),
      );
    } catch (error) {
      console.error("Error in fetchLivePoolData:", error);
    } finally {
      isFetchingLiveData.current = false;
    }
  };

  // Refresh all data
  const refreshData = useCallback(() => {
    if (selectedPoolToken) {
      if (activeTab === "Pools") {
        fetchLiquidityPools(
          selectedPoolToken,
          poolsCurrentPage,
          poolsRowsPerPage,
        );
      } else if (activeTab === "Reports") {
        fetchDailyPoolReportsAggregates(
          selectedPoolToken,
          reportsCurrentPage,
          reportsRowsPerPage,
        );
      }
    }
  }, [
    selectedPoolToken,
    poolsCurrentPage,
    poolsRowsPerPage,
    reportsCurrentPage,
    reportsRowsPerPage,
    activeTab,
  ]);

  // Handle Pools page change
  const handlePoolsPageChange = (newPage) => {
    if (
      newPage < 1 ||
      newPage > poolsTotalPages ||
      newPage === poolsCurrentPage
    ) {
      return;
    }
    setPoolsCurrentPage(newPage);
  };

  // Handle Reports page change
  const handleReportsPageChange = (newPage) => {
    if (
      newPage < 1 ||
      newPage > reportsTotalPages ||
      newPage === reportsCurrentPage
    ) {
      return;
    }
    setReportsCurrentPage(newPage);
  };

  // Helper functions for data transformation
  const calculateAge = (createdAt) => {
    if (!createdAt) return "N/A";
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  const getRandomGradientColor = (index) => {
    const colors = [
      "from-blue-500 to-cyan-500",
      "from-green-500 to-emerald-500",
      "from-purple-500 to-pink-500",
      "from-orange-500 to-red-500",
      "from-yellow-500 to-amber-500",
      "from-gray-500 to-blue-500",
    ];
    return colors[index % colors.length];
  };

  const getGradientStyle = (index) => {
    const gradients = [
      "linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)",
      "linear-gradient(135deg, #10B981 0%, #059669 100%)",
      "linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)",
      "linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)",
      "linear-gradient(135deg, #EAB308 0%, #D97706 100%)",
      "linear-gradient(135deg, #6B7280 0%, #3B82F6 100%)",
    ];
    return gradients[index % gradients.length];
  };

  // Get current pools - use API data
  const currentPools = liquidityPools.filter((pool) => {
    // Keep existing volume filter
    if (pool.volume24h <= 0) return false;
    return true;
  });
  // Get current pools - use API data (show all pools from API, don't filter by volume24h)
  // const currentPools = liquidityPools;

  const fetchGetActiveTokens = async () => {
    // Prevent duplicate calls
    if (isFetchingTokens.current) {
      return;
    }

    try {
      isFetchingTokens.current = true;

      const response = await ADMIN_API.GET_TOKENS({
        networkId: networkId,
      });

      const tokens = response?.data?.data || [];
      const simplified = tokens
        .map((token) => ({
          name: token.name,
          tokenAddress: token.tokenAddress,
          token_logo_url: token.token_logo_url,
          chainId: token.chainId,
        }))
        .sort((a, b) => {
          if (a.name === "IdleMine") return -1;
          if (b.name === "IdleMine") return 1;
          return 0;
        });
      setPooledTokensData(simplified);

      // Set first token as selected by default
      if (simplified.length > 0 && !selectedPoolToken) {
        setSelectedPoolToken(simplified[0].tokenAddress);
      }
    } catch (error) {
      // Error handling
    } finally {
      isFetchingTokens.current = false;
    }
  };

  useEffect(() => {
    if (networkId) {
      fetchGetActiveTokens();
    }
  }, [networkId]);

  // Reset to page 1 when token changes
  useEffect(() => {
    if (selectedPoolToken) {
      setPoolsCurrentPage(1);
      setReportsCurrentPage(1);
    }
  }, [selectedPoolToken]);

  // Fetch liquidity pools when token/page/limit changes and Pools tab is active
  useEffect(() => {
    if (selectedPoolToken && activeTab === "Pools") {
      fetchLiquidityPools(
        selectedPoolToken,
        poolsCurrentPage,
        poolsRowsPerPage,
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedPoolToken,
    poolsCurrentPage,
    poolsRowsPerPage,
    activeTab,
    poolsSubTab,
  ]); // Only depend on values, not the function

  // Fetch daily pool reports aggregates when token/page/limit/reportsSubTab changes and Reports tab is active
  useEffect(() => {
    if (selectedPoolToken && activeTab === "Reports") {
      fetchDailyPoolReportsAggregates(
        selectedPoolToken,
        reportsCurrentPage,
        reportsRowsPerPage,
      );
    }
  }, [
    selectedPoolToken,
    reportsCurrentPage,
    reportsRowsPerPage,
    activeTab,
    reportsSubTab,
  ]);

  // Fetch daily pool reports aggregates
  const fetchDailyPoolReportsAggregates = async (
    tokenAddress,
    page = reportsCurrentPage,
    limit = reportsRowsPerPage,
  ) => {
    if (!tokenAddress) return;

    // Prevent duplicate calls
    if (isFetchingDailyPoolReportsAggregates.current) {
      return;
    }

    try {
      isFetchingDailyPoolReportsAggregates.current = true;
      setReportsLoading(true);

      // Find the token to get chainId
      const selectedToken = pooledTokensData.find(
        (t) => t.tokenAddress === tokenAddress,
      );

      if (!selectedToken) {
        console.warn("Token not found for reports fetch");
        return;
      }

      // Determine poolType based on reportsSubTab
      let poolType = "cpmm+clmm"; // Default for "All" tab if added
      if (reportsSubTab === "cpmm") {
        poolType = "cpmm";
      } else if (reportsSubTab === "clmm") {
        poolType = "clmm";
      }

      // Construct full URL for reports data
      const baseURL = import.meta.env.VITE_API_URL;
      const reportsEndpoint = "/api/v1/main/getDailyWalletReportsAggregates";
      const reportsQueryParams = new URLSearchParams({
        chainId: selectedToken.chainId,
        tokenAddress: tokenAddress,
        page: page.toString(),
        limit: limit.toString(),
        poolType: poolType,
      });
      const reportsFullUrl = `${baseURL}${reportsEndpoint}?${reportsQueryParams.toString()}`;

      // Log API endpoint information
      console.log("===========================================");
      console.log("📊 FETCHING DAILY POOL REPORTS AGGREGATES");
      console.log("===========================================");
      console.log("API Endpoint:", reportsEndpoint);
      console.log("Full URL:", reportsFullUrl);
      console.log("Parameters:", {
        chainId: selectedToken.chainId,
        tokenAddress: tokenAddress,
        page: page,
        limit: limit,
        poolType: poolType,
      });
      console.log("===========================================");

      const response = await ADMIN_API.GET_DAILY_POOL_REPORTS_AGGREGATES({
        chainId: selectedToken.chainId,
        tokenAddress: tokenAddress,
        page: page,
        limit: limit,
        poolType: poolType,
      });

      if (response && response.status === 200) {
        // Display response data formatted as JSON
        console.log("📦 Reports API Response Data:", response);
        const reports = response?.data?.data || [];

        // Use pagination values directly from API response
        const apiTotal = response?.data?.totalCount || 0;
        const apiTotalPages = response?.data?.totalPages || 1;

        // Update local reportsRowsPerPage if API returned a different limit
        if (
          response?.data?.limit &&
          response.data.limit !== reportsRowsPerPage
        ) {
          setReportsRowsPerPage(response.data.limit);
        }

        setReportsData(reports);
        setReportsTotalPages(apiTotalPages);
        setReportsTotalCount(apiTotal);
      }
    } catch (error) {
      console.error("Error in fetchDailyPoolReportsAggregates:", error);
      setReportsData([]);
    } finally {
      setReportsLoading(false);
      isFetchingDailyPoolReportsAggregates.current = false;
    }
  };

  // Sort function
  const sortedPools = useMemo(() => {
    const sortablePools = [...currentPools];
    if (sortConfig.key) {
      sortablePools.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortablePools;
  }, [currentPools, sortConfig]);

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction:
        sortConfig.key === key && sortConfig.direction === "asc"
          ? "desc"
          : "asc",
    });
  };

  // Pagination handled by server: use current (already-paginated) list
  const paginatedPools = useMemo(() => {
    return sortedPools;
  }, [sortedPools]);

  // Utility function
  const formatCompactNumber = (num) => {
    if (num === 0) return "$0";
    if (num < 1) return `$${num.toFixed(4)}`;
    if (num < 1000) return `$${num.toFixed(2)}`;
    if (num < 1000000) return `$${(num / 1000).toFixed(2)}K`;
    if (num < 1000000000) return `$${(num / 1000000).toFixed(2)}M`;
    return `$${(num / 1000000000).toFixed(2)}B`;
  };

  // Format symbol: replace WSOL with SOL
  const formatSymbol = (symbol) => {
    if (!symbol) return symbol;
    return symbol.startsWith("WSOL") ? symbol.replace(/^WSOL/, "SOL") : symbol;
  };

  // Table columns configuration for Pools
  const tableColumns = [
    {
      key: "name",
      label: "Pool",
      width: "min-w-[200px]",
      sortable: true,
    },
    {
      key: "liquidityAmount",
      label: "Liquidity",
      width: "min-w-[100px]",
      sortable: true,
    },
    {
      key: "volume24h",
      label: "Volume 24H",
      width: "min-w-[100px]",
      sortable: true,
    },
    {
      key: "fees24h",
      label: "Fees 24H",
      width: "min-w-[90px]",
      sortable: true,
    },
    {
      key: "apr24h",
      label: "APR 24H",
      width: "min-w-[100px]",
      sortable: true,
    },
  ];

  // Table columns configuration for Reports
  const reportsTableColumns = [
    { key: "endTime", label: "Date", width: "w-auto", sortable: true },
    {
      key: "totalTransactions",
      label: "Total\nTransactions",
      width: "w-auto",
      sortable: true,
    },
    {
      key: "totalVolume",
      label: "Total\nVolume",
      width: "w-auto",
      sortable: true,
    },
    { key: "buys", label: "Buys", width: "w-auto", sortable: true },
    { key: "sells", label: "Sells", width: "w-auto", sortable: true },
    {
      key: "agentsVolume",
      label: "Agents\nVolume",
      width: "w-auto",
      sortable: true,
    },
    { key: "agentBuys", label: "Agent\nBuys", width: "w-auto", sortable: true },
    {
      key: "agentSells",
      label: "Agent\nSells",
      width: "w-auto",
      sortable: true,
    },
    {
      key: "resetsVolume",
      label: "Resets\nVolume",
      width: "w-auto",
      sortable: true,
    },
    { key: "resetBuys", label: "Reset\nBuys", width: "w-auto", sortable: true },
    {
      key: "resetSells",
      label: "Reset\nSells",
      width: "w-auto",
      sortable: true,
    },
    { key: "bundles", label: "Bundles", width: "w-auto", sortable: true },
    // { key: "walletCount", label: "Wallet Count", width: "min-w-[130px]", sortable: true },
    // { key: "poolCount", label: "Pool Count", width: "min-w-[120px]", sortable: true },
    // { key: "poolType", label: "Pool Type", width: "min-w-[120px]", sortable: true },
    // { key: "priceImpact", label: "Price Impact", width: "min-w-[130px]", sortable: true },
    {
      key: "slipageAndloss",
      label: "Slippage\n& Loss",
      width: "w-auto",
      sortable: true,
    },
    { key: "gasFee", label: "Gas\nFee", width: "w-auto", sortable: true },
    {
      key: "gasFeeInDollars",
      label: "Gas Fee\n($)",
      width: "w-auto",
      sortable: true,
    },
    { key: "poolRayFee", label: "Ray\nFee", width: "w-auto", sortable: true },
    { key: "tip", label: "Tip", width: "w-auto", sortable: true },
    { key: "cost", label: "Cost", width: "w-auto", sortable: true },
    // { key: "expectedCost", label: "Expected Cost", width: "min-w-[140px]", sortable: true },
    // { key: "netCost", label: "Net Cost", width: "min-w-[120px]", sortable: true },
    { key: "totalCost", label: "Total\nCost", width: "w-auto", sortable: true },
    // { key: "walletLoss", label: "Wallet\nLoss", width: "min-w-[45px]", sortable: true },
    { key: "pP", label: "pP", width: "w-auto", sortable: true },
    { key: "lpAdd", label: "LP Add", width: "w-auto", sortable: true },
    // { key: "pooledSolAverage", label: "Pooled SOL Avg", width: "min-w-[150px]", sortable: true },
    // { key: "pooledTokenAverage", label: "Pooled Token Avg", width: "min-w-[170px]", sortable: true },
    {
      key: "solAverage",
      label: "SOL\nAverage",
      width: "w-auto",
      sortable: true,
    },
    // { key: "tokenAverage", label: "Token Average", width: "min-w-[140px]", sortable: true },
  ];

  // Format date from endTime (YYYYMMDD format)
  const formatDate = (endTime) => {
    if (!endTime) return "N/A";
    const dateStr = endTime.toString();
    if (dateStr.length === 8) {
      const year = dateStr.substring(0, 4);
      const month = dateStr.substring(4, 6);
      const day = dateStr.substring(6, 8);
      return `${year}-${month}-${day}`;
    }
    return dateStr;
  };

  const handlePoolClick = (pool) => {
    // Find the selected token to get its chainId
    const selectedToken = pooledTokensData.find(
      (token) => token.tokenAddress === selectedPoolToken,
    );

    if (selectedToken && pool.pairAddress && pool.tokenAddress) {
      // Preserve the current tab in the URL when navigating
      const currentTab = searchParams.get("tab") || "RWA";
      const networkId = searchParams.get("network");
      const networkName = searchParams.get("networkName");

      // Build the query string with preserved parameters
      const queryParams = new URLSearchParams();
      if (currentTab) queryParams.set("tab", currentTab);
      if (networkId) queryParams.set("network", networkId);
      if (networkName) queryParams.set("networkName", networkName);

      // Use the chainId from the selected token and addresses from the pool
      navigate(
        `/pool/${selectedToken.chainId}/${pool.pairAddress}/${pool.tokenAddress}`,
      );
    } else {
      console.warn("Missing required parameters for pool navigation:", {
        selectedToken,
        pairAddress: pool.pairAddress,
        tokenAddress: pool.tokenAddress,
      });
    }
  };

  const handleViewDetails = (rowData, event) => {
    if (event) {
      event.stopPropagation(); // Prevent row click when clicking eye icon
    }
    setSelectedRowData(rowData);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRowData(null);
  };

  // Pool Display Component
  const PoolDisplay = ({ pool }) => {
    const [token1, token2] = pool.name.split("x-");
    const liveData = livePoolData[pool.id];

    return (
      <div className="flex items-center gap-4">
        {/* Overlapping token icons */}
        <div
          className="relative flex items-center"
          style={{ width: "72px", height: "48px" }}
        >
          {/* First token circle - mintA at back */}
          <div className="absolute left-0 w-12 h-12 rounded-full shadow-2xl border-4 border-white overflow-hidden bg-gradient-to-br from-red-500 to-pink-600">
            {liveData?.mintA?.logoURI ? (
              <img
                src={liveData.mintA.logoURI}
                alt={liveData.mintA.symbol || token1}
                className="w-full h-full object-cover"
                style={{ imageRendering: "auto" }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-base">${
                    liveData.mintA.symbol?.charAt(0) || token1?.charAt(0) || "T"
                  }</div>`;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-base">
                {token1?.charAt(0) || "T"}
              </div>
            )}
          </div>
          {/* Second token circle - mintB on top, overlapping */}
          <div className="absolute left-7 w-12 h-12 rounded-full shadow-2xl border-4 border-white z-10 overflow-hidden bg-gradient-to-br from-cyan-500 to-blue-600">
            {liveData?.mintB?.logoURI ? (
              <img
                src={liveData.mintB.logoURI}
                alt={liveData.mintB.symbol || token2}
                className="w-full h-full object-cover"
                style={{ imageRendering: "auto" }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML = `<div class="w-full h-full flex items-center justify-center text-white font-bold text-base">${
                    liveData.mintB.symbol?.charAt(0) || token2?.charAt(0) || "I"
                  }</div>`;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white font-bold text-base">
                {token2?.charAt(0) || "I"}
              </div>
            )}
          </div>
        </div>

        {/* Pool name and percentage */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base font-bold text-gray-900">
              {liveData?.mintA?.symbol && liveData?.mintB?.symbol
                ? `${formatSymbol(liveData.mintA.symbol)}-${formatSymbol(
                    liveData.mintB.symbol,
                  )}`
                : pool.name}
            </span>
          </div>
          <div className="text-sm font-medium text-purple-600">
            {pool.apr24h >= 999
              ? ">999.99%"
              : pool.apr24h > 0
                ? `${pool.apr24h.toFixed(2)}%`
                : "0%"}
          </div>
        </div>
      </div>
    );
  };

  // Simplified Pool Token Card Component
  const PoolTokenCard = ({ token, isSelected, onClick }) => {
    return (
      <button
        onClick={onClick}
        className={`w-full p-3.5 rounded-2xl transition-all duration-500 ease-out text-left group relative overflow-hidden transform ${
          isSelected
            ? "bg-white shadow-2xl scale-[1.03]"
            : "bg-white/60 hover:bg-white border-2 border-gray-200/60 hover:border-purple-300/50 hover:shadow-xl hover:scale-[1.02]"
        }`}
        style={
          isSelected
            ? {
                animation: "slideIn 0.4s ease-out",
              }
            : {}
        }
      >
        {/* Animated gradient border for selected state */}
        {isSelected && (
          <div className="absolute inset-0 rounded-2xl p-[2px] bg-gradient-to-r from-orange-500 via-yellow-400 to-orange-500 animate-shine-border">
            <div className="w-full h-full bg-white rounded-2xl"></div>
          </div>
        )}

        {/* Animated gradient overlay for selected state */}
        {isSelected && (
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-orange-50/30 via-yellow-50/30 to-orange-50/30 animate-pulse-slow"></div>
        )}

        <div className="flex items-center gap-3 relative z-10">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden transition-all duration-500 shadow-md ${
              isSelected
                ? "bg-gradient-to-br from-orange-50 to-yellow-50"
                : "bg-gradient-to-r from-purple-50 to-blue-50"
            }`}
          >
            {token.token_logo_url ? (
              <img
                src={token.token_logo_url}
                alt={token.name}
                className="w-full h-full object-cover"
                style={{ border: "none", outline: "none" }}
                onError={(e) => {
                  e.target.style.display = "none";
                  e.target.parentElement.innerHTML = `<span class="text-sm font-bold ${
                    isSelected ? "text-orange-600" : "text-purple-600"
                  }">${token.name?.charAt(0) || "T"}</span>`;
                }}
              />
            ) : (
              <span
                className={`text-base font-bold transition-colors duration-500 ${
                  isSelected ? "text-orange-600" : "text-purple-600"
                }`}
              >
                {token.name?.charAt(0) || "T"}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3
              className={`font-bold text-base truncate transition-all duration-500 ${
                isSelected ? "text-gray-900" : "text-gray-800"
              }`}
            >
              {token.name}
            </h3>
          </div>
          {isSelected && (
            <ArrowRight
              size={18}
              className="text-orange-500 flex-shrink-0 animate-bounce-x"
            />
          )}
        </div>

        {/* Hover effect */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-500 to-blue-500 opacity-0 group-hover:opacity-5 transition-all duration-500 ${
            isSelected ? "hidden" : ""
          }`}
        ></div>
      </button>
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 p-6">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10">
        {/* Enhanced Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-6">
            <div>
              <h1 className="text-3xl font-black bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent mb-2">
                Tollgate Pools
              </h1>
              <p className="text-gray-600 text-lg">
                Explore trading pools across multiple platforms
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="flex items-center gap-3">
                {activeTab === "Pools" && (
                  <div className="flex items-center gap-2 bg-white/80 backdrop-blur-xl px-4 py-2.5 rounded-2xl border border-white/20 shadow-lg">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-700">
                      {currentPools.length} Active Pools
                    </span>
                  </div>
                )}

                <button
                  onClick={refreshData}
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 text-sm bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-2xl hover:from-purple-700 hover:to-blue-700 transition-all duration-300 disabled:opacity-50 shadow-lg hover:shadow-xl hover:scale-105 backdrop-blur-sm"
                >
                  <RefreshCw
                    size={16}
                    className={loading ? "animate-spin" : ""}
                  />
                  Refresh
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left Sidebar - Pool Tokens */}
          <div className="lg:w-80">
            <div className="bg-gradient-to-br from-white via-white to-purple-50/20 backdrop-blur-xl rounded-3xl border-2 border-purple-300/40 shadow-2xl p-6 transition-all duration-300 hover:shadow-3xl hover:border-purple-400/50">
              <h2 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-5 flex items-center gap-2 pb-3 border-b-2 border-purple-200/50">
                <BarChart3 size={20} className="text-purple-500" />
                Tokens
              </h2>
              <div className="space-y-3">
                {pooledTokensData.length > 0 ? (
                  pooledTokensData.map((token) => (
                    <PoolTokenCard
                      key={token.tokenAddress}
                      token={token}
                      isSelected={selectedPoolToken === token.tokenAddress}
                      onClick={() => setSelectedPoolToken(token.tokenAddress)}
                    />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Loader size={24} className="animate-spin mx-auto mb-2" />
                    <p className="text-sm">Loading tokens...</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Content - Pools Table */}
          <div className="flex-1">
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
              {/* Enhanced Table Header */}
              <div className="px-8 py-6 border-b border-white/20 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {
                        pooledTokensData.find(
                          (t) => t.tokenAddress === selectedPoolToken,
                        )?.name
                      }
                    </h2>
                    {/* Tabs */}
                    <div className="flex gap-2">
                      {user?.role !== "superuser" && (
                        <button
                          onClick={() => setActiveTab("Reports")}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                            activeTab === "Reports"
                              ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                              : "text-gray-600 hover:text-gray-900 bg-white/50 hover:bg-white border border-gray-200"
                          }`}
                        >
                          <FileText size={18} />
                          Reports
                        </button>
                      )}
                      <button
                        onClick={() => setActiveTab("Pools")}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold transition-all duration-300 ${
                          activeTab === "Pools"
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                            : "text-gray-600 hover:text-gray-900 bg-white/50 hover:bg-white border border-gray-200"
                        }`}
                      >
                        <BarChart3 size={18} />
                        Pool-Wise Ledger
                      </button>
                    </div>
                  </div>

                  {(loading || reportsLoading) && (
                    <div className="flex items-center gap-3 text-sm text-purple-600 bg-white/50 px-4 py-2 rounded-2xl border border-white/20">
                      <Loader size={16} className="animate-spin" />
                      Updating data...
                    </div>
                  )}
                </div>
              </div>

              {/* Conditional Table Rendering */}
              {activeTab === "Reports" ? (
                <>
                  {/* Reports Sub-Tabs */}
                  <div className="px-8 py-4 border-b border-gray-200 bg-white">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReportsSubTab("cpmm")}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                          reportsSubTab === "cpmm"
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                            : "text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-300"
                        }`}
                      >
                        CPMM Pools
                      </button>
                      {/* <button
                        onClick={() => setReportsSubTab("clmm")}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                          reportsSubTab === "clmm"
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                            : "text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-300"
                        }`}
                      >
                        CLMM
                      </button> */}
                    </div>
                  </div>

                  {/* Reports Table Container - Separate Div with Bottom Scrollbar */}
                  {reportsData.length > 0 ? (
                    <div className="w-full border-t border-gray-200">
                      <div
                        className="flex-1 overflow-x-scroll overflow-y-visible pb-2"
                        style={{
                          scrollbarWidth: "thin",
                          scrollbarColor: "#8B5CF6 #f1f5f9",
                        }}
                      >
                        <table className="w-auto border-collapse">
                          <thead className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 border-b-2 border-purple-200">
                            <tr>
                              {reportsTableColumns.map((column) => (
                                <th
                                  key={column.key}
                                  className={`px-4 py-3 text-center text-xs font-bold text-purple-700 uppercase tracking-wider whitespace-nowrap ${column.width} bg-gradient-to-r from-purple-50/50 to-blue-50/50`}
                                >
                                  {column.label.split("\n").map((line, i) => (
                                    <div key={i}>{line}</div>
                                  ))}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-100">
                            {reportsData.map((report, index) => (
                              <tr
                                key={report._id || index}
                                className="hover:bg-purple-50/50 transition-colors duration-150"
                              >
                                {reportsTableColumns.map((column) => {
                                  const value = report[column.key];
                                  let displayValue = "N/A";

                                  if (
                                    value !== null &&
                                    value !== undefined &&
                                    value !== ""
                                  ) {
                                    if (column.key === "endTime") {
                                      displayValue = formatDate(value);
                                    } else if (
                                      column.key === "totalVolume" ||
                                      column.key === "agentsVolume" ||
                                      column.key === "resetsVolume" ||
                                      column.key === "gasFeeInDollars" ||
                                      column.key === "cost" ||
                                      column.key === "expectedCost" ||
                                      column.key === "netCost" ||
                                      column.key === "totalCost" ||
                                      // column.key === "walletLoss" ||
                                      column.key === "pP" ||
                                      column.key === "lpAdd" ||
                                      column.key === "poolRayFee" ||
                                      column.key === "mmRayCost" ||
                                      column.key === "slipageAndloss"
                                    ) {
                                      displayValue = formatCompactNumber(value);
                                    } else if (typeof value === "number") {
                                      displayValue = value.toLocaleString(
                                        "en-US",
                                        {
                                          maximumFractionDigits: 4,
                                          minimumFractionDigits: 0,
                                        },
                                      );
                                    } else {
                                      displayValue = String(value);
                                    }
                                  }

                                  return (
                                    <td
                                      key={column.key}
                                      className={`px-4 py-3 text-center text-sm text-gray-900 whitespace-nowrap ${column.width}`}
                                    >
                                      {column.key === "endTime" ? (
                                        <div className="flex items-center justify-center gap-2">
                                          <span className="font-medium text-gray-900">
                                            {displayValue}
                                          </span>
                                          <button
                                            onClick={(e) =>
                                              handleViewDetails(report, e)
                                            }
                                            className="p-1 hover:bg-purple-100 rounded-full transition-colors duration-200 text-purple-600 hover:text-purple-700"
                                            title="View Details"
                                          >
                                            <Eye size={16} />
                                          </button>
                                        </div>
                                      ) : (
                                        <span className="font-medium text-gray-900">
                                          {displayValue}
                                        </span>
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ) : (
                    <div className="px-8 py-20 text-center border-t border-gray-200 bg-white">
                      <div className="flex flex-col items-center justify-center">
                        <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center border border-purple-200 shadow-2xl">
                          <FileText className="h-12 w-12 text-purple-500" />
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-3">
                          No reports found
                        </h3>
                        <p className="text-gray-600 max-w-md mx-auto text-lg">
                          {`No reports available for ${
                            pooledTokensData.find(
                              (t) => t.tokenAddress === selectedPoolToken,
                            )?.name || "this token"
                          }.`}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Reports Table Footer */}
                  {reportsData.length > 0 && (
                    <div className="px-8 py-6 border-t border-white/20 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-gray-600">
                          Showing{" "}
                          <span className="font-semibold text-gray-900">
                            {(reportsCurrentPage - 1) * reportsRowsPerPage + 1}
                          </span>{" "}
                          to{" "}
                          <span className="font-semibold text-gray-900">
                            {Math.min(
                              reportsCurrentPage * reportsRowsPerPage,
                              reportsTotalCount,
                            )}
                          </span>{" "}
                          of{" "}
                          <span className="font-semibold text-gray-900">
                            {reportsTotalCount}
                          </span>{" "}
                          reports
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              handleReportsPageChange(reportsCurrentPage - 1)
                            }
                            disabled={reportsCurrentPage === 1}
                            className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
                              reportsCurrentPage === 1
                                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                                : "border-gray-300 hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            &lt; Previous
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from(
                              { length: Math.min(5, reportsTotalPages) },
                              (_, i) => {
                                let pageNum;
                                if (reportsTotalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (reportsCurrentPage <= 3) {
                                  pageNum = i + 1;
                                } else if (
                                  reportsCurrentPage >=
                                  reportsTotalPages - 2
                                ) {
                                  pageNum = reportsTotalPages - 4 + i;
                                } else {
                                  pageNum = reportsCurrentPage - 2 + i;
                                }
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() =>
                                      handleReportsPageChange(pageNum)
                                    }
                                    className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                                      reportsCurrentPage === pageNum
                                        ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                                        : "border border-gray-300 hover:bg-gray-50 text-gray-700"
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              },
                            )}
                            {reportsTotalPages > 5 &&
                              reportsCurrentPage < reportsTotalPages - 2 && (
                                <span className="px-2 text-gray-500">...</span>
                              )}
                            {reportsTotalPages > 5 &&
                              reportsCurrentPage < reportsTotalPages - 1 && (
                                <button
                                  onClick={() =>
                                    handleReportsPageChange(reportsTotalPages)
                                  }
                                  className="px-3 py-2 text-sm font-medium border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 transition-colors"
                                >
                                  {reportsTotalPages}
                                </button>
                              )}
                          </div>
                          <button
                            onClick={() =>
                              handleReportsPageChange(reportsCurrentPage + 1)
                            }
                            disabled={reportsCurrentPage === reportsTotalPages}
                            className={`px-4 py-2 text-sm font-medium border rounded-lg transition-colors ${
                              reportsCurrentPage === reportsTotalPages
                                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                                : "border-gray-300 hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            Next &gt;
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Pools Sub-Tabs */}
                  <div className="px-8 py-4 border-b border-gray-200 bg-white">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setPoolsSubTab("cpmm")}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                          poolsSubTab === "cpmm"
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                            : "text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-300"
                        }`}
                      >
                        CPMM Pools
                      </button>
                      {/* <button
                        onClick={() => setPoolsSubTab("clmm")}
                        className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 ${
                          poolsSubTab === "clmm"
                            ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white shadow-md"
                            : "text-gray-600 hover:text-gray-900 bg-gray-100 hover:bg-gray-200 border border-gray-300"
                        }`}
                      >
                        CLMM
                      </button> */}
                    </div>
                  </div>

                  {/* Pools Table */}
                  <div className="flex-1 overflow-x-auto overflow-y-visible">
                    <table className="w-full min-w-[800px]">
                      <thead className="bg-gradient-to-r from-purple-50/50 to-blue-50/50 border-b border-white/20">
                        <tr>
                          {tableColumns.map((column) => (
                            <th
                              key={column.key}
                              className={`px-1 py-2 text-left text-xs font-bold text-purple-700 uppercase tracking-wider ${column.width}`}
                            >
                              <button
                                onClick={() =>
                                  column.sortable && handleSort(column.key)
                                }
                                className={`flex items-center gap-2 transition-all duration-200 ${
                                  column.sortable
                                    ? "cursor-pointer hover:text-purple-900 hover:scale-105"
                                    : ""
                                }`}
                              >
                                {column.label}
                                {column.sortable && (
                                  <ChevronDown
                                    size={16}
                                    className={`transition-transform ${
                                      sortConfig.key === column.key &&
                                      sortConfig.direction === "desc"
                                        ? "rotate-0"
                                        : "rotate-180"
                                    }`}
                                  />
                                )}
                              </button>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/20">
                        {paginatedPools.length > 0 ? (
                          paginatedPools.map((pool, index) => (
                            <tr
                              key={pool.id}
                              onClick={() => handlePoolClick(pool)}
                              className="group hover:bg-gradient-to-r hover:from-purple-50/30 hover:to-blue-50/30 transition-all duration-500 cursor-pointer"
                              style={{
                                animation: `fadeInUp 0.6s ease-out ${
                                  index * 50
                                }ms both`,
                              }}
                            >
                              {/* Pool */}
                              <td className="px-1 py-2">
                                <PoolDisplay pool={pool} />
                              </td>

                              {/* Liquidity */}
                              <td className="px-1 py-2">
                                <div className="text-sm font-bold text-gray-900 bg-gradient-to-r from-amber-50/80 to-yellow-50/80 px-2 py-2 rounded-2xl border border-amber-200/50 text-center backdrop-blur-sm shadow-sm">
                                  {formatCompactNumber(pool.liquidityAmount)}
                                </div>
                              </td>

                              {/* Volume 24H */}
                              <td className="px-1 py-2">
                                <div className="text-sm font-bold text-gray-900 bg-gradient-to-r from-blue-50/80 to-cyan-50/80 px-2 py-2 rounded-2xl border border-blue-200/50 text-center backdrop-blur-sm shadow-sm">
                                  {formatCompactNumber(pool.volume24h)}
                                </div>
                              </td>

                              {/* Fees 24H */}
                              <td className="px-1 py-2">
                                <div className="text-sm font-bold text-gray-900 bg-gradient-to-r from-purple-50/80 to-pink-50/80 px-2 py-2 rounded-2xl border border-purple-200/50 text-center backdrop-blur-sm shadow-sm">
                                  {formatCompactNumber(pool.fees24h)}
                                </div>
                              </td>

                              {/* APR 24H */}
                              <td className="px-1 py-2">
                                <div
                                  className={`inline-flex items-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border transition-all duration-300 backdrop-blur-sm ${
                                    pool.apr24h > 0
                                      ? pool.apr24h >= 999
                                        ? "bg-gradient-to-r from-red-50/80 to-pink-50/80 text-red-700 border-red-200/50"
                                        : "bg-gradient-to-r from-green-50/80 to-emerald-50/80 text-green-700 border-green-200/50"
                                      : "bg-gray-50/80 text-gray-600 border-gray-200/50"
                                  }`}
                                >
                                  {pool.apr24h > 0 && (
                                    <TrendingUp
                                      size={16}
                                      className={
                                        pool.apr24h >= 999
                                          ? "text-red-500"
                                          : "text-green-500"
                                      }
                                    />
                                  )}
                                  {pool.apr24h >= 999
                                    ? ">999.99%"
                                    : pool.apr24h > 0
                                      ? `${pool.apr24h.toFixed(2)}%`
                                      : "0%"}
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={tableColumns.length}
                              className="px-8 py-20"
                            >
                              <div className="text-center">
                                <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-purple-100 to-blue-100 rounded-full flex items-center justify-center border border-purple-200 shadow-2xl">
                                  <BarChart3 className="h-12 w-12 text-purple-500" />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                                  No pools found
                                </h3>
                                <p className="text-gray-600 max-w-md mx-auto text-lg mb-6">
                                  {`No pools available in ${
                                    pooledTokensData.find(
                                      (t) =>
                                        t.tokenAddress === selectedPoolToken,
                                    )?.name || "this token"
                                  }.`}
                                </p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pools Table Footer */}
                  <div className="px-8 py-6 border-t border-white/20 bg-gradient-to-r from-purple-50/50 to-blue-50/50">
                    {paginatedPools.length > 0 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-xs text-gray-600">
                          Showing{" "}
                          <span className="font-semibold text-gray-900">
                            {paginatedPools.length}
                          </span>{" "}
                          of{" "}
                          <span className="font-semibold text-gray-900">
                            {currentPools.length}
                          </span>{" "}
                          pools (Page {poolsCurrentPage} of {poolsTotalPages})
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              handlePoolsPageChange(poolsCurrentPage - 1)
                            }
                            disabled={poolsCurrentPage === 1}
                            className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
                              poolsCurrentPage === 1
                                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                                : "border-gray-300 hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            Previous
                          </button>
                          <div className="flex items-center gap-1">
                            {Array.from(
                              { length: Math.min(5, poolsTotalPages) },
                              (_, i) => {
                                let pageNum;
                                if (poolsTotalPages <= 5) {
                                  pageNum = i + 1;
                                } else if (poolsCurrentPage <= 3) {
                                  pageNum = i + 1;
                                } else if (
                                  poolsCurrentPage >=
                                  poolsTotalPages - 2
                                ) {
                                  pageNum = poolsTotalPages - 4 + i;
                                } else {
                                  pageNum = poolsCurrentPage - 2 + i;
                                }
                                return (
                                  <button
                                    key={pageNum}
                                    onClick={() =>
                                      handlePoolsPageChange(pageNum)
                                    }
                                    className={`px-2 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                                      poolsCurrentPage === pageNum
                                        ? "bg-blue-600 text-white"
                                        : "border border-gray-300 hover:bg-gray-50 text-gray-700"
                                    }`}
                                  >
                                    {pageNum}
                                  </button>
                                );
                              },
                            )}
                          </div>
                          <button
                            onClick={() =>
                              handlePoolsPageChange(poolsCurrentPage + 1)
                            }
                            disabled={poolsCurrentPage === poolsTotalPages}
                            className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${
                              poolsCurrentPage === poolsTotalPages
                                ? "border-gray-200 text-gray-400 cursor-not-allowed"
                                : "border-gray-300 hover:bg-gray-50 text-gray-700"
                            }`}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* TableRowModal */}
      <TableRowModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        rowData={selectedRowData}
        type={activeTab === "Reports" ? "report" : "pool"}
      />

      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shine-border {
          0%, 100% {
            background: linear-gradient(135deg, #FF6B00, #FFD700, #FF8C00);
            filter: drop-shadow(0 0 10px rgba(255, 107, 0, 0.5)) drop-shadow(0 0 20px rgba(255, 215, 0, 0.3));
          }
          50% {
            background: linear-gradient(135deg, #FFD700, #FF8C00, #FFD700);
            filter: drop-shadow(0 0 15px rgba(255, 215, 0, 0.7)) drop-shadow(0 0 30px rgba(255, 140, 0, 0.4));
          }
        }
        
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-10px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes bounce-x {
          0%, 100% {
            transform: translateX(0);
          }
          50% {
            transform: translateX(4px);
          }
        }
        
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 0.5;
          }
        }
        
        .animate-bounce-x {
          animation: bounce-x 1.5s ease-in-out infinite;
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        .animate-shine-border {
          animation: shine-border 2.5s ease-in-out infinite;
        }
        
        .shadow-3xl {
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        /* Custom Scrollbar Styles for Reports Table */
        .overflow-x-scroll::-webkit-scrollbar,
        .overflow-x-auto::-webkit-scrollbar {
          height: 14px;
        }
        
        .overflow-x-scroll::-webkit-scrollbar-track,
        .overflow-x-auto::-webkit-scrollbar-track {
          background: #f1f5f9;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
        }
        
        .overflow-x-scroll::-webkit-scrollbar-thumb,
        .overflow-x-auto::-webkit-scrollbar-thumb {
          background: linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%);
          border-radius: 8px;
          border: 2px solid #f1f5f9;
          min-width: 50px;
        }
        
        .overflow-x-scroll::-webkit-scrollbar-thumb:hover,
        .overflow-x-auto::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(135deg, #7C3AED 0%, #2563EB 100%);
        }
        
        /* Firefox scrollbar */
        .overflow-x-scroll {
          scrollbar-width: thin;
          scrollbar-color: #8B5CF6 #f1f5f9;
        }
        
        .flex-1 {
          flex: 1 1 0%;
          overflow: auto;
        }
      `}</style>
    </div>
  );
};
export default PoolTable;
