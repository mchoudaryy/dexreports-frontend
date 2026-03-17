import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_API } from "../../services/ApiHandlers";
import { useAuth } from "../../context/useAuth";
import toast from "react-hot-toast";
// Import Components
import AuthLayout from "./AuthLayout";
import AuthCard from "./AuthCard";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";
import ForgotPasswordModal from "./ForgotPasswordModal";
import OTPModal from "./OTPModal";
import SuccessModal from "./SuccessModal";

export default function AuthPage() {
  // reCAPTCHA ref for reset
  const recaptchaRef = useRef(null);
  const navigate = useNavigate();
  const authContext = useAuth();
  const [activeTab, setActiveTab] = useState("login");
  const [isLoading, setIsLoading] = useState(false);

  // Modal states
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [timer, setTimer] = useState(60);
  const [isResendEnabled, setIsResendEnabled] = useState(false);

  // OTP state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);

  // Form states
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [forgotData, setForgotData] = useState({
    email: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [recaptchaToken, setRecaptchaToken] = useState(null); // Store the reCAPTCHA token

  // Redirect if already authenticated
  useEffect(() => {
    if (authContext.token) {
      navigate("/");
    }
  }, [authContext.token, navigate]);

  // Timer for OTP
  useEffect(() => {
    if (timer > 0 && showOtpModal) {
      const countdown = setTimeout(() => setTimer(timer - 1), 1000);
      return () => clearTimeout(countdown);
    } else if (timer === 0) {
      setIsResendEnabled(true);
    }
  }, [timer, showOtpModal]);

  const resetOtpTimer = () => {
    setTimer(60);
    setIsResendEnabled(false);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(loginData.email)) {
      toast.error("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    // Validate reCAPTCHA token
    if (!recaptchaToken) {
      toast.error("Please complete the reCAPTCHA");
      setIsLoading(false);
      return;
    }

    try {
      const response = await AUTH_API.LOGIN({ ...loginData, recaptchaToken });
      console.log("Login response", response);

      // Extract token and user data from response
      const {
        token: authToken,
        data: { user: userData },
      } = response.data;

      if (response.status === 200) {
        // Restrict login to specific roles
        const role = userData?.role?.toLowerCase();
        if (role !== "superadmin" && role !== "superuser" && role !== "admin") {
          toast.error("Access denied. Only superadmin, superuser and admin can access the dashboard.");
          setIsLoading(false);
          return;
        }

        toast.success(response.data.message);
        // Use AuthContext to handle login (this will save token and redirect)
        await authContext.login(authToken, userData);
      }
    } catch (error) {
      console.error("Login failed:", error);
      // If backend says reCAPTCHA failed, reset widget and token
      if (error.response?.data?.message === "reCAPTCHA verification failed") {
        if (recaptchaRef.current) {
          recaptchaRef.current.reset();
        }
        setRecaptchaToken(null);
      }
      toast.error(
        error.response?.data?.message || "Login failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    // Validate passwords match
    if (signupData.password !== signupData.confirmPassword) {
      toast.error("Passwords don't match!");
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(signupData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Validate password strength
    if (signupData.password.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      const response = await AUTH_API.SIGNUP(signupData);
      console.log("Signup response", response);

      // If API returns token directly, login automatically
      if (response.data.token) {
        const { token: authToken, user: userData } = response.data;
        await authContext.login(authToken, userData);
        toast.success("Account created successfully! Welcome!");
      }
      // If API requires OTP verification
      else if (
        response.data.message?.includes("OTP") ||
        response.data.requiresOtp
      ) {
        setShowOtpModal(true);
        resetOtpTimer();
        toast.success("OTP sent to your email for verification!");
      }
      // Default success case
      else {
        toast.success("Signup successful! Please login with your credentials.");
        setActiveTab("login");
        setSignupData({
          username: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
      }
    } catch (error) {
      console.error("Signup failed:", error);
      toast.error(
        error.response?.data?.message || "Signup failed. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(forgotData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      // Call forgot password API
      await AUTH_API.FORGOT_PASSWORD({ email: forgotData.email });
      toast.success("Password reset instructions sent to your email!");

      setIsLoading(false);
      setCurrentStep(2);
      setShowForgotModal(false);
      setShowOtpModal(true);
      resetOtpTimer();
    } catch (error) {
      console.error("Forgot password failed:", error);
      toast.error(
        error.response?.data?.message ||
          "Failed to send reset email. Please try again."
      );
      setIsLoading(false);
    }
  };

  const handleOtpVerify = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      toast.error("Please enter complete OTP");
      return;
    }

    setIsLoading(true);
    try {
      // For forgot password OTP verification
      if (currentStep === 2) {
        // Verify OTP for password reset
        await AUTH_API.VERIFY_RESET_OTP({
          email: forgotData.email,
          otp: otpValue,
        });
        setCurrentStep(3); // Move to reset password step
        setShowOtpModal(false);
        setShowForgotModal(true);
        toast.success("OTP verified! Please set your new password.");
      } else {
        // For signup OTP verification
        await AUTH_API.VERIFY_SIGNUP_OTP({
          email: signupData.email,
          otp: otpValue,
        });
        setShowOtpModal(false);
        setOtp(["", "", "", "", "", ""]);
        setShowSuccessModal(true);
        toast.success("Email verified successfully!");
        // Show success message and then switch to login tab
        setTimeout(() => {
          setShowSuccessModal(false);
          setActiveTab("login");
          // Clear signup form
          setSignupData({
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
          });
        }, 3000);
      }
      setIsLoading(false);
    } catch (error) {
      console.error("OTP verification failed:", error);
      toast.error(
        error.response?.data?.message ||
          "OTP verification failed. Please try again."
      );
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();

    if (forgotData.newPassword !== forgotData.confirmNewPassword) {
      toast.error("Passwords don't match!");
      return;
    }

    // Validate password strength
    if (forgotData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsLoading(true);
    try {
      // Call reset password API
      await AUTH_API.RESET_PASSWORD({
        email: forgotData.email,
        newPassword: forgotData.newPassword,
        confirmNewPassword: forgotData.confirmNewPassword,
      });

      setIsLoading(false);
      resetForgotFlow();
      setShowSuccessModal(true);
      toast.success("Password reset successfully!");

      setTimeout(() => {
        setShowSuccessModal(false);
        setActiveTab("login");
      }, 3000);
    } catch (error) {
      console.error("Password reset failed:", error);
      toast.error(
        error.response?.data?.message ||
          "Password reset failed. Please try again."
      );
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      resetOtpTimer();

      if (currentStep === 2) {
        // Resend OTP for forgot password
        await AUTH_API.FORGOT_PASSWORD({ email: forgotData.email });
        toast.success("OTP resent successfully!");
      } else {
        // Resend OTP for signup
        await AUTH_API.RESEND_SIGNUP_OTP({ email: signupData.email });
        toast.success("OTP resent successfully!");
      }
    } catch (error) {
      console.error("Failed to resend OTP:", error);
      toast.error("Failed to resend OTP. Please try again.");
    }
  };

  const resetForgotFlow = () => {
    setShowForgotModal(false);
    setShowOtpModal(false);
    setCurrentStep(1);
    setForgotData({
      email: "",
      newPassword: "",
      confirmNewPassword: "",
    });
    setOtp(["", "", "", "", "", ""]);
  };

  const getHeaderContent = () => {
    if (activeTab === "login") {
      return {
        title: "Welcome Back",
        description: "Sign in to access your account and continue",
      };
    } else {
      return {
        title: "Join Us",
        description: "Create your account and start your journey",
      };
    }
  };

  const headerContent = getHeaderContent();

  return (
    <>
      <AuthLayout>
        <AuthCard
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          headerTitle={headerContent.title}
          headerDescription={headerContent.description}
        >
          {activeTab === "login" ? (
            <LoginForm
              loginData={loginData}
              setLoginData={setLoginData}
              isLoading={isLoading}
              onLogin={handleLogin}
              recaptchaToken={recaptchaToken}
              setRecaptchaToken={setRecaptchaToken}
              recaptchaRef={recaptchaRef}
              onShowForgotPassword={() => setShowForgotModal(true)}
            />
          ) : (
            <SignupForm
              signupData={signupData}
              setSignupData={setSignupData}
              isLoading={isLoading}
              onSignup={handleSignup}
            />
          )}
        </AuthCard>
      </AuthLayout>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        onClose={resetForgotFlow}
        currentStep={currentStep}
        onNextStep={() => setCurrentStep(currentStep + 1)}
        onPreviousStep={() => setCurrentStep(currentStep - 1)}
        forgotData={forgotData}
        setForgotData={setForgotData}
        isLoading={isLoading}
        onForgotPassword={handleForgotPassword}
        onPasswordReset={handlePasswordReset}
      />

      {/* OTP Modal */}
      <OTPModal
        isOpen={showOtpModal}
        onClose={() => setShowOtpModal(false)}
        otp={otp}
        setOtp={setOtp}
        timer={timer}
        isResendEnabled={isResendEnabled}
        isLoading={isLoading}
        onOtpVerify={handleOtpVerify}
        onResendOtp={handleResendOtp}
        currentStep={currentStep}
        email={currentStep === 2 ? forgotData.email : ""}
        // email={currentStep === 2 ? forgotData.email : signupData.email}
      />

      {/* Success Modal */}
      <SuccessModal
        isOpen={showSuccessModal}
        title="Success!"
        message={
          currentStep === 3
            ? "Your password has been reset successfully!"
            : "Your account has been created successfully! Welcome aboard!"
        }
        showRedirect={true}
      />
    </>
  );
}
