require('dotenv').config();
const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function main() {
  console.log("🚀 Deploying ALL contracts to Ethereum Sepolia...\n");

  const provider = new ethers.JsonRpcProvider(
    process.env.SEPOLIA_RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com'
  );
  
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  console.log("📝 Deployer:", wallet.address);
  
  const balance = await provider.getBalance(wallet.address);
  console.log("💰 Balance:", ethers.formatEther(balance), "ETH\n");

  if (balance === 0n) {
    throw new Error("❌ No ETH! Get from: https://sepoliafaucet.com/");
  }

  // Compilar MockIdentityRegistry usando solc directamente
  console.log("========================================");
  console.log("STEP 0: Compiling MockIdentityRegistry");
  console.log("========================================\n");

  const mockIdentityRegistrySource = fs.readFileSync(
    path.join(__dirname, '../contracts/MockIdentityRegistry.sol'),
    'utf8'
  );

  // Buscar solc en node_modules o usar npx
  let solcPath;
  try {
    solcPath = require.resolve('solc', { paths: [__dirname + '/../node_modules'] });
  } catch (e) {
    console.log("⚠️  solc not found in node_modules, trying to compile with npx...");
  }

  // Si no hay solc, intentar compilar con el artifact existente o usar un método alternativo
  let mockIdentityRegistryBytecode;
  let mockIdentityRegistryABI;

  // Intentar leer artifact si existe
  const artifactPath = path.join(__dirname, '../artifacts/contracts/MockIdentityRegistry.sol/MockIdentityRegistry.json');
  if (fs.existsSync(artifactPath)) {
    console.log("✅ Found existing artifact for MockIdentityRegistry");
    const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
    mockIdentityRegistryBytecode = artifact.bytecode;
    mockIdentityRegistryABI = artifact.abi;
  } else {
    // Si no hay artifact, intentar compilar con solcjs
    console.log("⚠️  No artifact found, attempting to compile...");
    try {
      const solc = require('solc');
      
      // Crear una interfaz mínima de IIdentity sin dependencias
      const iIdentitySource = `// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;
interface IIdentity {
    function addKey(bytes32 _key, uint256 _purpose, uint256 _keyType) external returns (bool success);
    function getKey(bytes32 _key) external view returns (uint256[] memory purposes, uint256 keyType, bytes32 key);
}`;
      
      const input = {
        language: 'Solidity',
        sources: {
          'MockIdentityRegistry.sol': {
            content: mockIdentityRegistrySource.replace(
              '@onchain-id/solidity/contracts/interface/IIdentity.sol',
              'IIdentity.sol'
            )
          },
          'IIdentity.sol': {
            content: iIdentitySource
          }
        },
        settings: {
          outputSelection: {
            '*': {
              '*': ['abi', 'evm.bytecode']
            }
          },
          optimizer: {
            enabled: true,
            runs: 200
          }
        }
      };

      const output = JSON.parse(solc.compile(JSON.stringify(input)));
      if (output.errors && output.errors.length > 0) {
        // Filtrar solo errores, ignorar warnings
        const realErrors = output.errors.filter(e => e.severity === 'error');
        if (realErrors.length > 0) {
          console.error("Compilation errors:", realErrors);
          throw new Error("Compilation failed");
        }
        // Si solo hay warnings, continuar
        const warnings = output.errors.filter(e => e.severity === 'warning');
        if (warnings.length > 0) {
          console.log("⚠️  Compilation warnings (ignored):", warnings.length);
        }
      }

      const contract = output.contracts['MockIdentityRegistry.sol']['MockIdentityRegistry'];
      mockIdentityRegistryBytecode = contract.evm.bytecode.object;
      mockIdentityRegistryABI = contract.abi;
      console.log("✅ Compiled successfully");
    } catch (error) {
      console.error("❌ Could not compile MockIdentityRegistry:", error.message);
      console.log("\n💡 Trying alternative: using minimal bytecode from Remix compilation...");
      
      // ABI mínimo necesario
      mockIdentityRegistryABI = [
        "function registerIdentity(address user, address identity, uint16 country) external",
        "function identity(address user) external view returns (address)",
        "function isVerified(address user) external view returns (bool)",
        "function investorCountry(address user) external view returns (uint16)"
      ];
      
      // Intentar deployar con un factory que compile on-the-fly
      throw new Error("Please compile MockIdentityRegistry first. Run: npx hardhat compile (if it works) or deploy from Remix");
    }
  }

  console.log("\n========================================");
  console.log("STEP 1: Deploying MockIdentityRegistry");
  console.log("========================================\n");

  const MockIdentityRegistryFactory = new ethers.ContractFactory(
    mockIdentityRegistryABI,
    mockIdentityRegistryBytecode,
    wallet
  );
  
  const identityRegistry = await MockIdentityRegistryFactory.deploy();
  console.log("⏳ Transaction hash:", identityRegistry.deploymentTransaction().hash);
  await identityRegistry.waitForDeployment();
  const identityRegistryAddress = await identityRegistry.getAddress();
  
  console.log("✅ MockIdentityRegistry deployed to:", identityRegistryAddress);
  console.log("");

  // Leer artifact de ChainlinkKYCIssuer
  const kycIssuerPath = path.join(__dirname, '../artifacts/contracts/ChainlinkKYCIssuer.sol/ChainlinkKYCIssuer.json');
  if (!fs.existsSync(kycIssuerPath)) {
    throw new Error(`❌ Artifact not found: ${kycIssuerPath}\nRun: npx hardhat compile`);
  }
  const ChainlinkKYCIssuerArtifact = JSON.parse(fs.readFileSync(kycIssuerPath, 'utf8'));

  console.log("========================================");
  console.log("STEP 2: Deploying ChainlinkKYCIssuer");
  console.log("========================================\n");

  const config = {
    // Usar una dirección mock válida (no zero) para pasar la validación del constructor
    // En producción esto sería la dirección real del World ID Router
    worldIdRouter: "0x0000000000000000000000000000000000000001", // Mock address para testing
    appId: "test-app-sepolia",
    actionId: "test-kyc-verification",
    identityRegistry: identityRegistryAddress
  };

  console.log("📋 Config:");
  console.log("   World ID Router:", config.worldIdRouter, "(disabled for testing)");
  console.log("   App ID:", config.appId);
  console.log("   Action ID:", config.actionId);
  console.log("   Identity Registry:", config.identityRegistry);
  console.log("");

  const ChainlinkKYCIssuerFactory = new ethers.ContractFactory(
    ChainlinkKYCIssuerArtifact.abi,
    ChainlinkKYCIssuerArtifact.bytecode,
    wallet
  );
  
  const kycIssuer = await ChainlinkKYCIssuerFactory.deploy(
    config.worldIdRouter,
    config.appId,
    config.actionId,
    config.identityRegistry
  );
  
  console.log("⏳ Transaction hash:", kycIssuer.deploymentTransaction().hash);
  console.log("⏳ Waiting for deployment...");
  await kycIssuer.waitForDeployment();
  const kycIssuerAddress = await kycIssuer.getAddress();
  
  console.log("✅ ChainlinkKYCIssuer deployed to:", kycIssuerAddress);
  console.log("");

  console.log("========================================");
  console.log("STEP 3: Configuring Roles");
  console.log("========================================\n");

  const chainlinkDonRole = await kycIssuer.CHAINLINK_DON_ROLE();
  console.log("🔑 Granting CHAINLINK_DON_ROLE...");
  
  const grantTx = await kycIssuer.grantRole(chainlinkDonRole, wallet.address);
  console.log("⏳ Transaction hash:", grantTx.hash);
  await grantTx.wait();
  
  console.log("✅ CHAINLINK_DON_ROLE granted!");
  console.log("");

  const deploymentInfo = {
    network: "ethereum-sepolia",
    chainId: 11155111,
    deployer: wallet.address,
    timestamp: new Date().toISOString(),
    contracts: {
      MockIdentityRegistry: identityRegistryAddress,
      ChainlinkKYCIssuer: kycIssuerAddress
    },
    config: {
      worldIdRouter: config.worldIdRouter,
      worldAppId: config.appId,
      worldActionId: config.actionId,
      identityRegistry: identityRegistryAddress
    }
  };

  const deploymentsDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }

  const deploymentFile = path.join(deploymentsDir, "ethereum-sepolia.json");
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));

  console.log("========================================");
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("========================================\n");
  
  console.log("📋 Contract Addresses:");
  console.log("   MockIdentityRegistry:", identityRegistryAddress);
  console.log("   ChainlinkKYCIssuer:", kycIssuerAddress);
  console.log("");
  
  console.log("📝 Update ours/ours/config.staging.json:");
  console.log(`   "kycIssuerAddress": "${kycIssuerAddress}"`);
  console.log("");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Error:", error.message);
    process.exit(1);
  });

