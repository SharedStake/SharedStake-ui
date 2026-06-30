Fuzz profile: via_ir required with optimizer — no-IR and IR/no-optimizer profiles hit stack-too-deep in legacy project contracts during Fizz setup. Treat Medusa coverage as IR-deflated by roughly 15-20% and prefer branch/path review over raw percentage alone.

## Targets

| Contract | Role | Target | Notes |
|---|---:|---:|---|
| StakingRouter | Core staking router | 65% | IR-deflated target; selected handlers exercise deposits, module reports, allowlist latch, queue interactions. |
| ValidatorModule | Core validator module | 65% | Includes beacon deposit, positive reports, loss reports, and validator-count decreases. |
| WithdrawalQueueV2 | Core withdrawal queue | 65% | Includes single and batch requests, exact and overfunded finalize, refunds, single and batch claims. |
| WstToken | Wrapper | 50% | Wrapper round-trip covered through deterministic Foundry and fuzz handlers. |

## Skips

- Direct Echidna/Medusa runs must export `FOUNDRY_PROFILE=fuzz`; crytic-compile in this installed version supports `--foundry-compile-all` but not a config-level Foundry profile selector.
- Embedded Slither pre-passes are disabled in `echidna.yaml` and `medusa.json`; run Slither as an explicit audit gate so fuzz campaigns execute promptly and static findings are reviewed separately.
