<template>
  <DocsPageFrame
    title="Staking Routes"
    subtitle="Route-level behavior in SharedStake V2: router default route, solo validator route, DVT route, and optional module paths."
    updated-at="2026-05-22"
    :anchors="anchors"
  >
    <section id="audience">
      <h2>Who This Page Is For</h2>
      <ul>
        <li><strong>Users:</strong> understand what route your stake transaction follows in the default UI.</li>
        <li><strong>Operators:</strong> control which module is default and which module routes are active.</li>
        <li><strong>Integrators:</strong> map route-specific calls to router methods.</li>
      </ul>
      <details>
        <summary>Action checklist</summary>
        <ul>
          <li>Confirm default module before user traffic.</li>
          <li>Confirm whether explicit module selection is exposed in your frontend.</li>
          <li>Confirm module pause/cap/inflow-limit settings.</li>
        </ul>
      </details>
    </section>

    <section id="router-default-route">
      <h2>Router Default Route</h2>
      <p>
        The default UI stake path uses router-default routing when router contracts are
        deployed on the connected network.
      </p>
      <ul>
        <li>UI stake action uses <code>submitWithReferralCode</code> when a code hash is active; otherwise it uses <code>submit(referral)</code>.</li>
        <li>The store reads <code>defaultModuleId</code> and module inflow metadata for status display and checks.</li>
        <li>Store contains transitional dual-path selection logic, but the current UI expects full V2 deployment manifests and blocks stake actions if required addresses are missing.</li>
      </ul>
      <details>
        <summary>Integrator note</summary>
        <p>
          The current default UI does not expose manual module selection. Integrators that
          need deterministic routing can use explicit module-submit methods at integration level.
        </p>
      </details>
    </section>

    <section id="solo-validators">
      <h2>Solo Validator Route</h2>
      <p>
        The solo route is the <code>ValidatorModule</code> path in the modular architecture.
        It is configured through module registration and operator runbooks, not selected directly
        from the default user stake tab.
      </p>
      <ul>
        <li>Users enter through router default route unless an integration targets module methods directly.</li>
        <li>Operators maintain deposit and reporting workflows for the validator module.</li>
        <li>Governance and guardian controls determine route availability and pause behavior.</li>
      </ul>
      <details>
        <summary>Operator readiness checks</summary>
        <ul>
          <li>Validate module registration and active status.</li>
          <li>Validate withdrawal credential policy and deposit data pipeline controls.</li>
          <li>Validate incident runbooks for pause/unpause and reconciliation.</li>
        </ul>
      </details>
    </section>

    <section id="dvt-route">
      <h2>DVT Route</h2>
      <p>
        The DVT route is provided by <code>DVTModule</code> in the deployment plan and
        is intended for distributed validator operations under governance-defined controls.
      </p>
      <ul>
        <li>Route activation is environment-specific and depends on deployment/module configuration.</li>
        <li>Default UI stake path still follows router-default behavior unless explicitly overridden in integration code.</li>
        <li>Operational ownership includes cluster policy, signer controls, and incident playbooks.</li>
      </ul>
      <details>
        <summary>DVT operational checklist</summary>
        <ul>
          <li>Confirm cluster registration and lifecycle controls for the target environment.</li>
          <li>Confirm threshold/key-management policy.</li>
          <li>Confirm monitoring and guardian escalation paths for DVT incidents.</li>
        </ul>
      </details>
    </section>

    <section id="optional-routes">
      <h2>Optional Module Routes</h2>
      <p>
        Additional routes such as LST wrap modules are part of modular deployment options.
        Availability depends on environment wiring and governance decisions.
      </p>
      <ul>
        <li>Treat non-default modules as optional until verified active in deployment manifests.</li>
        <li><code>StTokenERC4626Wrapper</code> is deployed as an integrator route and is not exposed in default user tabs.</li>
        <li>Document enabled routes per network for support and incident response.</li>
      </ul>
    </section>
  </DocsPageFrame>
</template>

<script>
import DocsPageFrame from "../DocsPageFrame.vue";

export default {
  name: "DocsStakingRoutesPage",
  components: { DocsPageFrame },
  data() {
    return {
      anchors: [
        { id: "audience", label: "Audience" },
        { id: "router-default-route", label: "Router Default Route" },
        { id: "solo-validators", label: "Solo Validator Route" },
        { id: "dvt-route", label: "DVT Route" },
        { id: "optional-routes", label: "Optional Routes" },
      ],
    };
  },
};
</script>
