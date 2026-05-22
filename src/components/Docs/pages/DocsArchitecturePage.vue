<template>
  <DocsPageFrame
    title="Architecture"
    subtitle="Contract boundaries, role model, and upgrade surfaces for SharedStake V2 modular staking."
    updated-at="2026-05-22"
    :anchors="anchors"
  >
    <section id="audience">
      <h2>Who This Page Is For</h2>
      <ul>
        <li><strong>Users:</strong> understand trust boundaries and where operational risk lives.</li>
        <li><strong>Operators:</strong> align runbooks with role and module boundaries.</li>
        <li><strong>Integrators:</strong> map frontend/store behavior to router/core/accounting contracts.</li>
      </ul>
      <details>
        <summary>Action checklist</summary>
        <ul>
          <li>Confirm which contracts are deployed on your target network.</li>
          <li>Confirm role ownership and timelock status.</li>
          <li>Confirm module registry state before enabling route-specific UX.</li>
        </ul>
      </details>
    </section>

    <section id="protocol-architecture">
      <h2>Protocol Architecture</h2>
      <p>
        SharedStake V2 is router-centric: routing and policy are anchored at protocol entry,
        while modules implement route-specific staking behavior.
      </p>
      <ul>
        <li>Store logic contains router/core compatibility selection, but current UI requires full V2 deployment manifests and marks the app Not Deployed when required addresses are missing.</li>
        <li>Accounting: <code>StToken</code> share model for pooled ETH.</li>
        <li>Exit flow: <code>WithdrawalQueueV2</code> request/finalize/claim lifecycle.</li>
      </ul>
      <details>
        <summary>Boundary rule</summary>
        <p>
          Modules should encapsulate route-specific logic; cross-route accounting and policy should remain centralized.
        </p>
      </details>
    </section>

    <section id="contracts">
      <h2>Contract Surface</h2>
      <ul>
        <li><code>StakingRouter</code>: module registry, routing, caps/limits, and policy checks.</li>
        <li><code>StakingCore</code>: core staking/accounting compatibility surface.</li>
        <li><code>ValidatorModule</code> / <code>DVTModule</code>: route modules defined by deployment plan.</li>
        <li><code>FeeController</code> + referral-code registry wiring: fee/referral control plane.</li>
        <li><code>OracleAdapter</code> / quorum adapters: report validation paths.</li>
        <li><code>WithdrawalQueueV2</code>: queue-mediated exits.</li>
      </ul>
    </section>

    <section id="roles">
      <h2>Roles And Trust Model</h2>
      <ul>
        <li><code>GOV</code>: parameter and module lifecycle governance.</li>
        <li><code>GUARDIAN</code>: emergency pause and incident controls.</li>
        <li><code>NODE_OPERATOR</code>: validator operations within module scope.</li>
        <li><code>SUBMITTER</code>: oracle/report submission under adapter constraints.</li>
      </ul>
      <details>
        <summary>Operational implication</summary>
        <p>
          Incident response and governance policy operate at different speeds; keep both runbooks explicit.
        </p>
      </details>
    </section>

    <section id="governance-upgrades">
      <h2>Governance And Upgrades</h2>
      <p>
        V2 evolution is designed around governance-managed module and parameter changes,
        with ownership transfer and timelock controls as primary safety boundaries.
      </p>
      <ul>
        <li>Module lifecycle can enable route upgrades without replacing the full system surface.</li>
        <li>Governance/timelock ownership must be verified as part of release readiness.</li>
        <li><code>MigrationHelper</code> announce/activate flow is the documented major-cutover mechanism and should be rehearsed before production migration.</li>
        <li>Current website governance tab is informational only; proposal execution surface is not yet shipped in UI.</li>
      </ul>
      <details>
        <summary>Readiness checkpoints</summary>
        <ul>
          <li>Role transfer and timelock verification.</li>
          <li>Deployment manifest and contract verification completeness.</li>
          <li>Runbook and incident-drill completion.</li>
        </ul>
      </details>
    </section>
  </DocsPageFrame>
</template>

<script>
import DocsPageFrame from "../DocsPageFrame.vue";

export default {
  name: "DocsArchitecturePage",
  components: { DocsPageFrame },
  data() {
    return {
      anchors: [
        { id: "audience", label: "Audience" },
        { id: "protocol-architecture", label: "Protocol Architecture" },
        { id: "contracts", label: "Contract Surface" },
        { id: "roles", label: "Roles And Trust" },
        { id: "governance-upgrades", label: "Governance And Upgrades" },
      ],
    };
  },
};
</script>
