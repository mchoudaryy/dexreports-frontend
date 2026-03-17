import { Sparkles } from "lucide-react";

const AuthLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50/90 via-purple-50/90 to-cyan-50/90 flex items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Enhanced Texture Background */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIgMS44LTQgNC00czQgMS44IDQgNC0xLjggNC00IDQtNC0xLjgtNC00eiIvPjxwYXRoIGQ9Ik0xNiAxNmMtMi4yIDAtNCAxLjgtNCA0czEuOCA0IDQgNCA0LTEuOCA0LTRzLTEuOC00LTQtNHoiLz48cGF0aCBkPSJNNjAgNjBWNEE0IDQgMCAwIDAgNTYgMEg0QzEuOCAwIDAgMS44IDAgNHY1NmMwIDIuMiAxLjggNCA0IDRoNTZjMi4yIDAgNC0xLjggNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-40"></div>

      {/* Enhanced Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        {/* Large animated blobs */}
        <div className="absolute -top-40 -right-40 w-72 h-72 sm:w-80 sm:h-80 bg-blue-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-72 h-72 sm:w-80 sm:h-80 bg-purple-300/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/3 left-1/4 w-48 h-48 sm:w-60 sm:h-60 bg-cyan-300/25 rounded-full blur-2xl animate-pulse delay-500"></div>
        <div className="absolute bottom-1/4 right-1/4 w-32 h-32 sm:w-40 sm:h-40 bg-pink-300/20 rounded-full blur-xl animate-pulse delay-1500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 sm:w-96 sm:h-96 bg-emerald-300/20 rounded-full blur-3xl animate-pulse delay-2000"></div>

        {/* Floating particles */}
        <div className="absolute top-1/4 left-1/5 w-4 h-4 bg-blue-400/40 rounded-full animate-bounce delay-300"></div>
        <div className="absolute top-3/4 right-1/4 w-3 h-3 bg-purple-400/40 rounded-full animate-bounce delay-700"></div>
        <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-cyan-400/40 rounded-full animate-bounce delay-1200"></div>
        <div className="absolute top-1/2 right-1/3 w-3 h-3 bg-pink-400/40 rounded-full animate-bounce delay-500"></div>
        <div className="absolute top-2/3 left-1/6 w-2 h-2 bg-amber-400/40 rounded-full animate-bounce delay-900"></div>

        {/* Sparkles */}
        <div className="absolute top-1/5 right-1/4 animate-ping">
          <Sparkles className="w-4 h-4 text-yellow-400/60" />
        </div>
        <div className="absolute bottom-1/4 left-1/3 animate-ping delay-700">
          <Sparkles className="w-3 h-3 text-blue-400/60" />
        </div>
      </div>

      {children}
    </div>
  );
};

export default AuthLayout;
