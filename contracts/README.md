# Kuluri Smart Contracts

Transparent, tamper-proof job agreements between farms and seasonal workers.
No crypto knowledge required from the user — Privy handles wallets invisibly.

---

## What goes on-chain and why

| On-chain | Off-chain |
|---|---|
| `termsHash` — keccak256 of the full terms JSON | Full terms text (app database / IPFS) |
| Farm wallet address | Farm name, contact details |
| Worker wallet address | Worker name, nationality, documents |
| State: Proposed / Agreed / Completed / Cancelled | Chat transcript |
| Timestamps of each transition | Intent score (AI analysis) |
| Cancel reason (dispute-relevant text only) | Pay slips, timesheets |

**Why hash-only?** GDPR. Names and addresses cannot go on a public blockchain. The hash is the proof — anyone with the original JSON can verify it matches. If the farm tries to change the terms later, the hash will not match and the lie is provable.

---

## Which blockchain

**Primary: Gnosis Chain (chain ID 100)**

- EVM-compatible — same Solidity, same tools
- ~€0.0001 per transaction (often less than €0.001 for a full agreement lifecycle)
- Stable native currency: xDAI (pegged 1:1 to USD via DAI)
- EU-adjacent project, used by many European non-profits and DAOs
- Free testnet: **Chiado** (chain ID 10200), faucet at faucet.chiadochain.net

**Why not EBSI?**
EBSI (European Blockchain Services Infrastructure) is great for W3C Verifiable Credentials and DID, but it does not run general EVM smart contracts. It would require becoming an accredited Trust Service Provider. That is a future integration point — EBSI VCs could reference the on-chain agreement address as the proof anchor.

**Why not Ethereum mainnet?**
Gas costs. One `propose()` call on mainnet ≈ €2–10 depending on congestion. For a farm creating 50 agreements per season that is a real cost. On Gnosis it is less than €0.01 total for the full lifecycle.

**Alternative: Polygon PoS (chain ID 137)**
Also configured in hardhat.config.js. Similar cost profile, larger ecosystem. Switch by changing `--network polygon` in the deploy command.

---

## Contracts

### `KuluriAgreement.sol`
One deployed instance per agreement. Key design:

**Power balance**
- The factory (a neutral platform contract) deploys every agreement — neither party does
- The farm proposes terms (hash stored on-chain) but nothing is "agreed" until the worker signs
- The worker passes the hash they computed from what they read; if the farm changed anything, the transaction reverts — no silent bait-and-switch possible
- Extensions are symmetric: either party proposes, the other confirms using the same hash-drift check

**Lifecycle functions**
- `agreeAsWorker(expectedHash)` — worker signs; their Privy wallet call IS the signature
- `updateTerms(newHash)` — farm corrects draft before worker signs
- `withdraw()` — farm pulls back before worker signs
- `markCompleted()` — farm marks done after work finishes
- `cancel(reason)` — farm cancels an agreed engagement (reason stored on-chain permanently)

**Extension functions**
- `proposeExtension(newTermsHash)` — either party, while status is Agreed
- `confirmExtension(expectedHash)` — the OTHER party confirms (hash-drift protected)
- `rejectExtension()` — either party rejects; a fresh proposal can follow
- Only one extension can be pending at a time; all extensions are stored permanently

**View helpers**
- `snapshot()` — everything the app needs in one call
- `pendingExtension()` — current pending extension if any
- `verifyTerms(hash)` — quick integrity check

### `KuluriAgreementFactory.sol`
Neutral platform registry. Kuluri deploys one of these once.

**Key mechanisms**
- `propose(_farm, _worker, termsHash, appId)` — only whitelisted addresses can call this; in the MVP the Kuluri backend is the sole caller, acting on behalf of farms
- `setWhitelisted(addr, bool)` — owner grants verified farms the right to propose directly (future)
- `isGenuine(contractAddr)` — anyone can verify a contract was created by this factory (anti-fake)
- `byAppId["AG-001"]` → contract address
- `agreementsOf(walletAddress)` → all agreements for any wallet, newest first

---

## How Privy connects

Privy gives each user an embedded wallet. They never see a seed phrase.

```
User clicks "I Agree"
  → App computes keccak256(termsJSON)
  → App calls privy.sendTransaction({
        to:   agreementContractAddress,
        data: agreement.interface.encodeFunctionData("agreeAsWorker", [hash])
    })
  → Privy signs with the embedded wallet (invisible to user)
  → Transaction lands on Gnosis Chain
  → WorkerAgreed event emitted (permanent, public)
```

From the user's perspective: they tapped a button. From the blockchain's perspective: they cryptographically signed the exact hash of the terms they were shown.

---

## Gas sponsorship (making it truly free for users)

Using ERC-4337 (Account Abstraction) with a Paymaster, the app can pay the tiny gas fees on behalf of users. Gnosis Chain supports this via Safe's infrastructure. Users pay nothing and never need to hold xDAI.

Alternatively: the backend can relay transactions (a simple meta-transaction pattern) so the app pays the gas and the user's Privy wallet just signs a permit.

---

## Setup

```bash
cd contracts
npm install

# Run tests (uses Hardhat's local network, no real funds needed)
npm test

# Deploy to Chiado testnet
# 1. Get free xDAI: https://faucet.chiadochain.net
# 2. Add DEPLOYER_PRIVATE_KEY to app/.env.local
npm run deploy:chiado

# Deploy to Gnosis mainnet
npm run deploy:gnosis
```

After deployment, add the factory address to `app/.env.local`:
```
VITE_AGREEMENT_FACTORY_ADDRESS=0x...
VITE_CHAIN_ID=100
```

---

## Verifying a proof (what happens if there's a dispute)

1. The worker opens the app or goes directly to Gnosisscan
2. They paste the agreement contract address (stored in the app and in the factory)
3. They see: both wallet addresses, the terms hash, exact timestamps, current state
4. They take the original terms JSON from the app, compute `keccak256` locally
5. It matches the on-chain hash → proof the terms were not changed
6. The `WorkerAgreed` event with its block timestamp is the cryptographic receipt

This is usable as evidence in labour disputes without any Kuluri infrastructure being online.
