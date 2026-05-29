<template>
  <DocsPageFrame
    title="Migration & Cutover"
    subtitle="Major-upgrade migration flow using MigrationHelper announce/activate states and explicit operational gates."
    updated-at="2026-05-22"
    :anchors="anchors"
  >
    <section id="audience">
      <h2>Who This Page Is For</h2>
      <ul>
        <li><strong>Operators:</strong> execute migration timelines and safety gates.</li>
        <li><strong>Integrators:</strong> switch routing targets based on migration state.</li>
        <li><strong>Users:</strong> understand what changes during cutover windows.</li>
      </ul>
    </section>

    <section id="state-model">
      <h2>Migration State Model</h2>
      <ul>
        <li><strong>Announced:</strong> governance sets migration target and activation timestamp.</li>
        <li><strong>Exit window:</strong> old router remains active while users can withdraw under normal queue rules.</li>
        <li><strong>Activated:</strong> cutover flag is active and frontend/integrators route new deposits to the new router.</li>
      </ul>
      <details>
        <summary>Contract references</summary>
        <ul>
          <li><code>MigrationHelper.announceMigration(newRouter)</code></li>
          <li><code>MigrationHelper.activateMigration()</code></li>
          <li><code>MigrationHelper.migrationActive</code> / <code>migrationActiveAt</code> / <code>newRouter</code></li>
        </ul>
      </details>
    </section>

    <section id="frontend-behavior">
      <h2>Frontend / Integrator Behavior</h2>
      <ul>
        <li>Read migration state from onchain helper before selecting the active deposit route.</li>
        <li>Show clear user messaging during announce and activation phases.</li>
        <li>Deprecate old router entry points after activation and manifest publication.</li>
        <li>Current <code>/v2</code> UI does not auto-switch route targets from <code>MigrationHelper</code>; migration-state handling is still an integration task.</li>
      </ul>
      <details>
        <summary>Current implementation note</summary>
        <p>
          Current V2 UI docs include the cutover model. Full automatic migration banner/redirect behavior remains an integration task.
        </p>
      </details>
    </section>

    <section id="onchain-invariants">
      <h2>Onchain Migration Invariants</h2>
      <ul>
        <li>Notice period is fixed onchain at 14 days in <code>MigrationHelper</code>.</li>
        <li><code>activateMigration()</code> cannot execute before <code>migrationActiveAt</code>.</li>
        <li><code>cancelMigration()</code> is only valid before activation.</li>
      </ul>
      <details>
        <summary>Operator implication</summary>
        <p>
          Emergency process may still pause deposits immediately at router level, but helper activation timing remains contract-enforced.
        </p>
      </details>
    </section>

    <section id="operator-checklist">
      <h2>Operator Checklist</h2>
      <ul>
        <li>Publish migration announcement and exact <code>migrationActiveAt</code> timestamp.</li>
        <li>Prepare old-router deposit pause plan for cutover window.</li>
        <li>Monitor withdrawal queue backlog and finalization throughput.</li>
        <li>Smoke-test new router path on fork/stateful staging before activation.</li>
        <li>Switch frontend/integrator manifests only after activation criteria are met.</li>
      </ul>
    </section>

    <section id="user-impact">
      <h2>User Impact Summary</h2>
      <ul>
        <li>Normal case: users can continue holding stETH/wstETH during migration windows.</li>
        <li>Exit preference: users can request withdrawals during the announced window.</li>
        <li>Emergency case: follow official channels for any shortened or exceptional migration actions.</li>
      </ul>
    </section>
  </DocsPageFrame>
</template>

<script>
import DocsPageFrame from "../DocsPageFrame.vue";

export default {
  name: "DocsMigrationPage",
  components: { DocsPageFrame },
  data() {
    return {
      anchors: [
        { id: "audience", label: "Audience" },
        { id: "state-model", label: "State Model" },
        { id: "frontend-behavior", label: "Frontend Behavior" },
        { id: "onchain-invariants", label: "Onchain Invariants" },
        { id: "operator-checklist", label: "Operator Checklist" },
        { id: "user-impact", label: "User Impact" },
      ],
    };
  },
};
</script>
