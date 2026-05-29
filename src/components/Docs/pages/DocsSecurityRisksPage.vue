<template>
  <DocsPageFrame
    title="Security & Risks"
    subtitle="Risk model and safeguards for SharedStake V2, with explicit user/operator/integrator responsibilities."
    updated-at="2026-05-22"
    :anchors="anchors"
  >
    <section id="audience">
      <h2>Who This Page Is For</h2>
      <ul>
        <li><strong>Users:</strong> understand protocol and operational risk before staking.</li>
        <li><strong>Operators:</strong> enforce controls and incident runbooks.</li>
        <li><strong>Integrators:</strong> avoid unsafe assumptions about finality, queue timing, and route availability.</li>
      </ul>
      <details>
        <summary>Action checklist</summary>
        <ul>
          <li>Users: verify network/addresses and position sizing.</li>
          <li>Operators: confirm monitoring, paging, and emergency key controls.</li>
          <li>Integrators: implement failure handling for queue delays and paused routes.</li>
        </ul>
      </details>
    </section>

    <section id="risk-model">
      <h2>Risk Model</h2>
      <p>
        SharedStake V2 runs staking, routing, and queue logic onchain, but still depends
        on role holders, oracle infrastructure, and operator execution quality.
      </p>
      <ul>
        <li>Contract bugs and configuration errors remain possible.</li>
        <li>Oracle quality and report timeliness are critical inputs.</li>
        <li>Operational key compromise can create emergency conditions.</li>
      </ul>
    </section>

    <section id="safeguards">
      <h2>Built-In Safeguards</h2>
      <ul>
        <li>Role-based access control across control-plane actions.</li>
        <li>Granular pause paths for router/module incident response.</li>
        <li>Oracle sanity checks and bounded report acceptance logic.</li>
        <li>Module caps and inflow windows to limit rapid exposure growth.</li>
      </ul>
      <details>
        <summary>Withdrawal risk handling</summary>
        <p>
          Withdrawals are queue-mediated; finalization timing can change with mode and governance/guardian actions.
        </p>
      </details>
    </section>

    <section id="operational-security">
      <h2>Operational Security</h2>
      <ul>
        <li>Separate operator and guardian key workflows.</li>
        <li>Managed keepers/watchers with alerting and credential rotation.</li>
        <li>Runbook-driven response for oracle or pooled-balance anomalies.</li>
        <li>Role audits before release milestones.</li>
      </ul>
      <details>
        <summary>Pre-production controls</summary>
        <ul>
          <li>Independent external audit across active V2 surface.</li>
          <li>Reproducible deployment manifests with verified bytecode references.</li>
          <li>Forked incident simulations for priority scenarios.</li>
        </ul>
      </details>
    </section>

    <section id="referral-control-plane">
      <h2>Referral Control-Plane Risks</h2>
      <ul>
        <li><code>CODE_ADMIN</code> can map/revoke referral codes and therefore controls referral-attribution economics.</li>
        <li><code>GOV</code> can set/clear referral code resolver wiring on router/core.</li>
        <li>Resolver misconfiguration can degrade attribution to zero-referral behavior.</li>
      </ul>
      <details>
        <summary>Operational controls</summary>
        <ul>
          <li>Place <code>CODE_ADMIN</code> and <code>GOV</code> behind multisig/timelock policies.</li>
          <li>Alert on <code>ReferralCodeUpdated</code>, <code>ReferralCodeRevoked</code>, and <code>ReferralCodeRegistrySet</code> events.</li>
          <li>Run deployment post-checks confirming registry wiring on both router and core.</li>
        </ul>
      </details>
    </section>

    <section id="user-risk-disclosure">
      <h2>User Risk Disclosure</h2>
      <p>
        Staking and DeFi integrations are high-risk. Do not stake capital you cannot afford to lose.
      </p>
      <ul>
        <li>Validate network and contract addresses for each transaction.</li>
        <li>Use conservative position sizing during early rollout phases.</li>
        <li>Monitor official incident and parameter-change announcements.</li>
      </ul>
    </section>
  </DocsPageFrame>
</template>

<script>
import DocsPageFrame from "../DocsPageFrame.vue";

export default {
  name: "DocsSecurityRisksPage",
  components: { DocsPageFrame },
  data() {
    return {
      anchors: [
        { id: "audience", label: "Audience" },
        { id: "risk-model", label: "Risk Model" },
        { id: "safeguards", label: "Built-In Safeguards" },
        { id: "operational-security", label: "Operational Security" },
        { id: "referral-control-plane", label: "Referral Control Plane" },
        { id: "user-risk-disclosure", label: "User Disclosure" },
      ],
    };
  },
};
</script>
