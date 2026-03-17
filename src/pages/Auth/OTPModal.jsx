import { useState, useRef, useEffect } from "react";
import { X, Clock, Smartphone, Key, Mail } from "lucide-react";

const OTPModal = ({
  isOpen,
  onClose,
  otp,
  setOtp,
  timer,
  isResendEnabled,
  isLoading,
  onOtpVerify,
  onResendOtp,
  currentStep,
  email,
}) => {
  const otpInputRefs = useRef([]);

  useEffect(() => {
    if (isOpen && otpInputRefs.current[0]) {
      otpInputRefs.current[0].focus();
    }
  }, [isOpen]);

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    const newOtp = [...otp];
    newOtp[index] = element.value;
    setOtp(newOtp);

    // Focus next input
    if (element.nextSibling && element.value !== "") {
      element.nextSibling.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").slice(0, 6);
    const pasteArray = pasteData.split("");

    if (pasteArray.length === 6) {
      const newOtp = [...otp];
      pasteArray.forEach((char, index) => {
        if (index < 6 && !isNaN(char)) {
          newOtp[index] = char;
        }
      });
      setOtp(newOtp);

      // Focus the last input
      if (otpInputRefs.current[5]) {
        otpInputRefs.current[5].focus();
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = e.target.previousSibling;
      if (prevInput) prevInput.focus();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Verification Required
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="text-center mb-6">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-3">
              <Smartphone className="h-6 w-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {currentStep === 2
                ? "Password Reset Verification"
                : "Email Verification"}
            </h3>
            <p className="text-gray-600 text-sm">
              {currentStep === 2
                ? "We've sent a 6-digit verification code to your email for password reset."
                : "We've sent a 6-digit verification code to your email to complete your registration."}
            </p>
            {email && (
              <div className="flex items-center justify-center gap-2 mt-2">
                <Mail size={14} className="text-blue-600" />
                <p className="text-blue-600 font-medium text-sm">{email}</p>
              </div>
            )}
          </div>

          {/* OTP Input */}
          <div className="mb-6">
            <div className="flex justify-center gap-2 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  maxLength="1"
                  value={digit}
                  ref={(ref) => (otpInputRefs.current[index] = ref)}
                  onChange={(e) => handleOtpChange(e.target, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  onPaste={handleOtpPaste}
                  className="w-12 h-12 text-center text-lg font-semibold border-2 border-gray-300 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
                <Clock size={16} />
                <span>Code expires in: {timer}s</span>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="space-y-3">
            <button
              onClick={onOtpVerify}
              disabled={isLoading || otp.join("").length !== 6}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Verifying...
                </>
              ) : (
                "Verify Code"
              )}
            </button>

            <button
              onClick={onResendOtp}
              disabled={!isResendEnabled || isLoading}
              className="w-full text-blue-600 hover:text-blue-700 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Key size={16} />
              {isResendEnabled ? "Resend Code" : "Resend Code"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OTPModal;
