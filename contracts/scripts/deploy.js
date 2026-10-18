/**
 * Deploy KuluriForwarder + KuluriAgreementFactory to Gnosis Chain (or any EVM).
 *
 * Usage:
 *   npx hardhat run contracts/scripts/deploy.js --network chiado   # testnet (free)
 *   npx hardhat run contracts/scripts/deploy.js --network gnosis   # mainnet
 *
 * The relayer wallet (DEPLOYER_PRIVATE_KEY) needs a small amount of xDAI.
 * On Gnosis Chain, $5 of xDAI covers thousands of agreements.
 * Get testnet xDAI free at: https://faucet.chiadochain.net
 */

async function main() {
  const [deployer] = await ethers.getSigners()
  console.log("Deploying from:", deployer.address)

  const network = await ethers.provider.getNetwork()
  const balance = await ethers.provider.getBalance(deployer.address)
  console.log("Network:", network.name, `(chain ${network.chainId})`)
  console.log("Balance:", ethers.formatEther(balance), "ETH\n")

  // 1. Deploy the forwarder first — users sign through this, Kuluri pays gas
  const Forwarder = await ethers.getContractFactory("KuluriForwarder")
  const forwarder = await Forwarder.deploy()
  await forwarder.waitForDeployment()
  const forwarderAddr = await forwarder.getAddress()
  console.log("✓ KuluriForwarder:        ", forwarderAddr)

  // 2. Deploy the factory — one shared registry, trusts the forwarder above
  const Factory = await ethers.getContractFactory("KuluriAgreementFactory")
  const factory = await Factory.deploy(forwarderAddr)
  await factory.waitForDeployment()
  const factoryAddr = await factory.getAddress()
  console.log("✓ KuluriAgreementFactory: ", factoryAddr)

  console.log("\nAdd to app/.env.local:")
  console.log(`  VITE_FORWARDER_ADDRESS=${forwarderAddr}`)
  console.log(`  VITE_FACTORY_ADDRESS=${factoryAddr}`)
  console.log(`  VITE_CHAIN_ID=${(await ethers.provider.getNetwork()).chainId}`)

  const net = (await ethers.provider.getNetwork()).name
  console.log("\nVerify on block explorer:")
  console.log(`  npx hardhat verify --network ${net} ${forwarderAddr}`)
  console.log(`  npx hardhat verify --network ${net} ${factoryAddr} "${forwarderAddr}"`)
}

main().catch((err) => { console.error(err); process.exitCode = 1 })
