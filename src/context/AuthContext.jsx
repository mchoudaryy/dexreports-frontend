import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_API } from "../services/ApiHandlers";

// Create context
export const AuthContext = createContext();

// Provider component
const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("authToken"));
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch user data when token exists (on app start or refresh)
  const fetchUserData = async () => {
    const storedToken = localStorage.getItem("authToken");

    if (storedToken) {
      try {
        // Verify token validity by fetching user data
        const response = await AUTH_API.GET_USER();
        // console.log("User data fetched on refresh:", response.data);

        // Set both token and user data
        setToken(storedToken);

        // Handle different response structures
        if (response.data && response.data.user) {
          setUser(response.data.user);
        } else if (
          response.data &&
          response.data.data &&
          response.data.data.user
        ) {
          setUser(response.data.data.user);
        } else {
          setUser(response.data);
        }
      } catch (error) {
        console.error("Token validation failed:", error);
        // Token is invalid, clear it
        localStorage.removeItem("authToken");
        setToken(null);
        setUser(null);

        // Redirect to login if not already there
        if (!window.location.pathname.includes("/authentication")) {
          navigate("/authentication");
        }
      }
    }
    setLoading(false);
  };

  // Check if user is authenticated on app start
  useEffect(() => {
    fetchUserData();
  }, []);

  const login = async (authToken, userData) => {
    try {
      console.log("Logging in with:", { authToken, userData });

      setToken(authToken);
      setUser(userData);
      localStorage.setItem("authToken", authToken);

      // Redirect based on role
      if (userData.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      console.error("Login error:", error);
      throw error;
    }
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("authToken");
    console.log("Successfully logged out");

    // Redirect to authentication page
    navigate("/authentication");
  };

  const updateUser = (userData) => {
    setUser(userData);
  };

  // Function to manually refresh user data
  const refreshUserData = async () => {
    if (token) {
      await fetchUserData();
    }
  };

  const value = {
    user,
    setUser: updateUser,
    token,
    loading,
    login,
    logout,
    refreshUserData,
    isAuthenticated: !!token,
    isAdmin: user?.role === "admin",
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50/90 via-amber-50/90 to-orange-100/90">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
            <p className="text-gray-600">Loading user data...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
