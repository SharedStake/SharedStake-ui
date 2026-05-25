# SharedStake Referral Backend Service

## Purpose

The referral backend provides human-friendly referral code management while preserving onchain referral attribution as the canonical settlement layer.

- Onchain contract authority: `ReferralRegistry`
- Offchain code directory: `services/referral-service`
- Frontend responsibility: resolve code to canonical EVM referrer address before staking submission

## Architecture

```text
User/UI
  -> resolve short code via Referral Service API
  -> receive canonical referrer address (EIP-55)
  -> submit stake with referrer to StakingRouter
  -> StakingRouter records deposit in ReferralRegistry

Referral Sync Worker
  -> reads ReferralRegistry.DepositRecorded events
  -> stores event snapshots in SQLite
  -> logs divergence when onchain referrer has no active backend code mapping
```

## Responsibilities Split

### Backend API (`services/referral-service`)
- Create referral codes
- Resolve referral code to referrer address
- List/refine code mappings per referrer
- Revoke compromised or deprecated codes
- Enforce API-key auth for admin actions
- Apply rate limits and bounded onchain sync ranges

### Onchain `ReferralRegistry`
- Canonical referral attribution
- First-referrer-wins referee mapping
- Fee share accounting and distribution

### Sync Worker
- Read-only ingestion of `DepositRecorded` events
- Local event journaling for ops/audit
- Divergence warnings for missing backend mappings

## API Contract (v1)

- `GET /health`
- `POST /v1/codes` (admin)
- `GET /v1/codes/:code/resolve` (public)
- `GET /v1/referrers/:referrerAddress/codes` (admin)
- `POST /v1/codes/:code/revoke` (admin)

Admin routes require `x-api-key`.

## Code Normalization Rules

- Codes are normalized to uppercase.
- Whitespace is stripped before validation.
- Valid format: `^[A-Z0-9][A-Z0-9_-]{3,23}$`
- Referrer addresses are normalized to checksum format.

## Local Ops Commands

```bash
cd services/referral-service
cp .env.example .env
bun install
bun run prisma:generate
bun run prisma:migrate
bun run seed
bun run dev
```

Sync worker:

```bash
bun run worker:sync
```

Smoke test:

```bash
bun run smoke
```

## Security Notes

- Do not commit `.env` or production API keys.
- Run service behind TLS + reverse proxy in production.
- Scope API keys by environment and rotate regularly.
- Keep onchain sync worker read-only until contract-level code registry enforcement is finalized.
- Set `SYNC_MAX_BLOCK_RANGE` for provider-specific log range limits.
