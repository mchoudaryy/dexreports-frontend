import { useState, useEffect, useRef } from "react";

import { useNavigate } from "react-router-dom";

import {

  Wallet,

  Eye,

  Users,

  Clock,

  Download,

  RefreshCw,

  Copy,

  Activity,

} from "lucide-react";

import { ADMIN_API } from "../services/ApiHandlers";

import toast from "react-hot-toast";

import TokenWalletsSummary from "./TokenWalletsSummary";



const TokenWallets = ({ tokenId, tokenAddress, networkId, platformId }) => {

  const navigate = useNavigate();

  const [wallets, setWallets] = useState([]);

  const [loadingWallets, setLoadingWallets] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");



  useEffect(() => {

    const timer = setTimeout(() => {

      setDebouncedSearchTerm(searchTerm);

    }, 500);

    return () => clearTimeout(timer);

  }, [searchTerm]);

  const [tokenSummaries, setTokenSummaries] = useState({});

  const [tokenName, setTokenName] = useState("");

  // Pagination state

  const [pagination, setPagination] = useState({

    currentPage: 1,

    totalPages: 1,

    limit: 10,

    count: 0,

  });

  const paginationRef = useRef(pagination);

  useEffect(() => {

    paginationRef.current = pagination;

  }, [pagination]);


  // Format numbers with proper formatting

  const formatNumber = (num, decimals = 2) => {

    if (

      num === null ||

      num === undefined ||

      isNaN(num) ||

      typeof num !== "number"

    ) {

      return "0";

    }

    return new Intl.NumberFormat("en-US", {

      minimumFractionDigits: decimals,

      maximumFractionDigits: decimals,

    }).format(num);

  };



  const formatLargeNumber = (num) => {

    if (

      num === null ||

      num === undefined ||

      isNaN(num) ||

      typeof num !== "number"

    ) {

      return "0";

    }

    if (num >= 1000000) {

      return (num / 1000000).toFixed(2) + "M";

    } else if (num >= 1000) {

      return (num / 1000).toFixed(2) + "K";

    }

    return formatNumber(num, 0);

  };



  // Format UTC timestamp to readable format

  const formatTimestamp = (dateString) => {

    if (!dateString) return "No activity";



    try {

      const date = new Date(dateString);



      // Check if date is valid

      if (isNaN(date.getTime())) {

        return "Invalid date";

      }



      // Convert UTC to local time for display

      const year = date.getFullYear();

      const month = String(date.getMonth() + 1).padStart(2, "0");

      const day = String(date.getDate()).padStart(2, "0");

      const hours = String(date.getHours()).padStart(2, "0");

      const minutes = String(date.getMinutes()).padStart(2, "0");

      const seconds = String(date.getSeconds()).padStart(2, "0");



      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    } catch (error) {

      console.error("Error formatting date:", error);

      return "Date error";

    }

  };



  // Check if activity is recent (within last 24 hours)

  const isRecentActivity = (dateString) => {

    if (!dateString) return false;

    try {

      const activityDate = new Date(dateString);

      const now = new Date();

      const diffHours = (now - activityDate) / (1000 * 60 * 60);

      return diffHours < 24;

    } catch (error) {

      return false;

    }

  };



  // Truncate a wallet address

  const truncateAddress = (addr) => {

    if (!addr) return "";

    if (addr.length <= 10) return addr;

    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  };



  // Copy address to clipboard and show a toast via react-hot-toast

  const copyAddress = async (addr) => {

    if (!addr) return;

    try {

      await navigator.clipboard.writeText(addr);

      toast.success("Copied!");

    } catch (err) {

      console.error("Copy failed:", err);

      toast.error("Copy failed");

    }

  };



  // Filter wallets based on search

  const filteredWallets = wallets;



  // Fetch wallets with pagination

  const fetchTokenWallets = async (page, limit, showLoading = true) => {

    try {

      const timestamp = new Date().toLocaleTimeString();

      console.log(`[${timestamp}] API call started for page: ${page}, limit: ${limit}, search: ${debouncedSearchTerm}`);

      if (showLoading) setLoadingWallets(true);

      const [walletsResponse, swapsResponse] = await Promise.all([

        ADMIN_API.GET_WALLETS({ tokenId, tokenAddress, walletAddress: debouncedSearchTerm, page, limit }),

        ADMIN_API.GET_SWAPS_DATA(),

      ]);

      console.log(`[${timestamp}] API call completed successfully`);



      if (walletsResponse && walletsResponse.status === 200) {

        console.log("tokenWallets mapping wallet:", walletsResponse);

        setTokenSummaries(walletsResponse.data.tokenSummaries);

        setTokenName(walletsResponse.data.tokenSummaries[0]?.tokenName || "");



        // Update pagination state from API response

        setPagination({

          currentPage: walletsResponse.data.currentPage || page,

          totalPages: walletsResponse.data.totalPages || 1,

          limit: walletsResponse.data.limit || limit,

          count: walletsResponse.data.count || 0,

        });



        const swapsMap = {};

        if (swapsResponse && swapsResponse.data?.data) {

          swapsResponse.data.data.forEach((swap) => {

            if (swap.walletAddress && swap.pairSymbol) {

              swapsMap[swap.walletAddress] = swap.pairSymbol;

            }

          });

        }



        let tokenWallets = walletsResponse.data.data

          .filter((wallet) => wallet.tokenId?._id === tokenId)

          .map((wallet) => ({

            _id: wallet._id,

            address: wallet.walletAddress,

            createdAt: wallet.createdAt,

            totalTokens: wallet.overview?.valueInTokens || 0,

            solBalance: wallet.overview?.solValue || 0,

            totalValue: wallet.overview?.total_value || 0,

            lastActivity: wallet.transaction?.time || null,

            idleTokensValue: wallet.overview?.valueInUSD || 0,

            solBalanceValue: wallet.overview?.solValueInUSD || 0,

            // pairSymbol: swapsMap[wallet.walletAddress] || null,

            pairSymbol: wallet.symbol || null,

          }));



        setWallets(tokenWallets);

      }

    } catch (error) {

      const timestamp = new Date().toLocaleTimeString();

      console.error(`[${timestamp}] API call failed:`, error);

    } finally {

      setLoadingWallets(false);

    }

  };



  // Handle wallet click

  const handleWalletClick = (walletAddress) => {

    if (networkId && tokenId) {

      navigate(

        `/wallet/${networkId}/${platformId}/${tokenId}/${tokenAddress}/${walletAddress}`

      );

    }

  };



  // Load wallets on component mount

  useEffect(() => {

    setPagination((prev) => ({ ...prev, currentPage: 1 }));

    fetchTokenWallets(1, pagination.limit);



    const intervalId = setInterval(() => {

      const timestamp = new Date().toLocaleTimeString();

      console.log(

        `[${timestamp}] Auto-refreshing wallet data on page ${paginationRef.current.currentPage}...`

      );

      fetchTokenWallets(

        paginationRef.current.currentPage || 1,

        paginationRef.current.limit || 10,

        false

      );

    }, 5 * 1000);



    return () => clearInterval(intervalId);

  }, [tokenId, tokenAddress, debouncedSearchTerm]);



  // Handle page change

  const handlePageChange = (newPage) => {

    if (newPage < 1 || newPage > pagination.totalPages || newPage === pagination.currentPage) {

      return;

    }

    paginationRef.current.currentPage = newPage;

    fetchTokenWallets(newPage, pagination.limit);

  };



  return (

    <div className="mx-auto font-sans">

      {/* Compact Header */}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 mb-4">

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">

          {/* Left Section */}

          <div className="flex items-center gap-3">

            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">

              <Users size={18} className="text-white" />

            </div>

            <div>

              <h1 className="text-lg font-semibold text-gray-900">

                {tokenName} Wallets

              </h1>

              <p className="text-xs text-gray-500 mt-0.5">

                Monitor token distributions and wallet activity

              </p>

            </div>

          </div>



          {/* Search and Actions */}

          <div className="flex items-center gap-2 w-full sm:w-auto">

            <div className="relative flex-1 sm:flex-none">

              <input

                type="text"

                placeholder="Search wallets..."

                value={searchTerm}

                onChange={(e) => setSearchTerm(e.target.value)}

                className="pl-9 pr-10 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-56"

              />

              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">

                <svg

                  className="w-4 h-4 text-gray-400"

                  fill="none"

                  stroke="currentColor"

                  viewBox="0 0 24 24"

                >

                  <path

                    strokeLinecap="round"

                    strokeLinejoin="round"

                    strokeWidth={2}

                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"

                  />

                </svg>

              </div>

              {searchTerm && (

                <button

                  onClick={() => setSearchTerm("")}

                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"

                  title="Clear search"

                >

                  <svg

                    className="w-4 h-4"

                    fill="none"

                    stroke="currentColor"

                    viewBox="0 0 24 24"

                  >

                    <path

                      strokeLinecap="round"

                      strokeLinejoin="round"

                      strokeWidth={2}

                      d="M6 18L18 6M6 6l12 12"

                    />

                  </svg>

                </button>

              )}

            </div>

          </div>

        </div>

      </div>



      {/* Summary Cards - Compact */}

      {!loadingWallets && tokenSummaries && (

        <div className="mb-4">

          <TokenWalletsSummary tokenSummaries={tokenSummaries} />

        </div>

      )}



      {/* Compact Table */}

      {loadingWallets ? (

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">

          <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>

          <h3 className="text-base font-semibold text-gray-700 mb-2">

            Loading Wallets

          </h3>

          <p className="text-sm text-gray-500">Fetching your wallet data...</p>

        </div>

      ) : filteredWallets.length > 0 ? (

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          <div className="overflow-x-auto">

            <table className="w-full min-w-[800px] text-sm">

              <thead className="bg-gray-50 border-b border-gray-200">

                <tr>

                  <th className="px-4 py-3 text-center">

                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">

                      Wallet

                    </span>

                  </th>

                  <th className="px-4 py-3 text-center">

                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">

                      Token Pair

                    </span>

                  </th>

                  <th className="px-4 py-3 text-center">

                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">

                      Tokens

                    </span>

                  </th>

                  <th className="px-4 py-3 text-center">

                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">

                      SOL

                    </span>

                  </th>

                  <th className="px-4 py-3 text-center">

                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">

                      Total Value

                    </span>

                  </th>

                  <th className="px-4 py-3 text-center">

                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">

                      Last Activity

                    </span>

                  </th>

                  <th className="px-4 py-3 text-center">

                    <span className="text-xs font-semibold text-gray-700 uppercase tracking-wider">

                      Actions

                    </span>

                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-200">

                {filteredWallets.map((wallet, index) => {

                  const isRecent = isRecentActivity(wallet.lastActivity);



                  return (

                    <tr

                      key={wallet._id}

                      className="hover:bg-blue-50/50 transition-colors"

                    >

                      {/* Wallet Address - Compact */}

                      <td className="px-4 py-3 text-center">

                        <div className="flex items-center justify-center gap-3">

                          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">

                            <Wallet size={14} className="text-blue-600" />

                          </div>

                          <div className="min-w-0">

                            <div className="flex items-center gap-1.5">

                              <button

                                onClick={() => copyAddress(wallet.address)}

                                title={wallet.address}

                                className="font-mono text-xs font-medium text-gray-900 hover:text-blue-600 truncate max-w-[120px]"

                              >

                                {truncateAddress(wallet.address)}

                              </button>

                              <button

                                onClick={() => copyAddress(wallet.address)}

                                className="p-1 hover:bg-gray-100 rounded"

                              >

                                <Copy size={12} className="text-gray-400" />

                              </button>

                            </div>

                          </div>

                        </div>

                      </td>



                      {/* Token Pair */}

                      <td className="px-4 py-3 text-center">

                        <div className="whitespace-nowrap">

                          <span className="text-sm font-semibold text-gray-900">

                            {wallet.pairSymbol ? (

                              <span className="inline-block px-3 py-1  text-black-800 rounded-lg text-xs font-bold">

                                {wallet.pairSymbol}

                              </span>

                            ) : (

                              <span className="text-gray-400">—</span>

                            )}

                          </span>

                        </div>

                      </td>



                      {/* Tokens */}

                      <td className="px-4 py-3 text-center">

                        <div className="whitespace-nowrap">

                          <span className="text-sm font-semibold text-gray-900">

                            {formatLargeNumber(wallet.totalTokens)}

                          </span>

                          <span className="ml-1 text-xs text-gray-500">

                            (${formatNumber(wallet.idleTokensValue)})

                          </span>

                        </div>

                      </td>



                      {/* SOL Balance */}

                      <td className="px-4 py-3 text-center">

                        <div className="whitespace-nowrap">

                          <span className="text-sm font-semibold text-gray-900">

                            {formatNumber(parseFloat(wallet.solBalance), 3)} SOL

                          </span>

                          <span className="ml-1 text-xs text-gray-500">

                            (${formatNumber(wallet.solBalanceValue)})

                          </span>

                        </div>

                      </td>



                      {/* Total Value */}

                      <td className="px-4 py-3 text-center">

                        <div className="whitespace-nowrap">

                          <span className="text-base font-bold text-gray-900">

                            ${formatNumber(wallet.totalValue)}

                          </span>

                        </div>

                      </td>



                      {/* Last Activity - Compact */}

                      <td className="px-4 py-3 text-center">

                        <div className="flex justify-center items-center">

                          <div

                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium whitespace-nowrap ${

                              isRecent

                                ? "bg-green-100 text-green-700"

                                : "bg-gray-100 text-gray-600"

                            }`}

                          >

                            {isRecent ? (

                              <Activity size={10} className="text-green-600" />

                            ) : (

                              <Clock size={10} className="text-gray-500" />

                            )}

                            <span className="text-xs">

                              {formatTimestamp(wallet.lastActivity)}

                            </span>

                            {isRecent && (

                              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>

                            )}

                          </div>

                        </div>

                      </td>



                      {/* Actions - Compact */}

                      <td className="px-4 py-3 text-center">

                        <div className="flex justify-center">

                          <button

                            onClick={() => handleWalletClick(wallet.address)}

                            className="flex items-center justify-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded-lg hover:bg-blue-700 transition-colors"

                          >

                            <Eye size={12} />

                            View

                          </button>

                        </div>

                      </td>

                    </tr>

                  );

                })}

              </tbody>

            </table>

          </div>

        </div>

      ) : (

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">

          <div className="w-16 h-16 mx-auto mb-4 rounded-xl bg-gray-100 flex items-center justify-center">

            <Wallet size={24} className="text-gray-400" />

          </div>

          <h3 className="text-base font-semibold text-gray-700 mb-2">

            No wallets found

          </h3>

          <p className="text-sm text-gray-500 mb-4">

            {searchTerm

              ? "Try adjusting your search criteria"

              : "No wallets are currently associated with this token."}

          </p>

          <button

            onClick={() => fetchTokenWallets(1, pagination.limit || 10)}

            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"

          >

            <RefreshCw size={14} />

            Refresh Data

          </button>

        </div>

      )}



      {/* Compact Footer with Pagination */}

      {wallets.length > 0 && (

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-1">

          <p className="text-xs text-gray-600">

            Showing{" "}

            <span className="font-semibold text-gray-900">

              {searchTerm ? filteredWallets.length : wallets.length}

            </span>{" "}

            {searchTerm ? "filtered" : ""} of{" "}

            <span className="font-semibold text-gray-900">

              {pagination.count}

            </span>{" "}

            wallets (Page {pagination.currentPage} of {pagination.totalPages})

          </p>

          <div className="flex gap-2">

            <button

              onClick={() => handlePageChange(pagination.currentPage - 1)}

              disabled={pagination.currentPage === 1}

              className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${

                pagination.currentPage === 1

                  ? "border-gray-200 text-gray-400 cursor-not-allowed"

                  : "border-gray-300 hover:bg-gray-50 text-gray-700"

              }`}

            >

              Previous

            </button>

            <div className="flex items-center gap-1">

              {(() => {

                const { currentPage, totalPages } = pagination;

                const pages = [];

                

                if (totalPages <= 7) {

                  for (let i = 1; i <= totalPages; i++) pages.push(i);

                } else {

                  // Always show first page

                  pages.push(1);

                  

                  if (currentPage > 3) {

                    pages.push("...");

                  }

                  

                  // Calculate range around current page

                  let start = Math.max(2, currentPage - 1);

                  let end = Math.min(totalPages - 1, currentPage + 1);

                  

                  // Adjust range if at boundaries

                  if (currentPage <= 3) {

                    end = 4;

                  } else if (currentPage >= totalPages - 2) {

                    start = totalPages - 3;

                  }

                  

                  for (let i = start; i <= end; i++) {

                    if (!pages.includes(i)) pages.push(i);

                  }

                  

                  if (currentPage < totalPages - 2) {

                    pages.push("...");

                  }

                  

                  // Always show last page

                  if (!pages.includes(totalPages)) pages.push(totalPages);

                }



                return pages.map((page, index) => (

                  <button

                    key={index}

                    onClick={() => page !== "..." && handlePageChange(page)}

                    disabled={page === "..."}

                    className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${

                      page === "..."

                        ? "text-gray-400 cursor-default"

                        : currentPage === page

                        ? "bg-blue-600 text-white"

                        : "border border-gray-300 hover:bg-gray-50 text-gray-700"

                    }`}

                  >

                    {page}

                  </button>

                ));

              })()}

            </div>

            <button

              onClick={() => handlePageChange(pagination.currentPage + 1)}

              disabled={pagination.currentPage === pagination.totalPages}

              className={`px-3 py-1.5 text-xs font-medium border rounded-lg transition-colors ${

                pagination.currentPage === pagination.totalPages

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

  );

};



export default TokenWallets;

