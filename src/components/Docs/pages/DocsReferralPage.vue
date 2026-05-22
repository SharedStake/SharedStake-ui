<template>
  <DocsPageFrame
    title="Referral"
    subtitle="Implementation-accurate referral behavior: live address and code flows, with optional backend resolution and onchain code-registry settlement."
    updated-at="2026-05-22"
    :anchors="anchors"
  >
    <section id="audience">
      <h2>Who This Page Is For</h2>
      <ul>
        <li><strong>Users:</strong> share links and understand which referral is applied.</li>
        <li><strong>Operators:</strong> run referral campaigns without ambiguous attribution rules.</li>
        <li><strong>Integrators:</strong> wire code-based referral flows safely without breaking the live path.</li>
      </ul>
      <details>
        <summary>Action checklist</summary>
        <ul>
          <li>Use <code>?ref</code> for direct address referrals.</li>
          <li>Use <code>?r</code> for code-hash referral flow; add resolver integration for improved verification UX.</li>
          <li>Keep explicit fallback behavior documented for support teams.</li>
        </ul>
      </details>
    </section>

    <section id="live-address-flow">
      <h2>Live Referral Flows (Implemented)</h2>
      <p>
        The current stake panel supports both referral address and referral code inputs.
      </p>
      <ul>
        <li>Read <code>?ref=0x...</code> and <code>?r=CODE</code> from the current URL on page load.</li>
        <li>Accept only valid non-zero EVM addresses.</li>
        <li>Normalize code to uppercase and strip spaces before validation and hashing.</li>
        <li>Persist accepted referral state in local storage and allow users to clear it.</li>
        <li>For code flow, compute <code>keccak256(code)</code> and submit through code-aware stake methods when available.</li>
        <li>If no valid referral is available, submit uses zero-address referral semantics.</li>
      </ul>
      <details>
        <summary>Contract call path used by the UI</summary>
        <ul>
          <li>Code path: <code>submitWithReferralCode(bytes32)</code> on router/core where available.</li>
          <li>Address path: <code>submit(address)</code> when code path is unavailable or no code hash is active.</li>
          <li>Store includes router/core compatibility logic, but current UI enables staking only when required V2 addresses are fully configured.</li>
        </ul>
      </details>
    </section>

    <section id="referral-ux-params">
      <h2>Referral UX Parameters And Fallbacks</h2>
      <ul>
        <li><code>?ref=0x...</code> valid: canonicalized and stored as address fallback context.</li>
        <li><code>?r=CODE</code> valid: code path becomes active and code hash is prepared for submit.</li>
        <li>Both <code>?ref</code> and <code>?r</code>: code path is preferred; address remains fallback/resolution context.</li>
        <li>If code resolution API is configured and returns an address, UI shows resolved address status.</li>
        <li>If resolver is unavailable or fails, code-hash submit still proceeds where supported.</li>
        <li>When code resolution is unavailable onchain (registry unset or code missing), contracts fall back to zero-address referral.</li>
      </ul>
      <details>
        <summary>Examples</summary>
        <ul>
          <li><code>/v2?ref=0xabc...123</code>: address referral flow.</li>
          <li><code>/v2?r=alice_code</code>: code flow (hash submit path).</li>
          <li><code>/v2?ref=0xabc...123&r=alice_code</code>: code flow preferred with address fallback context.</li>
        </ul>
      </details>
    </section>

    <section id="code-flow-supported">
      <h2>Code Flow Via Onchain Registry + Backend Resolver</h2>
      <p>
        Code routing is enabled in the current UI and contract surface. Backend resolution
        is optional but recommended for campaign operations and user-facing verification.
      </p>
      <ul>
        <li>Router/Core ABIs include code-aware submit methods.</li>
        <li>Referral code registry wiring is available via governance-controlled contract settings.</li>
        <li>Frontend performs runtime ABI detection and falls back to <code>submit(address)</code> when code methods are unavailable.</li>
        <li>Backend resolver endpoint (<code>/v1/codes/:code/resolve</code>) can provide checksum address confirmation to the UI.</li>
      </ul>
      <details>
        <summary>Recommended integration pattern</summary>
        <ul>
          <li>Backend resolver normalizes/validates campaign codes and returns canonical address metadata.</li>
          <li>Onchain registry remains settlement truth for code-to-referrer mapping at submit time.</li>
          <li>Frontend preserves explicit fallback rules so failed resolution does not block staking.</li>
        </ul>
      </details>
    </section>

    <section id="implemented-vs-optional">
      <h2>Implemented Vs Optional</h2>
      <ul>
        <li><strong>Implemented now:</strong> <code>?ref</code> and <code>?r</code> parsing, persistence, clear actions, and dynamic submit path selection.</li>
        <li><strong>Supported now:</strong> optional backend resolver for code verification and ops workflows.</li>
        <li><strong>Optional rollout work:</strong> advanced campaign management UI and analytics dashboards.</li>
      </ul>
    </section>

    <section id="referral-faq">
      <h2>Referral FAQ</h2>
      <details>
        <summary>Do I need custom code links to run referrals now?</summary>
        <p>
          No. Address links via <code>?ref=0x...</code> are live today.
        </p>
      </details>
      <details>
        <summary>What happens if the link only includes <code>?r</code>?</summary>
        <p>
          The code path is applied directly in current UI and submitted as a code hash where supported.
          Resolver integration is optional and improves user-facing verification.
        </p>
      </details>
      <details>
        <summary>Can users clear an applied referral?</summary>
        <p>
          Yes. The stake panel includes a Clear action that removes the stored referral from local storage.
        </p>
      </details>
    </section>
  </DocsPageFrame>
</template>

<script>
import DocsPageFrame from "../DocsPageFrame.vue";

export default {
  name: "DocsReferralPage",
  components: { DocsPageFrame },
  data() {
    return {
      anchors: [
        { id: "audience", label: "Audience" },
        { id: "live-address-flow", label: "Live Address Flow" },
        { id: "referral-ux-params", label: "Referral UX Params" },
        { id: "code-flow-supported", label: "Code Flow Path" },
        { id: "implemented-vs-optional", label: "Implemented Vs Optional" },
        { id: "referral-faq", label: "Referral FAQ" },
      ],
    };
  },
};
</script>
