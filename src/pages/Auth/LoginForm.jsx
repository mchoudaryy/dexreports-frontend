import { useRef, useState } from "react";
import { LogIn, Mail, Lock, Eye, EyeOff, Unlock } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";

const SITE_KEY = import.meta.env.VITE_SITE_KEY;

const LoginForm = ({
  loginData,
  setLoginData,
  isLoading,
  onLogin,
  onShowForgotPassword,
  recaptchaToken,
  setRecaptchaToken,
  recaptchaRef,
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // recaptchaRef is now passed as a prop from AuthPage

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token); // Store reCAPTCHA token when it's verified
  };

  return (
    <form onSubmit={onLogin} className="space-y-4 sm:space-y-6">
      <div className="space-y-4 sm:space-y-5">
        <div className="relative group">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-white/90 rounded-xl backdrop-blur-sm group-focus-within:bg-blue-100 transition-all duration-300 shadow-sm border border-gray-200">
            <Mail className="text-gray-700 group-focus-within:text-blue-600 h-5 w-5 transition-colors" />
          </div>
          <input
            type="email"
            placeholder="Email Address"
            value={loginData.email}
            onChange={(e) =>
              setLoginData({
                ...loginData,
                email: e.target.value,
              })
            }
            className="w-full pl-14 pr-4 py-4 text-sm sm:text-base bg-white/80 backdrop-blur-sm border-2 border-white/70 rounded-2xl focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder-gray-500"
            required
          />
        </div>

        <div className="relative group">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-white/90 rounded-xl backdrop-blur-sm group-focus-within:bg-blue-100 transition-all duration-300 shadow-sm border border-gray-200">
            <Lock className="text-gray-700 group-focus-within:text-blue-600 h-5 w-5 transition-colors" />
          </div>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            value={loginData.password}
            onChange={(e) =>
              setLoginData({ ...loginData, password: e.target.value })
            }
            className="w-full pl-14 pr-14 py-4 text-sm sm:text-base bg-white/80 backdrop-blur-sm border-2 border-white/70 rounded-2xl focus:outline-none focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/20 transition-all duration-300 placeholder-gray-500"
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
      </div>

      {/* Forgot Password button - Now Enabled */}
      {/* <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onShowForgotPassword}
          className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1"
        >
          <Unlock size={14} />
          Forgot Password?
        </button>
      </div> */}

      {/* reCAPTCHA */}
      <div className="flex justify-center">
        <ReCAPTCHA
          ref={recaptchaRef}
          sitekey={SITE_KEY}
          onChange={handleRecaptchaChange} // Handle reCAPTCHA token
        />
      </div>

      <button
        type="submit"
        disabled={isLoading || !recaptchaToken}
        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 rounded-2xl font-semibold text-sm sm:text-base shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
      >
        {isLoading ? (
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Signing In...
          </div>
        ) : (
          <>
            <LogIn size={20} />
            Sign In to Your Account
          </>
        )}
      </button>
    </form>
  );
};

export default LoginForm;
