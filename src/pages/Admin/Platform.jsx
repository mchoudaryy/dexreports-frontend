
import { useEffect, useMemo, useState } from "react";
import {
  Layers,
  Plus,
  Edit2,
  X,
  Save,
  Loader2,
  Globe,
  Activity,
} from "lucide-react";
import { ADMIN_API } from "../../services/ApiHandlers";

export default function Platform() {
  const [platforms, setPlatforms] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState(null);
  const [formData, setFormData] = useState({
    platform: "",
    networkId: "",
    status: true,
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [pagination, setPagination] = useState({
    count: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });

  useEffect(() => {
    fetchPlatforms();
    fetchNetworks();
  }, []);

  const fetchPlatforms = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ADMIN_API.ADMIN_GET_PLATFORMS({ page, limit });
      if (response.data) {
        const {
          data: platformData = [],
          count,
          totalPages,
          currentPage,
          limit: responseLimit,
        } = response.data;
        const normalizedPlatforms = platformData.map((platform) => ({
          ...platform,
          status:
            platform.status === true ||
            platform.status === "true",
        }));
        setPlatforms(normalizedPlatforms);
        setPagination((prev) => ({
          ...prev,
          count: count ?? prev.count,
          totalPages: totalPages ?? prev.totalPages,
          currentPage: currentPage ?? page,
          limit: responseLimit ?? limit,
        }));
      }
    } catch (err) {
      console.error("Error fetching platforms:", err);
      setError(err.response?.data?.message || "Failed to fetch platforms");
    } finally {
      setLoading(false);
    }
  };

  const fetchNetworks = async () => {
    try {
      const response = await ADMIN_API.ADMIN_GET_NETWORKS();
      if (response.data && response.data.data) {
        const normalizedNetworks = response.data.data.map((network) => ({
          ...network,
          status:
            network.status === true ||
            network.status === "true",
        }));
        setNetworks(normalizedNetworks);
      }
    } catch (err) {
      console.error("Error fetching networks:", err);
    }
  };

  const uniqueNetworks = new Set(platforms.map((platform) => platform.networkId)).size;
  const latestUpdate = platforms.length
    ? new Date(
        Math.max(
          ...platforms.map((platform) =>
            new Date(platform.updatedAt || platform.createdAt || Date.now()).getTime()
          )
        )
      )
    : null;

  const stats = [
    {
      title: "Total Platforms",
      value: pagination.count,
      icon: Layers,
      color: "blue",
       accent: "from-blue-500 to-cyan-600",
    },
    {
      title: "Networks Covered",
      value: uniqueNetworks,
      icon: Globe,
      color: "green",
      accent: "from-emerald-500 to-green-600",
    },
    {
      title: "Latest Update",
      value: latestUpdate
        ? latestUpdate.toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "—",
      icon: Activity,
      color: "purple",
      accent: "from-purple-500 to-pink-600",
    },
  ];

  const activeNetworks = useMemo(() => {
    return networks.filter((network) => network.status === true || network.status === "true");
  }, [networks]);

  const colorSchemes = {
    blue: "from-blue-500 to-cyan-600",
    green: "from-emerald-500 to-green-600",
    purple: "from-purple-500 to-pink-600",
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const trimmedPlatform = formData.platform.trim();
    if (!trimmedPlatform || (!editingPlatform && !formData.networkId)) {
      setError("Please fill all required fields");
      setSubmitting(false);
      return;
    }

    const payload = {
      platform: trimmedPlatform,
      networkId: formData.networkId,
      status: formData.status ? "true" : "false",
    };

    try {
      if (editingPlatform) {
        const response = await ADMIN_API.ADMIN_UPDATE_PLATFORMS(editingPlatform._id, payload);
        if (response.data) {
          setSuccess(response.data.message || "Platform updated successfully!");
          await fetchPlatforms(pagination.currentPage);
        }
      } else {
        const response = await ADMIN_API.ADMIN_CREATE_PLATFORMS(payload);
        if (response.data) {
          setSuccess(response.data.message || "Platform created successfully!");
          await fetchPlatforms(pagination.currentPage);
        }
      }
      setTimeout(() => {
        resetForm();
      }, 1500);
    } catch (err) {
      console.error("Error saving platform:", err);
      setError(
        err.response?.data?.message ||
          `Failed to ${editingPlatform ? "update" : "create"} platform`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (platform) => {
    setEditingPlatform(platform);
    setFormData({
      platform: platform.platform || platform.name || "",
      networkId: platform.networkId || "",
      status:
        platform.status === true ||
        platform.status === "true",
    });
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleAdd = () => {
    setEditingPlatform(null);
    setFormData({ platform: "", networkId: "", status: true });
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const resetForm = () => {
    setFormData({
      platform: "",
      networkId: "",
      status: true,
    });
    setEditingPlatform(null);
    setShowModal(false);
    setError(null);
    setSuccess(null);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.currentPage) {
      return;
    }
    fetchPlatforms(page);
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

  const getNetworkName = (platform) => {
    if (platform.networkName) return platform.networkName;
    const match = networks.find((network) => network._id === platform.networkId);
    return match ? match.name : "—";
  };
const handleDownloadExcel = async () => {
  try {
    // First, get the total count from the API
    const firstResponse = await ADMIN_API.ADMIN_GET_PLATFORMS({ page: 1, limit: 1 });
    const totalCount = firstResponse?.data?.count || firstResponse?.data?.totalRecords || 0;
    // Now fetch all data using the total count
    const response = await ADMIN_API.ADMIN_GET_PLATFORMS({ page: 1, limit: totalCount });
    const platformData = response?.data?.data || [];
    const data = platformData.map((p, idx) => ({
      SNo: idx + 1,
      Platform: p.platform || p.name,
      Network: getNetworkName(p),
      Status: p.status ? 'Active' : 'Inactive',
      CreatedAt: p.createdAt,
      UpdatedAt: p.updatedAt,
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Platforms');
    XLSX.writeFile(workbook, 'platforms.xlsx');
  } catch (err) {
    alert('Failed to download Excel. Please try again.');
  }
};


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
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-gray-900 bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent mb-1">
                Platform Management
              </h1>
              <p className="text-base text-gray-600 max-w-2xl">
                Manage platform integrations and associated networks
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
                onClick={handleAdd}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <Plus size={20} />
                <span>Add Platform</span>
              </button>
            </div>
          </div>
        </div>

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

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
          </div>
        ) : (
          <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/40 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                All Platforms ({pagination.count})
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
                      Platform Name
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Network
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Last Updated
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {platforms.length === 0 ? (
                    <tr>
                      <td
                        colSpan="7"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No platforms found. Click "Add Platform" to create one.
                      </td>
                    </tr>
                  ) : (
                    platforms.map((platform, index) => (
                      <tr
                        key={platform._id}
                        className="hover:bg-blue-50/30 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {(pagination.currentPage - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg">
                              <Layers className="h-5 w-5 text-white" />
                            </div>
                            <span className="font-semibold text-gray-900">
                              {platform.platform || platform.name}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {getNetworkName(platform)}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              platform.status
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {platform.status ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {platform.createdAt ? formatDate(platform.createdAt) : "—"}
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {platform.updatedAt ? formatDate(platform.updatedAt) : "—"}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(platform)}
                              className="p-2 bg-blue-100 hover:bg-blue-200 text-blue-600 rounded-lg transition-colors duration-200"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>
                            {/* <button
                              className="p-2 bg-gray-100 text-gray-400 rounded-lg cursor-not-allowed"
                              title="Delete (Not available)"
                              disabled
                            >
                              —
                            </button> */}
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
                  platforms
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.currentPage - 1)}
                    disabled={pagination.currentPage === 1 || loading}
                    className={`px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold transition-colors duration-200 ${pagination.currentPage === 1 || loading
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
                      className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors duration-200 ${pagination.currentPage === page
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
                    className={`px-4 py-2 rounded-xl border border-gray-300 text-sm font-semibold transition-colors duration-200 ${pagination.currentPage === pagination.totalPages || loading
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

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingPlatform ? "Edit Platform" : "Add New Platform"}
              </h2>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors duration-200"
                disabled={submitting}
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                  {error}
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
                  {success}
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Platform Name *
                </label>
                <input
                  type="text"
                  name="platform"
                  value={formData.platform}
                  onChange={handleInputChange}
                  required
                  disabled={submitting}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="e.g., STON.fi"
                />
              </div>

              {!editingPlatform && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Network *
                  </label>
                  <select
                    name="networkId"
                    value={formData.networkId}
                    onChange={handleInputChange}
                    required
                    disabled={submitting || activeNetworks.length === 0}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>
                      {activeNetworks.length === 0 ? "No active networks available" : "Select network"}
                    </option>
                    {activeNetworks.map((network) => (
                      <option key={network._id} value={network._id}>
                        {network.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="status"
                  name="status"
                  checked={formData.status}
                  onChange={handleInputChange}
                  disabled={submitting}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:cursor-not-allowed"
                />
                <label htmlFor="status" className="text-sm font-semibold text-gray-700">
                  Active Status
                </label>
              </div>

              <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={submitting}
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save size={18} />
                      <span>{editingPlatform ? "Update" : "Create"} Platform</span>
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
