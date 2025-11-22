import { ethers } from 'ethers';

async function main() {
  // World Chain Sepolia RPC (public endpoint)
  const RPC_URL = "https://worldchain-sepolia.gateway.tenderly.co";
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  // Contract address from deployment
  const KYC_ISSUER_ADDRESS = "0x1d7e95F200508Bf1f29d2386FBDCfa65a88c00EE";
  
  // Contract ABI for debugging
  const abi = [
    "function getKYCData(address user) external view returns ((uint8 status, uint256 requestedAt, uint256 approvedAt, bytes32 nullifierHash, bytes32 kycDataHash))",
    "function isKYCVerified(address user) external view returns (bool)"
  ];
  
  // Connect to contract (read-only)
  const kycIssuer = new ethers.Contract(KYC_ISSUER_ADDRESS, abi, provider);
  
  try {
    // Address from the error (user being verified) - convert to lowercase to avoid checksum issues
    const userAddress = "0xabdff83ac5e8e729c6ce44e938f244fb12f6ce32";
    
    console.log("🔍 Checking KYC data for user:", userAddress);
    
    // Get KYC data
    const kycData = await kycIssuer.getKYCData(userAddress);
    console.log("📋 KYC Data:", {
      status: kycData.status.toString(),
      requestedAt: kycData.requestedAt.toString(),
      approvedAt: kycData.approvedAt.toString(),
      nullifierHash: kycData.nullifierHash,
      kycDataHash: kycData.kycDataHash
    });
    
    // Get verification status
    const isVerified = await kycIssuer.isKYCVerified(userAddress);
    console.log("✅ Is KYC Verified:", isVerified);
    
    // Decode status
    const statusMap = {
      0: "NONE",
      1: "WORLD_ID_VERIFIED", 
      2: "FULL_KYC",
      3: "REJECTED"
    };
    
    console.log("📊 Status meaning:", statusMap[kycData.status.toString()] || "UNKNOWN");
    
  } catch (error) {
    console.error("❌ Error checking KYC data:", error);
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });