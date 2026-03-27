
  // Download Excel handler

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
  AlertCircle,
} from "lucide-react";
import { ADMIN_API } from "../../services/ApiHandlers";
import * as XLSX from 'xlsx';

export default function Poolswalletdata() {
  const [wallets, setWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [formData, setFormData] = useState({
    poolId: "",
    poolWalletAddress: "",
    innerWalletAddress: "",
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

  useEffect(() => {
    fetchWallets();
  }, [pagination.limit]);

  const fetchWallets = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ADMIN_API.ADMIN_GET_POOL_WALLETS({ page, limit });
      if (response.data) {
        const {
          data: walletData = [],
          totalRecords,
          totalPages,
          currentPage,
        } = response.data;
        const list = Array.isArray(walletData) ? walletData : [];
        setWallets(list);
        setPagination((prev) => ({
          ...prev,
          count: totalRecords ?? prev.count,
          totalPages: totalPages && totalPages > 0 ? totalPages : prev.totalPages,
          currentPage: currentPage ?? page,
          limit: limit,
        }));
      }
    } catch (err) {
      console.error("Error fetching pool wallets:", err);
      setError(err.response?.data?.message || "Failed to fetch pool wallets");
    } finally {
      setLoading(false);
    }
  };

  const stats = [
    {
      title: "Total Pool Wallets",
      value: pagination.count,
      icon: Wallet,
      color: "blue",
      accent: "from-blue-500 to-cyan-600",
    },
    {
      title: "Unique Pools",
      value: new Set(wallets.map((w) => w.poolId)).size,
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

    if (!formData.poolId || !formData.poolWalletAddress || !formData.innerWalletAddress) {
      setError("Please fill in all required fields");
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        poolId: formData.poolId,
        poolWalletAddress: formData.poolWalletAddress,
        innerWalletAddress: formData.innerWalletAddress,
      };

      if (editingWallet) {
        payload.updateId = editingWallet._id;
      }

      console.log("Submitting pool wallet data:", payload);
      const response = await ADMIN_API.ADMIN_CREATE_OR_UPDATE_POOL_WALLETS(payload);
      console.log("Response:", response.data);
      
      if (response.data) {
        setSuccess(response.data.message || "Pool wallet data saved successfully!");
        await fetchWallets(pagination.currentPage);
      }

      setTimeout(() => {
        resetForm();
      }, 1500);
    } catch (err) {
      console.error("Error saving pool wallet:", err);
      setError(
        err.response?.data?.message ||
          `Failed to ${editingWallet ? "update" : "add"} pool wallet`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (wallet) => {
    setEditingWallet(wallet);
    setFormData({
      poolId: wallet.poolId,
      poolWalletAddress: wallet.poolWalletAddress,
      innerWalletAddress: wallet.innerWalletAddress,
    });
    setShowModal(true);
    setError(null);
    setSuccess(null);
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
      poolId: "",
      poolWalletAddress: "",
      innerWalletAddress: "",
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
  // Download Excel handler using latest API response
  const handleDownloadExcel = async () => {
    try {
      // First, get the total count from the API
      const firstResponse = await ADMIN_API.ADMIN_GET_POOL_WALLETS({ page: 1, limit: 1 });
      const totalCount = firstResponse?.data?.totalRecords || firstResponse?.data?.count || 0;
      // Now fetch all data using the total count
      const response = await ADMIN_API.ADMIN_GET_POOL_WALLETS({ page: 1, limit: totalCount });
      const walletData = response?.data?.data || [];
      const data = walletData.map((w, idx) => ({
        SNo: idx + 1,
        PoolID: w.poolId,
        PoolWalletAddress: w.poolWalletAddress,
        InnerWalletAddress: w.innerWalletAddress,
        CreatedAt: w.createdAt,
        UpdatedAt: w.updatedAt,
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'PoolWallets');
      XLSX.writeFile(workbook, 'poolwallets.xlsx');
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
        {/* Download Excel Button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleDownloadExcel}
            className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-600 to-blue-600 text-white rounded-xl font-semibold shadow-lg hover:scale-105 transition-all duration-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4" /></svg>
            <span>Download Excel</span>
          </button>
        </div>
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
                Pools Wallet Management
              </h1>
              <p className="text-base text-gray-600 max-w-2xl">
                Manage token wallets and configurations
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              <Plus size={20} />
              <span>Add Pool Wallet</span>
            </button>
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
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                All Pool Wallets ({pagination.count})
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
                      Pool ID
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Pool Wallet Address
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Inner Wallet Address
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {wallets.length === 0 ? (
                    <tr>
                      <td
                        colSpan="6"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No pool wallets found. Click "Add Pool Wallet" to create one.
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
                          <div className="flex items-center gap-2 group">
                            <code className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                              {truncateAddress(wallet.poolId, 8)}
                            </code>
                            <button
                              onClick={() =>
                                handleCopy(wallet.poolId, wallet._id + "_pool")
                              }
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                              title="Copy Pool ID"
                            >
                              {copyFeedback[wallet._id + "_pool"] ? (
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
                              {truncateAddress(wallet.poolWalletAddress)}
                            </code>
                            <button
                              onClick={() =>
                                handleCopy(wallet.poolWalletAddress, wallet._id)
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
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(wallet)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors duration-200"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                          </div>
                        </td>
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
                  pool wallets
                </div>
                <div className="flex items-center gap-2">
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
                  {Array.from({ length: pagination.totalPages }, (_, index) => index + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      disabled={loading}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 ${
                        pagination.currentPage === page
                          ? "bg-blue-600 text-white shadow-lg"
                          : "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
                      } ${loading ? "cursor-not-allowed opacity-70" : ""}`}
                    >
                      {page}
                    </button>
                  ))}
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
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingWallet ? "Edit Pool Wallet" : "Add New Pool Wallet"}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
              >
                <X size={24} />
              </button>
            </div>

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

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pool ID *
                </label>
                <input
                  type="text"
                  name="poolId"
                  value={formData.poolId}
                  onChange={handleInputChange}
                  placeholder="e.g., 690c43168b3394458f41121d"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                  disabled={submitting}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pool Wallet Address *
                </label>
                <input
                  type="text"
                  name="poolWalletAddress"
                  value={formData.poolWalletAddress}
                  onChange={handleInputChange}
                  placeholder="e.g., 9N2gWYrNkbDCekkjA3NzgPuKrBz4dtHJFd4by6pdPhtM"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all font-mono text-sm"
                  disabled={submitting}
                  required
                />
              </div>

              <div>
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
              </div>

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
                      <span>{editingWallet ? "Update" : "Add"} Pool Wallet</span>
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