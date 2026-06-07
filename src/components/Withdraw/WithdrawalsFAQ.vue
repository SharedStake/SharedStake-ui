<template>
  <div class="mt-10 text-white">
    <h2 class="mb-4 text-2xl font-medium text-center">
      Frequently Asked Questions
    </h2>

    <QuestionAnswer>
      <template #question>
        How do I withdraw my staked ETH?
      </template>
      <template #answer>
        You can withdraw your staked ETH by following the steps:
        <br>
        <strong>Step 1:</strong> Approve vETH2 (Please enter how much vETH2 you'd like to redeem)
        <br>
        <strong>Step 2:</strong> Deposit vETH2
        <br>
        <strong>Step 3:</strong> Redeem (when there is ETH available)
        <br>
        <strong>Note: You must deposit vETH2 first. ETH or tokens will then be buffered into the contract based on
          demand. </strong>
        <br>
        <strong>Note: You can at any point after deposit, choose to withdraw your vETH2 and use OTC or uniswap to sell for ETH. If you require a quicker flow. </strong>
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        How much is vETH2 worth? (Redemption rate)
      </template>
      <template #answer>
        The rate is 1.08
        i.e. 1 vETH2 = 1.08 ETH.
        <p v-if="userBal > 0">
          OR
          {{ userBal.div(eighteenPower).decimalPlaces(6).toString() }} vETH2 = {{ userBal.div(1 / 1.08).div(eighteenPower).decimalPlaces(6).toString() }} ETH/sgETH
        </p>
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        How much vETH2 is staked in this contract?
      </template>
      <template #answer>
        There is {{
          veth2Bal.div(eighteenPower)
            .decimalPlaces(6)
            .toString() }} vETH2 deposited here.
        Redeemable for {{
          veth2Bal.div(1/1.08).div(eighteenPower)
            .decimalPlaces(6)
            .toString() }} tokens.
        <br>
        From which {{
          totalRedeemed.div(eighteenPower)
            .decimalPlaces(6).toString()
        }} tokens have already been redeemed.
        <br>
        A total of {{
          (veth2Bal.multipliedBy(11).div(10)
            .minus(totalRedeemed)
            .minus(ethAvailableForWithdrawal)
          ).div(11)
            .multipliedBy(10)
            .div(eighteenPower)
            .decimalPlaces(6)
            .toString()
        }} vETH2 is queued. (if the number is negative that means there's excess in the buffer)
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        How much can be withdrawn right now?
      </template>
      <template #answer>
        You can withdraw upto {{
          ethAvailableForWithdrawal.div(eighteenPower)
            .decimalPlaces(6)
            .toString() }} ETH buffered in the contract. Right now!
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        How long does it take to withdraw my ETH?
      </template>
      <template #answer>
        It takes at least 7-14 days to withdraw your ETH. This wait time may be longer if demand is high. As ETH is buffered in phases your personal wait time may be affected by other users redeeming before you.
        This is because the ETH you
        staked is locked in the Ethereum 2.0 deposit contract and validators need to have their withdrawal addresses
        changed, then exited wherein they enter the exit queue.
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        I don't see the veth2 I previously deposited
      </template>
      <template #answer>
        If you had deposited in the old withdrawals/rollover contract, you will have to use etherscan to manually retrieve/withdraw
        your vETH2 and redo the process. <br>
        You can find a howto in the <a
          class="link"
          href="https://docs.sharedstake.finance/withdrawals/withdraw-veth2-via-etherscan"
        >docs under Withdrawals at docs.sharedstake.finance</a>
      </template>
    </QuestionAnswer>

    <QuestionAnswer>
      <template #question>
        How much has been processed across all vETH2 withdrawal contracts?
      </template>
      <template #answer>
        The table below shows cumulative stats across all three generations of the vETH2 withdrawal system.
        <br><br>

        <!-- Mobile card layout -->
        <div class="block md:hidden mt-4 space-y-4">
          <div
            v-for="row in historyRows"
            :key="row.address || row.name"
            class="bg-gray-800 border border-gray-700 rounded-lg p-4"
          >
            <h4 class="text-sm font-semibold text-gray-300 mb-3">
              {{ row.name }}
            </h4>
            <div class="space-y-2 text-xs">
              <div
                v-if="row.address"
                class="flex justify-between"
              >
                <span class="text-gray-400">Address:</span>
                <a
                  :href="`https://etherscan.io/address/${row.address}`"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-300 underline hover:text-blue-200 font-mono break-all text-right max-w-[60%]"
                >{{ row.address.slice(0,6) }}...{{ row.address.slice(-4) }}</a>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">vETH2 Deposited:</span>
                <span class="text-gray-200 font-mono">{{ fmt(row.veth2) }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-400">ETH Paid Out:</span>
                <span class="text-gray-200 font-mono">{{ fmt(row.paidOut) }}</span>
              </div>
              <div
                v-if="row.pending !== null"
                class="flex justify-between"
              >
                <span class="text-gray-400">ETH Pending Claim:</span>
                <span class="text-gray-200 font-mono">{{ fmt(row.pending) }}</span>
              </div>
            </div>
          </div>
          <div
            v-if="loading"
            class="bg-gray-800 border border-gray-700 rounded-lg p-4 text-center text-gray-400"
          >
            Loading...
          </div>
        </div>

        <!-- Desktop table layout -->
        <div class="hidden md:block mt-4">
          <div class="overflow-x-auto">
            <div class="overflow-hidden border border-gray-700 rounded-lg">
              <table class="w-full divide-y divide-gray-700 text-xs">
                <thead class="bg-gray-900">
                  <tr>
                    <th class="px-2 py-1.5 text-left text-xs font-semibold text-gray-300 uppercase tracking-tight">
                      Contract
                    </th>
                    <th class="px-2 py-1.5 text-left text-xs font-semibold text-gray-300 uppercase tracking-tight">
                      Address
                    </th>
                    <th class="px-2 py-1.5 text-right text-xs font-semibold text-gray-300 uppercase tracking-tight">
                      vETH2 Deposited
                    </th>
                    <th class="px-2 py-1.5 text-right text-xs font-semibold text-gray-300 uppercase tracking-tight">
                      ETH Paid Out
                    </th>
                    <th class="px-2 py-1.5 text-right text-xs font-semibold text-gray-300 uppercase tracking-tight">
                      ETH Pending Claim
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-gray-800 divide-y divide-gray-700">
                  <template v-if="!loading && historyRows.length > 0">
                    <tr
                      v-for="(row, i) in historyRows"
                      :key="row.address || row.name"
                      :class="i % 2 === 0 ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-900 hover:bg-gray-800'"
                      class="transition-colors"
                    >
                      <td class="px-2 py-1.5 whitespace-nowrap text-gray-200 font-medium text-xs">
                        {{ row.name }}
                      </td>
                      <td class="px-2 py-1.5 max-w-[160px]">
                        <a
                          v-if="row.address"
                          :href="`https://etherscan.io/address/${row.address}`"
                          target="_blank"
                          rel="noopener noreferrer"
                          class="text-blue-300 underline hover:text-blue-200 font-mono text-xs transition-colors"
                          :title="row.address"
                        >{{ row.address.slice(0,6) }}...{{ row.address.slice(-4) }}</a>
                        <span
                          v-else
                          class="text-gray-500 text-xs italic"
                        >pending deploy</span>
                      </td>
                      <td class="px-2 py-1.5 whitespace-nowrap text-right text-gray-200 font-mono text-xs">
                        {{ fmt(row.veth2) }}
                      </td>
                      <td class="px-2 py-1.5 whitespace-nowrap text-right text-gray-200 font-mono text-xs">
                        {{ fmt(row.paidOut) }}
                      </td>
                      <td class="px-2 py-1.5 whitespace-nowrap text-right text-gray-200 font-mono text-xs">
                        <span v-if="row.pending !== null">{{ fmt(row.pending) }}</span>
                        <span
                          v-else
                          class="text-gray-500"
                        >—</span>
                      </td>
                    </tr>
                  </template>
                  <template v-else>
                    <tr class="bg-gray-800">
                      <td
                        colspan="5"
                        class="px-2 py-2 text-center text-gray-400"
                      >
                        {{ loading ? 'Loading contract data...' : 'No data available' }}
                      </td>
                    </tr>
                  </template>
                </tbody>
                <tfoot
                  v-if="!loading && historyRows.length > 0"
                  class="bg-gray-900"
                >
                  <tr class="font-semibold border-t-2 border-gray-600">
                    <td
                      class="px-2 py-1.5 text-gray-200 text-xs"
                      colspan="2"
                    >
                      Total
                    </td>
                    <td class="px-2 py-1.5 whitespace-nowrap text-right text-gray-200 font-mono text-xs">
                      {{ fmt(totalVeth2) }}
                    </td>
                    <td class="px-2 py-1.5 whitespace-nowrap text-right text-gray-200 font-mono text-xs">
                      {{ fmt(totalPaidOut) }}
                    </td>
                    <td class="px-2 py-1.5 whitespace-nowrap text-right text-gray-200 font-mono text-xs">
                      {{ fmt(totalPending) }}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </template>
    </QuestionAnswer>
  </div>
</template>

<script>
import QuestionAnswer from "@/components/Withdraw/QuestionAnswer.vue";
import BN from "bignumber.js";
import {
  vEth2 as vEth2Factory,
  withdrawals as withdrawalsFactory,
  oldVeth2WithdrawalQueue as oldVeth2QueueFactory,
  getDeprecatedWithdrawalsAddresses,
  createDeprecatedWithdrawalsContract,
} from "@/contracts";

const E18 = BN(10).pow(18);

function bnFrom(raw) {
  try { return BN(raw.toString()); } catch { return BN(0); }
}

export default {
  name: 'WithdrawalsFAQ',
  components: { QuestionAnswer },
  props: ['ethAvailableForWithdrawal', 'totalRedeemed', 'veth2Bal', 'userBal'],
  data() {
    return {
      loading: false,
      historyRows: [],
    };
  },
  computed: {
    eighteenPower() { return E18; },
    totalVeth2() {
      return this.historyRows.reduce((s, r) => s.plus(r.veth2 || BN(0)), BN(0));
    },
    totalPaidOut() {
      return this.historyRows.reduce((s, r) => s.plus(r.paidOut || BN(0)), BN(0));
    },
    totalPending() {
      return this.historyRows.reduce((s, r) => s.plus(r.pending || BN(0)), BN(0));
    },
  },
  mounted() {
    this.loadHistory();
  },
  methods: {
    fmt(bn) {
      if (!bn || !BN.isBigNumber(bn)) return '—';
      return bn.div(E18).decimalPlaces(4).toString();
    },

    async loadHistory() {
      this.loading = true;
      const rows = [];

      const veth2 = vEth2Factory();

      // ── V2: current withdrawals contract (use factory → reads live _addresses) ──
      const v2Contract = withdrawalsFactory(false);
      let v2Addr = null;
      try { if (v2Contract) v2Addr = await v2Contract.getAddress(); } catch {}
      if (v2Addr) {
        const v2Veth2 = BN.isBigNumber(this.veth2Bal) ? this.veth2Bal : BN(0);
        const v2Redeemed = BN.isBigNumber(this.totalRedeemed) ? this.totalRedeemed : BN(0);
        rows.push({ name: 'Withdrawals V2 (active)', address: v2Addr, veth2: v2Veth2, paidOut: v2Redeemed, pending: null });
      }

      // ── V1: deprecated contracts (reads live _addresses via closure) ──────
      const deprecatedAddrs = getDeprecatedWithdrawalsAddresses()
        .filter(a => a.toLowerCase() !== v2Addr?.toLowerCase());
      for (const [i, addr] of deprecatedAddrs.entries()) {
        const c = createDeprecatedWithdrawalsContract(addr, false);
        let veth2Bal = BN(0), paidOut = BN(0);
        try { if (veth2) veth2Bal = bnFrom(await veth2.balanceOf(addr)); } catch {}
        try { if (c) paidOut = bnFrom(await c.totalOut()); } catch {}
        rows.push({ name: `Withdrawals V1${deprecatedAddrs.length > 1 ? ` (${i + 1})` : ''}`, address: addr, veth2: veth2Bal, paidOut, pending: null });
      }

      // ── V3: OldVeth2WithdrawalQueue (factory reads live _addresses) ───────
      const v3Contract = oldVeth2QueueFactory(false);
      let v3Addr = null;
      try { if (v3Contract) v3Addr = await v3Contract.getAddress(); } catch {}
      if (v3Addr && v3Contract) {
        let requested = BN(0), canceled = BN(0), finalized = BN(0), claimed = BN(0);
        try {
          [requested, canceled, finalized, claimed] = await Promise.all([
            v3Contract.totalRequestedVeth2().then(bnFrom).catch(() => BN(0)),
            v3Contract.totalCanceledVeth2().then(bnFrom).catch(() => BN(0)),
            v3Contract.totalFinalizedEth().then(bnFrom).catch(() => BN(0)),
            v3Contract.totalClaimedEth().then(bnFrom).catch(() => BN(0)),
          ]);
        } catch {}
        rows.push({
          name: 'Old vETH2 Queue V3',
          address: v3Addr,
          veth2: requested.minus(canceled),
          paidOut: claimed,
          pending: finalized.minus(claimed),
        });
      } else {
        rows.push({ name: 'Old vETH2 Queue V3', address: null, veth2: BN(0), paidOut: BN(0), pending: BN(0) });
      }

      this.historyRows = rows;
      this.loading = false;
    },
  },
}
</script>

<style scoped>
.links {
  color: blue !important;
}
</style>
