import { ethers } from 'ethers';

async function main() {
  // World Chain Sepolia RPC (from .env file)
  const RPC_URL = "https://worldchain-sepolia.g.alchemy.com/v2/9LoW6D330D8KHv0K-u-yB";
  
  // Deployer private key from .env (this was used to deploy the contract)
  const DEPLOYER_PK = "0x2354cb39ddac1304a8f63053ebae9ee558d95507bf6fc774087719855cb4f5b5";
  const BACKEND_PK = "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d";
  
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const deployer = new ethers.Wallet(DEPLOYER_PK, provider);
  const backend = new ethers.Wallet(BACKEND_PK, provider);
  
  console.log("🔧 Granting CHAINLINK_DON_ROLE to backend account...");
  console.log("💰 Deployer account:", deployer.address);
  console.log("🤖 Backend account:", backend.address);
  
  // Contract address from new deployment
  const KYC_ISSUER_ADDRESS = "0xd5467031Ae1d256bB4c9DC879aB53fFa9B5ff5a5";
  
  // Contract ABI (minimal needed for role granting)
  const abi = [
    "function grantRole(bytes32 role, address account) external",
    "function hasRole(bytes32 role, address account) external view returns (bool)",
    "function CHAINLINK_DON_ROLE() external view returns (bytes32)",
    "function DEFAULT_ADMIN_ROLE() external view returns (bytes32)",
    "function getRoleAdmin(bytes32 role) external view returns (bytes32)"
  ];
  
  // Connect to contract
  const kycIssuer = new ethers.Contract(KYC_ISSUER_ADDRESS, abi, deployer);
  
  try {
    // Get the role hash
    const CHAINLINK_DON_ROLE = await kycIssuer.CHAINLINK_DON_ROLE();
    const DEFAULT_ADMIN_ROLE = await kycIssuer.DEFAULT_ADMIN_ROLE();
    
    console.log("🔑 CHAINLINK_DON_ROLE:", CHAINLINK_DON_ROLE);
    console.log("🔑 DEFAULT_ADMIN_ROLE:", DEFAULT_ADMIN_ROLE);
    
    // Check who has admin rights
    const deployerIsAdmin = await kycIssuer.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
    const backendIsAdmin = await kycIssuer.hasRole(DEFAULT_ADMIN_ROLE, backend.address);
    
    console.log("👑 Deployer is admin?", deployerIsAdmin);
    console.log("👑 Backend is admin?", backendIsAdmin);
    
    if (!deployerIsAdmin) {
      console.log("❌ Deployer doesn't have admin role. Cannot grant CHAINLINK_DON_ROLE.");
      console.log("🔍 Need to find who has DEFAULT_ADMIN_ROLE in this contract.");
      return;
    }
    
    // Check if backend already has the role
    const hasRole = await kycIssuer.hasRole(CHAINLINK_DON_ROLE, backend.address);
    
    if (hasRole) {
      console.log("✅ Backend already has CHAINLINK_DON_ROLE");
      return;
    }
    
    console.log("📝 Granting role to backend...");
    const tx = await kycIssuer.grantRole(CHAINLINK_DON_ROLE, backend.address);
    console.log("⏳ Transaction sent:", tx.hash);
    
    // Wait for confirmation
    const receipt = await tx.wait();
    console.log("✅ Role granted successfully!");
    console.log("📄 Transaction receipt:", receipt?.hash);
    
    // Verify the role was granted
    const hasRoleAfter = await kycIssuer.hasRole(CHAINLINK_DON_ROLE, backend.address);
    console.log("🔍 Role verification:", hasRoleAfter ? "SUCCESS" : "FAILED");
    
  } catch (error) {
    console.error("❌ Error granting role:", error);
  }
}

// Execute the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });