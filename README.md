# SharedStake V2

## Quick Start
```bash
# Deploy contracts
./scripts/deploy.sh contracts

# Deploy services
./scripts/deploy.sh services

# Backup database
./scripts/deploy.sh backup
```

## Environment
Copy `.env.production.example` to `.env.production` and fill in required values.

## Documentation
- [Infrastructure Documentation](INFRASTRUCTURE.md) - Architecture, security, backup strategy
- [Operational Runbook](RUNBOOK.md) - Common procedures, troubleshooting, emergency response

## Production Status

### V2 Modular Staking (current)
✅ Contracts: StakingRouter + StakingCore + StToken + WstToken + WithdrawalQueueV2 + FeeController + DebtPool + VoteEscrowV2 + governance
✅ 6-pass internal security audit complete — 398 contract tests passing, 7 Foundry invariants passing
✅ Full frontend: Stake / Wrap / Withdraw / Lock / Governance panels at `/v2`
✅ Referral service backend skeleton (services/referral-service/)
✅ Security dependencies updated
✅ CI/CD configured
✅ Deployment scripts ready
✅ Documentation complete
⏳ Deploy to testnet
⏳ External audit