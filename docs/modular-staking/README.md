# SharedStake V2 Modular Staking Docs

Reference documentation for the SharedStake V2 Modular Staking protocol.

## Architecture

1. `architecture.md` — System architecture and component overview
2. `diagrams.md` — Sequence and deployment diagrams
3. `threat-model.md` — Security threat model
4. `SOLIDITY_SECURITY_AUDIT.md` — Comprehensive internal security audit (6 passes)
5. `AUDIT_WORKFLOW.md` — Required PR audit gates and iteration loop
6. `UPGRADE_PATH.md` — Router migration and upgrade paths

## Operations

7. `DEPLOYMENT_GUIDE.md` — Step-by-step deployment and role wiring
8. `composite-profile-prd.md` — Product requirements and feature scope
9. `referral-backend-service.md` — Referral code backend architecture and ops

## Security Test Gates

See `AUDIT_WORKFLOW.md` for the complete PR gate list. Minimum security-focused gates:

- Hardhat adversarial + fuzz:
  - `cd staking-contracts && npx hardhat test test/v2/modular-staking/adversarial.spec.ts test/v2/modular-staking/fuzz.spec.ts`
- Foundry invariants:
  - `cd staking-contracts && npm run test:invariants`
