import { useState } from "react";
import { X, Mail, Lock, Eye, EyeOff, ArrowLeft, Shield } from "lucide-react";

const ForgotPasswordModal = ({
  isOpen,
  onClose,
  currentStep,
  onNextStep,
  onPreviousStep,
  forgotData,
  setForgotData,
  isLoading,
  onForgotPassword,
  onPasswordReset,
}) => {
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  if (!isOpen) return null;

  const renderStep1 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-3">
          <Mail className="h-6 w-6 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Reset Your Password
        </h3>
        <p className="text-gray-600 text-sm mt-1">
          Enter your email address and we'll send you a verification code to
          reset your password.
        </p>
      </div>

      <div className="relative group">
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-lg group-focus-within:bg-blue-50 transition-colors">
          <Mail className="text-gray-500 group-focus-within:text-blue-600 h-4 w-4" />
        </div>
        <input
          type="email"
          placeholder="Enter your email"
          value={forgotData.email}
          onChange={(e) =>
            setForgotData({ ...forgotData, email: e.target.value })
          }
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onForgotPassword}
          disabled={isLoading || !forgotData.email}
          className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Sending...
            </>
          ) : (
            <>
              <Shield size={16} />
              Send Code
            </>
          )}
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <div className="text-center mb-4">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-3">
          <Lock className="h-6 w-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900">
          Create New Password
        </h3>
        <p className="text-gray-600 text-sm mt-1">
          Enter your new password below. Make sure it's strong and secure.
        </p>
      </div>

      <div className="space-y-3">
        <div className="relative group">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-lg group-focus-within:bg-blue-50 transition-colors">
            <Lock className="text-gray-500 group-focus-within:text-blue-600 h-4 w-4" />
          </div>
          <input
            type={showNewPassword ? "text" : "password"}
            placeholder="New Password"
            value={forgotData.newPassword}
            onChange={(e) =>
              setForgotData({ ...forgotData, newPassword: e.target.value })
            }
            className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="relative group">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 p-2 bg-white rounded-lg group-focus-within:bg-blue-50 transition-colors">
            <Lock className="text-gray-500 group-focus-within:text-blue-600 h-4 w-4" />
          </div>
          <input
            type={showConfirmNewPassword ? "text" : "password"}
            placeholder="Confirm New Password"
            value={forgotData.confirmNewPassword}
            onChange={(e) =>
              setForgotData({
                ...forgotData,
                confirmNewPassword: e.target.value,
              })
            }
            className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showConfirmNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onPreviousStep}
          className="flex items-center justify-center gap-2 flex-1 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <button
          type="button"
          onClick={onPasswordReset}
          disabled={
            isLoading ||
            !forgotData.newPassword ||
            !forgotData.confirmNewPassword
          }
          className="flex-1 px-4 py-3 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Resetting..." : "Reset Password"}
        </button>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            {currentStep === 1 ? "Forgot Password" : "Set New Password"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Progress Steps */}
        <div className="px-6 pt-4">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((step) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep >= step
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {step}
                </div>
                <div className="text-xs mt-1 text-gray-500">
                  {step === 1 ? "Email" : step === 2 ? "Verify" : "Reset"}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 3 && renderStep3()}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
