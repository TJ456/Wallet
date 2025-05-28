import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import dotenv from "dotenv";

dotenv.config();

// Get private key from .env file or use a default one for testing (never use this in production!)
const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";
// API keys for blockchain explorers
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";
const MONADSCAN_API_KEY = process.env.MONADSCAN_API_KEY || "";

const config: HardhatUserConfig = {
  solidity: "0.8.28",
  networks: {
    // Local network for testing
    localhost: {
      url: "http://127.0.0.1:8545",
    },
    // Sepolia testnet
    sepolia: {
      url: `https://sepolia.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
      accounts: PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" 
        ? [PRIVATE_KEY] 
        : [],
      chainId: 11155111
    },
    // Goerli testnet
    goerli: {
      url: `https://goerli.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
      accounts: PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" 
        ? [PRIVATE_KEY] 
        : [],
      chainId: 5
    },
    // Mumbai testnet (Polygon)
    mumbai: {
      url: `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_API_KEY || ""}`,
      accounts: PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" 
        ? [PRIVATE_KEY] 
        : [],
      chainId: 80001
    },
    // Monad testnet
    monad_testnet: {
      url: process.env.MONAD_RPC_URL || "https://rpc.testnet.monad.xyz",
      accounts: PRIVATE_KEY !== "0x0000000000000000000000000000000000000000000000000000000000000000" 
        ? [PRIVATE_KEY] 
        : [],
      chainId: 2023
    }
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      goerli: ETHERSCAN_API_KEY,
      sepolia: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
      monad_testnet: MONADSCAN_API_KEY
    },
    customChains: [
      {
        network: "monad_testnet",
        chainId: 2023,
        urls: {
          apiURL: "https://explorer-api-testnet.monad.xyz/api",
          browserURL: "https://explorer.testnet.monad.xyz"
        }
      }
    ]
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};

export default config;
