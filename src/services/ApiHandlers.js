import axios from "axios";
import { API_CONFIG } from "./ApiConfig";

// Create an Axios instance with the base URL from environment variables
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000, // 60 seconds timeout to handle slow API responses
});

// Request cache
const requestCache = new Map();
const CACHE_DURATION = 30000; // 30 seconds

// List of public endpoints that don't require token
const PUBLIC_ENDPOINTS = [
  API_CONFIG.LOGIN,
  API_CONFIG.SIGNUP,
  API_CONFIG.FORGOT_PASSWORD,
  API_CONFIG.RESET_PASSWORD,
  API_CONFIG.VERIFY_RESET_OTP,
  API_CONFIG.VERIFY_SIGNUP_OTP,
  API_CONFIG.RESEND_SIGNUP_OTP,
].filter(Boolean);

// Helper function to check if endpoint is public
const isPublicEndpoint = (url) => {
  return PUBLIC_ENDPOINTS.some((endpoint) => url.includes(endpoint));
};

// Add request interceptor to include auth token if available and check token for protected routes
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("authToken");
    const requestUrl = config.url || "";

    // Check if this is a protected endpoint and no token exists
    if (!isPublicEndpoint(requestUrl) && !token) {
      console.warn(
        `Blocked API call to protected endpoint without token: ${requestUrl}`
      );
      return Promise.reject({
        message: "Authentication required. Please login.",
        code: "NO_TOKEN",
        config,
      });
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Cache GET requests (only if token exists for protected endpoints)
    if (config.method === "get" && (isPublicEndpoint(requestUrl) || token)) {
      const cacheKey = JSON.stringify(config);
      const cached = requestCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        // console.log("Returning cached response for:", config.url);
        return Promise.reject({
          __isCached: true,
          data: cached.data,
          config,
        });
      }
    }

    // console.log(
    //   `Making ${config.method?.toUpperCase()} request to: ${config.url}`
    // );
    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle common errors and caching
api.interceptors.response.use(
  (response) => {
    // Cache successful GET responses
    if (response.config.method === "get") {
      const cacheKey = JSON.stringify(response.config);
      requestCache.set(cacheKey, {
        data: response.data,
        timestamp: Date.now(),
      });
    }
    return response;
  },
  (error) => {
    // Handle cached responses
    if (error.__isCached) {
      return Promise.resolve({
        data: error.data,
        status: 200,
        statusText: "OK (Cached)",
        headers: {},
        config: error.config,
      });
    }

    // Handle no token error
    if (error.code === "NO_TOKEN") {
      console.warn("API call blocked - no token:", error.config?.url);
      // Redirect to authentication page if not already there
      if (!window.location.pathname.includes("/authentication")) {
        window.location.href = "/authentication";
      }
      return Promise.reject({
        message: "Authentication required. Redirecting to login...",
        code: "NO_TOKEN",
        originalError: error,
      });
    }

    if (error.code === "ECONNABORTED") {
      console.warn("Request timeout:", error.config?.url);
      return Promise.reject({
        message: "Request is taking longer than expected. Please try again.",
        code: "TIMEOUT",
        originalError: error,
      });
    }

    if (error.response) {
      // Server responded with error status
      console.error("API Error Response:", {
        status: error.response.status,
        data: error.response.data,
        url: error.response.config.url,
      });
    } else if (error.request) {
      // Request made but no response received
      console.warn("API No Response:", error.request);
      return Promise.reject({
        message: "Network error. Please check your connection.",
        code: "NETWORK_ERROR",
        originalError: error,
      });
    } else {
      // Something else happened
      console.error("API Unknown Error:", error.message);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem("authToken");
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes("/authentication")) {
        window.location.href = "/authentication";
      }
    }
    return Promise.reject(error);
  }
);

// Clear cache function (optional, for development)
export const clearApiCache = () => {
  requestCache.clear();
  console.log("API cache cleared");
};

// API handlers
export const AUTH_API = {
  SIGNUP: (userData) => {
    console.log("Signup API call:", userData);
    return api.post(API_CONFIG.SIGNUP, userData);
  },
  LOGIN: (credentials) => api.post(API_CONFIG.LOGIN, credentials),
  GET_USER: () => api.get(API_CONFIG.GET_USER),
  LOGOUT: () => api.post(API_CONFIG.LOGOUT),
  FORGOT_PASSWORD: (emailData) =>
    api.post(API_CONFIG.FORGOT_PASSWORD, emailData),
  RESET_PASSWORD: (passwordData) =>
    api.post(API_CONFIG.RESET_PASSWORD, passwordData),
  VERIFY_RESET_OTP: (otpData) => api.post(API_CONFIG.VERIFY_RESET_OTP, otpData),
  VERIFY_SIGNUP_OTP: (otpData) =>
    api.post(API_CONFIG.VERIFY_SIGNUP_OTP, otpData),
  RESEND_SIGNUP_OTP: (emailData) =>
    api.post(API_CONFIG.RESEND_SIGNUP_OTP, emailData),
};

export const ADMIN_API = {
  GET_ACTIVE_NETWORKS: () => api.get(API_CONFIG.GET_ACTIVE_NETWORKS),

  GET_ACTIVE_PLATFORMS: ({ networkId } = {}) => {
    const params = {};
    if (networkId) params.networkId = networkId;
    return api.get(API_CONFIG.GET_ACTIVE_PLATFORMS, { params });
  },

  GET_TOKENS: ({ platformId, networkId, tokenId } = {}) => {
    const params = {};
    if (platformId) params.platformId = platformId;
    if (networkId) params.networkId = networkId;
    if (tokenId) params.tokenId = tokenId;

    return api.get(API_CONFIG.GET_TOKENS, { params });
  },

  GET_LIVE_TOKEN_DATA: ({ chainId, tokenAddress } = {}) => {
    const params = {};
    if (chainId) params.chainId = chainId;
    if (tokenAddress) params.tokenAddress = tokenAddress;
    return api.get(API_CONFIG.GET_LIVE_TOKEN_DATA, { params });
  },

  // GET_WALLETS: ({ tokenId } = {}) => {
  //   const params = {};
  //   if (tokenId) params.tokenId = tokenId;
  //   return api.get(API_CONFIG.GET_WALLETS, { params });
  // },

  GET_WALLETS: ({ tokenId, tokenAddress, walletAddress, page = 1, limit = 10 } = {}) => {
    const params = {};
    if (tokenId) params.tokenId = tokenId;
    if (tokenAddress) params.tokenAddress = tokenAddress;
    if (walletAddress) params.walletAddress = walletAddress;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    return api.get(API_CONFIG.GET_WALLETS, { params });
  },

  GET_TOKEN_REPORTS: ({ tokenAddress, page = 1, limit = 10, startTime, endTime } = {}) => {
    const params = {};
    if (tokenAddress) params.tokenAddress = tokenAddress;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;
    return api.get(API_CONFIG.GET_TOKEN_REPORTS, { params });
  },
  GET_WALLET_REPORTS: ({ walletAddress, page, limit, startTime, endTime } = {}) => {
    const params = {};
    if (walletAddress) params.walletAddress = walletAddress;
    if (page) params.page = page;
    if (limit) params.limit = limit; // Changed from pageSize to limit
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;
    return api.get(API_CONFIG.GET_WALLET_REPORTS, { params });
  },
  GET_TOKEN_REPORTS_TOTAL: (tokenAddress) => {
    return api.get(`${API_CONFIG.GET_TOKEN_REPORTS_TOTAL}/${tokenAddress}`);
  },
  GET_WALLET_REPORTS_TOTAL: (walletAddress) => {
    return api.get(`${API_CONFIG.GET_WALLET_REPORTS_TOTAL}/${walletAddress}`);
  },
  TOKEN_REPORTS_TOTAL: ({ tokenAddress } = {}) => {
    const params = {};
    if (tokenAddress) params.tokenAddress = tokenAddress;
    return api.get(API_CONFIG.TOKEN_REPORTS_TOTAL, { params });
  },
  WALLET_REPORTS_TOTAL: ({ walletAddress } = {}) => {
    const params = {};
    if (walletAddress) params.walletAddress = walletAddress;
    return api.get(API_CONFIG.WALLET_REPORTS_TOTAL, { params });
  },

  GET_SETTINGS: () => {
    return api.get(API_CONFIG.GET_SETTINGS);
  },
  GET_FILTERED_REPORTS: ({ tokenAddress, filterType } = {}) => {
    const params = {};
    if (tokenAddress) params.tokenAddress = tokenAddress;
    if (filterType) params.filterType = filterType;
    return api.get(API_CONFIG.GET_FILTERED_REPORTS, { params });
  },
  TOKEN_HOLDER_LIST: ({
    tokenAddress,
    filterType,
    page = 1,
    pageSize = 10,
  } = {}) => {
    const params = {};
    if (tokenAddress) params.tokenAddress = tokenAddress;
    if (filterType) params.filterType = filterType;
    if (page) params.page = page;
    if (pageSize) params.pageSize = pageSize;
    return api.get(API_CONFIG.TOKEN_HOLDER_LIST, { params });
  },

  GET_POOLED_SOL_AND_TOKENS: ({ chainId, tokenAddress } = {}) => {
    const params = {};
    if (chainId) params.chainId = chainId;
    if (tokenAddress) params.tokenAddress = tokenAddress;
    return api.get(API_CONFIG.GET_POOLED_SOL_AND_TOKENS, { params });
  },

  GET_LIQUIDITY_POOLS: ({
    tokenAddress,
    page = 1,
    limit = 10,
    poolType,
  } = {}) => {
    const params = {};
    if (tokenAddress) params.tokenAddress = tokenAddress;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (poolType) params.poolType = poolType;
    return api.get(API_CONFIG.GET_LIQUIDITY_POOLS, { params });
  },

  GET_LIVE_POOLS_DATA: ({ pairAddress, tokenAddress, chainId } = {}) => {
    const params = {};
    if (pairAddress) params.pairAddress = pairAddress;
    if (tokenAddress) params.tokenAddress = tokenAddress;
    if (chainId) params.chainId = chainId;
    return api.get(API_CONFIG.GET_LIVE_POOLS_DATA, { params });
  },

  GET_LIVE_POOLS_NOT_RWA_DATA: ({
    pairAddress,
    tokenAddress,
    chainId,
    page,
    limit,
  } = {}) => {
    const params = {};
    if (pairAddress) params.pairAddress = pairAddress;
    if (tokenAddress) params.tokenAddress = tokenAddress;
    if (chainId) params.chainId = chainId;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    return api.get(API_CONFIG.GET_LIVE_POOLS_NOT_RWA_DATA, { params });
  },

  GET_DAILY_RWA_POOLS_REPORTS: ({
    chainId,
    pairAddress,
    tokenAddress,
    page,
    limit,
    startDate,
    endDate,
  } = {}) => {
    const params = {};
    if (chainId) params.chainId = chainId;
    if (pairAddress) params.pairAddress = pairAddress;
    if (tokenAddress) params.tokenAddress = tokenAddress;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return api.get(API_CONFIG.GET_DAILY_RWA_POOLS_REPORTS, { params });
  },
  GET_RWA_POOL_DATE_RANGE_REPORT: ({ startTime, endTime, pairAddress, page, limit } = {}) => {
    const params = {};
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;
    if (pairAddress) params.pairAddress = pairAddress;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    return api.get(API_CONFIG.GET_RWA_POOL_DATE_RANGE_REPORT, { params });
  },
  GET_PAGINATED_TOKENS: ({
    chainId,
    platformId,
    tokenAddress,
    page = 1,
    limit = 10,
  } = {}) => {
    const params = {};
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (chainId) params.chainId = chainId;
    if (platformId) params.platformId = platformId;
    if (tokenAddress) params.tokenAddress = tokenAddress;
    return api.get(API_CONFIG.GET_PAGINATED_TOKENS, { params });
  },

  GET_SWAPS_DATA: () => {
    return api.get(API_CONFIG.GET_SWAPS_DATA);
  },


  GET_DAILY_POOL_REPORTS_AGGREGATES: ({
    chainId,
    tokenAddress,
    page,
    limit,
    poolType,
  } = {}) => {
    const params = {};
    if (chainId) params.chainId = chainId;
    if (tokenAddress) params.tokenAddress = tokenAddress;
    if (page) params.page = page;
    if (limit) params.limit = limit;
    if (poolType) params.poolType = poolType;
    return api.get(API_CONFIG.GET_DAILY_POOL_REPORTS_AGGREGATES, { params });
  },

  // =============================== ADMIN ====================================

  ADMIN_GET_NETWORKS: () => api.get(API_CONFIG.ADMIN_GET_NETWORKS),
  ADMIN_CREATE_NETWORKS: (networkData) =>
    api.post(API_CONFIG.ADMIN_CREATE_NETWORKS, networkData),
  ADMIN_UPDATE_NETWORKS: (_id, networkData) =>
    api.put(API_CONFIG.ADMIN_UPDATE_NETWORKS.replace(":_id", _id), networkData),

  ADMIN_CREATE_PLATFORMS: (platformData) =>
    api.post(API_CONFIG.ADMIN_CREATE_PLATFORMS, platformData),
  ADMIN_UPDATE_PLATFORMS: (_id, platformData) =>
    api.put(
      API_CONFIG.ADMIN_UPDATE_PLATFORMS.replace(":_id", _id),
      platformData
    ),
  ADMIN_GET_PLATFORMS: ({ networkId } = {}) => {
    const params = {};
    if (networkId) params.networkId = networkId;
    return api.get(API_CONFIG.ADMIN_GET_PLATFORMS, { params });
  },

  ADMIN_CREATE_TOKENS: (tokenData) =>
    api.post(API_CONFIG.ADMIN_CREATE_TOKENS, tokenData),
  ADMIN_UPDATE_TOKENS: (_id, tokenData) =>
    api.put(API_CONFIG.ADMIN_UPDATE_TOKENS.replace(":_id", _id), tokenData),
  ADMIN_GET_TOKENS: ({ platformId, networkId } = {}) => {
    const params = {};
    if (platformId) params.platformId = platformId;
    if (networkId) params.networkId = networkId;
    return api.get(API_CONFIG.ADMIN_GET_TOKENS, { params });
  },

  ADMIN_GET_SETTINGS: () => {
    return api.get(API_CONFIG.ADMIN_GET_SETTINGS);
  },
  ADMIN_CREATE_OR_UPDATE_SETTINGS: (settingsData) => {
    return api.post(API_CONFIG.ADMIN_CREATE_OR_UPDATE_SETTINGS, settingsData);
  },
  ADMIN_GET_USERS: () => api.get(API_CONFIG.ADMIN_GET_USERS),
  ADMIN_UPDATE_USER: (_id, userData) =>
    api.post(API_CONFIG.ADMIN_UPDATE_USER.replace(":_id", _id), userData),
  ADMIN_DELETE_USER: (_id) =>
    api.delete(API_CONFIG.ADMIN_DELETE_USER.replace(":_id", _id)),

  ADMIN_GET_WALLETS: ({ page = 1, limit = 10 } = {}) => {
    const params = { page, limit };
    return api.get(API_CONFIG.ADMIN_GET_WALLETS, { params });
  },
  ADMIN_CREATE_WALLETS: (walletData) =>
    api.post(API_CONFIG.ADMIN_CREATE_WALLETS, walletData),
  ADMIN_UPDATE_WALLETS: (_id, walletData) =>
    api.post(API_CONFIG.ADMIN_UPDATE_WALLETS.replace(":_id", _id), walletData),
  ADMIN_DELETE_WALLETS: (_id) =>
    api.delete(API_CONFIG.ADMIN_DELETE_WALLETS.replace(":_id", _id)),
  ADMIN_GET_SETTINGS: () => {
    return api.get(API_CONFIG.ADMIN_GET_SETTINGS);
  },
  ADMIN_CREATE_OR_UPDATE_SETTINGS: (settingsData) => {
    return api.post(API_CONFIG.ADMIN_CREATE_OR_UPDATE_SETTINGS, settingsData);
  },
  ADMIN_GET_POOL_WALLETS: ({ page, limit } = {}) => {
    const params = {};
    if (page) params.page = page;
    if (limit) params.limit = limit;
    return api.get(API_CONFIG.ADMIN_GET_POOL_WALLETS, { params });
  },
  ADMIN_CREATE_OR_UPDATE_POOL_WALLETS: (poolWalletData) =>
    api.post(API_CONFIG.ADMIN_CREATE_OR_UPDATE_POOL_WALLETS, poolWalletData),

  ADMIN_GET_COMPANY_WALLETS: ({ page = 1, limit = 10 } = {}) => {
    const params = {};
    if (page) params.page = page;
    if (limit) params.limit = limit;
    return api.get(API_CONFIG.ADMIN_GET_COMPANY_WALLETS, { params });
  },
  ADMIN_ADD_COMPANY_WALLET: (walletData) =>
    api.post(API_CONFIG.ADMIN_ADD_COMPANY_WALLET, walletData),
  ADMIN_UPDATE_COMPANY_WALLET: (walletId, walletData) => {
    const payload = { walletId, ...walletData };
    console.log("[API] Sending ADMIN_UPDATE_COMPANY_WALLET payload:", payload);
    return api.post(API_CONFIG.ADMIN_UPDATE_COMPANY_WALLET, payload);
  },

  ADMIN_GET_COMPOUND_WALLETS: ({ page = 1, limit = 10 } = {}) => {
    const params = {};
    if (page) params.page = page;
    if (limit) params.limit = limit;
    return api.get(API_CONFIG.ADMIN_GET_COMPOUND_WALLETS, { params });
  },
  ADMIN_ADD_COMPOUND_WALLET: (walletData) =>
    api.post(API_CONFIG.ADMIN_ADD_COMPOUND_WALLET, walletData),
  ADMIN_UPDATE_COMPOUND_WALLET: (walletId, walletData) => {
    const payload = { walletId, ...walletData };
    console.log("[API] Sending ADMIN_UPDATE_COMPOUND_WALLET payload:", payload);
    return api.post(API_CONFIG.ADMIN_UPDATE_COMPOUND_WALLET, payload);
  },

  // ─── Audit / Market Making Export ─────────────────────────────────────────

  AUDIT_GET_WALLETS: () => api.get(API_CONFIG.AUDIT_WALLETS),

  AUDIT_GET_SUMMARY: ({ startDate, endDate, walletStatus, poolType, walletAddress } = {}) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (walletStatus) params.walletStatus = walletStatus;
    if (poolType) params.poolType = poolType;
    if (walletAddress) params.walletAddress = walletAddress;
    return api.get(API_CONFIG.AUDIT_SUMMARY, { params });
  },

  AUDIT_GET_DATA: ({ startDate, endDate, walletStatus, poolType, walletAddress, page = 1, limit = 50 } = {}) => {
    const params = { page, limit };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (walletStatus) params.walletStatus = walletStatus;
    if (poolType) params.poolType = poolType;
    if (walletAddress) params.walletAddress = walletAddress;
    return api.get(API_CONFIG.AUDIT_DATA, { params });
  },

  AUDIT_GET_POOL_DATA: ({ startDate, endDate, poolType, page = 1, limit = 50 } = {}) => {
    const params = { page, limit };
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (poolType) params.poolType = poolType;
    return api.get(API_CONFIG.AUDIT_POOL_DATA, { params });
  },

  AUDIT_EXPORT: ({ startDate, endDate, walletStatus, poolType, walletAddress } = {}) => {
    const params = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (walletStatus) params.walletStatus = walletStatus;
    if (poolType) params.poolType = poolType;
    if (walletAddress) params.walletAddress = walletAddress;
    return api.get(API_CONFIG.AUDIT_EXPORT, { params, timeout: 120000 });
  },

  // ── Solscan Transfer Export ─────────────────────────────────────────────
  AUDIT_SOLSCAN_GET_POOLS: () =>
    api.get(API_CONFIG.AUDIT_SOLSCAN_POOLS),

  AUDIT_SOLSCAN_SAVE_POOL_TOKENS: ({ poolWalletDataId, tokenAddresses } = {}) =>
    api.post(API_CONFIG.AUDIT_SOLSCAN_POOL_TOKENS, { poolWalletDataId, tokenAddresses }),

  AUDIT_SOLSCAN_GET_TRANSFERS: ({ poolWalletDataId, startDate, endDate } = {}) => {
    const params = {};
    if (poolWalletDataId) params.poolWalletDataId = poolWalletDataId;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    return api.get(API_CONFIG.AUDIT_SOLSCAN_TRANSFERS, { params, timeout: 120000 });
  },
};

export default api;
