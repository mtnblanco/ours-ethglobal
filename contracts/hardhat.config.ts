import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

const config: HardhatUserConfig = {
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
      type: "edr-simulated",
      chainId: 1337,
    },
    worldchain: {
      type: "http",
      url: process.env.WORLD_CHAIN_RPC_URL || "https://worldchain-mainnet.g.alchemy.com/v2/demo",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 480, // World Chain mainnet ID
      gasPrice: 1000000000, // 1 gwei (reducido 20x)
    },
    worldchainSepolia: {
      type: "http",
      url: process.env.WORLD_CHAIN_SEPOLIA_RPC_URL || "https://worldchain-sepolia.g.alchemy.com/v2/demo",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 4801, // World Chain Sepolia testnet ID
      gasPrice: 100000000, // 0.1 gwei (reducido 200x) - súper barato para testnet
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "https://ethereum-sepolia-rpc.publicnode.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111, // Ethereum Sepolia testnet ID
    },
  },
};

export default config;
