import { CheckCircle } from "lucide-react";

const SuccessModal = ({
  isOpen,
  title = "Success!",
  message = "Operation completed successfully!",
  showRedirect = true,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="relative z-10 w-full max-w-sm sm:max-w-md mx-auto">
        <div className="bg-white rounded-3xl border-2 border-gray-200 shadow-2xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-500 to-emerald-600"></div>

          <div className="relative z-10 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-green-100 rounded-2xl animate-bounce">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-gray-700 mb-6 text-sm sm:text-base">{message}</p>
            {showRedirect && (
              <div className="flex items-center justify-center gap-2 text-sm text-green-600 font-medium">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Redirecting to login...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;
