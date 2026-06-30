# DebtPool Merkle Tree Tools

This directory contains utilities for generating and verifying merkle trees for DebtPool distributions using OpenZeppelin's standard merkle tree implementation.

## Leaf Encoding

The merkle tree uses OpenZeppelin's standard double-hash leaf encoding to prevent second-preimage attacks:

```
leaf = keccak256(bytes.concat(keccak256(abi.encode(distributionId, leafIndex, recipient, amount))))
```

**Leaf structure:**

- `uint256 distributionId` - The distribution identifier
- `uint256 leafIndex` - Unique index for each claim in the distribution
- `address recipient` - The address eligible to claim
- `uint256 amount` - The amount (in wei) that can be claimed

### Security Considerations

**Why double-hashing?**
OpenZeppelin's StandardMerkleTree uses double-hashing (hashing the encoded data, then hashing that hash again) to prevent second-preimage attacks. This is a security best practice for merkle trees used in production systems.

**Why include leafIndex in the leaf?**
Including the leafIndex ensures that each claim is unique within a distribution, even if the same recipient appears multiple times with different amounts. This prevents certain attack vectors and makes the tree more robust.

## Preparing Claims

Create a JSON file with your distribution claims:

```json
[
  {
    "distributionId": 1,
    "leafIndex": 0,
    "recipient": "0x1234567890123456789012345678901234567890",
    "amount": "1000000000000000000"
  },
  {
    "distributionId": 1,
    "leafIndex": 1,
    "recipient": "0x0987654321098765432109876543210987654321",
    "amount": "2000000000000000000"
  }
]
```

**Important notes:**

- `leafIndex` must be unique per distribution (0, 1, 2, ...)
- `amount` should be a string to preserve precision for large numbers
- `distributionId` should match the on-chain distribution ID

## Building the Merkle Tree

Generate the merkle tree and proofs:

```bash
node scripts/merkle/buildDebtPoolTree.js claims.json proofs.json
```

This will:

1. Read claims from `claims.json`
2. Build a merkle tree using OpenZeppelin's StandardMerkleTree
3. Generate proofs for each recipient
4. Output the merkle root and proofs to `proofs.json`
5. Print the merkle root to stdout

**Output format:**

```json
{
  "root": "0x...",
  "proofs": {
    "0x1234567890123456789012345678901234567890": {
      "leafIndex": 0,
      "proof": ["0x...", "0x..."],
      "amount": "1000000000000000000",
      "distributionId": 1
    }
  }
}
```

## Verifying Proofs

Verify a proof for a specific recipient before on-chain submission:

```bash
node scripts/merkle/verifyProof.js proofs.json 0x1234567890123456789012345678901234567890
```

This will output:

- `VALID: 0x... can claim X amount` if the proof is valid
- `INVALID: No proof found for recipient` or `INVALID: Proof verification failed` if invalid

## Submitting the Root On-Chain

Once you've generated the merkle tree, submit the root to the DebtPool contract:

```javascript
// Using createDistribution (for new distributions)
await debtPool.createDistribution(
  distributionId,
  merkleRoot, // The root from buildDebtPoolTree.js output
  totalAmount,
  deadline,
);

// Or using updateMerkleRoot (for existing distributions)
await debtPool.updateMerkleRoot(
  distributionId,
  merkleRoot, // The root from buildDebtPoolTree.js output
);
```

After setting the root, finalize the distribution:

```javascript
await debtPool.finalizeDistribution(distributionId);
```

## Claiming On-Chain

Users can claim their allocation using the proof from the generated file:

```javascript
const proofData = proofs["0xRecipientAddress"];

await debtPool.claim(
  proofData.distributionId,
  proofData.leafIndex,
  proofData.recipient,
  proofData.amount,
  proofData.proof,
);
```

## Complete Workflow Example

1. **Prepare claims file:** `claims.json`
2. **Build merkle tree:** `node scripts/merkle/buildDebtPoolTree.js claims.json proofs.json`
3. **Verify specific proof:** `node scripts/merkle/verifyProof.js proofs.json 0xRecipientAddress`
4. **Submit root on-chain:** Call `createDistribution` or `updateMerkleRoot` with the root
5. **Finalize distribution:** Call `finalizeDistribution`
6. **Users claim:** Call `claim` with the proof data for each recipient

## Testing

Integration tests are available in `test/v2/modular-staking/debtPoolMerkle.spec.ts` to verify the end-to-end flow works correctly.

Run the tests:

```bash
npx hardhat test test/v2/modular-staking/debtPoolMerkle.spec.ts
```

## Troubleshooting

**Common issues:**

- Ensure `leafIndex` values are unique and sequential starting from 0
- Verify `amount` values are strings to preserve precision
- Check that recipient addresses are properly checksummed
- Make sure the distribution ID matches between off-chain and on-chain

**Error messages:**

- `AlreadyClaimed`: The recipient has already claimed this distribution
- `InvalidMerkleProof`: The proof doesn't match the submitted root
- `InvalidAmount`: Amount is zero or invalid
- Distribution not finalized: Claims can only be made after finalization
