import { useState } from "react";
import { UserPlus, User, Mail, Lock, Eye, EyeOff } from "lucide-react";

const SignupForm = ({ signupData, setSignupData, isLoading, onSignup }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <form onSubmit={onSignup} className="space-y-4 sm:space-y-6">
      <div className="space-y-4 sm:space-y-5">
        <div className="relative group">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-white/90 rounded-xl backdrop-blur-sm group-focus-within:bg-purple-100 transition-all duration-300 shadow-sm border border-gray-200">
            <User className="text-gray-700 group-focus-within:text-purple-600 h-5 w-5 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Username"
            value={signupData.username}
            onChange={(e) =>
              setSignupData({
                ...signupData,
                username: e.target.value,
              })
            }
            className="w-full pl-14 pr-4 py-4 text-sm sm:text-base bg-white/80 backdrop-blur-sm border-2 border-white/70 rounded-2xl focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 placeholder-gray-500"
            required
          />
        </div>

        <div className="relative group">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-white/90 rounded-xl backdrop-blur-sm group-focus-within:bg-purple-100 transition-all duration-300 shadow-sm border border-gray-200">
            <Mail className="text-gray-700 group-focus-within:text-purple-600 h-5 w-5 transition-colors" />
          </div>
          <input
            type="email"
            placeholder="Email Address"
            value={signupData.email}
            onChange={(e) =>
              setSignupData({ ...signupData, email: e.target.value })
            }
            className="w-full pl-14 pr-4 py-4 text-sm sm:text-base bg-white/80 backdrop-blur-sm border-2 border-white/70 rounded-2xl focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 placeholder-gray-500"
            required
          />
        </div>

        <div className="relative group">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-white/90 rounded-xl backdrop-blur-sm group-focus-within:bg-purple-100 transition-all duration-300 shadow-sm border border-gray-200">
            <Lock className="text-gray-700 group-focus-within:text-purple-600 h-5 w-5 transition-colors" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={signupData.password}
            onChange={(e) =>
              setSignupData({
                ...signupData,
                password: e.target.value,
              })
            }
            className="w-full pl-14 pr-14 py-4 text-sm sm:text-base bg-white/80 backdrop-blur-sm border-2 border-white/70 rounded-2xl focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 placeholder-gray-500"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-white/90 rounded-xl backdrop-blur-sm text-gray-600 hover:text-gray-800 transition-all duration-300 hover:bg-white shadow-sm border border-gray-200"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>

        <div className="relative group">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-white/90 rounded-xl backdrop-blur-sm group-focus-within:bg-purple-100 transition-all duration-300 shadow-sm border border-gray-200">
            <Lock className="text-gray-700 group-focus-within:text-purple-600 h-5 w-5 transition-colors" />
          </div>
          <input
            type={showConfirmPassword ? "text" : "password"}
            placeholder="Confirm Password"
            value={signupData.confirmPassword}
            onChange={(e) =>
              setSignupData({
                ...signupData,
                confirmPassword: e.target.value,
              })
            }
            className="w-full pl-14 pr-14 py-4 text-sm sm:text-base bg-white/80 backdrop-blur-sm border-2 border-white/70 rounded-2xl focus:outline-none focus:border-purple-500/50 focus:ring-4 focus:ring-purple-500/20 transition-all duration-300 placeholder-gray-500"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-white/90 rounded-xl backdrop-blur-sm text-gray-600 hover:text-gray-800 transition-all duration-300 hover:bg-white shadow-sm border border-gray-200"
          >
            {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white py-4 rounded-2xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Creating Account...
          </div>
        ) : (
          <>
            <UserPlus size={20} />
            Create New Account
          </>
        )}
      </button>
    </form>
  );
};

export default SignupForm;
