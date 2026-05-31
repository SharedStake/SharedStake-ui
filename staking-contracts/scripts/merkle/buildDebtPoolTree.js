const { StandardMerkleTree } = require("@openzeppelin/merkle-tree");
const fs = require("fs");

/**
 * Build a merkle tree for DebtPool claims using OpenZeppelin StandardMerkleTree
 * 
 * Usage: node scripts/merkle/buildDebtPoolTree.js <claims.json> [output.json]
 * 
 * Input format (claims.json):
 * [
 *   {
 *     "distributionId": 1,
 *     "leafIndex": 0,
 *     "recipient": "0x...",
 *     "amount": "1000000000000000000"
 *   },
 *   ...
 * ]
 * 
 * Output format:
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
    
    if (args.length < 1) {
        console.error("Usage: node buildDebtPoolTree.js <claims.json> [output.json]");
        process.exit(1);
    }
    
    const inputFile = args[0];
    const outputFile = args[1] || null;
    
    // Read claims from input file
    let claims;
    try {
        const claimsData = fs.readFileSync(inputFile, "utf8");
        claims = JSON.parse(claimsData);
    } catch (error) {
        console.error(`Error reading claims file: ${error.message}`);
        process.exit(1);
    }
    
    if (!Array.isArray(claims)) {
        console.error("Claims must be an array");
        process.exit(1);
    }
    
    // Build merkle tree with OZ standard encoding
    // Leaf encoding: (uint256 distributionId, uint256 leafIndex, address recipient, uint256 amount)
    const values = claims.map(claim => [
        claim.distributionId,
        claim.leafIndex,
        claim.recipient,
        claim.amount
    ]);
    
    const tree = StandardMerkleTree.of(values, ["uint256", "uint256", "address", "uint256"]);
    
    // Generate proofs for each recipient
    const proofs = {};
    for (const [i, value] of tree.entries()) {
        const claim = claims[i];
        const proof = tree.getProof(i);
        
        proofs[claim.recipient.toLowerCase()] = {
            leafIndex: claim.leafIndex,
            proof: proof,
            amount: claim.amount,
            distributionId: claim.distributionId
        };
    }
    
    const output = {
        root: tree.root,
        proofs: proofs
    };
    
    // Print root to stdout
    console.log(`Merkle Root: ${tree.root}`);
    
    // Write to output file if specified
    if (outputFile) {
        try {
            fs.writeFileSync(outputFile, JSON.stringify(output, null, 2));
            console.log(`Proofs written to ${outputFile}`);
        } catch (error) {
            console.error(`Error writing output file: ${error.message}`);
            process.exit(1);
        }
    } else {
        // Output to stdout if no file specified
        console.log(JSON.stringify(output, null, 2));
    }
}

main();