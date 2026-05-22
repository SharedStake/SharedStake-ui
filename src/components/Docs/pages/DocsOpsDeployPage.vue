<template>
  <DocsPageFrame
    title="Ops & Deploy"
    subtitle="Operational reference for deploying and maintaining SharedStake V2 with explicit operator and integrator checklists."
    updated-at="2026-05-22"
    :anchors="anchors"
  >
    <section id="audience">
      <h2>Who This Page Is For</h2>
      <ul>
        <li><strong>Operators:</strong> deploy, configure, and run keepers/watchers.</li>
        <li><strong>Integrators:</strong> verify environment readiness before exposing user traffic.</li>
        <li><strong>Users:</strong> understand what production readiness means for safety and reliability.</li>
      </ul>
      <details>
        <summary>Action checklist</summary>
        <ul>
          <li>Run deployment in documented order and publish manifests.</li>
          <li>Validate roles and module state after each phase.</li>
          <li>Rehearse incident and rollback runbooks before launch.</li>
        </ul>
      </details>
    </section>

    <section id="deployment-order">
      <h2>Deployment Order</h2>
      <p>
        Use <code>SharedDeposit/deploy/v2-modular-staking/</code> as the canonical sequence.
      </p>
      <ul>
        <li>Deploy core token/router/queue dependencies.</li>
        <li>Deploy and register modules (validator, DVT, and optional module routes).</li>
        <li>Deploy oracle adapters and grant submitter roles.</li>
        <li>Deploy governance/timelock and transfer ownership.</li>
        <li>Wire referral-code registry and fee recipients.</li>
      </ul>
      <details>
        <summary>Preflight checks</summary>
        <ul>
          <li>Environment variables for governance, operators, caps, and addresses.</li>
          <li>Role assertions after each deployment phase.</li>
          <li>Contract verification and manifest publication before user traffic.</li>
        </ul>
      </details>
    </section>

    <section id="module-admission-hardening">
      <h2>Module Admission Hardening (Required)</h2>
      <ul>
        <li>Before each module registration, allowlist runtime code hash by module type with <code>setModuleCodeHashAllowed(moduleType, codeHash, true)</code>.</li>
        <li>Enable strict allowlist enforcement with <code>setEnforceModuleCodeHashAllowlist(true)</code> once expected hashes are seeded.</li>
        <li>Release gate: refuse production rollout if router allows module registration without allowlisted code hashes.</li>
      </ul>
      <details>
        <summary>Verification checklist</summary>
        <ul>
          <li>Check <code>moduleCodeHashAllowed(moduleType, codeHash) == true</code> for every production module.</li>
          <li>Check <code>enforceModuleCodeHashAllowlist == true</code> before opening user traffic.</li>
          <li>Validate registration order: allowlist first, then <code>registerModule</code>.</li>
          <li>Test that unallowlisted module registration reverts in staging/fork runs.</li>
        </ul>
      </details>
    </section>

    <section id="keeper-services">
      <h2>Keeper / Watcher Services</h2>
      <p>
        Keeper code is under <code>SharedDeposit/scripts/keepers/</code> and is intended
        for continuous managed runtime.
      </p>
      <ul>
        <li><code>depositSweep.ts</code>: validator deposit operations.</li>
        <li><code>oracleReporter.ts</code>: oracle report submission.</li>
        <li><code>withdrawalFinalizer.ts</code>: queue finalization operations.</li>
        <li><code>balanceMonitor.ts</code>: anomaly detection and escalation triggers.</li>
      </ul>
      <details>
        <summary>Runtime packaging options</summary>
        <ul>
          <li>Docker compose stack: <code>docker-compose.keepers.yml</code>.</li>
          <li>Systemd units: <code>ops/systemd/*.service</code>.</li>
          <li>Configuration template: <code>.env.keeper.example</code>.</li>
        </ul>
      </details>
    </section>

    <section id="monitoring-alerts">
      <h2>Monitoring And Alerts</h2>
      <ul>
        <li>Track pooled ETH deltas and report freshness.</li>
        <li>Alert on threshold breaches and stale oracle conditions.</li>
        <li>Route alerts to paging channels with clear on-call ownership.</li>
      </ul>
      <details>
        <summary>Core monitoring dimensions</summary>
        <ul>
          <li>Router pooled balance trajectory.</li>
          <li>Module-level beacon/report consistency.</li>
          <li>Withdrawal queue backlog and claim latency.</li>
          <li>Keeper health and transaction success ratios.</li>
        </ul>
      </details>
    </section>

    <section id="migration-cutover">
      <h2>Migration Helper Cutover</h2>
      <ul>
        <li>Major router replacement path uses <code>MigrationHelper</code> announce/activate sequencing.</li>
        <li>Operational timeline: announce new router, run exit window, activate migration, then switch frontend target.</li>
        <li>Frontends/integrators must read migration flags and route users to the active router state.</li>
      </ul>
      <details>
        <summary>Cutover checklist</summary>
        <ul>
          <li>Publish <code>migrationActiveAt</code> timestamp in user-facing channels.</li>
          <li>Pause old-router deposit path during transition where required.</li>
          <li>Verify queue drain and rollback plan before activation.</li>
        </ul>
      </details>
    </section>

    <section id="runbooks">
      <h2>Runbooks</h2>
      <ul>
        <li>Document pause/unpause paths for router and modules.</li>
        <li>Define guardian escalation and governance follow-up timelines.</li>
        <li>Keep key rotation and credential revocation procedures current.</li>
      </ul>
      <details>
        <summary>Release readiness checklist</summary>
        <ul>
          <li>All required keepers deployed and tested on forked infrastructure.</li>
          <li>Incident drill executed and postmortem template prepared.</li>
          <li>Address manifest and docs synced for target network.</li>
        </ul>
      </details>
    </section>
  </DocsPageFrame>
</template>

<script>
import DocsPageFrame from "../DocsPageFrame.vue";

export default {
  name: "DocsOpsDeployPage",
  components: { DocsPageFrame },
  data() {
    return {
      anchors: [
        { id: "audience", label: "Audience" },
        { id: "deployment-order", label: "Deployment Order" },
        { id: "module-admission-hardening", label: "Module Hardening" },
        { id: "keeper-services", label: "Keeper Services" },
        { id: "monitoring-alerts", label: "Monitoring" },
        { id: "migration-cutover", label: "Migration Cutover" },
        { id: "runbooks", label: "Runbooks" },
      ],
    };
  },
};
</script>
