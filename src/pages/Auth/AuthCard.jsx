import { LogIn } from "lucide-react";
// import { LogIn, UserPlus } from "lucide-react";

const AuthCard = ({
  activeTab,
  setActiveTab,
  children,
  headerTitle,
  headerDescription,
}) => {
  return (
    <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto">
      <div className="bg-white/25 backdrop-blur-2xl rounded-3xl border-2 border-white/40 shadow-2xl p-6 sm:p-8 md:p-10 relative overflow-hidden">
        {/* Glass overlay effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/10 rounded-3xl"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500/60 via-purple-500/60 to-cyan-500/60"></div>

        {/* Animated background circles */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-white/20 rounded-full blur-2xl"></div>

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center items-center gap-3 mb-3 sm:mb-4">
              <div
                className={`p-3 rounded-2xl backdrop-blur-sm shadow-lg transition-all duration-500 ${
                  // activeTab === "login"
                    // ? "bg-gradient-to-br from-blue-500/20 to-blue-600/20"
                    // : "bg-gradient-to-br from-purple-500/20 to-pink-600/20"
                  "bg-gradient-to-br from-blue-500/20 to-blue-600/20"
                }`}
              >
                {/* {activeTab === "login" ? ( */}
                  <LogIn className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
                {/* ) : (
                  <UserPlus className="h-6 w-6 sm:h-8 sm:w-8 text-purple-600" />
                )} */}
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black bg-gradient-to-r from-gray-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                {headerTitle}
              </h1>
            </div>
            <p className="text-sm sm:text-base text-gray-700 font-medium">
              {headerDescription}
            </p>
          </div>

          {/* Tabs - Commented Out */}
          {/* <div className="flex mb-6 sm:mb-8 bg-white/40 backdrop-blur-lg rounded-2xl p-1 border-2 border-white/30 shadow-inner">
            <button
              onClick={() => setActiveTab("login")}
              className={`flex-1 py-3 sm:py-4 px-4 rounded-xl text-sm sm:text-base font-semibold transition-all duration-500 flex items-center justify-center gap-2 ${
                activeTab === "login"
                  ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg"
                  : "text-gray-700 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              <LogIn size={18} className="sm:w-5 sm:h-5" />
              Login
            </button>
            <button
              onClick={() => setActiveTab("signup")}
              className={`flex-1 py-3 sm:py-4 px-4 rounded-xl text-sm sm:text-base font-semibold transition-all duration-500 flex items-center justify-center gap-2 ${
                activeTab === "signup"
                  ? "bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg"
                  : "text-gray-700 hover:text-gray-900 hover:bg-white/50"
              }`}
            >
              <UserPlus size={18} className="sm:w-5 sm:h-5" />
              Sign Up
            </button>
          </div> */}

          {/* Form Content */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default AuthCard;
