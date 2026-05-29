# SharedStake V2 Modular Staking Docs

Reference documentation for the SharedStake V2 Modular Staking protocol.

## Architecture

1. `architecture.md` — System architecture and component overview
2. `diagrams.md` — Sequence and deployment diagrams
3. `threat-model.md` — Security threat model
4. `SOLIDITY_SECURITY_AUDIT.md` — Comprehensive internal security audit (6 passes)
5. `UPGRADE_PATH.md` — Router migration and upgrade paths

## Operations

6. `DEPLOYMENT_GUIDE.md` — Step-by-step deployment and role wiring
7. `composite-profile-prd.md` — Product requirements and feature scope
8. `referral-backend-service.md` — Referral code backend architecture and ops

## Security Test Gates

- Hardhat adversarial + fuzz:
  - `cd SharedDeposit && npx hardhat test test/v2/modular-staking/adversarial.spec.ts test/v2/modular-staking/fuzz.spec.ts`
- Foundry invariants:
  - `cd SharedDeposit && npm run test:invariants`
