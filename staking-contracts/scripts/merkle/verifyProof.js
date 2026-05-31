const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");
const fs = require("fs");

/**
 * Verify a merkle proof for a specific recipient
 * 
 * Usage: node scripts/merkle/verifyProof.js <treeFile.json> <recipientAddress>
 * 
 * Input format (treeFile.json): Output from buildDebtPoolTree.js
 * {
 *   "root": "0x...",
 *   "proofs": {
 *     "0x<recipient>": {
 *       "leafIndex": 0,
 *       "proof": ["0x...", ...],
 *       "amount": "1000000000000000000",
 *       "distributionId": 1
 *     }
 *   }
 * }
 */

function main() {
    const args = process.argv.slice(2);
    
    if (args.length < 2) {
        console.error("Usage: node verifyProof.js <treeFile.json> <recipientAddress>");
        process.exit(1);
    }
    
    const treeFile = args[0];
    const recipientAddress = args[1].toLowerCase();
    
    // Load tree data
    let treeData;
    try {
        const treeDataContent = fs.readFileSync(treeFile, "utf8");
        treeData = JSON.parse(treeDataContent);
    } catch (error) {
        console.error(`Error reading tree file: ${error.message}`);
        process.exit(1);
    }
    
    // Check if recipient has a proof
    if (!treeData.proofs[recipientAddress]) {
        console.log("INVALID: No proof found for recipient");
        process.exit(1);
    }
    
    const proofData = treeData.proofs[recipientAddress];
    
    // Reconstruct the leaf value for verification
    const leafValue = [
        proofData.distributionId,
        proofData.leafIndex,
        recipientAddress,
        proofData.amount
    ];
    
    // Verify the proof against the root
    const valid = StandardMerkleTree.verify(
        proofData.proof,
        ["uint256", "uint256", "address", "uint256"],
        leafValue,
        treeData.root
    );
    
    if (valid) {
        console.log(`VALID: ${recipientAddress} can claim ${proofData.amount} amount`);
        console.log(`Distribution ID: ${proofData.distributionId}`);
        console.log(`Leaf Index: ${proofData.leafIndex}`);
    } else {
        console.log("INVALID: Proof verification failed");
        process.exit(1);
    }
}

main();