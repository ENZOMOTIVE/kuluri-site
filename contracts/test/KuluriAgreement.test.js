/**
 * npx hardhat test contracts/test/KuluriAgreement.test.js
 */

const { expect } = require("chai")
const { ethers }  = require("hardhat")

describe("KuluriAgreement", () => {
  let factory, platform, farm, worker, other
  const appId = "AG-001"

  const terms = { job: "Grape harvest", start: "2026-09-01", end: "2026-10-31", pay: 12.50 }
  const hash  = (obj) => ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(obj)))
  const termsHash = hash(terms)

  beforeEach(async () => {
    ;[platform, farm, worker, other] = await ethers.getSigners()
    const Fw = await ethers.getContractFactory("KuluriForwarder")
    const fw = await Fw.deploy()
    const F  = await ethers.getContractFactory("KuluriAgreementFactory")
    factory  = await F.deploy(await fw.getAddress())
    // platform is whitelisted by default (it's the deployer/owner)
  })

  async function deploy(id = appId) {
    const tx  = await factory.connect(platform).propose(farm.address, worker.address, termsHash, id)
    const rec = await tx.wait()
    const evt = rec.logs.find(l => l.fragment?.name === "AgreementCreated")
    return ethers.getContractAt("KuluriAgreement", evt.args.agreementContract)
  }

  // ── Power balance ──────────────────────────────────────────────────────────

  describe("power balance", () => {
    it("non-whitelisted address cannot propose", async () => {
      await expect(
        factory.connect(farm).propose(farm.address, worker.address, termsHash, appId)
      ).to.be.revertedWith("not whitelisted")
    })

    it("owner can whitelist a farm to propose directly", async () => {
      await factory.connect(platform).setWhitelisted(farm.address, true)
      const tx  = await factory.connect(farm).propose(farm.address, worker.address, termsHash, appId)
      const rec = await tx.wait()
      expect(rec.logs.some(l => l.fragment?.name === "AgreementCreated")).to.be.true
    })

    it("factory address inside the agreement points back to the factory (authenticity)", async () => {
      const a = await deploy()
      expect(await a.factory()).to.equal(await factory.getAddress())
    })

    it("isGenuine returns true for a factory-deployed agreement", async () => {
      const a = await deploy()
      expect(await factory.isGenuine(await a.getAddress())).to.be.true
    })

    it("isGenuine returns false for a random address", async () => {
      expect(await factory.isGenuine(other.address)).to.be.false
    })

    it("same appId cannot be proposed twice", async () => {
      await deploy(appId)
      await expect(
        factory.connect(platform).propose(farm.address, worker.address, termsHash, appId)
      ).to.be.revertedWith("appId already registered")
    })
  })

  // ── Core lifecycle ─────────────────────────────────────────────────────────

  describe("lifecycle", () => {
    it("farm proposes → worker agrees → farm completes", async () => {
      const a = await deploy()
      expect(await a.status()).to.equal(0) // Proposed

      await a.connect(worker).agreeAsWorker(termsHash)
      expect(await a.status()).to.equal(1) // Agreed
      expect(await a.workerSignedAt()).to.be.gt(0)

      await a.connect(farm).markCompleted()
      expect(await a.status()).to.equal(2) // Completed
    })

    it("worker is blocked if the terms hash drifts", async () => {
      const a = await deploy()
      const stale = hash({ ...terms, pay: 9.00 })
      await expect(a.connect(worker).agreeAsWorker(stale))
        .to.be.revertedWith("terms changed since you read them")
    })

    it("farm can update terms before worker signs", async () => {
      const a = await deploy()
      const updated = hash({ ...terms, pay: 13.00 })
      await a.connect(farm).updateTerms(updated)
      expect(await a.termsHash()).to.equal(updated)
    })

    it("farm cannot update to the same hash", async () => {
      const a = await deploy()
      await expect(a.connect(farm).updateTerms(termsHash))
        .to.be.revertedWith("hash unchanged")
    })

    it("farm can withdraw before worker signs", async () => {
      const a = await deploy()
      await a.connect(farm).withdraw()
      expect(await a.status()).to.equal(3) // Withdrawn
      await expect(a.connect(worker).agreeAsWorker(termsHash)).to.be.revertedWith("wrong status")
    })

    it("farm can cancel with reason after mutual agreement", async () => {
      const a = await deploy()
      await a.connect(worker).agreeAsWorker(termsHash)
      await a.connect(farm).cancel("Crop failure — hailstorm")
      expect(await a.status()).to.equal(4) // Cancelled
      expect(await a.cancelReason()).to.equal("Crop failure — hailstorm")
    })

    it("random wallet cannot sign as worker", async () => {
      const a = await deploy()
      await expect(a.connect(other).agreeAsWorker(termsHash)).to.be.revertedWith("not the worker")
    })
  })

  // ── Extensions ─────────────────────────────────────────────────────────────

  describe("extensions", () => {
    let a, extTerms, extHash

    beforeEach(async () => {
      a = await deploy()
      await a.connect(worker).agreeAsWorker(termsHash)
      extTerms = { ...terms, end: "2026-12-15", pay: 13.00 }
      extHash  = hash(extTerms)
    })

    it("farm proposes extension → worker confirms → termsHash updated", async () => {
      await a.connect(farm).proposeExtension(extHash)

      const { exists, index } = await a.pendingExtension()
      expect(exists).to.be.true
      expect(index).to.equal(0)

      await a.connect(worker).confirmExtension(extHash)
      expect(await a.termsHash()).to.equal(extHash)
    })

    it("worker proposes extension → farm confirms", async () => {
      await a.connect(worker).proposeExtension(extHash)
      await a.connect(farm).confirmExtension(extHash)
      expect(await a.termsHash()).to.equal(extHash)
    })

    it("proposer cannot confirm their own extension", async () => {
      await a.connect(farm).proposeExtension(extHash)
      await expect(a.connect(farm).confirmExtension(extHash))
        .to.be.revertedWith("cannot confirm your own extension")
    })

    it("confirming party is blocked if extension hash drifts", async () => {
      await a.connect(farm).proposeExtension(extHash)
      const wrong = hash({ ...extTerms, pay: 7.00 })
      await expect(a.connect(worker).confirmExtension(wrong))
        .to.be.revertedWith("extension terms changed")
    })

    it("only one extension can be pending at a time", async () => {
      await a.connect(farm).proposeExtension(extHash)
      const extHash2 = hash({ ...extTerms, pay: 14.00 })
      await expect(a.connect(farm).proposeExtension(extHash2))
        .to.be.revertedWith("an extension is already pending")
    })

    it("rejecting an extension lets a new one be proposed", async () => {
      await a.connect(farm).proposeExtension(extHash)
      await a.connect(worker).rejectExtension()

      const { exists } = await a.pendingExtension()
      expect(exists).to.be.false

      // New proposal is allowed
      const extHash2 = hash({ ...extTerms, pay: 14.00 })
      await a.connect(farm).proposeExtension(extHash2)
      const { exists: exists2 } = await a.pendingExtension()
      expect(exists2).to.be.true
    })

    it("extension history is immutable — count grows only", async () => {
      await a.connect(farm).proposeExtension(extHash)
      await a.connect(worker).rejectExtension()

      const extHash2 = hash({ ...extTerms, pay: 14.00 })
      await a.connect(worker).proposeExtension(extHash2)
      await a.connect(farm).confirmExtension(extHash2)

      const snap = await a.snapshot()
      expect(snap._extensionCount).to.equal(2n) // both recorded
    })

    it("cannot propose extension on a completed agreement", async () => {
      await a.connect(farm).markCompleted()
      await expect(a.connect(farm).proposeExtension(extHash))
        .to.be.revertedWith("wrong status")
    })
  })

  // ── Registry ───────────────────────────────────────────────────────────────

  describe("factory registry", () => {
    it("contractFor resolves appId to address", async () => {
      const a = await deploy()
      expect(await factory.contractFor(appId)).to.equal(await a.getAddress())
    })

    it("agreementsOf returns the agreement for both parties", async () => {
      const a = await deploy()
      const addr = await a.getAddress()
      expect((await factory.agreementsOf(farm.address))[0]).to.equal(addr)
      expect((await factory.agreementsOf(worker.address))[0]).to.equal(addr)
    })

    it("snapshot returns all fields", async () => {
      const a = await deploy()
      const s = await a.snapshot()
      expect(s._farm).to.equal(farm.address)
      expect(s._worker).to.equal(worker.address)
      expect(s._termsHash).to.equal(termsHash)
      expect(s._appId).to.equal(appId)
      expect(s._extensionCount).to.equal(0n)
    })
  })
})
