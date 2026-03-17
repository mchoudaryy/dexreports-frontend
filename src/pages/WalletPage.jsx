import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { ADMIN_API } from "../services/ApiHandlers";

import TokenWallets from "./TokenWallets";

const WalletPage = () => {
  const { networkId, tokenId, platformId, tokenAddress } = useParams();
  console.log("tokenId", tokenId, "tokenAddress", tokenAddress);

  const navigate = useNavigate();

  const [tokenInfo, setTokenInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  // Main token data fetch function
  const fetchTokens = async () => {
    try {
      setLoading(true);

      if (!tokenAddress) {
        console.error("No token address in URL params");
        setLoading(false);
        return;
      }

      const response = await ADMIN_API.GET_TOKENS({
        tokenId: tokenId,
        tokenAddress: tokenAddress,
      });

      const tokenData = response.data.data;
      if (!tokenData) {
        console.error("No token data received");
        setLoading(false);
        return;
      }

      if (response && response.status === 200) {
        console.log("Token data received:", tokenData);
        setTokenInfo(tokenData);
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching tokens:", error);
      setLoading(false);
    }
  };

  // Effects
  useEffect(() => {
    fetchTokens();
  }, [networkId, platformId, tokenId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading token data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 sm:p-6 md:p-8">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-50 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-50 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 mx-auto">
        {/* Token Header */}

        {/* Wallets Content */}
        <TokenWallets
          tokenId={tokenId}
          tokenAddress={tokenAddress}
          networkId={tokenInfo?.networkId}
          platformId={tokenInfo?.platformId}
        />
      </div>
    </div>
  );
};

export default WalletPage;
