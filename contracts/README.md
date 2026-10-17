# Kuluri Smart Contracts

Tamper-proof job agreements between farms and seasonal workers on Polygon Amoy (testnet).
Neither party pays gas — Kuluri's relayer wallet submits transactions and covers the cost.
No crypto knowledge is required from users; Privy handles wallets and signing invisibly.

---

## Deployed contracts (Polygon Amoy testnet, chain 80002)

| Contract | Address |
|---|---|
| `KuluriForwarder` | `0x96A8A0A52cb44b637d2b3F6ED5E815e1EfFfbfDa` |
| `KuluriAgreementFactory` | `0x134EdfA525ECe891653001f0b2A252fA16957cAA` |

Inspect on: https://amoy.polygonscan.com

---

## Environment variables

Add these to `app/.env.local` (already done for the current setup):

```
VITE_CHAIN_ID=80002
VITE_FORWARDER_ADDRESS=0x96A8A0A52cb44b637d2b3F6ED5E815e1EfFfbfDa
VITE_FACTORY_ADDRESS=0x134EdfA525ECe891653001f0b2A252fA16957cAA
DEPLOYER_PRIVATE_KEY=<relayer wallet private key — never expose in frontend>
```

`VITE_CHAIN_ID` tells the app which network to target.
`VITE_FORWARDER_ADDRESS` and `VITE_FACTORY_ADDRESS` are the two deployed contracts the app calls.
`DEPLOYER_PRIVATE_KEY` is the relayer wallet that pays gas on behalf of users — backend only.

---

## Contracts

### `src/KuluriForwarder.sol`
Accepts EIP-712 signed messages from users (via Privy, off-chain and free), then submits
the actual transaction on-chain. The relayer wallet pays the gas. The target contract sees
the real user's address, not the relayer's.

### `src/KuluriAgreementFactory.sol`
Neutral platform registry. Deploys one `KuluriAgreement` per job and indexes it.
Only whitelisted addresses (Kuluri's backend in the MVP) can register agreements.
Provides `isGenuine(addr)` so anyone can verify a contract came from the real factory.

### `src/KuluriAgreement.sol`
One instance per agreement. Stores the `keccak256` hash of the full terms JSON — no names,
no PII on-chain (GDPR). Both parties must sign; neither can act unilaterally.
Supports the full lifecycle and extensions, both requiring mutual confirmation.

**Lifecycle:**
```
Proposed → Agreed → Completed
         ↘ Withdrawn  └→ Cancelled
```

**Extensions:** either party proposes a new terms hash (with updated end date), the other
confirms using the same hash they computed from what they read — drift reverts the tx.

---

## What goes on-chain vs off-chain

| On-chain | Off-chain |
|---|---|
| `keccak256` hash of terms | Full terms text (app database) |
| Farm + worker wallet addresses | Names, nationality, documents |
| State + timestamps | Chat transcript, intent score |
| Cancel reason | Pay slips, timesheets |

The hash is the proof. If anyone tampers with the terms text, the hash won't match —
provable without Kuluri's servers being online.

---

## Setup from scratch

```bash
cd contracts
npm install
npm test                   # 24 tests, local hardhat network, no funds needed
```

**Deploy to Amoy testnet:**
1. Generate a relayer wallet: `node -e "const {Wallet}=require('ethers'); const w=Wallet.createRandom(); console.log(w.address, w.privateKey)"`
2. Get free MATIC: https://faucet.polygon.technology (Google login, no balance required)
3. Add `DEPLOYER_PRIVATE_KEY=0x...` to `app/.env.local`
4. `npm run deploy:amoy`
5. Copy the printed addresses into `app/.env.local`

**Deploy to Gnosis Chain (production):**
- Same steps, use `npm run deploy:gnosis`
- Fund the relayer with xDAI (~$5 covers thousands of agreements)

---

## How signing works (no crypto UX for users)

```
User taps "I Agree"
  → App computes keccak256(termsJSON)
  → Privy signs an EIP-712 typed message with the user's embedded wallet (invisible)
  → Kuluri backend submits via KuluriForwarder, pays the ~$0.0001 gas fee
  → WorkerAgreed event emitted on-chain permanently
```

The user tapped a button. The blockchain has a cryptographic receipt.
