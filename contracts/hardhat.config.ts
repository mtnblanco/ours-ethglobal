import { defineConfig } from "hardhat/config";
import "@nomiclabs/hardhat-ethers";
import "dotenv/config";

export default defineConfig({
  solidity: {
    compilers: [
      {
        version: "0.8.19", // Updated for Chainlink compatibility
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      {
        version: "0.8.28",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
      {
        version: "0.8.17",
        settings: {
          optimizer: {
            enabled: true,
            runs: 200,
          },
          viaIR: true,
        },
      },
    ],
  },
  networks: {
    hardhat: {
      chainId: 1337,
    },
    worldchain: {
      url: process.env.WORLD_CHAIN_RPC_URL || "https://worldchain-mainnet.g.alchemy.com/v2/demo",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 480, // World Chain mainnet ID
      gasPrice: 20000000000, // 20 gwei
    },
    worldchainSepolia: {
      url: process.env.WORLD_CHAIN_SEPOLIA_RPC_URL || "https://worldchain-sepolia.g.alchemy.com/v2/demo",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 4801, // World Chain Sepolia testnet ID
      gasPrice: 20000000000, // 20 gwei
    },
  },
  etherscan: {
    apiKey: {
      worldchain: process.env.WORLDCHAIN_ETHERSCAN_API_KEY || "",
      worldchainSepolia: process.env.WORLDCHAIN_ETHERSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "worldchain",
        chainId: 480,
        urls: {
          apiURL: "https://worldchain-mainnet.explorer.alchemy.com/api",
          browserURL: "https://worldchain-mainnet.explorer.alchemy.com",
        },
      },
      {
        network: "worldchainSepolia",
        chainId: 4801,
        urls: {
          apiURL: "https://worldchain-sepolia.explorer.alchemy.com/api",
          browserURL: "https://worldchain-sepolia.explorer.alchemy.com",
        },
      },
    ],
  },
});
