require("@nomicfoundation/hardhat-toolbox")
require("dotenv").config({ path: "../app/.env.local" })

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x" + "0".repeat(64)

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  paths: {
    sources:   "./src",      // .sol files go in /contracts/src
    tests:     "./test",
    cache:     "./cache",
    artifacts: "./artifacts",
  },
  solidity: {
    version: "0.8.24",
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    // Polygon Amoy — testnet, faucet has no balance requirement
    amoy: {
      url: "https://polygon-amoy-bor-rpc.publicnode.com",
      chainId: 80002,
      accounts: [PRIVATE_KEY],
    },
    // Sepolia — Ethereum testnet (faucets now require existing balance)
    sepolia: {
      url: "https://rpc.ankr.com/eth_sepolia",
      chainId: 11155111,
      accounts: [PRIVATE_KEY],
    },
    // Gnosis Chain mainnet — ~€0.0001/tx for production
    gnosis: {
      url: "https://rpc.gnosischain.com",
      chainId: 100,
      accounts: [PRIVATE_KEY],
    },
    // Chiado = Gnosis testnet (faucet often down — use sepolia for demos)
    chiado: {
      url: "https://rpc.chiadochain.net",
      chainId: 10200,
      accounts: [PRIVATE_KEY],
    },
    // Polygon PoS — alternative production chain
    polygon: {
      url: "https://polygon-rpc.com",
      chainId: 137,
      accounts: [PRIVATE_KEY],
    },
  },
  etherscan: {
    apiKey: {
      gnosis:  process.env.GNOSISSCAN_API_KEY || "",
      chiado:  process.env.GNOSISSCAN_API_KEY || "",
      polygon: process.env.POLYGONSCAN_API_KEY || "",
    },
    customChains: [
      {
        network: "chiado",
        chainId: 10200,
        urls: {
          apiURL:     "https://gnosis-chiado.blockscout.com/api",
          browserURL: "https://gnosis-chiado.blockscout.com",
        },
      },
    ],
  },
}
