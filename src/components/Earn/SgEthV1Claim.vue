<template>
  <main class="claim-page">
    <section class="claim-shell">
      <div class="claim-header">
        <p class="eyebrow">Exploit loss receipt</p>
        <h1>sgethV1Claim</h1>
        <p>
          Claim the receipt token allocated to the connected address. Claims are
          recipient-only and the token is non-transferable until governance enables transfers.
        </p>
      </div>

      <div class="claim-panel">
        <label for="sgeth-v1-claim-address">Recipient address</label>
        <input
          id="sgeth-v1-claim-address"
          v-model="address"
          autocomplete="off"
          spellcheck="false"
          placeholder="0x..."
        >

        <div class="status-row">
          <span>Status</span>
          <strong data-testid="sgeth-v1-claim-status">{{ statusLabel }}</strong>
        </div>
        <div class="status-row">
          <span>Available</span>
          <strong data-testid="sgeth-v1-claim-available">{{ availableLabel }}</strong>
        </div>
        <div class="status-row">
          <span>Your balance</span>
          <strong data-testid="sgeth-v1-claim-balance">{{ balanceLabel }}</strong>
        </div>

        <button
          class="mainButton claim-button"
          type="button"
          :disabled="!canClaim || loading"
          @click="claimReceipt"
        >
          {{ loading ? "Claiming..." : "Claim sgethV1Claim" }}
        </button>
      </div>
    </section>
  </main>
</template>

<script>
import { ethers } from "ethers";
import { notify } from "@/utils/common";
import { sgethV1Claim } from "@/contracts";
import { useWalletStore } from "@/stores/wallet";
import { sgethV1ClaimMerkle } from "./sgethV1ClaimAirdrop";

const formatToken = (amount) => {
  try {
    const [whole, fractional = ""] = ethers.formatUnits(amount || 0n, 18).split(".");
    const groupedWhole = BigInt(whole).toLocaleString();
    const trimmedFraction = fractional.slice(0, 6).replace(/0+$/, "");
    return trimmedFraction ? `${groupedWhole}.${trimmedFraction}` : groupedWhole;
  } catch {
    return "0";
  }
};

export default {
  setup() {
    const walletStore = useWalletStore();
    return { walletStore };
  },
  data: () => ({
    address: "",
    claim: null,
    eligible: false,
    claimed: false,
    loading: false,
    contractMissing: false,
    balance: 0n,
    contractRetryCount: 0,
  }),
  computed: {
    userAddress() {
      return this.walletStore.userAddress;
    },
    normalizedAddress() {
      try {
        return this.address ? ethers.getAddress(this.address) : "";
      } catch {
        return "";
      }
    },
    statusLabel() {
      if (this.contractMissing) return "Contract unavailable";
      if (!this.address) return "Enter an address";
      if (!this.normalizedAddress) return "Invalid address";
      if (!this.eligible) return "Not eligible";
      if (this.claimed) return "Claimed";
      if (this.userAddress && this.normalizedAddress.toLowerCase() !== this.userAddress.toLowerCase()) {
        return "Connect recipient wallet";
      }
      return "Available";
    },
    availableLabel() {
      if (!this.claim || this.claimed) return "0 sgethV1Claim";
      return `${formatToken(BigInt(this.claim.amount))} sgethV1Claim`;
    },
    balanceLabel() {
      return `${formatToken(this.balance)} sgethV1Claim`;
    },
    canClaim() {
      if (!this.eligible || this.claimed || this.loading || !this.userAddress) return false;
      return this.normalizedAddress.toLowerCase() === this.userAddress.toLowerCase();
    }
  },
  watch: {
    async address() {
      await this.refreshClaimState({ resetRetries: true });
    },
    async userAddress(next) {
      if (next && !this.address) this.address = next;
      await this.refreshClaimState({ resetRetries: true });
    },
  },
  async mounted() {
    const params = new URLSearchParams(window.location.search);
    this.address = params.get("e2eAddress") || this.userAddress || "";
    await this.refreshClaimState({ resetRetries: true });
  },
  methods: {
    async refreshClaimState({ resetRetries = false } = {}) {
      if (resetRetries) this.contractRetryCount = 0;
      this.contractMissing = false;
      this.eligible = false;
      this.claimed = false;
      this.claim = null;
      this.balance = 0n;

      if (!this.normalizedAddress) return;

      const claim =
        sgethV1ClaimMerkle.claims[this.normalizedAddress] ||
        sgethV1ClaimMerkle.claims[this.normalizedAddress.toLowerCase()];
      if (!claim) return;

      this.eligible = true;
      this.claim = claim;

      const contract = sgethV1Claim();
      if (!contract) {
        this.contractMissing = true;
        if (this.contractRetryCount < 12) {
          this.contractRetryCount += 1;
          window.setTimeout(() => this.refreshClaimState(), 300);
        }
        return;
      }

      try {
        const [claimed, balance] = await Promise.all([
          contract.isClaimed(claim.index),
          contract.balanceOf(this.normalizedAddress)
        ]);
        this.claimed = claimed;
        this.balance = balance;
      } catch (error) {
        console.error("Failed to read sgethV1Claim state:", error);
        this.contractMissing = true;
      }
    },
    async claimReceipt() {
      if (!this.canClaim || !this.claim) return;

      this.loading = true;
      try {
        const contract = sgethV1Claim(true);
        if (!contract) throw new Error("sgethV1Claim contract not available");

        const tx = await contract.claim(
          this.claim.index,
          this.normalizedAddress,
          this.claim.amount,
          this.claim.proof
        );
        notify.hash(tx.hash);
        await tx.wait();
        await this.refreshClaimState();
      } catch (error) {
        console.error("Failed to claim sgethV1Claim:", error);
        notify.notification({
          message: error?.shortMessage || error?.message || "sgethV1Claim claim failed",
          type: "error"
        });
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<style scoped>
.claim-page {
  min-height: 78vh;
  padding: 48px 24px;
  color: #f5f7fa;
  background: #101418;
}

.claim-shell {
  width: min(860px, 100%);
  margin: 0 auto;
}

.claim-header {
  margin-bottom: 24px;
}

.claim-header h1 {
  margin: 0 0 8px;
  font-size: 36px;
  line-height: 1.1;
}

.claim-header p {
  max-width: 680px;
  margin: 0;
  color: #b9c3cf;
}

.eyebrow {
  margin: 0 0 8px;
  color: #63d297;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

.claim-panel {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 8px;
  background: #171d23;
  padding: 24px;
}

.claim-panel label {
  display: block;
  margin-bottom: 8px;
  color: #dfe7ef;
  font-size: 14px;
  font-weight: 700;
}

.claim-panel input {
  width: 100%;
  min-height: 44px;
  margin-bottom: 18px;
  padding: 0 12px;
  color: #f5f7fa;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 6px;
  background: #0f141a;
  font-family: monospace;
  font-size: 15px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 12px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.status-row span {
  color: #95a2af;
}

.status-row strong {
  overflow-wrap: anywhere;
  text-align: right;
}

.claim-button {
  width: 100%;
  min-height: 46px;
  margin-top: 18px;
}

.claim-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

@media (max-width: 620px) {
  .claim-page {
    padding: 32px 16px;
  }

  .claim-header h1 {
    font-size: 30px;
  }

  .status-row {
    align-items: flex-start;
    flex-direction: column;
    gap: 4px;
  }

  .status-row strong {
    text-align: left;
  }
}
</style>
