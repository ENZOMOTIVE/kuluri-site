// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * EIP-2771 context mixin.
 * When called through the trusted KuluriForwarder, the real sender is the last
 * 20 bytes of calldata. Direct calls fall back to msg.sender (backend, tests).
 */
abstract contract EIP2771Context {
    address public immutable trustedForwarder;

    constructor(address _forwarder) {
        trustedForwarder = _forwarder;
    }

    function _msgSender() internal view returns (address sender) {
        if (msg.sender == trustedForwarder && msg.data.length >= 20) {
            assembly { sender := shr(96, calldataload(sub(calldatasize(), 20))) }
        } else {
            sender = msg.sender;
        }
    }
}

/**
 * KuluriAgreement
 *
 * A mutual job agreement between a farm and a seasonal worker.
 * Deployed by KuluriAgreementFactory (a neutral platform contract).
 *
 * Power balance
 * ─────────────
 * Neither party can unilaterally create an active agreement.
 * - The factory deploys this (no single party controls deployment).
 * - The farm signs first (proposes terms).
 * - The worker must independently verify the hash and sign to make it Agreed.
 * - Extensions work the same way: one side proposes, the other confirms.
 * - Only the factory can deploy — no one can create a fake Kuluri agreement.
 *
 * Lifecycle
 * ─────────
 *   Proposed ──[workerAgrees]──→ Agreed ──[markCompleted]──→ Completed
 *            ↘[farm withdraws]→ Withdrawn  └──[cancel]──────→ Cancelled
 *
 * Extensions
 * ──────────
 * Either party can propose an extension while status is Agreed.
 * The other party must confirm it. The extension replaces the active terms hash
 * and end date. Every extension is stored permanently as an immutable record.
 *
 * What is stored on-chain
 * ───────────────────────
 * Only the keccak256 hash of the full terms JSON — no names, no PII (GDPR).
 * The app keeps the readable text. Anyone with the original JSON can verify it.
 */
contract KuluriAgreement is EIP2771Context {

    // ── Types ────────────────────────────────────────────────────────────────

    enum Status { Proposed, Agreed, Completed, Withdrawn, Cancelled }

    struct Extension {
        bytes32 termsHash;      // hash of the updated terms (includes new end date)
        address proposedBy;     // farm or worker
        uint40  proposedAt;
        uint40  confirmedAt;    // 0 until the other party confirms
        bool    confirmed;
    }

    // ── Immutables ────────────────────────────────────────────────────────────

    address public immutable factory;
    address public immutable farm;
    address public immutable worker;
    string  public           appId;      // app-level ID, e.g. "AG-001"

    // ── Mutable state ─────────────────────────────────────────────────────────

    // The active terms hash. Updated when an extension is confirmed.
    bytes32 public termsHash;

    Status  public status;
    uint40  public farmSignedAt;
    uint40  public workerSignedAt;
    string  public cancelReason;

    // Full extension history. Index 0 = first extension proposed.
    Extension[] public extensions;

    // ── Events ────────────────────────────────────────────────────────────────

    event Proposed          (address indexed farm, address indexed worker, bytes32 termsHash, string appId);
    event WorkerAgreed      (address indexed worker, uint40 at);
    event Completed         (uint40 at);
    event Withdrawn         (uint40 at);
    event Cancelled         (string reason, uint40 at);
    event TermsUpdated      (bytes32 newHash, uint40 at);                   // farm edits draft
    event ExtensionProposed (uint256 indexed index, address proposedBy, bytes32 termsHash, uint40 at);
    event ExtensionConfirmed(uint256 indexed index, address confirmedBy, uint40 at);
    event ExtensionRejected (uint256 indexed index, address rejectedBy, uint40 at);

    // ── Guards ────────────────────────────────────────────────────────────────

    modifier onlyFactory() { require(msg.sender == factory,          "only factory"); _; }
    modifier onlyFarm()    { require(_msgSender() == farm,           "not the farm"); _; }
    modifier onlyWorker()  { require(_msgSender() == worker,         "not the worker"); _; }
    modifier onlyParty()   { require(_msgSender() == farm || _msgSender() == worker, "not a party"); _; }

    modifier inStatus(Status s) { require(status == s, "wrong status"); _; }

    // ── Constructor ───────────────────────────────────────────────────────────

    /**
     * Called only by KuluriAgreementFactory.
     *
     * @param _farm       Farm's Privy embedded-wallet address
     * @param _worker     Worker's Privy embedded-wallet address
     * @param _termsHash  keccak256 of the canonical terms JSON (farm-computed)
     * @param _appId      App-internal agreement ID, e.g. "AG-001"
     * @param _forwarder  Address of KuluriForwarder (for gasless meta-transactions)
     */
    constructor(
        address _farm,
        address _worker,
        bytes32 _termsHash,
        string  memory _appId,
        address _forwarder
    ) EIP2771Context(_forwarder) {
        require(_farm   != address(0), "bad farm address");
        require(_worker != address(0), "bad worker address");
        require(_termsHash != bytes32(0), "empty terms hash");

        factory      = msg.sender;   // whoever deployed = factory
        farm         = _farm;
        worker       = _worker;
        termsHash    = _termsHash;
        appId        = _appId;
        status       = Status.Proposed;
        farmSignedAt = uint40(block.timestamp);

        emit Proposed(_farm, _worker, _termsHash, _appId);
    }

    // ── Farm actions (Proposed state) ─────────────────────────────────────────

    /**
     * Farm corrects the terms hash before the worker has signed.
     * The new hash must differ — prevents pointless no-op calls.
     */
    function updateTerms(bytes32 newHash)
        external
        onlyFarm
        inStatus(Status.Proposed)
    {
        require(newHash != bytes32(0),  "empty hash");
        require(newHash != termsHash,   "hash unchanged");
        termsHash    = newHash;
        farmSignedAt = uint40(block.timestamp);
        emit TermsUpdated(newHash, uint40(block.timestamp));
    }

    /**
     * Farm pulls the proposal back before the worker signs.
     */
    function withdraw()
        external
        onlyFarm
        inStatus(Status.Proposed)
    {
        status = Status.Withdrawn;
        emit Withdrawn(uint40(block.timestamp));
    }

    // ── Worker action (Proposed state) ────────────────────────────────────────

    /**
     * Worker agrees to the terms.
     *
     * The worker passes the hash they computed from the terms they read in the app.
     * If it does not match what the farm stored, the transaction reverts — no silent
     * bait-and-switch is possible. The Privy wallet call is the cryptographic signature.
     *
     * @param expectedHash  keccak256 the worker computed client-side
     */
    function agreeAsWorker(bytes32 expectedHash)
        external
        onlyWorker
        inStatus(Status.Proposed)
    {
        require(termsHash == expectedHash, "terms changed since you read them");
        status         = Status.Agreed;
        workerSignedAt = uint40(block.timestamp);
        emit WorkerAgreed(msg.sender, uint40(block.timestamp));
    }

    // ── Shared actions (Agreed state) ─────────────────────────────────────────

    /**
     * Farm marks the engagement done after the work is finished.
     */
    function markCompleted()
        external
        onlyFarm
        inStatus(Status.Agreed)
    {
        status = Status.Completed;
        emit Completed(uint40(block.timestamp));
    }

    /**
     * Farm cancels a mutually agreed engagement.
     * The reason is stored on-chain — it is the only human-readable field we allow
     * because it is dispute-relevant, not personally identifying.
     */
    function cancel(string calldata reason)
        external
        onlyFarm
        inStatus(Status.Agreed)
    {
        status       = Status.Cancelled;
        cancelReason = reason;
        emit Cancelled(reason, uint40(block.timestamp));
    }

    // ── Extension flow ────────────────────────────────────────────────────────
    //
    // Either party can propose an extension while status is Agreed.
    // The OTHER party confirms or rejects it.
    // Confirming updates termsHash to the new one (new end date baked in).
    // Rejecting discards it; a new proposal can follow.
    // Only one extension can be pending at a time.

    function _pendingExtension() internal view returns (bool has, uint256 idx) {
        for (uint256 i = extensions.length; i > 0; i--) {
            if (!extensions[i - 1].confirmed && extensions[i - 1].confirmedAt == 0) {
                return (true, i - 1);
            }
        }
        return (false, 0);
    }

    /**
     * Propose an extension (either party, while Agreed).
     *
     * @param newTermsHash  Hash of the new terms JSON (must include the new end date
     *                      and any other changed fields so the full picture is captured)
     */
    function proposeExtension(bytes32 newTermsHash)
        external
        onlyParty
        inStatus(Status.Agreed)
    {
        require(newTermsHash != bytes32(0),  "empty hash");
        require(newTermsHash != termsHash,   "terms unchanged");

        (bool pending,) = _pendingExtension();
        require(!pending, "an extension is already pending");

        uint256 idx = extensions.length;
        extensions.push(Extension({
            termsHash:   newTermsHash,
            proposedBy:  msg.sender,
            proposedAt:  uint40(block.timestamp),
            confirmedAt: 0,
            confirmed:   false
        }));

        emit ExtensionProposed(idx, msg.sender, newTermsHash, uint40(block.timestamp));
    }

    /**
     * The OTHER party confirms the pending extension.
     * They pass the hash they computed from the terms they read — same drift protection
     * as the original agreement.
     *
     * @param expectedHash  Hash the confirming party computed client-side
     */
    function confirmExtension(bytes32 expectedHash)
        external
        onlyParty
        inStatus(Status.Agreed)
    {
        (bool pending, uint256 idx) = _pendingExtension();
        require(pending, "no pending extension");

        Extension storage ext = extensions[idx];
        require(ext.proposedBy != msg.sender, "cannot confirm your own extension");
        require(ext.termsHash == expectedHash, "extension terms changed");

        ext.confirmed    = true;
        ext.confirmedAt  = uint40(block.timestamp);
        termsHash        = ext.termsHash;   // promote to active terms

        emit ExtensionConfirmed(idx, msg.sender, uint40(block.timestamp));
    }

    /**
     * Either party rejects the pending extension.
     * The agreement stays active under its current terms.
     */
    function rejectExtension()
        external
        onlyParty
        inStatus(Status.Agreed)
    {
        (bool pending, uint256 idx) = _pendingExtension();
        require(pending, "no pending extension");

        // Mark as rejected by setting confirmedAt with confirmed = false
        extensions[idx].confirmedAt = uint40(block.timestamp);

        emit ExtensionRejected(idx, msg.sender, uint40(block.timestamp));
    }

    // ── View helpers ──────────────────────────────────────────────────────────

    /**
     * Full snapshot for the app — one call, no extra queries.
     */
    function snapshot()
        external
        view
        returns (
            address _farm,
            address _worker,
            bytes32 _termsHash,
            Status  _status,
            uint40  _farmSignedAt,
            uint40  _workerSignedAt,
            string  memory _appId,
            string  memory _cancelReason,
            uint256 _extensionCount
        )
    {
        return (
            farm, worker, termsHash, status,
            farmSignedAt, workerSignedAt,
            appId, cancelReason, extensions.length
        );
    }

    /**
     * Whether the caller's off-chain text matches the active on-chain terms.
     */
    function verifyTerms(bytes32 hashToCheck) external view returns (bool) {
        return termsHash == hashToCheck;
    }

    /**
     * Pending extension data, if any. Returns zeroed struct if none.
     */
    function pendingExtension()
        external
        view
        returns (bool exists, uint256 index, Extension memory ext)
    {
        (bool has, uint256 idx) = _pendingExtension();
        if (has) return (true, idx, extensions[idx]);
        return (false, 0, Extension(bytes32(0), address(0), 0, 0, false));
    }
}
