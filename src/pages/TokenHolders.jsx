import { useState, useEffect } from "react";
import {
  Users,
  Coins,
  CircleDollarSign,
  Calendar,
  Award,
  UserCheck,
  Wallet,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  Banknote,
  PieChart,
  Copy,
} from "lucide-react";
import { ADMIN_API } from "../services/ApiHandlers";
import toast from "react-hot-toast";

const TokenHolders = ({ tokenAddress, tokenInfo, liveTokenData }) => {
  const [holders, setHolders] = useState([]);
  const [loadingHolders, setLoadingHolders] = useState(false);
  const [currentHoldersPage, setCurrentHoldersPage] = useState(1);
  const [holdersRowsPerPage, setHoldersRowsPerPage] = useState(10);
  const [holdersPagination, setHoldersPagination] = useState({
    totalHolders: 0,
    totalPages: 0,
    currentPage: 1,
  });
  const [pooledSolAndTokens, setPooledSolAndTokens] = useState(null);

  // Format numbers
  const formatCount = (num) => {
    if (!num || num === 0) return "0";
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    } else if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    } else {
      return num?.toString() || "0";
    }
  };

  const formatNumber = (num) => {
    if (!num || num === 0) return "$0";
    if (num >= 1000000000) {
      return `$${(num / 1000000000).toFixed(2)}B`;
    } else if (num >= 1000000) {
      return `$${(num / 1000000).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else {
      return `$${num?.toFixed(2) || "0"}`;
    }
  };

  // GET_POOLED_SOL_AND_TOKENS
  const fetchPooledSolAndTokens = async () => {
    try {
      const response = await ADMIN_API.GET_POOLED_SOL_AND_TOKENS({
        tokenAddress: tokenAddress,
        chainId: tokenInfo.chainId,
      });
      console.log("GET_POOLED_SOL_AND_TOKENS response:", response);
      if (response && response.status === 200 && response.data) {
        setPooledSolAndTokens(response.data);
      }
    } catch (error) {
      console.log("Error in fetchPooledSolAndTokens:", error);
    }
  };

  useEffect(() => {
    fetchPooledSolAndTokens();
  }, []);

  // Fetch token holders with pagination
  const fetchTokenHoldersList = async (
    page = currentHoldersPage,
    pageSize = holdersRowsPerPage
  ) => {
    try {
      setLoadingHolders(true);
      const response = await ADMIN_API.TOKEN_HOLDER_LIST({
        tokenAddress: tokenAddress,
        page: page,
        pageSize: pageSize,
      });

      console.log("TOKEN_HOLDER_LIST response:", response);

      if (response.data.holders && Array.isArray(response.data.holders)) {
        setHolders(response.data.holders);
        setHoldersPagination({
          totalHolders: response.data.totalHolders || 0,
          totalPages: response.data.totalPages || 1,
          currentPage: response.data.page || 1,
        });
      } else {
        setHolders([]);
        setHoldersPagination({
          totalHolders: 0,
          totalPages: 0,
          currentPage: 1,
        });
      }
    } catch (error) {
      console.log("Error in fetchTokenHoldersList:", error);
      setHolders([]);
    } finally {
      setLoadingHolders(false);
    }
  };

  // Token Holders Pagination Functions
  const handleHoldersPageChange = async (pageNumber) => {
    if (pageNumber < 1 || pageNumber > holdersPagination.totalPages) return;
    setCurrentHoldersPage(pageNumber);
    await fetchTokenHoldersList(pageNumber, holdersRowsPerPage);
  };

  const handleHoldersRowsPerPageChange = async (value) => {
    const newPageSize = Number(value);
    setHoldersRowsPerPage(newPageSize);
    setCurrentHoldersPage(1);
    await fetchTokenHoldersList(1, newPageSize);
  };

  const getHoldersPageNumbers = () => {
    const totalPages = holdersPagination.totalPages;
    const currentPage = currentHoldersPage;
    const pageNumbers = [];
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
      return pageNumbers;
    }

    // Always include page 1
    pageNumbers.push(1);

    if (currentPage > 4) {
      pageNumbers.push("...");
    }

    // Determine range around current page
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    // Adjust range if at boundaries
    if (currentPage <= 4) {
      start = 2;
      end = 5;
    } else if (currentPage >= totalPages - 3) {
      start = totalPages - 4;
      end = totalPages - 1;
    }

    for (let i = start; i <= end; i++) {
      pageNumbers.push(i);
    }

    if (currentPage < totalPages - 3) {
      pageNumbers.push("...");
    }

    // Always include last page
    pageNumbers.push(totalPages);

    return pageNumbers;
  };

  // Format holder date
  const formatHolderDate = (dateValue) => {
    if (!dateValue || dateValue === "N/A") return "N/A";
    
    const s = dateValue.toString();
    if (/^\d{8}$/.test(s)) {
      const year = s.slice(0, 4);
      const month = s.slice(4, 6);
      const day = s.slice(6, 8);
      const date = new Date(year, parseInt(month) - 1, day);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }

    const date = new Date(dateValue);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Format percentage
  const formatPercentage = (percentage) => {
    return `${percentage?.toFixed(2) || "0.00"}%`;
  };

  // Format value
  const formatHolderValue = (value) => {
    return `$${
      value?.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) || "0.00"
    }`;
  };

  // Load holders on component mount
  useEffect(() => {
    if (tokenAddress) {
      fetchTokenHoldersList(1, holdersRowsPerPage);
    }
  }, [tokenAddress]);

  const handleCopyAddress = (address) => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    toast.success("Address copied to clipboard");
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Table Header */}
      <div className="px-4 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Token Holders</h2>
            <p className="text-gray-600">
              Ranked list of token holders with their holdings
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-700 whitespace-nowrap">
                Rows per page:
              </label>
              <select
                value={holdersRowsPerPage}
                onChange={(e) => handleHoldersRowsPerPageChange(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                {[10, 25, 50, 100].map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Pool summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 border-b border-gray-200">
        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
              <Users className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">
                {formatCount(holdersPagination?.totalHolders || 0)}
              </h3>
              <p className="text-base font-semibold text-gray-600 mt-1">
                Number of Holders
              </p>
            </div>
          </div>
          <div className="w-full bg-blue-50 rounded-lg p-3">
            <p className="text-sm text-blue-600 font-medium">
              Total unique addresses holding tokens
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
              <CircleDollarSign className="h-7 w-7 text-white" />
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">
                {formatNumber(pooledSolAndTokens?.pooledSOLToday || 0)}
              </h3>
              <p className="text-base font-semibold text-gray-600 mt-1">
                SOLs in Pool
              </p>
            </div>
          </div>
          <div className="w-full bg-purple-50 rounded-lg p-3">
            <p className="text-sm text-purple-600 font-medium">
              Total SOL value locked in liquidity pool
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-300">
          <div className="flex items-center gap-4 mb-4">
            <div className="rounded-xl shadow-lg overflow-hidden flex items-center justify-center w-12 h-12 flex-shrink-0">
              {liveTokenData?.info?.imageUrl ? (
                <img
                  src={liveTokenData.info.imageUrl}
                  alt={tokenInfo?.symbol || "token"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center w-full h-full">
                  <Coins className="w-8 h-8 text-emerald-500" />
                </div>
              )}
            </div>
            <div>
              <h3 className="text-3xl font-bold text-gray-900">
                {formatCount(pooledSolAndTokens?.pooledTokenToday || 0)}
              </h3>
              <p className="text-base font-semibold text-gray-600 mt-1">
                Tokens in Pool
              </p>
            </div>
          </div>
          <div className="w-full bg-emerald-50 rounded-lg p-3">
            <p className="text-sm text-emerald-600 font-medium">
              Total tokens deposited in liquidity pool
            </p>
          </div>
        </div>
      </div>

      {loadingHolders ? (
        <div className="p-12 text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading token holders...</p>
        </div>
      ) : holders.length > 0 ? (
        <>
          {/* Table Container */}
          <div className="overflow-x-auto">
            {/* Desktop Table */}
            <table className="w-full hidden md:table">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 sm:px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-4 sm:px-6 py-4 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {holders.map((holder, index) => (
                  <tr
                    key={holder._id?.$oid || index}
                    className="hover:bg-gray-50 transition-colors group"
                  >
                    {/* Date */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-3">
                        <Calendar
                          size={16}
                          className="text-gray-400 flex-shrink-0"
                        />
                        <span className="text-sm font-medium text-gray-900">
                          {formatHolderDate(holder.date || holder.createdAt)}
                        </span>
                      </div>
                    </td>

                    {/* Rank */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <Award
                          size={16}
                          className={`flex-shrink-0 ${
                            holder.rank === 1
                              ? "text-yellow-500"
                              : holder.rank <= 3
                              ? "text-gray-500"
                              : "text-orange-500"
                          }`}
                        />
                        <span
                          className={`text-sm font-bold ${
                            holder.rank === 1
                              ? "text-yellow-600"
                              : holder.rank <= 3
                              ? "text-gray-700"
                              : "text-orange-600"
                          }`}
                        >
                          {holder.rank}
                        </span>
                      </div>
                    </td>

                    {/* Owner */}
                    <td className="px-4 sm:px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div
                          onClick={() => handleCopyAddress(holder.owner)}
                          title="Click to copy owner"
                          className="flex items-center gap-2 max-w-xs px-2 py-1 rounded-md cursor-pointer hover:bg-gray-100 transition-all min-w-0"
                        >
                          <UserCheck
                            size={16}
                            className="text-blue-500 flex-shrink-0"
                          />
                          <span className="text-sm font-mono text-gray-900 truncate block max-w-[180px]">
                            {holder.owner?.slice(0, 8)}...
                            {holder.owner?.slice(-6)}
                          </span>
                          <Copy
                            size={14}
                            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                          />
                        </div>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="px-4 sm:px-6 py-4 text-center">
                      <div className="flex justify-center">
                        <div
                          className="flex items-center gap-2 max-w-xs cursor-pointer hover:bg-gray-100 px-2 py-1 rounded-md transition-all"
                          onClick={() => handleCopyAddress(holder.address)}
                          title="Click to copy address"
                        >
                          <Wallet
                            size={16}
                            className="text-purple-500 flex-shrink-0"
                          />
                          <span className="text-sm font-mono text-gray-700 truncate">
                            {holder.address?.slice(0, 8)}...
                            {holder.address?.slice(-6)}
                          </span>
                          <Copy
                            size={14}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          />
                        </div>
                      </div>
                    </td>

                    {/* Percentage */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <PieChart
                          size={16}
                          className="text-green-500 flex-shrink-0"
                        />
                        <span className="text-sm font-semibold text-green-700">
                          {formatPercentage(holder.percentage)}
                        </span>
                      </div>
                    </td>

                    {/* Value */}
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-2">
                        <DollarSign
                          size={16}
                          className="text-emerald-500 flex-shrink-0"
                        />
                        <span className="text-sm font-bold text-emerald-700">
                          {formatHolderValue(holder.value)}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-4 p-4">
              {holders.map((holder, index) => (
                <div
                  key={holder._id?.$oid || index}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 shadow-sm"
                >
                  {/* Header with Rank and Date */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Award
                        size={16}
                        className={
                          holder.rank === 1
                            ? "text-yellow-500"
                            : holder.rank <= 3
                            ? "text-gray-500"
                            : "text-orange-500"
                        }
                      />
                      <span
                        className={`font-bold ${
                          holder.rank === 1
                            ? "text-yellow-600"
                            : holder.rank <= 3
                            ? "text-gray-700"
                            : "text-orange-600"
                        }`}
                      >
                        Rank #{holder.rank}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Calendar size={14} />
                      <span>
                        {formatHolderDate(holder.date || holder.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Owner */}
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <UserCheck size={14} className="text-blue-500" />
                      <span className="text-xs font-semibold text-gray-700">
                        Owner
                      </span>
                    </div>
                    <p
                      onClick={() => handleCopyAddress(holder.owner)}
                      title="Tap to copy owner"
                      className="flex items-center gap-2 text-sm font-mono text-gray-900 truncate cursor-pointer hover:text-blue-600 min-w-0"
                    >
                      <span className="truncate max-w-[220px]">
                        {holder.owner?.slice(0, 8)}...{holder.owner?.slice(-6)}
                      </span>
                      <Copy
                        size={14}
                        className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
                      />
                    </p>
                  </div>

                  {/* Address */}
                  <div className="mb-2">
                    <div className="flex items-center gap-2 mb-1">
                      <Wallet size={14} className="text-purple-500" />
                      <span className="text-xs font-semibold text-gray-700">
                        Address
                      </span>
                    </div>
                    <p
                      onClick={() => handleCopyAddress(holder.address)}
                      className="flex items-center gap-2 text-sm font-mono text-gray-700 truncate cursor-pointer hover:text-blue-600"
                    >
                      {holder.address?.slice(0, 8)}...
                      {holder.address?.slice(-6)}
                      <Copy
                        size={14}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                      />
                    </p>
                  </div>

                  {/* Percentage and Value */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <div className="flex items-center gap-2">
                      <PieChart size={14} className="text-green-500" />
                      <span className="text-sm font-semibold text-green-700">
                        {formatPercentage(holder.percentage)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign size={14} className="text-emerald-500" />
                      <span className="text-sm font-bold text-emerald-700">
                        {formatHolderValue(holder.value)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pagination */}
          {holdersPagination.totalPages > 1 && (
            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-700">
                  Showing {(currentHoldersPage - 1) * holdersRowsPerPage + 1} to{" "}
                  {Math.min(
                    currentHoldersPage * holdersRowsPerPage,
                    holdersPagination.totalHolders
                  )}{" "}
                  of {holdersPagination.totalHolders} holders
                  {holdersPagination.totalPages > 1 && (
                    <span className="ml-2 text-gray-500">
                      (Page {currentHoldersPage} of{" "}
                      {holdersPagination.totalPages})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleHoldersPageChange(1)}
                    disabled={currentHoldersPage === 1}
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium text-gray-700"
                  >
                    First
                  </button>
                  <button
                    onClick={() =>
                      handleHoldersPageChange(currentHoldersPage - 1)
                    }
                    disabled={currentHoldersPage === 1}
                    className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  {getHoldersPageNumbers().map((pageNumber, idx) => 
                    pageNumber === "..." ? (
                      <span key={`dots-${idx}`} className="px-3 py-2 text-gray-500">
                        ...
                      </span>
                    ) : (
                      <button
                        key={pageNumber}
                        onClick={() => handleHoldersPageChange(pageNumber)}
                        className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                          currentHoldersPage === pageNumber
                            ? "bg-orange-500 text-white"
                            : "border border-gray-300 bg-white hover:bg-gray-50 text-gray-700"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    )
                  )}
                  <button
                    onClick={() =>
                      handleHoldersPageChange(currentHoldersPage + 1)
                    }
                    disabled={
                      currentHoldersPage === holdersPagination.totalPages
                    }
                    className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                  <button
                    onClick={() =>
                      handleHoldersPageChange(holdersPagination.totalPages)
                    }
                    disabled={
                      currentHoldersPage === holdersPagination.totalPages
                    }
                    className="px-3 py-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium text-gray-700"
                  >
                    Last
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="p-12 text-center">
          <Users size={48} className="text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-400">No holders found</p>
          <p className="text-sm text-gray-500 mt-2">
            No holders are currently associated with this token.
          </p>
        </div>
      )}
    </div>
  );
};

export default TokenHolders;
