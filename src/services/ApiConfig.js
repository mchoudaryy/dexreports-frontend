const BASE_URL = import.meta.env.VITE_API_URL;
// console.log("BASE_URL", BASE_URL);

const auth = `${BASE_URL}/api/auth`;
const admin = `${BASE_URL}/api/admin`;
const main = `${BASE_URL}/api/v1/main`;
const audit = `${BASE_URL}/api/v1/audit`;

export const API_CONFIG = {
  // Auth endpoints
  SIGNUP: `${auth}/signup`,
  LOGIN: `${auth}/login`,
  GET_USER: `${auth}/me`,
  LOGOUT: `${auth}/logout`,
  FORGOT_PASSWORD: `${auth}/forgot-password`,
  RESET_PASSWORD: `${auth}/reset-password`,
  VERIFY_RESET_OTP: `${auth}/verify-reset-otp`,
  VERIFY_SIGNUP_OTP: `${auth}/verify-signup-otp`,
  RESEND_SIGNUP_OTP: `${auth}/resend-signup-otp`,

  // Admin Endpoints
  GET_NETWORKS: `${main}/getNetworks`,

  GET_ACTIVE_NETWORKS: `${main}/getActiveNetworks`,
  GET_PLATFORMS: `${main}/getPlatforms`,
  GET_ACTIVE_PLATFORMS: `${main}/getActivePlatforms`,

  GET_WALLETS: `${admin}/getWallets`,
  GET_TOKENS: `${main}/getActiveTokens`,

  GET_LIVE_TOKEN_DATA: `${main}/getLiveTokenData`,

  GET_TOKEN_REPORTS: `${admin}/getTokenReports`,
  GET_WALLET_REPORTS: `${admin}/getWalletReports`,

  GET_TOKEN_REPORTS_TOTAL: `${main}/tokenReportsSingle`,
  GET_WALLET_REPORTS_TOTAL: `${main}/walletReportsSingle`,

  TOKEN_REPORTS_TOTAL: `${main}/tokenReportsTotal`,
  WALLET_REPORTS_TOTAL: `${main}/walletReportsTotal`,

  GET_SETTINGS: `${admin}/getSettings`,
  GET_FILTERED_REPORTS: `${main}/getFilteredReports`,
  TOKEN_HOLDER_LIST: `${main}/tokenHoldersList`,

  GET_POOLED_SOL_AND_TOKENS: `${main}/getPooledSolAndTokens`,

  GET_LIQUIDITY_POOLS: `${main}/getLiquidityPools`,
  GET_LIVE_POOLS_DATA: `${main}/livePoolsData`,
  GET_LIVE_POOLS_NOT_RWA_DATA: `${main}/livePoolsNotRWA`,
  GET_DAILY_RWA_POOLS_REPORTS: `${main}/getDailyRWAPoolsReports`,
  GET_RWA_POOL_DATE_RANGE_REPORT: `${main}/getRWAPoolDateRangeReport`,
  GET_PAGINATED_TOKENS: `${main}/getPaginatedTokens`,

  GET_SWAPS_DATA: `${main}/getSwapsData`,
  
  GET_WALLETS_DATA: `${main}/getWalletsData`,


  GET_DAILY_POOL_REPORTS_AGGREGATES: `${main}/getDailyWalletReportsAggregates`,

  // =============================== ADMIN ====================================

  ADMIN_GET_NETWORKS: `${admin}/getNetworks`,
  ADMIN_CREATE_NETWORKS: `${admin}/createNetwork`,
  ADMIN_UPDATE_NETWORKS: `${admin}/updateNetwork/:_id`,

  ADMIN_GET_PLATFORMS: `${admin}/getPlatforms`,
  ADMIN_CREATE_PLATFORMS: `${admin}/createPlatform`,
  ADMIN_UPDATE_PLATFORMS: `${admin}/updatePlatform/:_id`,

  ADMIN_GET_TOKENS: `${admin}/getTokens`,
  ADMIN_CREATE_TOKENS: `${admin}/createToken`,
  ADMIN_UPDATE_TOKENS: `${admin}/updateToken/:_id`,

  ADMIN_GET_USERS: `${admin}/getSingleAndAllUsers`,
  ADMIN_UPDATE_USER: `${admin}/updateUserProfile/:_id`,
  ADMIN_DELETE_USER: `${admin}/deleteUserById/:_id`,

  ADMIN_CREATE_WALLETS: `${admin}/addWallet`,
  ADMIN_UPDATE_WALLETS: `${admin}/updateWallet/:_id`,
  ADMIN_DELETE_WALLETS: `${admin}/deleteWallet/:_id`,

  ADMIN_GET_POOL_WALLETS: `${admin}/getPoolWalletData`,
  ADMIN_CREATE_OR_UPDATE_POOL_WALLETS: `${admin}/CreateAndUpdatePoolWalletData`,

  ADMIN_GET_COMPANY_WALLETS: `${admin}/getCompanyWallets`,
  ADMIN_ADD_COMPANY_WALLET: `${admin}/addCompanyWallet`,
  ADMIN_UPDATE_COMPANY_WALLET: `${admin}/addCompanyWallet`,

  ADMIN_GET_COMPOUND_WALLETS: `${admin}/getCompoundWallets`,
  ADMIN_ADD_COMPOUND_WALLET: `${admin}/addCompoundWallet`,
  ADMIN_UPDATE_COMPOUND_WALLET: `${admin}/addCompoundWallet`,

  ADMIN_CREATE_OR_UPDATE_SETTINGS: `${admin}/createOrUpdateSettings`,
  ADMIN_GET_SETTINGS: `${admin}/getSettings`,

  ADMIN_GET_WALLETS: `${admin}/getWallets`,

  // =============================== AUDIT / MM EXPORT ========================
  AUDIT_WALLETS:   `${audit}/wallets`,
  AUDIT_SUMMARY:   `${audit}/summary`,
  AUDIT_DATA:      `${audit}/data`,
  AUDIT_POOL_DATA: `${audit}/pool-data`,
  AUDIT_EXPORT:    `${audit}/export`,
};
