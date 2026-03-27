import { useState, useEffect } from "react";
import {
  Wallet,
  Plus,
  X,
  Loader2,
  Copy,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { ADMIN_API } from "../../services/ApiHandlers";

export default function Wallets() {
  const [companyWallets, setCompanyWallets] = useState([]);
  const [compoundWallets, setCompoundWallets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("company");
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [showCompoundModal, setShowCompoundModal] = useState(false);
  const [companyFormData, setCompanyFormData] = useState({
    walletAddress: "",
    status: "active",
  });
  const [compoundFormData, setCompoundFormData] = useState({
    walletAddress: "",
    status: "active",
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [copyFeedback, setCopyFeedback] = useState({});

  useEffect(() => {
    fetchWallets();
  }, []);

  const fetchWallets = async () => {
    try {
      setLoading(true);
      setError(null);
      const [companyRes, compoundRes] = await Promise.all([
        ADMIN_API.ADMIN_GET_COMPANY_WALLETS(),
        ADMIN_API.ADMIN_GET_COMPOUND_WALLETS(),
      ]);

      if (companyRes.data && Array.isArray(companyRes.data.data)) {
        setCompanyWallets(companyRes.data.data);
      }
      if (compoundRes.data && Array.isArray(compoundRes.data.data)) {
        setCompoundWallets(compoundRes.data.data);
      }
    } catch (err) {
      console.error("Error fetching wallets:", err);
      setError(err.response?.data?.message || "Failed to fetch wallets");
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyInputChange = (e) => {
    const { name, value } = e.target;
    setCompanyFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCompoundInputChange = (e) => {
    const { name, value } = e.target;
    setCompoundFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCompanySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!companyFormData.walletAddress) {
      setError("Please enter a wallet address");
      setSubmitting(false);
      return;
    }

    try {
      const response = await ADMIN_API.ADMIN_ADD_COMPANY_WALLET(
        companyFormData
      );
      if (response.data) {
        setSuccess(response.data.message || "Company wallet added successfully!");
        resetCompanyForm();
        await fetchWallets();
      }
    } catch (err) {
      console.error("Error adding company wallet:", err);
      setError(
        err.response?.data?.message || "Failed to add company wallet"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompoundSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!compoundFormData.walletAddress) {
      setError("Please enter a wallet address");
      setSubmitting(false);
      return;
    }

    try {
      const response = await ADMIN_API.ADMIN_ADD_COMPOUND_WALLET(
        compoundFormData
      );
      if (response.data) {
        setSuccess(response.data.message || "Compound wallet added successfully!");
        resetCompoundForm();
        await fetchWallets();
      }
    } catch (err) {
      console.error("Error adding compound wallet:", err);
      setError(
        err.response?.data?.message || "Failed to add compound wallet"
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetCompanyForm = () => {
    setCompanyFormData({
      walletAddress: "",
      status: "active",
    });
    setShowCompanyModal(false);
    setTimeout(() => {
      setSuccess(null);
    }, 2000);
  };

  const resetCompoundForm = () => {
    setCompoundFormData({
      walletAddress: "",
      status: "active",
    });
    setShowCompoundModal(false);
    setTimeout(() => {
      setSuccess(null);
    }, 2000);
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
      title: "Total Company Wallets",
      value: companyWallets.length,
      icon: Wallet,
      color: "blue",
      accent: "from-blue-500 to-cyan-600",
    },
    {
      title: "Total Compound Wallets",
      value: compoundWallets.length,
      icon: Wallet,
      color: "purple",
      accent: "from-purple-500 to-pink-600",
    },
    {
      title: "Active Wallets",
      value:
        companyWallets.filter((w) => w.status === "active").length +
        compoundWallets.filter((w) => w.status === "active").length,
      icon: CheckCircle,
      color: "green",
      accent: "from-emerald-500 to-green-600",
    },
  ];

  const colorSchemes = {
    blue: "from-blue-500 to-cyan-600",
    green: "from-emerald-500 to-green-600",
    purple: "from-purple-500 to-pink-600",
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
          <div className="text-center lg:text-left">
            <div className="flex items-center justify-center lg:justify-start gap-3 mb-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
              <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse delay-300"></div>
              <div className="w-3 h-3 bg-cyan-500 rounded-full animate-pulse delay-700"></div>
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse delay-1000"></div>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-900 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-3">
              Wallets Management
            </h1>
            <p className="text-base text-gray-600 max-w-2xl">
              Manage company and compound wallets
            </p>
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

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8">
          <button
            onClick={() => setActiveTab("company")}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "company"
                ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg"
                : "bg-white/70 text-gray-700 border border-gray-200 hover:bg-white"
            }`}
          >
            Company Wallets
          </button>
          <button
            onClick={() => setActiveTab("compound")}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
              activeTab === "compound"
                ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
                : "bg-white/70 text-gray-700 border border-gray-200 hover:bg-white"
            }`}
          >
            Compound Wallets
          </button>
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
        ) : (
          <>
            {/* Company Wallets Tab */}
            {activeTab === "company" && (
              <div className="space-y-6">
                <button
                  onClick={() => setShowCompanyModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <Plus size={20} />
                  <span>Add Company Wallet</span>
                </button>

                {/* Company Wallets Table */}
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                      All Company Wallets ({companyWallets.length})
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
                            Wallet Address
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Created At
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {companyWallets.length === 0 ? (
                          <tr>
                            <td
                              colSpan="4"
                              className="px-6 py-12 text-center text-gray-500"
                            >
                              No company wallets found. Click "Add Company Wallet" to create one.
                            </td>
                          </tr>
                        ) : (
                          companyWallets.map((wallet, index) => (
                            <tr
                              key={wallet._id}
                              className="hover:bg-blue-50/30 transition-colors duration-200"
                            >
                              <td className="px-6 py-4 font-semibold text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 group">
                                  <code className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                    {truncateAddress(wallet.walletAddress)}
                                  </code>
                                  <button
                                    onClick={() =>
                                      handleCopy(
                                        wallet.walletAddress,
                                        wallet._id + "_company"
                                      )
                                    }
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                                    title="Copy Wallet Address"
                                  >
                                    {copyFeedback[wallet._id + "_company"] ? (
                                      <CheckCircle size={14} className="text-green-600" />
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
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {wallet.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {formatDate(wallet.createdAt)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Compound Wallets Tab */}
            {activeTab === "compound" && (
              <div className="space-y-6">
                <button
                  onClick={() => setShowCompoundModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                >
                  <Plus size={20} />
                  <span>Add Compound Wallet</span>
                </button>

                {/* Compound Wallets Table */}
                <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
                  <div className="p-6 border-b border-gray-200">
                    <h2 className="text-2xl font-bold text-gray-900">
                      All Compound Wallets ({compoundWallets.length})
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
                            Wallet Address
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Created At
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {compoundWallets.length === 0 ? (
                          <tr>
                            <td
                              colSpan="4"
                              className="px-6 py-12 text-center text-gray-500"
                            >
                              No compound wallets found. Click "Add Compound Wallet" to create one.
                            </td>
                          </tr>
                        ) : (
                          compoundWallets.map((wallet, index) => (
                            <tr
                              key={wallet._id}
                              className="hover:bg-purple-50/30 transition-colors duration-200"
                            >
                              <td className="px-6 py-4 font-semibold text-gray-900">
                                {index + 1}
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2 group">
                                  <code className="text-xs font-mono text-gray-600 bg-gray-100 px-2 py-1 rounded">
                                    {truncateAddress(wallet.walletAddress)}
                                  </code>
                                  <button
                                    onClick={() =>
                                      handleCopy(
                                        wallet.walletAddress,
                                        wallet._id + "_compound"
                                      )
                                    }
                                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-200 rounded"
                                    title="Copy Wallet Address"
                                  >
                                    {copyFeedback[wallet._id + "_compound"] ? (
                                      <CheckCircle size={14} className="text-green-600" />
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
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  {wallet.status}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-gray-600">
                                {formatDate(wallet.createdAt)}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Company Wallet Modal */}
        {showCompanyModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Add Company Wallet
                </h3>
                <button
                  onClick={() => setShowCompanyModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleCompanySubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Wallet Address *
                  </label>
                  <input
                    type="text"
                    name="walletAddress"
                    value={companyFormData.walletAddress}
                    onChange={handleCompanyInputChange}
                    placeholder="Enter wallet address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={companyFormData.status}
                    onChange={handleCompanyInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Add Wallet
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCompanyModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Compound Wallet Modal */}
        {showCompoundModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 animate-in zoom-in-95 slide-in-from-bottom-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  Add Compound Wallet
                </h3>
                <button
                  onClick={() => setShowCompoundModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-gray-600" />
                </button>
              </div>

              <form onSubmit={handleCompoundSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Wallet Address *
                  </label>
                  <input
                    type="text"
                    name="walletAddress"
                    value={compoundFormData.walletAddress}
                    onChange={handleCompoundInputChange}
                    placeholder="Enter wallet address"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    name="status"
                    value={compoundFormData.status}
                    onChange={handleCompoundInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus size={18} />
                        Add Wallet
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCompoundModal(false)}
                    className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
