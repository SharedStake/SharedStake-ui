# Keeper Scripts

Four keepers maintain the SharedStake V2 protocol in production. Run all four concurrently on a dedicated server or via systemd/Docker.

Committed runtime artifacts:

- Compose stack: `docker-compose.keepers.yml`
- Env template: `.env.keeper.example`
- systemd units: `ops/systemd/*.service`
- systemd installer: `ops/systemd/install-keepers.sh`

## Required Roles

| Keeper | Role | Notes |
|--------|------|-------|
| depositSweep | `NODE_OPERATOR` on ValidatorModule | Submits beacon deposits |
| oracleReporter | `SUBMITTER` on OracleAdapter | Reports beacon balances |
| withdrawalFinalizer | `GUARDIAN` on WithdrawalQueueV2 | Finalizes withdrawal batches |
| balanceMonitor | `GUARDIAN` on StakingRouter | Emergency pauses on anomaly |

> GUARDIAN and NODE_OPERATOR should be **separate hot wallets** — not the governance multisig. GUARDIAN needs enough ETH to finalize withdrawal batches.

## Quick Start

```bash
# Install dependencies (from SharedDeposit root)
yarn install --frozen-lockfile

# Create runtime env file
cp .env.keeper.example .env.keeper
# fill in addresses and private keys before running

# Run each keeper in a separate terminal (or use systemd/Docker below)
npx ts-node scripts/keepers/depositSweep.ts --watch --interval=60
npx ts-node scripts/keepers/oracleReporter.ts --watch --interval=900
npx ts-node scripts/keepers/withdrawalFinalizer.ts --watch --interval=120
npx ts-node scripts/keepers/balanceMonitor.ts --watch --interval=60
```

## Environment Variables

Create `.env.keeper` from `.env.keeper.example` (never commit `.env.keeper`):

```bash
# Shared
RPC_URL=https://eth-mainnet.g.alchemy.com/v2/<KEY>

# depositSweep
MODULE_ADDRESS=0x...ValidatorModule
KEEPER_PRIVATE_KEY=0x...nodeOperatorKey
VALIDATOR_PUBKEY_HEX=0x...48bytes
WITHDRAWAL_CREDS_HEX=0x...32bytes
SIGNATURE_HEX=0x...96bytes
DEPOSIT_DATA_ROOT_HEX=0x...32bytes

# oracleReporter
BEACON_API_URL=https://...beaconnode
ORACLE_ADAPTER_ADDRESS=0x...OracleAdapter
SUBMITTER_PRIVATE_KEY=0x...submitterKey
VALIDATOR_PUBKEYS=0xpubkey1,0xpubkey2

# withdrawalFinalizer
QUEUE_ADDRESS=0x...WithdrawalQueueV2
GUARDIAN_PRIVATE_KEY=0x...guardianKey

# balanceMonitor
ROUTER_ADDRESS=0x...StakingRouter
ORACLE_ADAPTER_ADDRESS=0x...OracleAdapter   # optional but recommended
# GUARDIAN_PRIVATE_KEY same as above
ALERT_THRESHOLD_BPS=500     # 5% drop triggers pause
MAX_ORACLE_AGE_SEC=3600     # stale oracle reports also trigger pause
WEBHOOK_URL=https://...      # optional: Slack/PagerDuty webhook
```

## Dry-Run Testing

Test every keeper against a local Anvil fork before mainnet:

```bash
# Start Anvil fork
anvil --fork-url $RPC_URL --chain-id 1

# Override RPC to local
RPC_URL=http://localhost:8545 \
  npx ts-node scripts/keepers/balanceMonitor.ts --dry-run
```

## Docker Compose

```bash
# Validate compose file
docker-compose -f docker-compose.keepers.yml config -q

# Start keepers
docker-compose -f docker-compose.keepers.yml up -d
docker-compose -f docker-compose.keepers.yml logs -f
```

If your host uses the v2 CLI plugin, replace `docker-compose` with `docker compose`.

## systemd

Install and enable production units:

```bash
sudo bash ops/systemd/install-keepers.sh
```

Detailed host setup is in `ops/systemd/README.md`.

## Alert Integration

`balanceMonitor` posts JSON to `WEBHOOK_URL` before pausing:

```json
{
  "event": "sharedstake.anomaly",
  "reason": "totalPooledEther dropped 523 bps (1.2 ETH) in one poll — threshold=500 bps",
  "timestamp": "2026-05-16T12:34:56Z",
  "router": "0x...",
  "moduleIds": ["0x..."]
}
```

Wire this to a Slack incoming webhook or PagerDuty Events API v2 endpoint.

## Recommended Poll Intervals

| Keeper | Interval | Rationale |
|--------|----------|-----------|
| depositSweep | 60s | Check buffer before next slot |
| oracleReporter | 900s | Beacon state settles every ~15min |
| withdrawalFinalizer | 120s | Finalize promptly; users waiting |
| balanceMonitor | 60s | Catch anomalies or stale oracle reports quickly |
