import { useState, useEffect } from "react";
import {
  Wallet,
  Plus,
  Edit2,
  Trash2,
  X,
  Save,
  Loader2,
  Copy,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { ADMIN_API } from "../../services/ApiHandlers";
import * as XLSX from 'xlsx';

export default function Walletsdata() {
  const [wallets, setWallets] = useState([]);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [formData, setFormData] = useState({
    tokenId: "",
    walletAddress: "",
    innerWalletAddress: "",
    pairAddress: "",
    poolType: "",
    symbol: "",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState({});
  const [pagination, setPagination] = useState({
    count: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });

  // Fetch wallets and tokens on component mount
  useEffect(() => {
    fetchWallets();
    fetchTokens();
  }, [pagination.limit]);

  const fetchWallets = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ADMIN_API.ADMIN_GET_WALLETS({ page, limit });
      if (response.data) {
        const {
          data: walletData = [],
          count,
          totalRecords,
          totalPages,
          currentPage,
          limit: responseLimit,
        } = response.data;

        const actualCount = count ?? totalRecords ?? 0;
        const list = Array.isArray(walletData) ? walletData : [];
        setWallets(list);

        setPagination((prev) => {
          const newLimit = responseLimit ?? limit;
          const calculatedTotalPages = totalPages || Math.ceil(actualCount / newLimit) || 1;

          return {
            ...prev,
            count: actualCount,
            totalPages: calculatedTotalPages,
            currentPage: currentPage ?? page,
            limit: newLimit,
          };
        });
      }
    } catch (err) {
      console.error("Error fetching wallets:", err);
      setError(err.response?.data?.message || "Failed to fetch wallets");
    } finally {
      setLoading(false);
    }
  };

  const fetchTokens = async () => {
    try {
      const response = await ADMIN_API.ADMIN_GET_TOKENS();
      if (response.data && response.data.data) {
        setTokens(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching tokens:", err);
    }
  };

  // Stats for wallets
  const stats = [
    {
      title: "Total Wallets",
      value: pagination.count,
      icon: Wallet,
      color: "blue",
      accent: "from-blue-500 to-cyan-600",
    },
    {
      title: "Unique Tokens",
      value: new Set(wallets.map((w) => w.tokenId?._id || w.tokenId)).size,
      icon: CheckCircle,
      color: "green",
      accent: "from-emerald-500 to-green-600",
    },
    {
      title: "Connected Wallets",
      value: wallets.filter((w) => w.innerWalletAddress).length,
      icon: AlertCircle,
      color: "purple",
      accent: "from-purple-500 to-pink-600",
    },
  ];

  const colorSchemes = {
    blue: "from-blue-500 to-cyan-600",
    green: "from-emerald-500 to-green-600",
    purple: "from-purple-500 to-pink-600",
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.currentPage) {
      return;
    }
    fetchWallets(page);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    // Validation
    if (!formData.tokenId || !formData.walletAddress || !formData.innerWalletAddress) {
      setError("Please fill in all required fields");
      setSubmitting(false);
      return;
    }

    try {
      if (editingWallet) {
        // Update existing wallet
        console.log("Updating wallet with data:", formData);
        const response = await ADMIN_API.ADMIN_UPDATE_WALLETS(editingWallet._id, formData);
        console.log("Update response:", response.data);
        if (response.data) {
          setSuccess(response.data.message || "Wallet updated successfully!");
          await fetchWallets(pagination.currentPage);
        }
      } else {
        // Create new wallet
        console.log("Creating wallet with data:", formData);
        const response = await ADMIN_API.ADMIN_CREATE_WALLETS(formData);
        console.log("Create response:", response.data);
        if (response.data) {
          setSuccess(response.data.message || "Wallet added successfully!");
          await fetchWallets(pagination.currentPage);
        }
      }
      // Close modal after 1.5 seconds
      setTimeout(() => {
        resetForm();
      }, 1500);
    } catch (err) {
      console.error("Error saving wallet:", err);
      setError(
        err.response?.data?.message ||
          `Failed to ${editingWallet ? "update" : "add"} wallet`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (wallet) => {
    setEditingWallet(wallet);
    setFormData({
      tokenId: wallet.tokenId?._id || wallet.tokenId,
      walletAddress: wallet.walletAddress,
      innerWalletAddress: wallet.innerWalletAddress,
      pairAddress: wallet.pairAddress || "",
      poolType: wallet.poolType || "",
      symbol: wallet.symbol || "",
    });
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this wallet?")) {
      try {
        setLoading(true);
        await ADMIN_API.ADMIN_DELETE_WALLETS(id);
        setSuccess("Wallet deleted successfully!");
        const nextCount = Math.max(pagination.count - 1, 0);
        const nextTotalPages = nextCount === 0 ? 1 : Math.ceil(nextCount / pagination.limit);
        const nextPage = nextCount === 0
          ? 1
          : Math.min(pagination.currentPage, nextTotalPages);
        await fetchWallets(nextPage);
      } catch (err) {
        console.error("Error deleting wallet:", err);
        setError(err.response?.data?.message || "Failed to delete wallet");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback({ ...copyFeedback, [id]: true });
    setTimeout(() => {
      setCopyFeedback({ ...copyFeedback, [id]: false });
    }, 2000);
  };

  const resetForm = () => {
    setFormData({
      tokenId: "",
      walletAddress: "",
      innerWalletAddress: "",
      pairAddress: "",
      poolType: "",
      symbol: "",
    });
    setEditingWallet(null);
    setShowModal(false);
    setError(null);
    setSuccess(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const truncateAddress = (address, length = 12) => {
    if (!address || address.length <= length) return address;
    return address.slice(0, length) + "..." + address.slice(-length);
  };

  const getTokenName = (tokenId) => {
    if (typeof tokenId === "object") {
      return tokenId?.name || "Unknown";
    }
    const token = tokens.find((t) => t._id === tokenId);
    return token?.name || "Unknown Token";
  };

  // Download Excel handler using latest API response
  const handleDownloadExcel = async () => {
    try {
      // First, get the total count from the API
      const firstResponse = await ADMIN_API.ADMIN_GET_WALLETS({ page: 1, limit: 1 });
      const totalCount = firstResponse?.data?.count || firstResponse?.data?.totalRecords || 0;
      // Now fetch all data using the total count
      const response = await ADMIN_API.ADMIN_GET_WALLETS({ page: 1, limit: totalCount });
      const walletData = response?.data?.data || [];
      const data = walletData.map((w, idx) => ({
        SNo: idx + 1,
        TokenName: w.tokenId?.name || w.tokenId,
        Symbol: w.symbol || "",
        PoolType: w.poolType || "",
        PairAddress: w.pairAddress || "",
        WalletAddress: w.walletAddress,
        InnerWalletAddress: w.innerWalletAddress,
        CreatedAt: w.createdAt,
        UpdatedAt: w.updatedAt,
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Wallets');
      XLSX.writeFile(workbook, 'wallets.xlsx');
    } catch (err) {
      alert('Failed to download Excel. Please try again.');
    }
  };
  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 left-1/3 w-60 h-60 bg-cyan-200/15 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 mx-auto">
        {/* Header */}
        <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="text-center lg:text-left">
              <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-300"></div>
                <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse delay-700"></div>
                <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse delay-1000"></div>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-900 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-3">
                Wallet Management
              </h1>
              <p className="text-base text-gray-600 max-w-2xl">
                Manage token wallets and configurations
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4">
              <button
                onClick={handleDownloadExcel}
                className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-all duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
                <span>Download Excel</span>
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Plus size={20} />
                <span>Add Wallet</span>
              </button>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 animate-in fade-in slide-in-from-top-2">
            {success}
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group relative overflow-hidden rounded-3xl p-6 bg-white/70 backdrop-blur-xl border border-white/40 shadow-2xl hover:scale-105 transition-all duration-500"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-gray-600 mb-2">
                      {stat.title}
                    </p>
                    <p className="text-4xl font-black text-gray-900">
                      {stat.value}
                    </p>
                  </div>
                  <div
                    className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${stat.accent} mix-blend-multiply`}
                  ></div>
                  <div
                    className={`p-4 rounded-2xl bg-gradient-to-br ${colorSchemes[stat.color]} shadow-lg`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
        ) : (
          /* Wallets Table */
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                All Wallets ({pagination.count})
              </h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      S.No
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Token Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Symbol
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Pool Type
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Pair Address
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Wallet Address
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Inner Wallet
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Created At
                    </th>
                    {/* <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th> */}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {wallets.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No wallets found. Click "Add Wallet" to create one.
                      </td>
                    </tr>
                  ) : (
                    wallets.map((wallet, index) => (
                      <tr
                        key={wallet._id}
                        className="hover:bg-blue-50/30 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {(pagination.currentPage - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                              <Wallet className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-semibold text-gray-900">
                              {getTokenName(wallet.tokenId)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {wallet.symbol || "-"}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                            wallet.poolType === 'RWA' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {wallet.poolType || "-"}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 group">
                            <code className="text-sm font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded">
                              {truncateAddress(wallet.pairAddress)}
                            </code>
                            {wallet.pairAddress && (
                              <button
                                onClick={() =>
                                  handleCopy(wallet.pairAddress, wallet._id + "_pair")
                                }
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                                title="Copy"
                              >
                                {copyFeedback[wallet._id + "_pair"] ? (
                                  <CheckCircle size={14} className="text-green-600" />
                                ) : (
                                  <Copy size={14} className="text-gray-600" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 group">
                            <code className="text-sm font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded">
                              {truncateAddress(wallet.walletAddress)}
                            </code>
                            <button
                              onClick={() =>
                                handleCopy(wallet.walletAddress, wallet._id)
                              }
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                              title="Copy"
                            >
                              {copyFeedback[wallet._id] ? (
                                <CheckCircle size={14} className="text-green-600" />
                              ) : (
                                <Copy size={14} className="text-gray-600" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 group">
                            <code className="text-sm font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded">
                              {truncateAddress(wallet.innerWalletAddress)}
                            </code>
                            <button
                              onClick={() =>
                                handleCopy(wallet.innerWalletAddress, wallet._id + "_inner")
                              }
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                              title="Copy"
                            >
                              {copyFeedback[wallet._id + "_inner"] ? (
                                <CheckCircle size={14} className="text-green-600" />
                              ) : (
                                <Copy size={14} className="text-gray-600" />
                              )}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {formatDate(wallet.createdAt)}
                        </td>
                        {/* <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(wallet)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors duration-200"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(wallet._id)}
                              className="p-2 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors duration-200"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td> */}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {pagination.count > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-6 border-t border-gray-200">
                <div className="text-sm text-gray-600">
                  Showing
                  <span className="font-semibold text-gray-900 mx-1">
                    {(pagination.currentPage - 1) * pagination.limit + 1}
                  </span>
                  to
                  <span className="font-semibold text-gray-900 mx-1">
                    {Math.min(pagination.currentPage * pagination.limit, pagination.count)}
                  </span>
                  of
                  <span className="font-semibold text-gray-900 mx-1">
                    {pagination.count}
                  </span>
                  wallets
                </div>
                <div className="flex items-center gap-2">
                  {/* <button
                    onClick={() => handlePageChange(1)}
                    disabled={pagination.currentPage === 1 || loading}
                    className={`px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold uppercase transition-colors duration-200 ${
                      pagination.currentPage === 1 || loading
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    First
                  </button> */}
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1 || loading}
                    className={`px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold transition-colors duration-200 ${
                      pagination.currentPage === 1 || loading
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Previous
                  </button>
                  
                  {/* Sliding Window Pagination */}
                  {(() => {
                    const pages = [];
                    const maxVisible = 5;
                    let start = Math.max(1, pagination.currentPage - Math.floor(maxVisible / 2));
                    let end = Math.min(pagination.totalPages, start + maxVisible - 1);
                    
                    if (end - start + 1 < maxVisible) {
                      start = Math.max(1, end - maxVisible + 1);
                    }

                    for (let i = start; i <= end; i++) {
                      pages.push(
                        <button
                          key={i}
                          onClick={() => handlePageChange(i)}
                          disabled={loading}
                          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                            pagination.currentPage === i
                              ? "bg-blue-600 text-white shadow-lg"
                              : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                          } ${loading ? "cursor-not-allowed opacity-70" : ""}`}
                        >
                          {i}
                        </button>
                      );
                    }
                    return pages;
                  })()}

                  <button
                    onClick={() => handlePageChange(pagination.currentPage + 1)}
                    disabled={pagination.currentPage === pagination.totalPages || loading}
                    className={`px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold transition-colors duration-200 ${
                      pagination.currentPage === pagination.totalPages || loading
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Next
                  </button>
                  {/* <button
                    onClick={() => handlePageChange(pagination.totalPages)}
                    disabled={pagination.currentPage === pagination.totalPages || loading}
                    className={`px-3 py-2 rounded-xl border border-gray-300 text-xs font-bold uppercase transition-colors duration-200 ${
                      pagination.currentPage === pagination.totalPages || loading
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-white text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    Last
                  </button> */}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal for Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingWallet ? "Edit Wallet" : "Add New Wallet"}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                  {success}
                </div>
              )}

              {/* Token Select */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Token *
                </label>
                <select
                  name="tokenId"
                  value={formData.tokenId}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  disabled={submitting}
                  required
                >
                  <option value="">Select a token</option>
                  {tokens.map((token) => (
                    <option key={token._id} value={token._id}>
                      {token.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Wallet Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Wallet Address *
                </label>
                <input
                  type="text"
                  name="walletAddress"
                  value={formData.walletAddress}
                  onChange={handleInputChange}
                  placeholder="e.g., WJGJuSoFZt8S4jMGPaNGP3d4PZMsJghPQTVFWjhigdj"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                  disabled={submitting}
                  required
                />
              </div>

              {/* Inner Wallet Address */}
              {/* <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Inner Wallet Address *
                </label>
                <input
                  type="text"
                  name="innerWalletAddress"
                  value={formData.innerWalletAddress}
                  onChange={handleInputChange}
                  placeholder="e.g., CrXjC1WkUbxix997s3hA71czVNLmgE7bQKQRqyT7R9XW"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                  disabled={submitting}
                  required
                />
              </div> */}

              {/* Symbol */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Symbol
                </label>
                <input
                  type="text"
                  name="symbol"
                  value={formData.symbol}
                  onChange={handleInputChange}
                  placeholder="e.g., SOL"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm uppercase"
                  disabled={submitting}
                />
              </div>

              {/* Pool Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pool Type
                </label>
                <input
                  type="text"
                  name="poolType"
                  value={formData.poolType}
                  onChange={handleInputChange}
                  placeholder="e.g., Cross Engine Pools, Standard, Tollgate Pools"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  disabled={submitting}
                />
              </div>

              {/* Pair Address */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pair Address
                </label>
                <input
                  type="text"
                  name="pairAddress"
                  value={formData.pairAddress}
                  onChange={handleInputChange}
                  placeholder="e.g., 58oQChkaZ98yzUBoYyVREvF34NnU"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                  disabled={submitting}
                />
              </div>

              {/* Modal Footer */}
              <div className="flex gap-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-3 bg-gray-200 text-gray-900 rounded-xl font-semibold hover:bg-gray-300 transition-colors duration-200 disabled:opacity-50"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{editingWallet ? "Update" : "Add"} Wallet</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}