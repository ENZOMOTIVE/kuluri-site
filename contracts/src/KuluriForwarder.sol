// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * KuluriForwarder  —  EIP-2771 trusted meta-transaction forwarder
 *
 * How it works
 * ────────────
 * 1. User's Privy wallet signs a ForwardRequest off-chain (free, no gas).
 * 2. Kuluri's backend submits execute() on-chain and pays the Gnosis Chain gas.
 * 3. This contract verifies the signature, then forwards the call to the target
 *    contract with the real user's address appended to the calldata (EIP-2771).
 * 4. KuluriAgreement reads the real sender from those last 20 bytes via _msgSender().
 *
 * Result: the user taps a button, their Privy wallet signs invisibly, the agreement
 * is recorded on-chain under their address — they never hold xDAI or see gas fees.
 *
 * Nonces prevent replay attacks: each address has a counter that increments per call.
 */
contract KuluriForwarder {

    // ── EIP-712 ───────────────────────────────────────────────────────────────

    struct ForwardRequest {
        address from;       // real sender (Privy wallet)
        address to;         // target contract (KuluriAgreement or Factory)
        uint256 nonce;      // must equal nonces[from] at submission time
        bytes   data;       // encoded function call
    }

    bytes32 private constant _TYPE_HASH = keccak256(
        "ForwardRequest(address from,address to,uint256 nonce,bytes data)"
    );

    bytes32 private immutable _DOMAIN_SEPARATOR;

    constructor() {
        _DOMAIN_SEPARATOR = keccak256(abi.encode(
            keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)"),
            keccak256("KuluriForwarder"),
            keccak256("1"),
            block.chainid,
            address(this)
        ));
    }

    // ── Nonces ────────────────────────────────────────────────────────────────

    mapping(address => uint256) public nonces;

    // ── Core ──────────────────────────────────────────────────────────────────

    /**
     * Verify that a signature is valid for a ForwardRequest.
     * Call this off-chain before submitting to avoid wasting gas on bad signatures.
     */
    function verify(ForwardRequest calldata req, bytes calldata signature)
        public
        view
        returns (bool)
    {
        address recovered = _recover(_hash(req), signature);
        return recovered == req.from && nonces[req.from] == req.nonce;
    }

    /**
     * Execute a signed ForwardRequest. Callable by anyone (the Kuluri backend relayer).
     * Gas is paid by msg.sender (the relayer), not the user.
     *
     * The user's address is appended to the calldata so the target contract can read
     * the true sender via _msgSender() (EIP-2771 convention).
     */
    function execute(ForwardRequest calldata req, bytes calldata signature)
        external
        payable
        returns (bool success, bytes memory returndata)
    {
        require(verify(req, signature), "invalid signature or nonce");
        nonces[req.from]++;

        // Append the real sender to calldata (EIP-2771: target reads last 20 bytes)
        (success, returndata) = req.to.call{ value: msg.value }(
            abi.encodePacked(req.data, req.from)
        );

        if (!success) {
            // Bubble up the revert reason so the backend knows what went wrong
            if (returndata.length > 0) {
                assembly { revert(add(32, returndata), mload(returndata)) }
            }
            revert("forwarded call reverted");
        }
    }

    // ── Internal ──────────────────────────────────────────────────────────────

    function _hash(ForwardRequest calldata req) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(
            "\x19\x01",
            _DOMAIN_SEPARATOR,
            keccak256(abi.encode(_TYPE_HASH, req.from, req.to, req.nonce, keccak256(req.data)))
        ));
    }

    function _recover(bytes32 digest, bytes calldata sig) internal pure returns (address) {
        require(sig.length == 65, "bad signature length");
        bytes32 r; bytes32 s; uint8 v;
        assembly {
            r := calldataload(sig.offset)
            s := calldataload(add(sig.offset, 32))
            v := byte(0, calldataload(add(sig.offset, 64)))
        }
        return ecrecover(digest, v, r, s);
    }

    // ── View helpers ──────────────────────────────────────────────────────────

    function domainSeparator() external view returns (bytes32) {
        return _DOMAIN_SEPARATOR;
    }
}
