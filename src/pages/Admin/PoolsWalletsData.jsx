import { useState, useEffect } from "react";
import {
  Wallet,
  Plus,
  Trash2,
  X,
  Loader2,
  Copy,
  CheckCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Edit2,
} from "lucide-react";
import { ADMIN_API, clearApiCache } from "../../services/ApiHandlers";

export default function PoolsWalletsData() {
  const [compoundWallets, setCompoundWallets] = useState([]);
  const [companyWallets, setCompanyWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("compound");
  const [showForm, setShowForm] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const [compoundFormData, setCompoundFormData] = useState({
    walletAddress: "",
    status: "active",
  });

  const [companyFormData, setCompanyFormData] = useState({
    walletAddress: "",
    status: "active",
  });

  const [editFormData, setEditFormData] = useState({
    walletAddress: "",
    status: "active",
  });

  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState({});

  const [compoundPagination, setCompoundPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });

  const [companyPagination, setCompanyPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 10,
  });

  const statuses = [
    { label: "Active", value: "active" },
    { label: "Inactive", value: "inactive" },
  ];

  useEffect(() => {
    console.log(
      "[COMPONENT] PoolsWalletsData component mounted - Initiating initial data load"
    );
    fetchData();
  }, []);

  useEffect(() => {
    console.log("[STATE CHANGE] Compound Wallets Updated:", {
      count: compoundWallets.length,
      data: compoundWallets,
      pagination: compoundPagination,
    });
  }, [compoundWallets, compoundPagination]);

  useEffect(() => {
    console.log("[STATE CHANGE] Company Wallets Updated:", {
      count: companyWallets.length,
      data: companyWallets,
      pagination: companyPagination,
    });
  }, [companyWallets, companyPagination]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      await fetchCompoundWallets(1);

      await fetchCompanyWallets(1);
    } catch (err) {
      console.error("[ACTIVITY LOG] Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompoundWallets = async (page = 1) => {
    try {
      const response = await ADMIN_API.ADMIN_GET_COMPOUND_WALLETS({
        page,
        limit: compoundPagination.limit,
      });

      console.log("[GET DATA] Full response:", response);

      if (response.data) {
        const wallets = Array.isArray(response.data.data)
          ? response.data.data
          : [];

        console.log("[GET DATA] Wallets list:", wallets);

        setCompoundWallets(wallets);

        const paginationData = {
          currentPage: response.data.currentPage || page,
          totalPages:
            response.data.totalPages ||
            Math.ceil(
              (response.data.totalCount || wallets.length) /
                (response.data.limit || compoundPagination.limit)
            ),
          totalCount: response.data.totalCount || wallets.length,
          limit: response.data.limit || compoundPagination.limit,
        };

        setCompoundPagination(paginationData);
      }
    } catch (err) {
      console.error("[GET ERROR] Error fetching compound wallets:", err);

      setError(err.response?.data?.message);
    }
  };

  const fetchCompanyWallets = async (page = 1) => {
    try {
      console.log(
        `[GET REQUEST] Fetching company wallets - Page: ${page}, Limit: ${companyPagination.limit}`
      );
      const startTime = performance.now();

      const response = await ADMIN_API.ADMIN_GET_COMPANY_WALLETS({
        page,
        limit: companyPagination.limit,
      });

      const endTime = performance.now();
      console.log(
        `[GET RESPONSE] Company wallets fetched successfully in ${(
          endTime - startTime
        ).toFixed(2)}ms`
      );
      console.log("[GET DATA] Full response:", response);
      console.log(
        "[GET DATA] Response data keys available:",
        Object.keys(response.data || {})
      );

      if (response.data) {
        const wallets = Array.isArray(response.data.data)
          ? response.data.data
          : [];
        console.log(
          `[GET DATA] Extracted ${wallets.length} company wallets from response`
        );
        console.log("[GET DATA] Wallets list:", wallets);

        setCompanyWallets(wallets);
        console.log(
          "[STATE UPDATE] Company wallets state updated with",
          wallets.length,
          "wallets"
        );

        const paginationData = {
          currentPage: response.data.currentPage || page,
          totalPages:
            response.data.totalPages ||
            Math.ceil(
              (response.data.totalCount || wallets.length) /
                (response.data.limit || companyPagination.limit)
            ),
          totalCount: response.data.totalCount || wallets.length,
          limit: response.data.limit || companyPagination.limit,
        };

        console.log("[GET DATA] Pagination metadata from response:", {
          hasCurrentPage: !!response.data.currentPage,
          hasTotalPages: !!response.data.totalPages,
          hasTotalCount: !!response.data.totalCount,
          hasLimit: !!response.data.limit,
        });

        setCompanyPagination(paginationData);
        console.log(
          "[STATE UPDATE] Company pagination state updated:",
          paginationData
        );
      }
    } catch (err) {
      console.error("[GET ERROR] Error fetching company wallets:", err);
      console.error(
        "[GET ERROR] Full error object:",
        err.response?.data || err.message
      );
      setError(
        err.response?.data?.message || "Failed to fetch company wallets"
      );
    }
  };

  const handlePageChange = (page) => {
    const pagination =
      activeTab === "compound" ? compoundPagination : companyPagination;
    console.log(
      `[PAGINATION] Page change requested for ${activeTab} wallet - Target page: ${page}, Current page: ${pagination.currentPage}`
    );
    if (
      page < 1 ||
      page > pagination.totalPages ||
      page === pagination.currentPage
    ) {
      console.log("[PAGINATION] Page change rejected - invalid page number");
      return;
    }
    console.log(`[PAGINATION] Fetching ${activeTab} wallets for page ${page}`);
    if (activeTab === "compound") {
      fetchCompoundWallets(page);
    } else {
      fetchCompanyWallets(page);
    }
  };

  const handleAddCompoundWallet = async (e) => {
    e.preventDefault();
    console.log(
      "[POST REQUEST] Adding compound wallet with data:",
      compoundFormData
    );
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!compoundFormData.walletAddress) {
      console.warn("[POST VALIDATION] Wallet address is empty");
      setError("Please enter a wallet address");
      setSubmitting(false);
      return;
    }

    try {
      const startTime = performance.now();
      console.log("[POST REQUEST] Sending POST request to add compound wallet");
      const response = await ADMIN_API.ADMIN_ADD_COMPOUND_WALLET(
        compoundFormData
      );
      const endTime = performance.now();
      console.log(
        `[POST RESPONSE] Compound wallet added successfully in ${(
          endTime - startTime
        ).toFixed(2)}ms`
      );
      console.log("[POST DATA] Response from server:", response.data);

      setSuccess("Compound wallet added successfully!");
      setCompoundFormData({
        walletAddress: "",
        status: "active",
      });
      setShowForm(false);

      console.log("[POST ACTION] Clearing API cache to ensure fresh data");
      clearApiCache();

      console.log(
        `[POST ACTION] Refetching compound wallets from page 1 (to show newly added wallet)`
      );
      await fetchCompoundWallets(1);
      console.log("[POST ACTION] Compound wallets refetch completed");

      setTimeout(() => {
        setSuccess(null);
        console.log("[POST ACTION] Success message cleared");
      }, 3000);
    } catch (err) {
      console.error("[POST ERROR] Error adding compound wallet:", err);
      console.error(
        "[POST ERROR] Full error object:",
        err.response?.data || err.message
      );
      setError(err.response?.data?.message || "Failed to add compound wallet");
    } finally {
      setSubmitting(false);
      console.log("[POST ACTION] Submission process completed");
    }
  };

  const handleAddCompanyWallet = async (e) => {
    e.preventDefault();
    console.log(
      "[POST REQUEST] Adding company wallet with data:",
      companyFormData
    );
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!companyFormData.walletAddress) {
      console.warn("[POST VALIDATION] Wallet address is empty");
      setError("Please enter a wallet address");
      setSubmitting(false);
      return;
    }

    try {
      const startTime = performance.now();
      console.log("[POST REQUEST] Sending POST request to add company wallet");
      const response = await ADMIN_API.ADMIN_ADD_COMPANY_WALLET(
        companyFormData
      );
      const endTime = performance.now();
      console.log(
        `[POST RESPONSE] Company wallet added successfully in ${(
          endTime - startTime
        ).toFixed(2)}ms`
      );
      console.log("[POST DATA] Response from server:", response.data);

      setSuccess("Company wallet added successfully!");
      setCompanyFormData({
        walletAddress: "",
        status: "active",
      });
      setShowForm(false);

      console.log("[POST ACTION] Clearing API cache to ensure fresh data");
      clearApiCache();

      console.log(
        `[POST ACTION] Refetching company wallets from page 1 (to show newly added wallet)`
      );
      await fetchCompanyWallets(1);
      console.log("[POST ACTION] Company wallets refetch completed");

      setTimeout(() => {
        setSuccess(null);
        console.log("[POST ACTION] Success message cleared");
      }, 3000);
    } catch (err) {
      console.error("[POST ERROR] Error adding company wallet:", err);
      console.error(
        "[POST ERROR] Full error object:",
        err.response?.data || err.message
      );
      setError(err.response?.data?.message || "Failed to add company wallet");
    } finally {
      setSubmitting(false);
      console.log("[POST ACTION] Submission process completed");
    }
  };

  const handleOpenEdit = (wallet) => {
    setEditingWallet(wallet);
    setEditFormData({
      walletAddress: wallet.walletAddress,
      status: wallet.status,
    });
    setError(null);
    setSuccess(null);
    setShowEditModal(true);
  };

  const handleUpdateWallet = async (e) => {
    e.preventDefault();
    console.log(
      "[UPDATE REQUEST] Updating wallet with data:",
      editFormData
    );
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!editFormData.walletAddress) {
      console.warn("[UPDATE VALIDATION] Wallet address is empty");
      setError("Please enter a wallet address");
      setSubmitting(false);
      return;
    }

    try {
      const startTime = performance.now();
      const updateData = {
        walletAddress: editFormData.walletAddress,
        status: editFormData.status,
      };

      if (activeTab === "compound") {
        console.log("[UPDATE REQUEST] Sending compound wallet update");
        await ADMIN_API.ADMIN_UPDATE_COMPOUND_WALLET(editingWallet._id, updateData);
      } else {
        console.log("[UPDATE REQUEST] Sending company wallet update");
        await ADMIN_API.ADMIN_UPDATE_COMPANY_WALLET(editingWallet._id, updateData);
      }

      const endTime = performance.now();
      console.log(
        `[UPDATE RESPONSE] Wallet updated successfully in ${(
          endTime - startTime
        ).toFixed(2)}ms`
      );

      setSuccess(`${activeTab === "compound" ? "Compound" : "Company"} wallet updated successfully!`);
      setShowEditModal(false);
      setEditingWallet(null);

      console.log("[UPDATE ACTION] Clearing API cache to ensure fresh data");
      clearApiCache();

      if (activeTab === "compound") {
        await fetchCompoundWallets(compoundPagination.currentPage);
      } else {
        await fetchCompanyWallets(companyPagination.currentPage);
      }

      setTimeout(() => {
        setSuccess(null);
        console.log("[UPDATE ACTION] Success message cleared");
      }, 3000);
    } catch (err) {
      console.error("[UPDATE ERROR] Error updating wallet:", err);
      console.error(
        "[UPDATE ERROR] Full error object:",
        err.response?.data || err.message
      );
      setError(err.response?.data?.message || "Failed to update wallet");
    } finally {
      setSubmitting(false);
      console.log("[UPDATE ACTION] Update process completed");
    }
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback({ ...copyFeedback, [id]: true });
    setTimeout(() => {
      setCopyFeedback({ ...copyFeedback, [id]: false });
    }, 2000);
  };

  const truncateAddress = (address, length = 12) => {
    if (!address || address.length <= length) return address;
    return address.slice(0, length) + "..." + address.slice(-length);
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

  const stats = [
    {
      title: "Compound Wallets",
      value: compoundPagination.totalCount,
      icon: Wallet,
      color: "blue",
      accent: "from-blue-500 to-cyan-600",
    },
    {
      title: "Company Wallets",
      value: companyPagination.totalCount,
      icon: Wallet,
      color: "green",
      accent: "from-emerald-500 to-green-600",
    },
    {
      title: "Total Wallets",
      value: compoundPagination.totalCount + companyPagination.totalCount,
      icon: CheckCircle,
      color: "purple",
      accent: "from-purple-500 to-pink-600",
    },
  ];

  const colorSchemes = {
    blue: "from-blue-500 to-cyan-600",
    green: "from-emerald-500 to-green-600",
    purple: "from-purple-500 to-pink-600",
  };

  const currentPagination =
    activeTab === "compound" ? compoundPagination : companyPagination;

  const renderPaginationButtons = () => {
    const maxPages = currentPagination.totalPages;
    const currentPage = currentPagination.currentPage;
    const buttons = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(maxPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => handlePageChange(i)}
          className={`px-3 py-2 rounded-lg font-semibold transition-all duration-300 ${
            i === currentPage
              ? `${
                  activeTab === "compound"
                    ? "bg-blue-600 text-white"
                    : "bg-green-600 text-white"
                } shadow-lg`
              : `border border-gray-300 text-gray-700 hover:${
                  activeTab === "compound" ? "bg-blue-50" : "bg-green-50"
                } hover:text-gray-900`
          }`}
        >
          {i}
        </button>
      );
    }

    return buttons;
  };

  console.log("[RENDER] Rendering component with state:", {
    activeTab,
    compoundWalletsCount: compoundWallets.length,
    companyWalletsCount: companyWallets.length,
    compoundPagination,
    companyPagination,
    currentPaginationForActiveTab: currentPagination,
  });

  return (
    <div className="p-4 sm:p-6 md:p-8 lg:p-10">
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-200/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/4 left-1/3 w-60 h-60 bg-cyan-200/15 rounded-full blur-2xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 mx-auto">
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
                Compound & Company Wallets
              </h1>
              <p className="text-base text-gray-600 max-w-2xl">
                Manage compound and company wallet configurations
              </p>
            </div>
          </div>
        </div>

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
                    className={`p-4 rounded-2xl bg-gradient-to-br ${
                      colorSchemes[stat.color]
                    } shadow-lg`}
                  >
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
            {/* Tab Navigation */}
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => {
                  console.log("[TAB SWITCH] Switching to Compound Wallets tab");
                  setActiveTab("compound");
                  setShowForm(false);
                }}
                className={`flex-1 px-6 py-4 font-semibold text-center transition-all duration-300 border-b-2 ${
                  activeTab === "compound"
                    ? "text-blue-600 border-blue-600 bg-blue-50/30"
                    : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50/30"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Wallet size={18} />
                  Compound Wallets ({compoundPagination.totalCount})
                </div>
              </button>
              <button
                onClick={() => {
                  console.log("[TAB SWITCH] Switching to Company Wallets tab");
                  setActiveTab("company");
                  setShowForm(false);
                }}
                className={`flex-1 px-6 py-4 font-semibold text-center transition-all duration-300 border-b-2 ${
                  activeTab === "company"
                    ? "text-green-600 border-green-600 bg-green-50/30"
                    : "text-gray-600 border-transparent hover:text-gray-900 hover:bg-gray-50/30"
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Wallet size={18} />
                  Company Wallets ({companyPagination.totalCount})
                </div>
              </button>
            </div>

            {/* Content Section */}
            <div className="p-6">
              {/* Header with Add Button */}
              <div className="mb-6 flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  {activeTab === "compound"
                    ? `Compound Wallets (${compoundPagination.totalCount})`
                    : `Company Wallets (${companyPagination.totalCount})`}
                </h2>
                <button
                  onClick={() => {
                    const newFormState = !showForm;
                    console.log(
                      `[FORM] ${activeTab} wallet form ${
                        newFormState ? "opened" : "closed"
                      }`
                    );
                    setShowForm(newFormState);
                  }}
                  className={`flex items-center gap-2 px-4 py-2 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 bg-gradient-to-r ${
                    activeTab === "compound"
                      ? "from-blue-600 to-cyan-600"
                      : "from-green-600 to-emerald-600"
                  }`}
                >
                  <Plus size={18} />
                  Add {activeTab === "compound" ? "Compound" : "Company"} Wallet
                </button>
              </div>

              {/* Form Section */}
              {showForm && (
                <div
                  className={`mb-6 p-6 border rounded-lg ${
                    activeTab === "compound"
                      ? "border-blue-200 bg-blue-50/30"
                      : "border-green-200 bg-green-50/30"
                  }`}
                >
                  <form
                    onSubmit={
                      activeTab === "compound"
                        ? handleAddCompoundWallet
                        : handleAddCompanyWallet
                    }
                    className="space-y-4"
                  >
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Wallet Address *
                      </label>
                      <input
                        type="text"
                        value={
                          activeTab === "compound"
                            ? compoundFormData.walletAddress
                            : companyFormData.walletAddress
                        }
                        onChange={(e) => {
                          if (activeTab === "compound") {
                            setCompoundFormData({
                              ...compoundFormData,
                              walletAddress: e.target.value,
                            });
                          } else {
                            setCompanyFormData({
                              ...companyFormData,
                              walletAddress: e.target.value,
                            });
                          }
                        }}
                        placeholder="Enter wallet address"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                          activeTab === "compound"
                            ? "border-gray-300 focus:ring-blue-500"
                            : "border-gray-300 focus:ring-green-500"
                        }`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Status *
                      </label>
                      <select
                        value={
                          activeTab === "compound"
                            ? compoundFormData.status
                            : companyFormData.status
                        }
                        onChange={(e) => {
                          if (activeTab === "compound") {
                            setCompoundFormData({
                              ...compoundFormData,
                              status: e.target.value,
                            });
                          } else {
                            setCompanyFormData({
                              ...companyFormData,
                              status: e.target.value,
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 ${
                          activeTab === "compound"
                            ? "border-gray-300 focus:ring-blue-500"
                            : "border-gray-300 focus:ring-green-500"
                        }`}
                      >
                        {statuses.map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                        type="submit"
                        disabled={submitting}
                        className={`flex-1 px-6 py-3 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 bg-gradient-to-r ${
                          activeTab === "compound"
                            ? "from-blue-600 to-cyan-600"
                            : "from-green-600 to-emerald-600"
                        }`}
                      >
                        {submitting
                          ? "Adding..."
                          : `Add ${
                              activeTab === "compound" ? "Compound" : "Company"
                            } Wallet`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowForm(false)}
                        className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {/* Table Section */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        S.No
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Wallet Address
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        Status
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
                    {(activeTab === "compound"
                      ? compoundWallets
                      : companyWallets
                    ).length === 0 ? (
                      <tr>
                        <td
                          colSpan="5"
                          className="px-6 py-12 text-center text-gray-500"
                        >
                          No {activeTab === "compound" ? "compound" : "company"}{" "}
                          wallets found
                        </td>
                      </tr>
                    ) : (
                      (activeTab === "compound"
                        ? compoundWallets
                        : companyWallets
                      ).map((wallet, index) => (
                        <tr
                          key={wallet._id}
                          className={`hover:transition-colors duration-200 ${
                            activeTab === "compound"
                              ? "hover:bg-blue-50/30"
                              : "hover:bg-green-50/30"
                          }`}
                        >
                          <td className="px-6 py-4 font-semibold text-gray-900">
                            {(currentPagination.currentPage - 1) *
                              currentPagination.limit +
                              index +
                              1}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2 group">
                              <code className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                {truncateAddress(wallet.walletAddress)}
                              </code>
                              <button
                                onClick={() =>
                                  handleCopy(wallet.walletAddress, wallet._id)
                                }
                                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                                title="Copy Wallet Address"
                              >
                                {copyFeedback[wallet._id] ? (
                                  <CheckCircle
                                    size={14}
                                    className="text-green-600"
                                  />
                                ) : (
                                  <Copy size={14} className="text-gray-600" />
                                )}
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                wallet.status === "active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {wallet.status || "N/A"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {wallet.createdAt
                              ? formatDate(wallet.createdAt)
                              : "N/A"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleOpenEdit(wallet)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                onClick={() => {
                                  if (
                                    window.confirm(
                                      "Are you sure you want to delete this wallet?"
                                    )
                                  ) {
                                    console.log("Delete wallet:", wallet._id);
                                  }
                                }}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination Section */}
              {currentPagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-6">
                  <div className="text-sm text-gray-600">
                    Showing page {currentPagination.currentPage} of{" "}
                    {currentPagination.totalPages} (
                    {currentPagination.totalCount} total)
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handlePageChange(currentPagination.currentPage - 1)
                      }
                      disabled={currentPagination.currentPage === 1}
                      className={`p-2 rounded-lg border transition-all duration-300 ${
                        currentPagination.currentPage === 1
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <ChevronLeft size={18} />
                    </button>
                    <div className="flex gap-1">
                      {renderPaginationButtons()}
                    </div>
                    <button
                      onClick={() =>
                        handlePageChange(currentPagination.currentPage + 1)
                      }
                      disabled={
                        currentPagination.currentPage ===
                        currentPagination.totalPages
                      }
                      className={`p-2 rounded-lg border transition-all duration-300 ${
                        currentPagination.currentPage ===
                        currentPagination.totalPages
                          ? "border-gray-200 text-gray-400 cursor-not-allowed"
                          : "border-gray-300 text-gray-700 hover:bg-gray-50"
                      }`}
                    >
                      <ChevronRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Edit {activeTab === "compound" ? "Compound" : "Company"} Wallet
              </h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                disabled={submitting}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleUpdateWallet} className="p-6 space-y-6">
              <div className="flex flex-col gap-2">
                <label htmlFor="editWalletAddress" className="text-sm font-semibold text-gray-700">
                  Wallet Address *
                </label>
                <input
                  id="editWalletAddress"
                  type="text"
                  value={editFormData.walletAddress}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      walletAddress: e.target.value,
                    })
                  }
                  placeholder="Enter wallet address"
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  disabled={submitting}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="editStatus" className="text-sm font-semibold text-gray-700">
                  Status *
                </label>
                <select
                  id="editStatus"
                  value={editFormData.status}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      status: e.target.value,
                    })
                  }
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  disabled={submitting}
                >
                  {statuses.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  disabled={submitting}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-2xl font-semibold hover:bg-gray-50 transition-all duration-300 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 px-6 py-3 text-white rounded-2xl font-semibold shadow-lg transition-all duration-300 disabled:opacity-70 bg-gradient-to-r ${
                    activeTab === "compound"
                      ? "from-blue-600 to-cyan-600"
                      : "from-green-600 to-emerald-600"
                  }`}
                >
                  {submitting ? "Updating..." : "Update Wallet"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
