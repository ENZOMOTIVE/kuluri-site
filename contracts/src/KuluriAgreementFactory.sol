// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { KuluriAgreement } from "./KuluriAgreement.sol";

/**
 * KuluriAgreementFactory
 *
 * Neutral platform contract. Kuluri's backend deploys one of these once.
 * The platform — not the farm, not the worker — controls who can register
 * agreements through it. This is the key power-balance mechanism:
 *
 *   - Only addresses the platform has whitelisted (verified farms) can call propose().
 *   - The factory's address is the `factory` immutable inside every KuluriAgreement,
 *     so fake "Kuluri" agreements deployed by other means are immediately detectable.
 *   - The factory is the single source of truth for the app to look up agreements.
 *
 * Anyone (worker, regulator, auditor) can query the factory to verify an agreement
 * contract is genuine — without needing Kuluri's servers.
 */
contract KuluriAgreementFactory {

    // ── State ─────────────────────────────────────────────────────────────────

    address public owner;

    // The single KuluriForwarder deployed alongside this factory.
    // Every agreement it creates trusts this forwarder for gasless meta-transactions.
    address public immutable forwarder;

    // Verified farm wallets allowed to propose agreements.
    // In the MVP the Kuluri backend is the only whitelisted address and it proposes
    // on behalf of the farm. Once scale warrants it, farms get whitelisted directly.
    mapping(address => bool) public whitelisted;

    // appId → agreement contract (appId must be globally unique)
    mapping(string => address) public byAppId;

    // wallet → all agreement contracts (farm or worker)
    mapping(address => address[]) private _agreements;

    // ── Events ────────────────────────────────────────────────────────────────

    event Whitelisted      (address indexed addr, bool allowed);
    event AgreementCreated (
        address indexed agreementContract,
        address indexed farm,
        address indexed worker,
        string  appId,
        bytes32 termsHash
    );

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor(address _forwarder) {
        require(_forwarder != address(0), "zero forwarder");
        forwarder = _forwarder;
        owner     = msg.sender;
        whitelisted[msg.sender] = true; // deployer (Kuluri backend) can propose
    }

    // ── Access control ────────────────────────────────────────────────────────

    modifier onlyOwner() { require(msg.sender == owner, "not owner"); _; }

    /**
     * Whitelist a farm wallet so it can propose agreements directly (no backend relay).
     * Revoke by passing allowed = false.
     */
    function setWhitelisted(address addr, bool allowed) external onlyOwner {
        whitelisted[addr] = allowed;
        emit Whitelisted(addr, allowed);
    }

    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "zero address");
        owner = newOwner;
    }

    // ── Factory ───────────────────────────────────────────────────────────────

    /**
     * Deploy a new KuluriAgreement and register it.
     *
     * Caller must be whitelisted. In the MVP the Kuluri backend calls this on behalf
     * of the farm using the farm's Privy wallet address as `_farm`.
     *
     * @param _farm       Farm's Privy embedded-wallet address (signs first)
     * @param _worker     Worker's Privy embedded-wallet address (signs second)
     * @param _termsHash  keccak256 of the canonical terms JSON
     * @param _appId      App-internal ID ("AG-001"). Must be globally unique.
     */
    function propose(
        address _farm,
        address _worker,
        bytes32 _termsHash,
        string  calldata _appId
    ) external returns (address addr) {
        require(whitelisted[msg.sender], "not whitelisted");
        require(byAppId[_appId] == address(0), "appId already registered");
        require(bytes(_appId).length > 0,      "empty appId");

        KuluriAgreement a = new KuluriAgreement(_farm, _worker, _termsHash, _appId, forwarder);

        addr = address(a);
        byAppId[_appId] = addr;
        _agreements[_farm].push(addr);
        _agreements[_worker].push(addr);

        emit AgreementCreated(addr, _farm, _worker, _appId, _termsHash);
    }

    // ── Authenticity check ────────────────────────────────────────────────────

    /**
     * Verify that a contract address was created by this factory.
     * A genuine Kuluri agreement will have factory() == address(this).
     * Anyone can call this to check a contract is not a fake.
     */
    function isGenuine(address contractAddr) external view returns (bool) {
        if (contractAddr == address(0)) return false;
        if (contractAddr.code.length == 0) return false; // EOA or empty address
        try KuluriAgreement(contractAddr).factory() returns (address f) {
            return f == address(this);
        } catch {
            return false;
        }
    }

    // ── Registry queries ──────────────────────────────────────────────────────

    /**
     * All agreement contracts a wallet is party to, newest first.
     */
    function agreementsOf(address wallet)
        external
        view
        returns (address[] memory)
    {
        address[] storage list = _agreements[wallet];
        uint256 len = list.length;
        address[] memory out = new address[](len);
        for (uint256 i = 0; i < len; i++) {
            out[i] = list[len - 1 - i];
        }
        return out;
    }

    /**
     * Contract address for an app-level agreement ID. Returns address(0) if unknown.
     */
    function contractFor(string calldata appId)
        external
        view
        returns (address)
    {
        return byAppId[appId];
    }
}
