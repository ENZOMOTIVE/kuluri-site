/**
 * relay-example.js
 *
 * Pseudocode showing how the Kuluri backend relays a worker's "I Agree" action.
 * The worker signs off-chain (free, invisible). Kuluri submits and pays gas.
 *
 * Stack: ethers v6 + Privy server SDK
 */

import { ethers } from 'ethers'
import { FORWARDER_ABI, AGREEMENT_ABI } from './abis.js'

const FORWARDER_ADDRESS = process.env.VITE_FORWARDER_ADDRESS
const CHAIN_ID          = Number(process.env.VITE_CHAIN_ID)

// Kuluri's funded relayer wallet — this is the ONLY wallet that needs xDAI.
// Workers and farmers never need to hold any token.
const provider = new ethers.JsonRpcProvider('https://rpc.gnosischain.com')
const relayer  = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY, provider)

const forwarder = new ethers.Contract(FORWARDER_ADDRESS, FORWARDER_ABI, relayer)

/**
 * Called by the API when the worker taps "I Agree" in the app.
 *
 * @param workerPrivyWallet  Privy wallet object for the worker
 * @param agreementAddress   On-chain KuluriAgreement contract address
 * @param termsHash          keccak256 the worker computed from the terms they read
 */
export async function relayWorkerAgree(workerPrivyWallet, agreementAddress, termsHash) {
  const agreement = new ethers.Interface(AGREEMENT_ABI)

  // Encode the function call the worker wants to make
  const calldata = agreement.encodeFunctionData('agreeAsWorker', [termsHash])

  // Current nonce for this worker address on the forwarder
  const nonce = await forwarder.nonces(workerPrivyWallet.address)

  const request = {
    from:  workerPrivyWallet.address,
    to:    agreementAddress,
    nonce: nonce,
    data:  calldata,
  }

  // EIP-712 typed data — the worker signs this with their Privy wallet.
  // Privy shows this as a simple confirmation, no hex, no gas mention.
  const domain = {
    name:              'KuluriForwarder',
    version:           '1',
    chainId:           CHAIN_ID,
    verifyingContract: FORWARDER_ADDRESS,
  }
  const types = {
    ForwardRequest: [
      { name: 'from',  type: 'address' },
      { name: 'to',    type: 'address' },
      { name: 'nonce', type: 'uint256' },
      { name: 'data',  type: 'bytes'   },
    ],
  }

  // Worker signs off-chain — this is what Privy does invisibly behind the button tap.
  // No gas. No token. No network name visible.
  const signature = await workerPrivyWallet.signTypedData(domain, types, request)

  // Kuluri's relayer submits the transaction and pays the ~€0.0001 gas fee.
  const tx = await forwarder.execute(request, signature)
  const receipt = await tx.wait()

  return receipt.hash  // stored in the app DB alongside the agreement record
}

/**
 * Same pattern for the farm proposing an extension — just different function call.
 */
export async function relayFarmProposeExtension(farmPrivyWallet, agreementAddress, newTermsHash) {
  const agreement = new ethers.Interface(AGREEMENT_ABI)
  const calldata  = agreement.encodeFunctionData('proposeExtension', [newTermsHash])
  // ... same relay pattern as above
}
