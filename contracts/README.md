# Contracts

## Development
Use Remix. 

## Release guide
- Release vEth2Token.sol with your address for owner and minter
- Release sharedStake.sol, using the vEth2 token address
- Call set minter on vEth2 to transfer mint ownership to sharedStake
- In the case of contract upgrades, sharedStake has a setMinter to transfer the token supply to the new contract

