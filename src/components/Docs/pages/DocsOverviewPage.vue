<template>
  <DocsPageFrame
    title="Overview / Synopsis"
    subtitle="SharedStake V2 docs for users, operators, and integrators. This center tracks the repository implementation and separates live behavior from optional rollout patterns."
    updated-at="2026-05-22"
    :anchors="anchors"
  >
    <section id="synopsis">
      <h2>Synopsis</h2>
      <p>
        This docs center is the product and implementation guide for SharedStake V2 in
        this repository.
      </p>
      <ul>
        <li>User stake path in UI: <code>/v2</code> uses Router/Core submit calls and mints stETH shares.</li>
        <li>Exit path: <code>WithdrawalQueueV2</code> request/finalize/claim flow.</li>
        <li>Control plane: router/module policies, role-gated operations, and governance handover.</li>
        <li>Referral: address and code flows are live, with optional backend code resolution.</li>
        <li>Governance tab status: currently read-only parameter preview in UI.</li>
      </ul>
      <details>
        <summary>Scope of this documentation</summary>
        <p>
          Pages cover user operations, referral behavior, staking routes, architecture,
          security assumptions, and operational runbooks.
        </p>
      </details>
    </section>

    <section id="persona-map">
      <h2>Persona Map And First Actions</h2>
      <ul>
        <li><strong>Users:</strong> read <code>User Guide</code>, then <code>Referral</code>, then <code>FAQ</code>.</li>
        <li><strong>Operators:</strong> read <code>Ops &amp; Deploy</code>, then <code>Security &amp; Risks</code>.</li>
        <li><strong>Integrators:</strong> read <code>Staking Routes</code>, then <code>Architecture</code>.</li>
      </ul>
      <details>
        <summary>Quick validation checklist</summary>
        <ul>
          <li>Confirm target network deployment state before running transactions.</li>
          <li>Confirm which paths are live in UI versus contract-supported but not wired in UI.</li>
          <li>Confirm router/module/referral settings for the target environment.</li>
        </ul>
      </details>
    </section>

    <section id="toc">
      <h2>Table Of Contents</h2>
      <ul>
        <li>Overview: protocol context and navigation.</li>
        <li>User Guide: actionable steps for stake, wrap, withdraw, and governance tabs.</li>
        <li>Referral: live <code>?ref</code> and <code>?r</code> flows, optional resolver, and fallbacks.</li>
        <li>Staking Routes: router default route, solo validator route, DVT route, optional module paths.</li>
        <li>Architecture: contract boundaries and trust model.</li>
        <li>Security &amp; Risks: threat model and controls.</li>
        <li>Migration &amp; Cutover: announce/activate workflow for major router transitions.</li>
        <li>Ops &amp; Deploy: deployment order, keepers, monitoring, and runbooks.</li>
        <li>FAQ: common user, operator, and integrator questions.</li>
      </ul>
    </section>

    <section id="status">
      <h2>Status Notes</h2>
      <p>
        This docs set is intentionally implementation-bound. Validate deployment manifests,
        addresses, and role ownership for each environment.
      </p>
      <details>
        <summary>Repository references</summary>
        <ul>
          <li><code>SharedDeposit/contracts/v2/modular-staking/</code> for contract source.</li>
          <li><code>SharedDeposit/deploy/v2-modular-staking/</code> for deployment flow.</li>
          <li><code>SharedDeposit/scripts/keepers/</code> for keeper/watcher services.</li>
          <li><code>docs/modular-staking/</code> for deeper technical notes.</li>
        </ul>
      </details>
    </section>
  </DocsPageFrame>
</template>

<script>
import DocsPageFrame from "../DocsPageFrame.vue";

export default {
  name: "DocsOverviewPage",
  components: { DocsPageFrame },
  data() {
    return {
      anchors: [
        { id: "synopsis", label: "Synopsis" },
        { id: "persona-map", label: "Persona Map" },
        { id: "toc", label: "Table Of Contents" },
        { id: "status", label: "Status Notes" },
      ],
    };
  },
};
</script>
