<template>
  <div class="container">
    <div class="max-w-2xl mx-auto text-gray-300">
      <h1 class="text-2xl font-medium text-center border-b border-b-white pb-3 mb-6">
        SharedStake V2 FAQ
      </h1>

      <div class="bg-blue-900/30 border border-blue-700/50 rounded-lg p-4 mb-6">
        <h3 class="text-lg font-semibold text-blue-300 mb-2">
          📚 New Documentation Center Available
        </h3>
        <p class="text-sm mb-2">
          For comprehensive V2 documentation, please visit our new <router-link
            to="/docs"
            class="text-blue-400 underline hover:text-blue-300"
          >
            Documentation Center
          </router-link>.
        </p>
        <p class="text-sm">
          The docs below cover common questions. For detailed technical information, see the full documentation.
        </p>
      </div>

      <h2>What is SharedStake V2?</h2>
      <p>SharedStake V2 is a modular liquid staking protocol built on Ethereum. Users stake ETH to receive stETH shares (rebasing) or wstETH (non-rebasing wrapped tokens). The protocol uses a router-based architecture with multiple staking routes including solo validator and DVT modules.</p>

      <h2>What token do I receive when staking?</h2>
      <p>You receive stETH shares in the V2 accounting model. You can wrap stETH to non-rebasing wstETH for DeFi composability. Both represent your share of the pooled ETH.</p>

      <h2>Are withdrawals instant?</h2>
      <p>No. Withdrawals use a queue model: you request a withdrawal first, then claim your ETH once it's finalized by the guardian. This queue-based system ensures orderly exits and protocol stability.</p>

      <h2>How does SharedStake compare to other liquid staking protocols?</h2>
      <p>SharedStake V2 differentiates itself through:</p>
      <ul class="list-disc ml-6 mb-4">
        <li><strong>Modular Architecture:</strong> Router-based design allowing multiple staking routes (solo validator, DVT, LST wrap)</li>
        <li><strong>Community-Led:</strong> Governed by the community rather than VC-controlled</li>
        <li><strong>Flexible Routes:</strong> Support for different validator operation models</li>
        <li><strong>Referral System:</strong> Built-in referral code and address tracking</li>
        <li><strong>Queue-Based Exits:</strong> Structured withdrawal process with guardian controls</li>
      </ul>
      <p class="text-sm text-gray-400">
        For detailed feature comparisons, see our <router-link
          to="/docs/architecture"
          class="underline"
        >
          Architecture documentation
        </router-link>.
      </p>

      <h2>What are the referral options?</h2>
      <p>SharedStake V2 supports two referral methods:</p>
      <ul class="list-disc ml-6 mb-4">
        <li><strong>Address Referral:</strong> Use <code>?ref=0x...</code> in URLs for direct wallet address referrals</li>
        <li><strong>Code Referral:</strong> Use <code>?r=CODE</code> for shareable referral codes with optional backend resolution</li>
      </ul>
      <p class="text-sm text-gray-400">
        See <router-link
          to="/docs/referral"
          class="underline"
        >
          Referral documentation
        </router-link> for details.
      </p>

      <h2>How does the governance work in V2?</h2>
      <p>V2 governance is currently in a read-only preview mode in the UI. The governance tab shows core parameters, but proposal creation, voting, and execution flows are still being developed. Governance operations are managed through timelock-controlled contracts with role-based access control.</p>

      <h2>Is SharedStake V2 audited?</h2>
      <p>Yes, SharedStake V2 has undergone comprehensive internal security audits with 6 audit passes covering:</p>
      <ul class="list-disc ml-6 mb-4">
        <li>Contract security and access control</li>
        <li>Adversarial and fuzz testing</li>
        <li>Foundry invariant testing</li>
        <li>End-to-end validation on forked networks</li>
      </ul>
      <p class="text-sm text-gray-400">
        See <router-link
          to="/docs/security-risks"
          class="underline"
        >
          Security & Risks documentation
        </router-link> for details.
      </p>

      <h2>What are the main risks?</h2>
      <p>As with any DeFi protocol, risks include:</p>
      <ul class="list-disc ml-6 mb-4">
        <li>Smart contract risks and potential bugs</li>
        <li>Oracle dependency and reporting quality</li>
        <li>Operational key management risks</li>
        <li>Protocol governance decisions</li>
        <li>Ethereum network-level risks</li>
      </ul>
      <p class="text-sm text-gray-400">
        Always review the <router-link
          to="/docs/security-risks"
          class="underline"
        >
          Security & Risks documentation
        </router-link> before staking.
      </p>

      <h2>How can I participate in governance?</h2>
      <p>Currently, governance operations are managed off-chain through the DAO processes. The UI governance tab is informational only. Full on-chain governance integration is planned for future releases.</p>

      <h2>Where can I find technical documentation?</h2>
      <p>
        Comprehensive technical documentation is available in our <router-link
          to="/docs"
          class="underline"
        >
          Documentation Center
        </router-link>, including:
      </p>
      <ul class="list-disc ml-6 mb-4">
        <li>User Guide for staking flows</li>
        <li>Architecture and contract details</li>
        <li>Security and risk analysis</li>
        <li>Operations and deployment guides</li>
        <li>API and integration documentation</li>
      </ul>

      <div class="flex gap-3 mt-6">
        <a
          rel="noopener noreferrer nofollow"
          target="_blank"
          class="underline"
          href="https://twitter.com/ChimeraDefi"
        >Twitter</a>
        <a
          rel="noopener noreferrer nofollow"
          target="_blank"
          class="underline"
          href="https://discord.com/invite/VezkjY9udC"
        >Discord</a>
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  background-color: rgb(24, 24, 24);
  width: 60%;
  margin: auto;
  margin-bottom: 20px;
  padding-top: 140px;
  display: flex;
  padding-bottom: 24px;
  flex-direction: column;
}

h1 {
  margin: auto;
}

h2 {
  font-size: 1.25rem;
  font-weight: 500;
  margin-top: 24px;
}

div {
  font-size: 16px;
}

@media only screen and (max-width: 900px) {
  .container {
    width: 90%;
  }
}
</style>
