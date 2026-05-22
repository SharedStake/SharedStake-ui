<template>
  <DocsPageFrame
    title="User Guide"
    subtitle="How to use the current SharedStake V2 UI with implementation-accurate steps."
    updated-at="2026-05-22"
    :anchors="anchors"
  >
    <section id="audience">
      <h2>Who This Page Is For</h2>
      <ul>
        <li><strong>Users:</strong> run stake, wrap, and withdrawal flows in <code>/v2</code>.</li>
        <li><strong>Operators:</strong> verify what end users can and cannot do from the UI.</li>
        <li><strong>Integrators:</strong> map UI behavior to store calls and contract methods.</li>
      </ul>
      <details>
        <summary>Action checklist</summary>
        <ul>
          <li>Use this page for user-facing transaction flow.</li>
          <li>Use <code>Staking Routes</code> for module-level route control and advanced methods.</li>
          <li>Use <code>Referral</code> for query-parameter behavior and fallback rules.</li>
        </ul>
      </details>
    </section>

    <section id="prerequisites">
      <h2>Prerequisites</h2>
      <ul>
        <li>Connect a wallet in the SharedStake app.</li>
        <li>Use a network where V2 contracts are deployed and configured.</li>
        <li>Keep enough ETH for gas.</li>
      </ul>
      <details>
        <summary>Where to start in the app</summary>
        <p>
          Open <code>/v2</code>. Tabs include Stake, Wrap, Withdraw, Lock, and Gov.
        </p>
      </details>
    </section>

    <section id="stake-flow">
      <h2>Stake Flow</h2>
      <ul>
        <li>Enter ETH amount in the Stake panel.</li>
        <li>Review estimated stETH output.</li>
        <li>Submit and confirm in wallet.</li>
        <li>Address referral path uses <code>submit(referral)</code>; code referral path uses <code>submitWithReferralCode(codeHash)</code> where available.</li>
        <li>The store prefers router-first execution and falls back to core compatibility where needed.</li>
      </ul>
      <details>
        <summary>Referral in the stake flow</summary>
        <p>
          If <code>?r</code> or manual code is active, stake uses code-hash submit path.
          If address referral is active, stake uses address submit path.
          If neither is valid, zero-address referral is used.
        </p>
      </details>
    </section>

    <section id="wrap-flow">
      <h2>Wrap And Unwrap</h2>
      <ul>
        <li>Wrap converts rebasing stETH to non-rebasing wstETH.</li>
        <li>Unwrap converts wstETH back to stETH.</li>
        <li>These are token conversions, not direct ETH withdrawals.</li>
      </ul>
      <details>
        <summary>When to use wrap</summary>
        <p>
          Use wrapping for integrations that expect fixed-balance tokens instead of rebasing balances.
        </p>
      </details>
    </section>

    <section id="withdraw-flow">
      <h2>Withdraw Queue</h2>
      <ul>
        <li>Withdrawals are request/claim, not instant ETH redemptions.</li>
        <li>Create one or more queue requests.</li>
        <li>Claim after finalization.</li>
      </ul>
      <details>
        <summary>Queue mode note</summary>
        <p>
          Queue behavior depends on protocol mode and configured limits. Finalization timing is not guaranteed to be immediate.
        </p>
      </details>
    </section>

    <section id="lock-gov">
      <h2>Lock And Governance Tabs</h2>
      <ul>
        <li>Locking and governance views are available in the UI.</li>
        <li>Effective capabilities depend on deployment wiring and role ownership.</li>
        <li>Always verify target addresses and calldata before signing.</li>
      </ul>
      <details>
        <summary>Integrator/operator reminder</summary>
        <p>
          Treat governance and lock actions as environment-specific. Confirm permissions on the target network before enabling public runbooks.
        </p>
      </details>
    </section>
  </DocsPageFrame>
</template>

<script>
import DocsPageFrame from "../DocsPageFrame.vue";

export default {
  name: "DocsUserGuidePage",
  components: { DocsPageFrame },
  data() {
    return {
      anchors: [
        { id: "audience", label: "Audience" },
        { id: "prerequisites", label: "Prerequisites" },
        { id: "stake-flow", label: "Stake Flow" },
        { id: "wrap-flow", label: "Wrap And Unwrap" },
        { id: "withdraw-flow", label: "Withdraw Queue" },
        { id: "lock-gov", label: "Lock And Governance" },
      ],
    };
  },
};
</script>
