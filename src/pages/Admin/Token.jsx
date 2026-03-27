import * as XLSX from 'xlsx';
  // Download Excel handler using latest API response
 
import { useEffect, useMemo, useState } from "react";
import {
  Coins,
  Layers,
  Globe,
  Activity,
  Plus,
  Edit2,
  Save,
  X,
  Loader2,
} from "lucide-react";
import { ADMIN_API } from "../../services/ApiHandlers";

export default function Token() {
  const [tokens, setTokens] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingToken, setEditingToken] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    symbol: "",
    solAddress: "",
    lpMint: "",
    url: "",
    platformId: "",
    tokenAddress: "",
    pairAddress: "",
    chainId: "",
    usd_min: "",
    token_logo_url: "",
    networkId: "",
    status: true,
  });
  const [pagination, setPagination] = useState({
    count: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10,
  });

  useEffect(() => {
    fetchTokens();
    fetchPlatforms();
    fetchNetworks();
  }, []);

  const fetchTokens = async (page = 1, limit = pagination.limit) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ADMIN_API.ADMIN_GET_TOKENS({ page, limit });
      if (response.data) {
        const {
          data: tokenData = [],
          count,
          totalPages,
          currentPage,
          limit: responseLimit,
        } = response.data;
        setTokens(tokenData);
        setPagination((prev) => ({
          ...prev,
          count: count ?? prev.count,
          totalPages: totalPages ?? prev.totalPages,
          currentPage: currentPage ?? page,
          limit: responseLimit ?? limit,
        }));
      }
    } catch (err) {
      console.error("Error fetching tokens:", err);
      setError(err.response?.data?.message || "Failed to fetch tokens");
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatforms = async () => {
    try {
      const response = await ADMIN_API.ADMIN_GET_PLATFORMS();
      if (response.data && response.data.data) {
        const normalizedPlatforms = response.data.data.map((platform) => ({
          ...platform,
          status:
            platform.status === true ||
            platform.status === "true",
        }));
        setPlatforms(normalizedPlatforms);
      }
    } catch (err) {
      console.error("Error fetching platforms:", err);
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

  const stats = useMemo(() => {
    const uniquePlatforms = new Set(tokens.map((token) => token.platformId)).size;
    const uniqueNetworks = new Set(tokens.map((token) => token.networkId)).size;
    return [
      {
        title: "Total Tokens",
        value: pagination.count,
        icon: Coins,
        color: "blue",
        accent: "from-blue-500 to-cyan-600",
      },
      {
        title: "Platforms Covered",
        value: uniquePlatforms,
        icon: Layers,
        color: "green",
        accent: "from-emerald-500 to-green-600",
      },
      {
        title: "Networks Reached",
        value: uniqueNetworks,
        icon: Globe,
        color: "purple",
        accent: "from-purple-500 to-pink-600",
      },
    ];
  }, [tokens, pagination.count]);

  const activeNetworks = useMemo(() => {
    return networks.filter((network) => network.status === true || network.status === "true");
  }, [networks]);

  const activePlatforms = useMemo(() => {
    return platforms.filter((platform) => platform.status === true || platform.status === "true");
  }, [platforms]);

  const colorSchemes = {
    blue: "from-blue-500 to-cyan-600",
    green: "from-emerald-500 to-green-600",
    purple: "from-purple-500 to-pink-600",
  };

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({
      ...previous,
      [name]: name === "status" ? value === "true" : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const trimmedName = formData.name.trim();
    const trimmedSymbol = formData.symbol.trim();
    const trimmedSolAddress = formData.solAddress.trim();
    const trimmedUrl = formData.url.trim();
    const trimmedPlatform = formData.platformId.trim();
    const trimmedTokenAddress = formData.tokenAddress.trim();
    const trimmedPairAddress = formData.pairAddress.trim();
    const trimmedChainId = formData.chainId.trim();

    if (
      !trimmedName ||
      !trimmedSymbol ||
      !trimmedPlatform ||
      !trimmedTokenAddress ||
      !trimmedPairAddress ||
      !trimmedChainId
    ) {
      setError("Please fill all required fields");
      setSubmitting(false);
      return;
    }

    const trimmedLpMint = formData.lpMint.trim();
    const payload = {
      name: trimmedName,
      symbol: trimmedSymbol,
      solAddress: trimmedSolAddress || undefined,
      lpMint: trimmedLpMint || undefined,
      url: trimmedUrl,
      platformId: trimmedPlatform,
      tokenAddress: trimmedTokenAddress,
      pairAddress: trimmedPairAddress,
      chainId: trimmedChainId,
      status: formData.status,
    };

    if (formData.usd_min !== "") {
      const parsed = parseFloat(formData.usd_min);
      if (Number.isNaN(parsed)) {
        setError("USD Min must be a valid number");
        setSubmitting(false);
        return;
      }
      payload.usd_min = parsed;
    }

    if (formData.token_logo_url.trim()) {
      payload.token_logo_url = formData.token_logo_url.trim();
    }

    if (formData.networkId.trim()) {
      payload.networkId = formData.networkId.trim();
    }

    try {
      if (editingToken) {
        const response = await ADMIN_API.ADMIN_UPDATE_TOKENS(editingToken._id, payload);
        if (response.data) {
          setSuccess(response.data.message || "Token updated successfully!");
          await fetchTokens(pagination.currentPage);
        }
      } else {
        const response = await ADMIN_API.ADMIN_CREATE_TOKENS(payload);
        if (response.data) {
          setSuccess(response.data.message || "Token created successfully!");
          await fetchTokens(pagination.currentPage);
        }
      }
      setTimeout(() => {
        resetForm();
      }, 1500);
    } catch (err) {
      console.error("Error saving token:", err);
      setError(
        err.response?.data?.message ||
        `Failed to ${editingToken ? "update" : "create"} token`
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdd = () => {
    setEditingToken(null);
    setFormData({
      name: "",
      symbol: "",
      solAddress: "",
      lpMint: "",
      url: "",
      platformId: "",
      tokenAddress: "",
      pairAddress: "",
      chainId: "",
      usd_min: "",
      token_logo_url: "",
      networkId: "",
      status: true,
    });
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const handleEdit = (token) => {
    setEditingToken(token);
    setFormData({
      name: token.name || "",
      symbol: token.symbol || "",
      solAddress: token.solAddress || "",
      lpMint: token.lpMint || "",
      url: token.url || "",
      platformId: token.platformId || "",
      tokenAddress: token.tokenAddress || "",
      pairAddress: token.pairAddress || "",
      chainId: token.chainId || "",
      usd_min: token.usd_min === undefined || token.usd_min === null ? "" : String(token.usd_min),
      token_logo_url: token.token_logo_url || "",
      networkId: token.networkId || "",
      status: token.status === undefined ? true : (token.status === true || token.status === "true"),
    });
    setShowModal(true);
    setError(null);
    setSuccess(null);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      symbol: "",
      solAddress: "",
      lpMint: "",
      url: "",
      platformId: "",
      tokenAddress: "",
      pairAddress: "",
      chainId: "",
      usd_min: "",
      token_logo_url: "",
      networkId: "",
      status: true,
    });
    setEditingToken(null);
    setShowModal(false);
    setError(null);
    setSuccess(null);
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > pagination.totalPages || page === pagination.currentPage) {
      return;
    }
    fetchTokens(page);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return (
      <div className="flex flex-col">
        <span className="whitespace-nowrap font-medium text-gray-900">
          {date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
          })}
        </span>
        <span className="text-xs text-gray-400">
          {date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    );
  };

  const truncateAddress = (address) => {
    if (!address || address === "—") return "—";
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const getPlatformName = (token) => {
    const match = platforms.find((platform) => platform._id === token.platformId);
    if (match) {
      return match.platform || match.name;
    }
    return token.platformName || "—";
  };

  const getNetworkName = (token) => {
    if (token.networkName) {
      return token.networkName;
    }
    const matchNetwork = networks.find((network) => network._id === token.networkId);
    if (matchNetwork) {
      return matchNetwork.name;
    }
    const matchPlatform = platforms.find((platform) => platform._id === token.platformId);
    if (matchPlatform) {
      return matchPlatform.networkName || "—";
    }
    return "—";
  };

  const selectedPlatform = useMemo(() => {
    return platforms.find((platform) => platform._id === formData.platformId) || null;
  }, [formData.platformId, platforms]);

  const selectedNetworkName = useMemo(() => {
    if (formData.networkId) {
      const match = networks.find((network) => network._id === formData.networkId);
      if (match) {
        return match.name;
      }
    }
    if (selectedPlatform) {
      return selectedPlatform.networkName || "";
    }
    return "";
  }, [formData.networkId, networks, selectedPlatform]);


   const handleDownloadExcel = async () => {
    try {
      // First, get the total count from the API
      const firstResponse = await ADMIN_API.ADMIN_GET_TOKENS({ page: 1, limit: 1 });
      const totalCount = firstResponse?.data?.count || firstResponse?.data?.totalRecords || 0;
      // Now fetch all data using the total count
      const response = await ADMIN_API.ADMIN_GET_TOKENS({ page: 1, limit: totalCount });
      const tokenData = response?.data?.data || [];
      const data = tokenData.map((t, idx) => ({
        SNo: idx + 1,
        Name: t.name,
        Symbol: t.symbol,
        TokenAddress: t.tokenAddress,
        PairAddress: t.pairAddress,
        SOLAddress: t.solAddress,
        LPMint: t.lpMint,
        TokenLogoURL: t.token_logo_url,
        Platform: t.platformName || t.platformId,
        Network: t.networkName || t.networkId,
        ChainID: t.chainId,
        USDMin: t.usd_min,
        Updated: t.updatedAt || t.createdAt,
      }));
      const worksheet = XLSX.utils.json_to_sheet(data);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Tokens');
      XLSX.writeFile(workbook, 'tokens.xlsx');
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
                Token Management
              </h1>
              <p className="text-base text-gray-600 max-w-2xl">
                Organize token details across platforms and networks
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
                <span>Add Token</span>
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
                All Tokens ({pagination.count})
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
                      Token Address
                    </th>
                    {/* <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Pair Address
                    </th> */}
                    {/* <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      SOL Address
                    </th> */}
                    {/* <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      LP Mint
                    </th> */}
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Token Logo URL
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Platform
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Network
                    </th>
                    {/* <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Chain ID
                    </th> */}
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      USD Min
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Updated
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {tokens.length === 0 ? (
                    <tr>
                      <td
                        colSpan="13"
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        No tokens found. Click "Add Token" to create one.
                      </td>
                    </tr>
                  ) : (
                    tokens.map((token, index) => (
                      <tr
                        key={token._id}
                        className="hover:bg-blue-50/30 transition-colors duration-200"
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {(pagination.currentPage - 1) * pagination.limit + index + 1}
                        </td>
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {token.name}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600" title={token.tokenAddress}>
                          {truncateAddress(token.tokenAddress)}
                        </td>
                        {/* <td className="px-6 py-4 text-xs text-gray-600" title={token.pairAddress}>
                          {truncateAddress(token.pairAddress)}
                        </td> */}
                        {/* <td className="px-6 py-4 text-xs text-gray-600" title={token.solAddress}>
                          {truncateAddress(token.solAddress)}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-600" title={token.lpMint}>
                          {truncateAddress(token.lpMint)}
                        </td> */}
                        <td className="px-6 py-4 text-xs text-gray-700">
                          {token.token_logo_url ? (
                            <div className="flex items-center gap-3">
                              <img
                                src={token.token_logo_url}
                                alt={token.name}
                                className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                onError={(event) => {
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                              {/* <a
                                href={token.token_logo_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 underline break-all"
                              >
                                View
                              </a> */}
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {getPlatformName(token)}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {getNetworkName(token)}
                        </td>
                        {/* <td className="px-6 py-4 text-gray-700">
                          {token.chainId || "—"}
                        </td> */}
                        <td className="px-6 py-4 text-gray-700">
                          {token.usd_min === undefined || token.usd_min === null
                            ? "—"
                            : token.usd_min}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            token.status === true || token.status === "true"
                              ? "bg-green-100 text-green-700"
                              : "bg-red-100 text-red-700"
                          }`}>
                            {token.status === true || token.status === "true" ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600 text-sm">
                          {token.updatedAt ? formatDate(token.updatedAt) : formatDate(token.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleEdit(token)}
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
                  tokens
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
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingToken ? "Edit Token" : "Add New Token"}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Token Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="e.g., 4Sides"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Symbol *
                  </label>
                  <input
                    type="text"
                    name="symbol"
                    value={formData.symbol}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="e.g., IDLE"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Select Platform *
                  </label>
                  <select
                    name="platformId"
                    value={formData.platformId}
                    onChange={handleInputChange}
                    required
                    disabled={submitting || activePlatforms.length === 0}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="" disabled>
                      {activePlatforms.length === 0 ? "No active platforms available" : "Select platform"}
                    </option>
                    {activePlatforms.map((platform) => (
                      <option key={platform._id} value={platform._id}>
                        {(platform.platform || platform.name) + (platform.networkName ? ` (${platform.networkName})` : "")}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Token Address *
                  </label>
                  <input
                    type="text"
                    name="tokenAddress"
                    value={formData.tokenAddress}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Token address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pair Address *
                  </label>
                  <input
                    type="text"
                    name="pairAddress"
                    value={formData.pairAddress}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Pair address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Chain ID / Network *
                  </label>
                  <input
                    type="text"
                    name="chainId"
                    value={formData.chainId}
                    onChange={handleInputChange}
                    required
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter chain ID or network name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    USD Min
                  </label>
                  <input
                    type="number"
                    name="usd_min"
                    value={formData.usd_min}
                    onChange={handleInputChange}
                    disabled={submitting}
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Enter minimum USD threshold"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Token Logo URL
                  </label>
                  <input
                    type="url"
                    name="token_logo_url"
                    value={formData.token_logo_url}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    SOL Address
                  </label>
                  <input
                    type="text"
                    name="solAddress"
                    value={formData.solAddress}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Solana address"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    LP Mint
                  </label>
                  <input
                    type="text"
                    name="lpMint"
                    value={formData.lpMint}
                    onChange={handleInputChange}
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="LP mint address"
                  />
                </div>

                {editingToken && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleInputChange}
                      disabled={submitting}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  </div>
                )}
              </div>

              {selectedPlatform && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                  <div className="font-semibold text-gray-700">Platform Summary</div>
                  <div>{selectedPlatform.platform || selectedPlatform.name}</div>
                  {selectedNetworkName && <div>Network: {selectedNetworkName}</div>}
                </div>
              )}

              {!selectedPlatform && formData.networkId && !selectedNetworkName && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-600">
                  Network ID: {formData.networkId}
                </div>
              )}

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
                      <span>{editingToken ? "Update" : "Create"} Token</span>
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
