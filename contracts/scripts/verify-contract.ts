import { ethers } from 'ethers';

async function main() {
  // World Chain Sepolia RPC (public endpoint)
  const RPC_URL = "https://worldchain-sepolia.gateway.tenderly.co";
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  
  // Contract address from .env.local
  const KYC_ISSUER_ADDRESS = "0x1d7e95F200508Bf1f29d2386FBDCfa65a88c00EE";
  
  console.log("🔍 Checking if ChainlinkKYCIssuer contract exists at:", KYC_ISSUER_ADDRESS);
  
  try {
    // Check if contract exists (has code)
    const code = await provider.getCode(KYC_ISSUER_ADDRESS);
    
    if (code === "0x" || code === "0x0") {
      console.log("❌ No contract found at this address!");
      console.log("📝 Contract needs to be deployed");
      return;
    }
    
    console.log("✅ Contract found! Code length:", code.length);
    
    // Try to call a simple view function to verify it's the right contract
    const abi = [
      "function CHAINLINK_DON_ROLE() external view returns (bytes32)",
      "function DEFAULT_ADMIN_ROLE() external view returns (bytes32)"
    ];
    
    const contract = new ethers.Contract(KYC_ISSUER_ADDRESS, abi, provider);
    
    try {
      const chainlinkRole = await contract.CHAINLINK_DON_ROLE();
      const adminRole = await contract.DEFAULT_ADMIN_ROLE();
      
      console.log("🔑 CHAINLINK_DON_ROLE:", chainlinkRole);
      console.log("👑 DEFAULT_ADMIN_ROLE:", adminRole);
      console.log("✅ Contract is correctly deployed and accessible!");
      
    } catch (error) {
      console.log("❌ Contract exists but might not be ChainlinkKYCIssuer:", error.message);
    }
    
  } catch (error) {
    console.error("❌ Error checking contract:", error);
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });