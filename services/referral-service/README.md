# SharedStake Referral Service

Production-oriented backend skeleton for referral code management.

## Scope

- Stores short referral codes (`code -> referrerAddress`) in SQLite via Prisma.
- Exposes API endpoints for create/resolve/list/revoke.
- Enforces API key auth on admin endpoints.
- Applies global + write-specific rate limits.
- Includes a read-only onchain sync worker that ingests `ReferralRegistry.DepositRecorded` events and logs divergence against backend code mappings.

## Local Quick Start

```bash
cd services/referral-service
cp .env.example .env
bun install
bun run prisma:generate
bun run prisma:migrate
bun run seed
bun run dev
```

Server default: `http://127.0.0.1:8787`

## API

### Health
- `GET /health`

### Create code (admin)
- `POST /v1/codes`
- Header: `x-api-key: <key>`
- Body:

```json
{
  "code": "OPTIONALCODE",
  "referrerAddress": "0x...",
  "createdBy": "ops",
  "metadata": { "campaign": "solo-validator-launch" }
}
```

### Resolve code (public)
- `GET /v1/codes/:code/resolve`

### List codes by referrer (admin)
- `GET /v1/referrers/:referrerAddress/codes?status=all|active|revoked`
- Header: `x-api-key: <key>`

### Revoke code (admin)
- `POST /v1/codes/:code/revoke`
- Header: `x-api-key: <key>`
- Body:

```json
{
  "reason": "fraud_report"
}
```

## Normalization Rules

- `code`: uppercase, whitespace removed, regex `^[A-Z0-9][A-Z0-9_-]{3,23}$`
- `referrerAddress`: normalized to EIP-55 checksum format

## Onchain Sync Worker (read-only)

```bash
bun run worker:sync
```

Required env vars:
- `RPC_URL`
- `ONCHAIN_REFERRAL_REGISTRY_ADDRESS`

Behavior:
- Polls `DepositRecorded(referrer, referee, ethAmount, shares)` from onchain `ReferralRegistry`
- Stores observed events in SQLite
- Logs divergence if an onchain referrer has no active backend code mapping
- Tracks cursor in `SyncCursor`

## Smoke Test

With server running:

```bash
bun run smoke
```

## Notes

- No secrets are committed; use `.env` locally and platform secret managers in production.
- This service is intentionally backend-only and does not change frontend or contract behavior directly.
