# DVTModule Security Audit — Fourth Pass

**Date:** 2026-05-14  
**Scope:** DVTModule.sol (newly written production code, not present during passes 1–3)  
**Tool:** `/security-review` skill (Claude Sonnet 4.6 sub-agent)  
**Verdict:** 2 HIGH fixed, 1 MEDIUM fixed, 1 MEDIUM documented as accepted design

---

## Findings

### DVTM-01 — HIGH — Cluster bypass via inherited `depositToBeaconChain` [FIXED]

**Confidence:** 9/10

**Description:**  
`DVTModule` inherits `ValidatorModule.depositToBeaconChain` as a callable `virtual` function. Any address holding the `NODE_OPERATOR` role could call `DVTModule.depositToBeaconChain(pubkey, creds, sig, root)` directly, bypassing cluster gating entirely. This drains 32 ETH from the buffer without attributing the deposit to any cluster, defeating the entire DVT cluster registry.

**Fix:**  
Override `depositToBeaconChain` in `DVTModule` to unconditionally revert with `UseClusteredDeposit()`. Role and pause modifiers are retained so unauthorized callers receive the access-control error rather than the cluster error.

```solidity
error UseClusteredDeposit();

function depositToBeaconChain(
    bytes calldata,
    bytes calldata,
    bytes calldata,
    bytes32
) external override onlyRole(NODE_OPERATOR) nonReentrant whenNotPaused(PAUSE_RECEIVE) {
    revert UseClusteredDeposit();
}
```

**Test added:** `"depositToBeaconChain reverts with UseClusteredDeposit (DVTM-01)"` in `dvtModule.spec.ts`.

---

### DVTM-02 — HIGH — No pubkey deduplication in `_doBeaconDeposit` [FIXED]

**Confidence:** 8/10

**Description:**  
`ValidatorModule._doBeaconDeposit` had no check for duplicate pubkeys. A `NODE_OPERATOR` could submit the same validator pubkey twice (same or different clusters), each call consuming 32 ETH from `_bufferedEther` and sending it to the beacon deposit contract. The beacon deposit contract accepts duplicate pubkeys. This is a loss-of-funds vector: user ETH is burned paying for a duplicate deposit that produces no additional validator.

**Fix:**  
Added `mapping(bytes32 => bool) internal _depositedPubkeys` to `ValidatorModule` state. At the start of `_doBeaconDeposit`, the pubkey hash is checked and recorded atomically.

```solidity
bytes32 pkHash = keccak256(pubkey);
if (_depositedPubkeys[pkHash]) revert DuplicatePubkey(pkHash);
_depositedPubkeys[pkHash] = true;
```

This is consistent with how the Ethereum Foundation deposit contract handles the problem (it simply ignores duplicate deposits server-side; we prevent them at the contract level instead).

---

### DVTM-03 — MEDIUM — No bounds check on `clusterIdAt(uint256)` [FIXED]

**Confidence:** 7/10

**Description:**  
`clusterIdAt(index)` would panic with an array out-of-bounds revert on any out-of-range index. While not exploitable for fund loss, it produces an opaque panic instead of a descriptive error, making off-chain tooling harder to debug.

**Fix:**  
```solidity
error IndexOutOfBounds(uint256 index, uint256 length);

function clusterIdAt(uint256 index) external view returns (bytes32) {
    if (index >= _clusterIds.length) revert IndexOutOfBounds(index, _clusterIds.length);
    return _clusterIds[index];
}
```

---

### DVTM-04 — MEDIUM — `operators[]` membership not enforced on-chain [ACCEPTED BY DESIGN]

**Confidence:** 7/10

**Description:**  
`clusters[id].operators` stores the DVT ensemble participants but is never checked against `msg.sender` in `depositToBeaconChainInCluster`. Any address holding `NODE_OPERATOR` role can deposit under any active cluster regardless of membership.

**Decision:** Accepted as design.

In a DVT context, `operators[]` represents the threshold-signature participants in the validator key ceremony (e.g., Obol nodes, SSV key shares). These are not the same entity as the transaction signer. The coordinator wallet that calls `depositToBeaconChainInCluster` is typically a separate hot wallet or keeper that holds `NODE_OPERATOR` role. Enforcing `msg.sender ∈ cluster.operators` would conflate these two distinct roles and break the intended architecture.

The `NODE_OPERATOR` access-control role already restricts who can call the deposit path. `operators[]` is informational — used for off-chain attribution, dispute resolution, and future governance tooling. This is documented in the NatSpec.

---

## Post-Fix Test Results

| Suite | Passing | Failing | Pending |
|---|---|---|---|
| Hardhat | 307 | 0 | 6 |
| Foundry invariants | 7 | 0 | 0 |

---

## Summary

All HIGH findings fixed. One MEDIUM fixed, one MEDIUM accepted by design. DVTModule is now secure against the two critical bypass vectors identified in this pass. The fourth pass closes the audit gap introduced by DVTModule not existing during passes 1–3.
