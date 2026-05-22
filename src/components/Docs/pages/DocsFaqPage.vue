<template>
  <DocsPageFrame
    title="FAQ"
    subtitle="Common questions with implementation-accurate answers for users, operators, and integrators."
    updated-at="2026-05-22"
    :anchors="anchors"
  >
    <section id="audience">
      <h2>Who This Page Is For</h2>
      <ul>
        <li><strong>Users:</strong> quick answers for staking, withdrawals, and referral links.</li>
        <li><strong>Operators:</strong> support-ready language for route and referral behavior.</li>
        <li><strong>Integrators:</strong> concise behavior checks before shipping UX changes.</li>
      </ul>
    </section>

    <section id="general">
      <h2>General</h2>
      <details>
        <summary>What token do I receive when staking?</summary>
        <p>
          You receive stETH shares in the V2 accounting model. You can wrap to
          non-rebasing wstETH in the wrap flow.
        </p>
      </details>
      <details>
        <summary>Are withdrawals instant?</summary>
        <p>
          No. Withdrawals use a queue model: request first, then claim once finalized.
        </p>
      </details>
      <details>
        <summary>Is this docs center the canonical source?</summary>
        <p>
          It is canonical for current website UX behavior. Contract source and deployment
          manifests remain final for environment-specific protocol truth.
        </p>
      </details>
    </section>

    <section id="referral-faq">
      <h2>Referral</h2>
      <details>
        <summary>Can I share referrals without custom codes?</summary>
        <p>
          Yes. Use address links with <code>?ref=0x...</code>. This path is live in current UI.
        </p>
      </details>
      <details>
        <summary>Does <code>?r</code> work by default in current UI?</summary>
        <p>
          Yes. <code>?r</code> is parsed and used for code-hash submit flows.
          A resolver endpoint is optional and improves address verification UX.
        </p>
      </details>
      <details>
        <summary>What happens if no valid referral is found?</summary>
        <p>
          Stake submit uses the zero-address referral value.
        </p>
      </details>
    </section>

    <section id="validator-faq">
      <h2>Router / Solo Validator / DVT</h2>
      <details>
        <summary>Which route does default UI staking use?</summary>
        <p>
          It uses router default-route submit where router is deployed; otherwise it uses
          core compatibility fallback.
        </p>
      </details>
      <details>
        <summary>How is solo validator flow different from DVT flow?</summary>
        <p>
          They are different module routes in the modular architecture. Activation and
          operations are environment-specific and governance-controlled.
        </p>
      </details>
      <details>
        <summary>Can users manually choose a module in default UI?</summary>
        <p>
          Not in the current default stake tab. Explicit module targeting is an integration-level path.
        </p>
      </details>
    </section>

    <section id="docs-feedback">
      <h2>Documentation Feedback</h2>
      <ul>
        <li>Report doc gaps with network, route, and wallet/client details.</li>
        <li>Include transaction hashes for behavior-specific questions.</li>
        <li>Call out whether issue is UI behavior, deployment configuration, or contract behavior.</li>
      </ul>
    </section>
  </DocsPageFrame>
</template>

<script>
import DocsPageFrame from "../DocsPageFrame.vue";

export default {
  name: "DocsFaqPage",
  components: { DocsPageFrame },
  data() {
    return {
      anchors: [
        { id: "audience", label: "Audience" },
        { id: "general", label: "General" },
        { id: "referral-faq", label: "Referral" },
        { id: "validator-faq", label: "Routes" },
        { id: "docs-feedback", label: "Feedback" },
      ],
    };
  },
};
</script>
