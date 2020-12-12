<template>
  <div class="Info">
    <div class="main-title">Shared Stake</div>
    <div v-for="(card, i) in Infocards" class="flex_row Buttons" v-bind:key="i">
      <Infocard :title="card.title" :content="card.content" />
    </div>
    <div class="main-title">Our Contract Addresses:</div>
    <div class="addresses" v-for="(address, i) in addresses" :key="i">
      <a
        :href="'https://etherscan.io/address/' + address"
        target="_blank"
        rel="noopener noreferrer"
      >
        <span class="addressName">{{ address.name + ": " }}</span>
        <span class="addressAddress">{{ address.address }}</span>
      </a>
    </div>
    <div class="disclaimer">
      The information contained on this website and the resources mentioned on
      this website is not intended as, and shall not be understood or construed
      as, financial advice.<br />
      We are not attorneys, accountants or financial advisors, nor holding
      ourselves out to be, and the information contained on this website is not
      a substitute for financial advice from a professional.<br />
      We have done our best to ensure that the information provided on this
      website and the resources listed are accurate and provide valuable
      information. <br />
      Regardless of anything to the contrary, nothing available on or through
      this website should be understood as a recommendation that you should not
      consult with a financial professional to address your particular
      information.
      <br />
      We shall not be held liable or responsible for any errors or omissions on
      this website or for any damage you may suffer as a result of failing to
      seek competent financial advice from a professional.
    </div>
  </div>
</template>

<script>
import Infocard from "./Infocard";
import content from "./content/content.json";
export default {
  components: { Infocard },
  data: () => ({
    Infocards: content,
    addresses: [
      { name: "validator", address: "0x" },
      { name: "vETH2", address: "0x" },
      { name: "SST", address: "0x" },
    ],
  }),
};
</script>

<style scoped>
.Info {
  padding: 0;
  padding-left: 1rem;
  text-align: left;
  width: 100%;
  max-height: 100vh;
  overflow-y: scroll;
  color: #2c3e50;
}

.main-title {
  padding-top: 2rem;
  color: #00d395;
  font-size: 30px;
}
.addresses {
  margin: 0 0.5rem 0 1.5rem;
  color: #2c3e50;
}
.addressName {
  color: #00d394a0;
  font-size: 15px;
}
.addressAddress {
  font-size: 15px;
}
.disclaimer {
  padding: 1rem;
  background: #888;
  color: #f1f1f1;
  width: calc(100%-2rem);
  font-size: 10px;
}
</style>