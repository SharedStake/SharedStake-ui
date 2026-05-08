# SharedStake V2 Modular Staking Diagrams (Router-First)

These diagrams represent the chosen architecture for this phase: router-first, single optimal path.

## 1. Router-First Component Map

```mermaid
graph TD
    U[User]
    SR[StakingRouter]
    ST[StToken]
    WST[WstToken]
    WQ[WithdrawalQueueV2]

    VM[ValidatorModule]
    DM[DVTModule]
    LM[LSTWrapModule]

    FC[FeeController]
    OA[OracleAdapter]
    QOA[QuorumOracleAdapter]
    PR[InstitutionalPolicyRegistry]

    U -->|submit ETH| SR
    SR -->|route stake| VM
    SR -->|route stake| DM
    SR -->|LST path| LM
    SR -->|mint shares| ST
    ST -->|wrap/unwrap| WST

    VM -->|reportBeacon| SR
    DM -->|reportBeacon| SR
    OA -->|validated report| VM
    OA -->|validated report| DM
    QOA -->|validated report| VM
    QOA -->|validated report| DM

    SR -->|fee calc| FC
    SR -->|policy checks| PR

    U -->|request/claim| WQ
    WQ -->|burn/settle via token state| ST
```

## 2. Deposit and Rebase (Router Path)

```mermaid
sequenceDiagram
    participant U as User
    participant SR as StakingRouter
    participant M as StakingModule
    participant ST as StToken
    participant FC as FeeController

    U->>SR: submitToModule(moduleId, referral) + ETH
    SR->>M: receiveDeposit(user, amount)
    SR->>ST: mintShares(user, shares)

    M->>SR: reportBeacon(newValidators, newBalance)
    SR->>FC: computeFees(rewardDelta)
    SR->>ST: mintShares(treasury/operator, feeShares)
    SR->>ST: setTotalPooledEther(updated)
```

## 3. Queue Lifecycle

```mermaid
sequenceDiagram
    participant U as User
    participant ST as StToken
    participant WQ as WithdrawalQueueV2
    participant G as Guardian

    U->>WQ: requestWithdrawals(amounts[], owner)
    WQ->>ST: burnShares(msg.sender, shares)
    Note over WQ: request ETH value locked at request time

    G->>WQ: finalize(lastRequestId) + ETH
    Note over WQ: finalized range now claimable

    U->>WQ: claimWithdrawal(requestId, recipient)
    WQ-->>U: transfer finalized ETH
```

## 4. Oracle Validation Flow

```mermaid
flowchart TD
    A[submitReport()] --> B{report timestamp fresh?}
    B -- no --> X[revert stale report]
    B -- yes --> C{drift/slash bounds valid?}
    C -- no --> Y[revert sanity failure]
    C -- yes --> D{quorum/submitter criteria met?}
    D -- no --> E[store vote or await quorum]
    D -- yes --> F[forward to reportable module]
    F --> G[module updates router state]
    G --> H[router fee + pooled update]
```

## 5. Future Upgradeability Boundary (Deferred)

```mermaid
flowchart LR
    A[Phase 1: Router-first stable core] --> B[Phase 2: Upgrade safety model]
    B --> C[Proxy/no-proxy decision]
    B --> D[Governance delay model]
    B --> E[Emergency rollback procedures]
    B --> F[Backward compatibility and migration]
```
