import { Menu, User, Shield } from "lucide-react";
import { useAuth } from "../../context/useAuth";

export const AdminNavbar = ({ setSidebarOpen }) => {
  const { user } = useAuth();

  // Get user display name
  const getDisplayName = () => {
    if (!user) return "Admin";

    if (user.username) return user.username;
    if (user.email) return user.email.split("@")[0];
    if (user.name) return user.name;

    return "Admin";
  };

  // Get user initial for avatar
  const getUserInitial = () => {
    if (!user) return "A";

    if (user.username) return user.username.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    if (user.name) return user.name.charAt(0).toUpperCase();

    return "A";
  };

  return (
    <nav className="h-16 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 border-b border-gray-200/60 shadow-sm sticky top-0 z-40 rounded-xl">
      <div className="flex items-center gap-4">
        {/* Hamburger menu trigger */}
        <button
          className="p-2 rounded-xl hover:bg-gray-100/80 transition-all duration-300 hover:scale-110 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu size={22} className="text-gray-700" />
        </button>

        <div>
          <h1 className="text-xl font-black text-gray-900">Admin Dashboard</h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-red-50/80 px-3 py-1 rounded-lg border border-red-200/60">
              <Shield size={16} className="text-red-600" />
              <span className="text-sm font-medium text-gray-700">
                Admin User
              </span>
            </div>
            <div className="flex items-center gap-2 bg-blue-50/80 px-3 py-1 rounded-lg border border-blue-200/60">
              <User size={16} className="text-blue-600" />
              <span className="text-sm font-medium text-gray-700">
                {getDisplayName()}
              </span>
            </div>

          </div>
        )}

        {/* User Avatar */}
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 shadow-lg flex items-center justify-center">
          <span className="text-white font-bold text-sm">
            {getUserInitial()}
          </span>
        </div>
      </div>
    </nav>
  );
};
