import { useState, useRef, useEffect } from "react";
import { Menu, User, Settings } from "lucide-react";
import { useAuth } from "../../context/useAuth";
import { useNavigate } from "react-router-dom";

export const Navbar = ({ setSidebarOpen }) => {
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Get user display name
  const getDisplayName = () => {
    if (!user) return "User";

    if (user.username) return user.username;
    if (user.email) return user.email.split("@")[0];
    if (user.name) return user.name;

    return "User";
  };

  // Get user initial for avatar
  const getUserInitial = () => {
    if (!user) return "U";

    if (user.username) return user.username.charAt(0).toUpperCase();
    if (user.email) return user.email.charAt(0).toUpperCase();
    if (user.name) return user.name.charAt(0).toUpperCase();

    return "U";
  };

  return (
    <>
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
            <h1 className="text-xl font-black text-gray-900">Dashboard</h1>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* User Avatar with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200"
            >
              <span className="text-white font-bold text-sm">
                {getUserInitial()}
              </span>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-12 mt-2 w-56 bg-white/80 backdrop-blur-lg border border-gray-200/60 rounded-xl shadow-lg py-2 z-50">
                {/* User Info */}
                <div className="px-4 py-2 border-b border-gray-200/60">
                  <p className="text-sm font-semibold text-gray-900">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-gray-600 truncate">
                    {user?.email}
                  </p>
                </div>

                {/* Profile Button */}
                {/* <button
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100/80 transition-colors duration-200 flex items-center gap-3"
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate("/profile");
                  }}
                >
                  <User size={16} className="text-gray-600" />
                  Profile
                </button> */}


              </div>
            )}
          </div>
        </div>
      </nav>
    </>
  );
};
