// AppRoutes.jsx
import { Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import AuthPage from "../pages/Auth/AuthPage";
import AdminRoute from "../pages/Auth/AdminRoute";
// import AdminLayout from "../components/layouts/AdminLayout";
import AdminDashboard from "../pages/Admin/AdminDashboard";
import Usermanagement from "../pages/Admin/Usermanagement";
import Network from "../pages/Admin/Network";
import Platform from "../pages/Admin/Platform";
import Wallets from "../pages/Admin/Wallets";
import MMWallets from "../pages/Admin/MMWallets";
import Token from "../pages/Admin/Token";
import Setting from "../pages/Admin/Setting";
import ProtectedRoute from "../pages/Auth/ProtectedRoute";
import DashboardLayout from "../components/layouts/DashboardLayout";
import DashboardPage from "../pages/DashboardPage";
import Tokens from "../pages/Tokens";
import TokenHome from "../pages/TokenHome";
import TokenWallet from "../pages/TokenWallet";
import WalletPage from "../pages/WalletPage";
import Profile from "../pages/Profile";
import UserSettings from "../pages/UserSettings";
import ProfileSettings from "../pages/ProfileSettings";
import { useAuth } from "../context/useAuth";
// import { useEffect } from "react";
import PoolDetails from "../pages/PoolDetails";
import RWATable from "../pages/RWATable";
import PoolTable from "../pages/PoolTable";
import RWADetails from "../pages/RWADetails";
import Walletsdata from "../pages/Admin/Walletsdata";
import Poolswalletdata from "../pages/Admin/Poolswalletdata";
import PoolsWalletsData from "../pages/Admin/PoolsWalletsData";
import VaultMappings from "../pages/Admin/VaultMappings";
import AuditExport from "../pages/AuditExport";

// Component to redirect authenticated users away from auth pages
const PublicRoute = ({ children }) => {
  const { token } = useAuth();
  return token ? <Navigate to="/" replace /> : children;
};

const AdminPageWrapper = ({ children }) => {
  const { user } = useAuth();
  const userRole = user?.role?.toLowerCase();

  // For superuser, superadmin and admin roles, show in DashboardLayout
  if (userRole === "superadmin" || userRole === "superuser" || userRole === "admin") {
    return (
      <ProtectedRoute>
        <DashboardLayout>{children}</DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Fallback to AdminRoute for other roles (will handle redirect)
  return (
    <AdminRoute>
      <DashboardLayout>{children}</DashboardLayout>
    </AdminRoute>
  );
};

const AppRoutes = () => {
  const { token, user } = useAuth();

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Public route - redirect to home if already authenticated */}
        <Route
          path="/authentication"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />

        {/* Admin routes */}
        {/*
        <Route
          path="/admin"
          element={
            <AdminPageWrapper>
              <AdminDashboard />
            </AdminPageWrapper>
          }
        />
        */}
        <Route
          path="/admin/users"
          element={
            <AdminPageWrapper>
              <Usermanagement />
            </AdminPageWrapper>
          }
        />
        <Route
          path="/admin/network"
          element={
            <AdminPageWrapper>
              <Network />
            </AdminPageWrapper>
          }
        />
        <Route
          path="/admin/platform"
          element={
            <AdminPageWrapper>
              <Platform />
            </AdminPageWrapper>
          }
        />
        <Route
          path="/admin/wallets"
          element={
            <AdminPageWrapper>
              <Wallets />
            </AdminPageWrapper>
          }
        />
        <Route
          path="/admin/mm-wallets"
          element={
            <AdminPageWrapper>
              <MMWallets />
            </AdminPageWrapper>
          }
        />
        <Route
          path="/admin/tokens"
          element={
            <AdminPageWrapper>
              <Token />
            </AdminPageWrapper>
          }
        />
        <Route
          path="/admin/wallets-data"
          element={
            <AdminPageWrapper>
              <Walletsdata />
            </AdminPageWrapper>
          }
        />
        <Route
          path="/admin/pools-wallets-data"
          element={
            <AdminPageWrapper>
              <PoolsWalletsData />
            </AdminPageWrapper>
          }
        />
        <Route
          path="/admin/vault-mappings"
          element={
            <AdminPageWrapper>
              <VaultMappings />
            </AdminPageWrapper>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <AdminPageWrapper>
              <Setting />
            </AdminPageWrapper>
          }
        />
        {/*
        <Route
          path="/admin/*"
          element={
            <AdminPageWrapper>
              <AdminDashboard />
            </AdminPageWrapper>
          }
        />
        */}

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Updated Tokens route */}
        <Route
          path="/tokens"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Tokens />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* New route structure for token and wallet pages */}
        <Route
          path="/tokens/:networkId"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Tokens />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tokens/:networkId/:platformId/:tokenId/:tokenAddress"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TokenHome />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/tokens/:networkId/:platformId/:tokenId/:tokenAddress"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TokenHome />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/wallet/:networkId/:platformId/:tokenId/:tokenAddress/:walletAddress"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <TokenWallet />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/wallet/:tokenId/:tokenAddress"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <WalletPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <Profile />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/user-settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <UserSettings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile-settings"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <ProfileSettings />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rwa"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <RWATable />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rwa/:chainId/:pairAddress/:tokenAddress"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <RWADetails />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pool"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PoolTable />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/pool/:chainId/:pairAddress/:tokenAddress"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <PoolDetails />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />


        {/* Wallet Audit — superadmin only */}
        <Route
          path="/audit"
          element={
            <AdminPageWrapper>
              <AuditExport />
            </AdminPageWrapper>
          }
        />

        {/* Catch all route - redirect based on role */}
        <Route
          path="*"
          element={
            <Navigate
              to={
                token
                  ? "/"
                  : "/authentication"
              }
              replace
            />
          }
        />
      </Routes>
    </>
  );
};

export default AppRoutes;
