<template>
  <div class="Landing">
    <div class="relative min-h-screen text-white z-[1] pt-40 grid grid-cols-1 md-large:grid-cols-2 gap-0" v-show="scrolled >= 0">
      <div class="bg-no-repeat bg-center grid grid-cols-1 grid-rows-1 justify-center items-center" style="background-image: url('bg-1.png');">
        <ImageVue
          class="self-center justify-self-center"
          :src="'logo-red.svg'"
          :size="windowWidth > 900 ? '180px' : '20vw'"
        />
      </div>
      <div class="flex flex-col justify-center h-full p-4">
        <div class="mb-8 text-center md-large:max-w-xl md-large:text-left">
          <h1 class="relative mb-6 max-w-[900px] text-6xl font-medium leading-[1.05]">
            <span
              title="Established in 2020"
              class="absolute p-1 px-2 text-xs font-semibold text-gray-800 transform -translate-x-1/2 bg-gray-300 rounded-sm -bottom-6 md:bottom-auto md:-top-6 md:left-0 left-1/2 md:translate-x-0"
            >
              EST. 2020
            </span>
            ETHEREUM LIQUID STAKING DERIVATIVE! <br />
          </h1>
          <div class="text-xl leading-[31px] font-light p-0 text-white/90 animate-fade-in z-[1]" style="text-justify: inter-word;">
            SharedStake is a decentralized Ethereum 2 staking solution that
            allows users to stake any amount of Ether and earn additional yield
            on top of their ETH2 rewards.
          </div>
        </div>
        <div
          class="flex items-center justify-center gap-6 mb-8 md-large:justify-start"
        >
          <div
            class="px-6 py-3 text-xl font-semibold transition-all border-2 border-transparent rounded-full bg-gray-500 md:font-medium md:text-3xl md:px-8 whitespace-nowrap cursor-not-allowed opacity-50 flex flex-col items-center"
          >
            <span>STAKE V2</span>
            <div class="text-xs mt-1">Coming Soon</div>
          </div>
          <a
            class="px-6 py-3 text-xl font-medium transition-all border border-white rounded-full whitespace-nowrap md:text-2xl hover:border-brand-primary hover:text-brand-primary md:px-8"
            rel="noopener noreferrer nofollow"
            href="https://app.passch.com/"
            target="_blank"
          >
            MINT NFT
          </a>
        </div>

        <div class="flex items-center justify-center md-large:justify-start">
          <p class="gap-8 mb-3 text-lg">
            Join the conversation:
          </p>
        </div>
        <div
          class="flex items-center justify-center gap-8 mb-8 md-large:justify-start"
        >
          <a
            href="https://discord.gg/C9GhCv86My"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ImageVue
              :src="'socialmediaicons/Discord.svg'"
              size="24px"
              class="brightness-[300%] transition-all duration-500 ease-out cursor-pointer hover:brightness-[500%]"
            />
          </a>

          <div class="cursor-not-allowed opacity-50 flex flex-col items-center">
            <ImageVue
              :src="'socialmediaicons/TG.svg'"
              size="24px"
              class="brightness-[300%] transition-all duration-500 ease-out cursor-pointer hover:brightness-[500%]"
            />
            <div class="text-xs mt-1 text-center">Coming Soon</div>
          </div>
          <a
            href="https://github.com/SharedStake"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ImageVue
              :src="'socialmediaicons/Git.svg'"
              size="24px"
              class="brightness-[300%] transition-all duration-500 ease-out cursor-pointer hover:brightness-[500%]"
            />
          </a>
          <a
            href="https://medium.com/@chimera_defi"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ImageVue
              :src="'socialmediaicons/Medium.svg'"
              size="24px"
              class="brightness-[300%] transition-all duration-500 ease-out cursor-pointer hover:brightness-[500%]"
            />
          </a>
          <a
            href="https://twitter.com/ChimeraDefi"
            target="_blank"
            rel="noopener noreferrer"
          >
            <ImageVue
              :src="'socialmediaicons/Twitter.svg'"
              size="24px"
              class="brightness-[300%] transition-all duration-500 ease-out cursor-pointer hover:brightness-[500%]"
            />
          </a>
        </div>

        <div class="flex items-center justify-center md-large:justify-start">
          <p class="mb-3 text-lg">
            vETH2 Redemptions:
          </p>
        </div>
        <div
          class="flex items-center justify-center gap-4 mb-8 md-large:justify-start"
        >
          <!-- <router-link
            class="px-4 py-2 text-base font-medium transition-all border border-white rounded-full whitespace-nowrap md:text-lg hover:border-brand-primary hover:text-brand-primary md:px-6"
            to="/rollover"
          >
            Rollover (Returning soon!)
          </router-link> -->
          <span
            class="px-4 py-2 text-base font-medium transition-all border border-white rounded-full whitespace-nowrap md:text-lg hover:border-brand-primary hover:text-brand-primary md:px-6"
            to="/rollover"
          >
            Rollover (Returning soon!)
        </span>
          <div
            class="px-4 py-2 text-base font-medium transition-all border border-gray-500 rounded-full whitespace-nowrap md:text-lg md:px-6 cursor-not-allowed opacity-50 flex flex-col items-center"
          >
            <span>Withdraw</span>
            <div class="text-xs mt-1">Coming Soon</div>
          </div>
        </div>
      </div>
    </div>
    <div class="downSign glow" v-show="scrolled >= 0">
      <ImageVue :src="'down.svg'" :size="'30px'" />
    </div>
    <div class="flex flex-col items-center justify-between min-h-auto max-w-[1500px] mx-auto relative overflow-hidden text-white justify-between" v-show="scrolled >= 350" style="width: calc(100% - 60px); padding: 120px 0;">
      <div class="text-white items-center pb-12 my-8 font-light animate-fade-in text-center" style="font-size: 3rem; line-height: 1.16em;">Capital efficient staking</div>
      <div class="max-w-[800px] text-center mx-auto mb-8 text-2xl font-light p-0 text-white/75 animate-fade-in" style="line-height: 31px;">Financial optimization at its finest.</div>
      <div class="max-w-[800px] text-center mx-auto mb-8 text-2xl font-light p-0 text-white/75 animate-fade-in" style="line-height: 31px;">
        Better rewards, improved user experience, and more DeFi compatibility
        than any other Staking-as-a-Service model on the market.
      </div>

      <!-- <div class="StatsHeader" id="stats" ref="stats">Dashboard</div>
      <div
        class="grid items-center justify-center gap-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3"
      >
        <div class="Stat">
          <div class="Num">{{ TVL }}</div>
          <div class="NumExp">Ether Staked with SharedStake</div>
          <div class="NumDetail">
            It's
            {{
              TVLinUsd.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })
            }}! Liquid & Incentivised
          </div>
        </div>
        <div class="Stat">
          <div class="Num">{{ validatorApr }}%</div>
          <div class="NumExp">Validator APR</div>
          <div class="NumDetail">
            Validator APR based on avg activation epoch of
            <a href="https://beaconscan.com/epoch/25205" target="_blank"
              >25205</a
            >.
          </div>
        </div>
        <template v-if="!isMobile()">
          <div class="Stat">
            <div class="Num">{{ validatorTotalBalance }}</div>
            <div class="NumExp">Total Validator Balance</div>
            <div class="NumDetail">
              Including ETH rewards accrued by SharedStake validators
            </div>
          </div>
          <div class="Stat">
            <div class="Num">{{ profit }}</div>
            <div class="NumExp">Total profit</div>
            <div class="NumDetail">
              ETH Profits generated by SharedStake validators
            </div>
          </div>
          <div class="Stat">
            <div class="Num">{{ validatorsOnline }}</div>
            <div class="NumExp">Validators online</div>
            <div class="NumDetail">SharedStake validator current status</div>
          </div>

          <div class="Stat">
            <div class="Num">{{ validatorsSlashed }}</div>
            <div class="NumExp">Validators slashed</div>
            <div class="NumDetail">
              SharedStake validator that have been slashed
            </div>
          </div>

          <div class="Stat">
            <div class="Num">{{ validatorVirtualPrice }}</div>
            <div class="NumExp">Virtual price</div>
            <div class="NumDetail">Redemption price of 1 vETH2 at merge</div>
          </div>
          <div class="Stat">
            <div class="Num">{{ vpPostFees }}</div>
            <div class="NumExp">Virtual Price post fees</div>
            <div class="NumDetail">
              vETH2 redemption price at merge post fees based on
              <a
                href="https://snapshot.org/#/sharedstake.eth/proposal/QmQBWBsAucwB7vtxMhYmsn7nQ1J3VWvGD3knrdQP3knjou"
                target="_blank"
                >SIP-22</a
              >.
            </div>
          </div>
          <div class="Stat">
            <div class="Num">{{ elapsed }}</div>
            <div class="NumExp">Total uptime (months)</div>
            <div class="NumDetail">Uptime so far at SharedStake in months</div>
          </div>
        </template>
      </div> -->
      <div v-if="isMobile()">
        <p class="text-center">
          More detailed dashboard available on desktops with an ETH RPC provider
        </p>
      </div>
    </div>
    <div class="Container" v-show="scrolled >= 1000">
      <div class="exp background2" />
      <div class="second">
        <div class="X Eth">
          <ImageVue :src="'eth.png'" :size="'90px'" />
        </div>
        <ImageVue
          :src="windowWidth > 900 ? 'next.svg' : 'down.svg'"
          :size="'15px'"
          class="X next1"
        />
        <div class="X vEth2">
          <ImageVue :src="'vEth2.png'" :size="'163px'" />
        </div>
        <ImageVue
          :src="windowWidth > 900 ? 'next.svg' : 'down.svg'"
          :size="'15px'"
          class="X next2"
        />
        <div class="X reward">
          <ImageVue :src="'Reward.png'" :size="'127px'" />
        </div>
        <ImageVue
          :src="windowWidth > 900 ? 'next.svg' : 'down.svg'"
          :size="'15px'"
          class="X next3"
        />
        <div class="X harvest">
          <ImageVue :src="'Harvest.png'" :size="'92px'" />
        </div>
        <div class="Exp EthExp">Stake any amount of Eth</div>
        <div class="Exp vEth2Exp">Receive your vEth2 token</div>
        <div class="Exp rewardExp">
          Simply holding vEth2 entitles you to staking rewards
        </div>
        <div class="Exp harvestExp">
          Harvest more yield with your vEth2 in supported DeFi protocols!
        </div>
        <div class="exp Information" v-show="scrolled >= 1500">
          <div class="InfoHeader centertext" v-show="scrolled >= 1500">
            Staking with SharedStake
          </div>
          <div class="exp Info" v-show="scrolled >= 1500">
            SharedStake users earn staking rewards every block, whether you hodl
            your stake or decide to invest your vEth2 in supported Ethereum
            dapps like Uniswap, SushiSwap, Curve, Maker, Compound, Aave, and
            many more...
          </div>
          <div class="exp Info" v-show="scrolled >= 1500">
            vEth2 is designed for DeFi compatibility. It is a yield bearing
            token with a 1:1 price ratio with Ether. vEth2 staking is also
            incentivized further with SGT, the SharedStake Governance Token.
          </div>
          <div class="LearnButton">
            <a
              href="https://docs.sharedstake.finance/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn More
            </a>
          </div>
        </div>
      </div>
    </div>
    <div
      class="Container flex_column"
      v-show="scrolled >= 2500"
      :style="{ paddingBottom: '5rem' }"
    >
      <div class="flex_row vEth2PanelHeader">
        <ImageVue :src="'vEth2.png'" :size="'123px'" class="exp" />
        <div class="StatsHeader">vEth2</div>
      </div>
      <div class="exp InfoHeader DropShadow centertext">
        Yield Bearing Wrapped Ether
      </div>
      <div class="exp background3" />
      <div class="third">
        <div class="Bubble">
          <div class="exp InfoHeader">Financially Optimized</div>
          <div class="exp Info mb30">
            SharedStake optimizes Eth2 staking profits by creating an off-chain
            yield bearing stable token (vEth2 has a 1:1 price ratio with Ether).
            Ethereum2 profit distribution will start with the Eth2 launch so
            until then, track your Eth2 profits in the SharedStake Dashboard.
          </div>
          <ImageVue
            :src="'discount.svg'"
            :size="'70px'"
            class="exp ICON reverse"
          />
        </div>
        <div class="Bubble">
          <div class="exp InfoHeader">DeFi Compatible</div>
          <div class="exp Info mb30">
            By using vEth2 instead of other wrapped Ether tokens, DeFi users
            gain an extra 8-9% yearly growth with off-chain profit distribution.
            <br />
            Since vEth2 doesn't contain any 'imaginary' staking rewards, its
            stability is derived from its peg to Ether's value, practically
            eliminating concerns with Impermanent Loss.
          </div>
          <ImageVue
            :src="'diamond.svg'"
            :size="'70px'"
            class="exp ICON reverse"
          />
        </div>
        <div class="Bubble">
          <div class="exp InfoHeader">Incentivized Staking</div>
          <div class="exp Info mb30">
            On top of Ethereum2 staking profits, holding vEth2 and leveraging it
            on other Decentralized Finance applications is further incentivized
            with SGT, used as a Proof of Participation token within the
            SharedStake Protocol.
          </div>
          <ImageVue
            :src="'dowload.svg'"
            :size="'70px'"
            class="exp ICON reverse"
          />
        </div>
        <div class="Bubble">
          <div class="exp InfoHeader">Built-in Exit Pool</div>
          <div class="exp Info mb30">
            10% of all staked Ether remains in the staking contract, creating a
            liquidity bridge between all users, old and new. <br />
            SharedStakers can un-stake their Ether at anytime by burning their
            vEth2 through the staking contract, subject to the pooled amount.
          </div>
          <ImageVue
            :src="'balance.svg'"
            :size="'70px'"
            class="exp ICON reverse"
          />
        </div>
      </div>
      <div class="LearnButton">
        <a
          href="https://sips.sharedstake.org/SIPS/sip-3.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn More</a
        >
      </div>
    </div>
    <div v-show="scrolled > 3800">
      <Partners />
    </div>
    <div
      class="BadgeContainer flex_column"
      v-show="scrolled >= 4400"
      :style="{ paddingBottom: '5rem' }"
    >
      <div class="StatsHeader">Audit</div>
      <div class="flex_column">
        <a
          href="https://github.com/SharedStake/SharedStake-ui/blob/main/public/assets/static/AuditReport.pdf?raw=true"
          target="_blank"
          rel="noopener noreferrer"
          class="certikLogo"
        >
          <ImageVue
            :src="'certik-foundation-logo-white.png'"
            :size="'400px'"
            class="certikLogo"
          />
        </a>
      </div>
    </div>
    <!-- <div class="exp roadMap" v-show="scrolled > 4700"> -->
      <!-- disable the roadmap as its outdated TODO: new roadmap -->
    <div class="exp roadMap" v-show="false">
      <div class="mainBox">
        <div class="exp titleBox">
          <div class="X">Roadmap</div>
        </div>
        <div class="main">
          <div class="mainCon">
            <div class="list">
              <div class="item">
                <div class="date">2020 Q4</div>
                <div class="text">Protocol Launch</div>
              </div>

              <div class="item">
                <div class="date">2021 Q1</div>
                <div class="text">
                  Smart Contract Security Audit by Certik &amp; SGT Airdrop
                </div>
              </div>

              <div class="item">
                <div class="date">2021 Q2</div>
                <div class="text">500 Validators Created</div>
              </div>

              <div class="item">
                <div class="date">2021 Q3</div>
                <div class="text">Leveraged Eth2 Staking with Ruler</div>
              </div>

              <div class="item">
                <div class="date">2021 Q4</div>
                <div class="text">Decentralized Validators Backed by SGT</div>
              </div>

              <div class="item">
                <div class="date">2022</div>
                <div class="text">
                  vEth2-backed AMM Provides Eth2 Staking Profits to LPs
                </div>
              </div>
              <div class="item">
                <div class="date">2023</div>
                <div class="text">
                  SGT-based Decentralized Automated Staking Mechanism on Mainnet
                </div>
              </div>
            </div>
            <div class="curve"></div>
            <div class="list next">
              <div class="item">
                <div class="date">2021 Q1</div>
                <div class="text">DAO Launched</div>
              </div>
              <div class="item">
                <div class="date">2021 Q2</div>
                <div class="text">
                  First Incentivized Pools for vEth2 on Saddle
                </div>
              </div>
              <!-- <div class="item">
                <div class="date">2021 Q2</div>
                <div class="text">DeFi Support with Barbecue.js</div>
              </div>
              <div class="item">
                <div class="date">2021 Q3</div>
                <div class="text">
                  More Integrations with DeFi Protocols through Sauce.js...
                </div>
              </div>
              <div class="item">
                <div class="date">2022</div>
                <div class="text">
                  Staked Ether in Use on Multiple Blockchains
                </div>
              </div> -->
              <div class="item">
                <div class="date">2023</div>
                <div class="text">Ethereum2 Deployed</div>
              </div>
              <div class="item">
                <div class="date">Eth2 &amp; Beyond</div>
                <div class="text">
                  Ethereum2 is just the beginning for SharedStake...
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- <div class="flex_column" v-show="scrolled >= 5500">
      <div class="exp Information" v-show="scrolled >= 5500">
        <div class="InfoHeader centertext" v-show="scrolled >= 5500">
          Subscribe for updates from the team
        </div>
        <div class="exp Info" v-show="scrolled >= 5500">
          <MailingListSubscribeForm />
        </div>
      </div>
    </div> -->
    <!-- <div class="Container" v-show="scrolled <= 5500"></div> -->
  </div>
</template>

<script>
import ImageVue from "../Handlers/ImageVue";
// import MailingListSubscribeForm from "../Common/MailingListSubscribeForm";
import Partners from "./Partners";
import axios from "axios";
import BN from "bignumber.js";
import { SGT_uniswap, geyser_SGT_uniswap, vEth2 } from "@/contracts";
import { priceInUsdAsync } from "@/utils/coingecko";

export default {
  components: {
    ImageVue,
    // MailingListSubscribeForm,
    Partners,
  },
  props: ["scrolled", "windowWidth"],
  data() {
    return {
      TVL: 16000,
      TVLinUsd: 0,
      APY: "",
      validatorTotalBalance: 16543,
      validatorVirtualPrice: 1.0377,
      validatorsSlashed: 0,
      validatorApr: 6,
      vpPostFees: 1.03,
      elapsed: 1,
      validatorsOnline: 500,
      profit: 543,
      indices: [
        "91086",
        "99502",
        "99532",
        "99506",
        "99645",
        "99643",
        "99544",
        "99540",
        "99539",
        "99512",
        "99652",
        "91090",
        "99549",
        "99518",
        "99589",
        "99644",
        "91063",
        "99492",
        "99513",
        "99606",
        "91084",
        "91135",
        "99538",
        "99507",
        "99639",
        "91083",
        "99522",
        "99520",
        "99594",
        "99592",
        "99636",
        "99533",
        "99529",
        "99516",
        "91081",
        "99554",
        "99552",
        "99530",
        "99601",
        "99634",
        "99627",
        "91089",
        "91085",
        "99543",
        "99524",
        "99614",
        "99597",
        "99587",
        "99651",
        "99629",
        "99555",
        "99600",
        "99607",
        "99619",
        "99630",
        "99503",
        "99631",
        "99632",
        "91050",
        "99494",
        "99525",
        "99511",
        "99655",
        "91053",
        "99491",
        "99583",
        "99654",
        "91082",
        "99493",
        "99548",
        "99505",
        "99586",
        "99576",
        "99650",
        "99547",
        "99535",
        "99534",
        "99637",
        "99541",
        "99528",
        "99519",
        "99613",
        "99605",
        "99653",
        "99635",
        "99626",
        "91049",
        "99608",
        "99648",
        "99640",
        "99641",
        "99638",
        "91088",
        "91052",
        "99584",
        "99633",
        "99628",
        "99615",
        "99498",
        "99537",
        "99610",
        "99595",
        "99591",
        "99588",
        "99617",
        "99623",
        "91087",
        "99510",
        "99579",
        "99497",
        "99527",
        "99514",
        "99521",
        "99596",
        "99581",
        "99577",
        "99649",
        "99647",
        "99536",
        "99609",
        "99612",
        "99582",
        "99621",
        "99620",
        "99509",
        "99602",
        "99578",
        "99658",
        "99496",
        "99504",
        "99515",
        "99642",
        "99551",
        "99545",
        "99604",
        "99598",
        "99656",
        "99495",
        "99542",
        "99526",
        "99603",
        "99599",
        "99646",
        "91047",
        "99523",
        "99517",
        "99616",
        "99622",
        "99590",
        "99585",
        "99657",
        "99553",
        "99546",
        "99508",
        "99611",
        "99593",
        "99618",
        "99624",
        "99575",
        "99574",
        "99566",
        "99571",
        "99564",
        "99570",
        "99568",
        "99563",
        "99567",
        "99565",
        "99572",
        "99569",
        "115084",
        "115048",
        "115059",
        "115064",
        "115074",
        "115099",
        "115101",
        "115102",
        "115038",
        "115045",
        "115076",
        "115041",
        "115054",
        "115063",
        "115070",
        "115071",
        "115080",
        "115092",
        "115028",
        "115029",
        "115051",
        "115078",
        "115088",
        "115098",
        "115030",
        "115052",
        "115073",
        "115077",
        "115090",
        "115095",
        "115106",
        "115032",
        "115061",
        "115081",
        "115097",
        "115039",
        "115068",
        "115060",
        "115067",
        "115075",
        "115086",
        "115094",
        "115105",
        "115053",
        "115057",
        "115055",
        "115044",
        "115050",
        "115066",
        "115093",
        "115103",
        "115027",
        "115037",
        "115040",
        "115065",
        "115069",
        "115079",
        "115091",
        "115104",
        "115033",
        "115035",
        "115036",
        "115046",
        "115058",
        "115082",
        "115042",
        "115043",
        "115056",
        "115062",
        "115087",
        "115034",
        "115049",
        "115072",
        "115083",
        "115085",
        "115089",
        "115096",
        "115100",
        "115031",
        "115047",
        "115282",
        "115149",
        "115212",
        "115202",
        "115289",
        "115350",
        "115359",
        "115156",
        "115177",
        "115351",
        "115365",
        "115251",
        "115276",
        "115117",
        "115304",
        "115248",
        "115279",
        "115297",
        "115303",
        "115317",
        "115328",
        "115151",
        "115205",
        "115226",
        "115249",
        "115265",
        "115321",
        "115128",
        "115172",
        "115313",
        "115349",
        "115363",
        "115267",
        "115293",
        "115284",
        "115285",
        "115220",
        "115224",
        "115228",
        "115142",
        "115179",
        "115319",
        "115244",
        "115259",
        "115233",
        "115239",
        "115258",
        "115281",
        "115296",
        "115334",
        "115165",
        "115188",
        "115342",
        "115133",
        "115158",
        "115252",
        "115268",
        "115292",
        "115298",
        "115141",
        "115214",
        "115236",
        "115126",
        "115199",
        "115335",
        "115343",
        "115352",
        "115225",
        "115324",
        "115196",
        "115294",
        "115235",
        "115253",
        "115347",
        "115184",
        "115245",
        "115169",
        "115195",
        "115201",
        "115355",
        "115153",
        "115168",
        "115280",
        "115193",
        "115210",
        "115204",
        "115264",
        "115312",
        "115358",
        "115163",
        "115185",
        "115190",
        "115367",
        "115125",
        "115131",
        "115256",
        "115339",
        "115118",
        "115132",
        "115260",
        "115307",
        "115152",
        "115240",
        "115221",
        "115291",
        "115364",
        "115139",
        "115181",
        "115208",
        "115144",
        "115150",
        "115330",
        "115160",
        "115217",
        "115242",
        "115277",
        "115301",
        "115302",
        "115306",
        "115348",
        "115136",
        "115162",
        "115299",
        "115275",
        "115194",
        "115269",
        "115340",
        "115366",
        "115166",
        "115290",
        "115287",
        "115145",
        "115237",
        "115333",
        "115219",
        "115274",
        "115211",
        "115241",
        "115261",
        "115272",
        "115273",
        "115283",
        "115171",
        "115200",
        "115305",
        "115322",
        "115310",
        "115344",
        "115122",
        "115206",
        "115356",
        "115134",
        "115222",
        "115254",
        "115320",
        "115137",
        "115154",
        "115130",
        "115255",
        "115341",
        "115138",
        "115174",
        "115246",
        "115270",
        "115327",
        "115123",
        "115209",
        "115189",
        "115243",
        "115309",
        "115121",
        "115170",
        "115215",
        "115247",
        "115311",
        "115326",
        "115135",
        "115263",
        "115198",
        "115223",
        "115250",
        "115286",
        "115300",
        "115161",
        "115213",
        "115353",
        "115357",
        "115187",
        "115191",
        "115227",
        "115176",
        "115180",
        "115148",
        "115331",
        "115119",
        "115147",
        "115257",
        "115271",
        "115323",
        "115146",
        "115173",
        "115316",
        "115329",
        "115155",
        "115182",
        "115164",
        "115175",
        "115192",
        "115216",
        "115232",
        "115345",
        "115120",
        "115143",
        "115238",
        "115278",
        "115325",
        "115360",
        "115207",
        "115229",
        "115218",
        "115346",
        "115361",
        "115183",
        "115186",
        "115315",
        "115362",
        "115178",
        "115197",
        "115140",
        "115234",
        "115332",
        "115230",
        "115262",
        "115157",
        "115295",
        "115318",
        "115337",
        "115159",
        "115266",
        "115354",
        "115129",
        "115336",
        "115338",
        "115288",
        "115308",
        "115167",
        "115203",
        "115314",
        "115124",
        "115127",
      ],
    };
  },
  async mounted() {
    this.setupTvl();
    if (!this.isMobile()) {
      this.setupApy();
      this.getValidatorInfo();
    }
  },
  methods: {
    isMobile() {
      // https://stackoverflow.com/questions/48515023/display-different-vuejs-components-for-mobile-browsers
      if (
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
          navigator.userAgent
        )
      ) {
        return true || window.ethereum; // mobile browsers will load if eth rpc available.
      } else {
        return false;
      }
    },
    async setupTvl() {
      try {
        this.TVL = await this.fetchTvlFromEtherscan();
      } catch (e) {
        const STATIC_TVL = 17688; // Updated 1 feb 2023

        if (!this.isMobile()) {
          try {
            this.TVL = await this.fetchTvlWithWallet();
          } catch (e) {
            this.TVL = BN(STATIC_TVL).toString();
          }
        } else {
          this.TVL = BN(STATIC_TVL).toString();
        }
      } finally {
        this.setTvlInUsd(this.TVL);
      }
    },
    async getValidatorInfo() {
      let results = [];
      let reqUrl = "https://beaconcha.in/api/v1/validator/";
      let chunkArray = (array, size) => {
        if (array.length <= size) {
          return [array];
        }
        return [array.slice(0, size), ...chunkArray(array.slice(size), size)];
      };
      async function getAllValidatorInfo(indices) {
        // disable the dashboard, exit early for now with just 1 validator
        indices = indices[0];
        // beacon chain api supports 100 indices per call, and a max of 10 calls/min for free tier
        await Promise.all(
          chunkArray(indices, 100).map(async (chunk) => {
            let url = reqUrl.concat(chunk.toString());
            let res = await axios.get(url);
            results = results.concat(res.data.data);
          })
        );
      }
      await getAllValidatorInfo(this.indices);

      let startTime = 1616502743000;
      let elapsed = Date.now() - startTime;
      let msInYr = 1000 * 60 * 60 * 24 * 365;

      let totalBal = 0;
      let effectiveBal = 0;
      let status = 0;
      let slashed = 0;
      results.forEach((validator) => {
        totalBal += validator.balance;
        effectiveBal += validator.effectivebalance;
        if (validator.status == "active_online") status++;
        if (validator.slashed) slashed++;
      });
      this.validatorsSlashed = slashed;
      this.validatorsOnline = status;
      this.validatorVirtualPrice = BN(totalBal / effectiveBal)
        .toFixed(4)
        .toString();
      this.validatorTotalBalance = BN(totalBal)
        .div(1e9)
        .toFixed(0)
        .toString();
      this.profit = BN(totalBal - effectiveBal)
        .div(1e9)
        .toFixed(2)
        .toString();
      this.validatorApr = (((this.profit / elapsed) * msInYr) / this.TVL) * 100;
      this.validatorApr = this.validatorApr.toFixed(2);
      this.vpPostFees =
        this.validatorVirtualPrice - (this.validatorVirtualPrice - 1) * 0.2;
      this.vpPostFees = this.vpPostFees.toFixed(4);
      this.elapsed = ((12 * elapsed) / msInYr).toFixed(2);

    },
    async setupApy() {
      try {
        this.getAPY();
      } catch (e) {
        this.APY = await BN(6).toString();
      }
    },
    async getAPY() {
      // Temporary till defi mining starts again
      this.APY = 5;
      try {
        let token = SGT_uniswap();
        let tokenGeyser = geyser_SGT_uniswap();
        if (!token || !tokenGeyser) {
          console.error("Contracts not available");
          return;
        }
        let reserves = await token.getReserves();
        let Sgt = reserves[0];
        let totalSupply = await token.totalSupply();
        let tokenPerSgt = totalSupply / (Sgt * 2n);
        let totalStaked = await tokenGeyser.totalSupply();
        totalStaked = BN(totalStaked.toString());
        let now = Math.floor(Date.now() / 1000);
        let until = await tokenGeyser.periodFinish();
        let remDays = BN(Number(until) - now).div(60).div(60).div(24); //get remaining days
        let stakedSchedule = remDays;
        let duration = await tokenGeyser.rewardsDuration(); //in second
        let remRewards = BN(remDays).times(
          BN(75000).div(
            BN(Number(duration))
              .div(60)
              .div(60)
              .div(24)
          )
        );
        let locked = BN(remRewards);
        let APY = Math.round(
          BN(
            100 *
              tokenPerSgt *
              ((locked * 1e18) / totalStaked) *
              (360 / stakedSchedule)
          )
        ).toString();
        this.APY = APY;
        return await Promise.resolve(APY);
      } catch {
        this.APY = BN(6).toString();
        return await Promise.resolve(BN(6).toString());
      }
    },
    async fetchTvlFromEtherscan() {
      let response = await axios.get(
        "https://api.etherscan.io/api?module=stats&action=tokensupply&contractaddress=0x898bad2774eb97cf6b94605677f43b41871410b1&apikey=GKKIY3WXXG1EICPRKACRR75MA4UE7ANFY8"
      );
      return BN(response.data.result)
        .div(1e18)
        .toFixed(0)
        .toString();
    },
    async fetchTvlWithWallet() {
      if (!window.ethereum) {
        throw "Window doesn't have ethereum enabled";
      }

      const vEth2Contract = vEth2();
      if (!vEth2Contract) {
        console.error("vETH2 contract not available");
        return "0";
      }
      const vETH2TotalSupply = await vEth2Contract.totalSupply();

      return BN(vETH2TotalSupply.toString())
        .div(1e18)
        .toFixed(0)
        .toString();
    },
    async setTvlInUsd(tvlInETH) {
      const etherPrice = await priceInUsdAsync("ethereum");
      this.TVLinUsd = etherPrice * tvlInETH;
    },
  },
};
</script>

<style scoped>
/* Custom styles that can't be easily replaced with Tailwind utilities */

.downSign {
  @apply flex justify-center items-center bottom-2.5 sticky;
}

.Container {
  @apply relative min-h-screen text-white;
  z-index: 1;
}

.LogoContainer {
  @apply bg-no-repeat bg-center grid grid-cols-1 grid-rows-1 justify-center items-center;
  background-image: url('bg-1.png');
}

.BadgeContainer {
  @apply relative justify-center items-center text-white;
  z-index: 1;
}

.first {
  @apply pt-40 grid grid-cols-1 md-large:grid-cols-2 gap-0;
}

.Explanation {
  @apply px-0 py-0 animate-fade-in;
  padding-right: 75px;
  padding-bottom: 200px;
}

.Exp,
.Explanation,
.Logo {
  @apply self-center justify-self-center;
}

.mainTitle {
  @apply max-w-[900px] text-6xl font-medium;
  line-height: 1.05;
}

.exp {
  @apply text-xl font-light p-0 text-white/90 animate-fade-in;
  line-height: 31px;
  z-index: 1;
  text-justify: inter-word;
}

.social {
  @apply flex flex-row items-center justify-between animate-fade-in mt-8;
}

.socialLogo {
  @apply transition-all duration-500 ease-out cursor-pointer;
  filter: brightness(300%);
}

.socialLogo:hover {
  filter: brightness(500%);
}

.LearnButton {
  @apply w-fit mx-auto mt-6 text-xl px-6 py-2 border-2 border-white rounded-lg text-center transition-transform duration-500 ease-out cursor-pointer;
  z-index: 3;
}

.LearnButton:hover,
.StakeButton:hover {
  transform: scale(0.98);
}

.StakeButton {
  @apply text-xl font-medium text-black px-6 py-2 border-2 border-brand-primary bg-brand-primary rounded-lg text-center transition-transform duration-500 ease-out cursor-pointer;
  width: 142px;
  z-index: 3;
}

.background2 {
  @apply absolute z-0 w-full h-full top-0 bg-cover bg-no-repeat bg-center;
  background-image: url('bg-2.png');
  mask-image: radial-gradient(
    circle,
    rgba(0, 0, 0, 1) 20%,
    rgba(0, 0, 0, 0.4) 60%
  );
}

.second {
  @apply mx-auto grid gap-0 justify-center items-center;
  width: 90%;
  height: 90%;
  padding-top: 10%;
  padding-left: 5%;
  padding-right: 5%;
  grid-template-columns: 1fr 0.2fr 1fr 0.2fr 1fr 0.2fr 1fr;
  grid-template-rows: 0.6fr 0.4fr 1fr;
  grid-template-areas:
    "Eth next1 vEth2 next2 reward next3 harvest"
    "EthExp . vEth2Exp . rewardExp . harvestExp"
    "Information Information Information Information Information Information Information";
}

.Information {
  @apply text-xl max-w-[1500px] relative overflow-hidden;
  margin-top: 2.5vh;
  padding: 5vh;
  width: 70%;
  background-color: rgba(20, 20, 20, 0.85);
  color: rgba(255, 255, 255, 0.9);
  grid-area: Information;
  -webkit-box-shadow: inset 0px 0px 100px -60px rgba(255, 255, 255, 0.517);
  -moz-box-shadow: inset 0px 0px 100px -60px rgba(255, 255, 255, 0.619);
  box-shadow: inset 0px 0px 100px -60px rgba(255, 255, 255, 0.469);
}

.InfoHeader {
  @apply font-light mb-8 self-center;
  font-size: 34px;
  line-height: 42px;
  color: rgba(255, 255, 255, 0.95);
  grid-area: Header;
}

.Info {
  @apply mb-2.5 text-base;
  grid-area: Info;
}

.ICON {
  @apply self-center justify-self-end;
  grid-area: Icon;
}

.Information,
.X {
  @apply justify-self-center self-center z-10;
}

.Exp {
  @apply text-base px-2.5 py-0 font-light self-start;
  max-width: 200px;
  line-height: 31px;
  color: rgba(255, 255, 255, 0.9);
  z-index: 2;
  text-justify: inter-word;
}

.EthExp,
.Eth {
  @apply opacity-0;
  grid-area: Eth;
  animation: LogoEnter 0.5s ease-out 0.4s forwards;
}

.EthExp {
  grid-area: EthExp;
}

.vEth2Exp,
.vEth2 {
  @apply opacity-0;
  filter: brightness(200%);
  grid-area: vEth2;
  animation: LogoEnter 0.5s ease-out 0.6s forwards;
}

.vEth2Exp {
  grid-area: vEth2Exp;
}

.rewardExp,
.reward {
  @apply opacity-0;
  grid-area: reward;
  animation: LogoEnter 0.5s ease-out 0.8s forwards;
}

.rewardExp {
  grid-area: rewardExp;
}

.harvestExp,
.harvest {
  @apply opacity-0;
  grid-area: harvest;
  animation: LogoEnter 0.5s ease-out 1s forwards;
}

.harvestExp {
  grid-area: harvestExp;
}

.next1 {
  @apply opacity-0;
  grid-area: next1;
  animation: LogoEnter 0.5s ease-out 0.5s forwards;
}

.next2 {
  @apply opacity-0;
  grid-area: next2;
  animation: LogoEnter 0.5s ease-out 0.7s forwards;
}

.next3 {
  @apply opacity-0;
  grid-area: next3;
  animation: LogoEnter 0.5s ease-out 0.9s forwards;
}

.Stats {
  @apply min-h-auto max-w-[1500px] mx-auto relative overflow-hidden text-white justify-between;
  width: calc(100% - 60px);
  padding: 120px 0;
}

.StatsHeader {
  @apply text-white items-center pb-12 my-8 font-light animate-fade-in text-center;
  font-size: 3rem;
  line-height: 1.16em;
}

.StatsExp {
  @apply max-w-[800px] text-center mx-auto mb-8 text-2xl font-light p-0 text-white/75 animate-fade-in;
  line-height: 31px;
}

.StatsContent {
  @apply flex justify-between max-w-[1500px] mx-auto animate-fade-in;
  width: calc(100% - 60px);
  padding: 120px 0;
}

.Stat {
  @apply flex h-full flex-col items-center p-6 gap-2 text-center;
  border-radius: 2rem;
  flex-basis: 1/3;
}

.Num {
  @apply text-6xl font-semibold;
  line-height: 1.125;
}
.Num:after {
  content: "";
  @apply bg-brand-primary h-1 w-16 block mx-auto my-1;
}

.NumExp {
  @apply font-light text-xl;
  line-height: 1.25;
}

.NumDetail {
  @apply font-light text-sm text-gray-400;
}

.background3 {
  @apply absolute w-full h-full z-0 bg-cover bg-no-repeat bg-center;
  background-image: url('bg-3.png');
  mask-image: radial-gradient(
    circle,
    rgba(0, 0, 0, 1) 30%,
    rgba(0, 0, 0, 0.5) 100%
  );
}

.vEth2PanelHeader {
  @apply animate-glow;
  padding-top: 5vw;
  z-index: 5;
}

.third {
  @apply grid grid-cols-2 grid-rows-2 gap-8 max-w-[1500px] justify-center items-center;
  width: 90%;
  height: 90%;
  padding-left: 5%;
  padding-right: 5%;
  padding-bottom: 1%;
  z-index: 1;
  grid-template-areas:
    ". ."
    ". .";
}

.Bubble {
  @apply text-xl bg-dark-card relative overflow-hidden self-stretch justify-self-stretch grid gap-0;
  min-height: 77%;
  color: rgba(255, 255, 255, 0.9);
  padding: 45px;
  grid-template-columns: 1fr 0.3fr;
  grid-template-rows: 0.4fr 1fr;
  grid-template-areas:
    "Header Icon"
    "Info Info ";
}

.mb30 {
  @apply mb-8;
}

.roadMap {
  @apply pt-8 pb-20 flex items-center justify-center;
}

.mainBox {
  @apply w-4/5;
  padding-bottom: 1.13rem;
}

.titleBox {
  @apply text-white text-5xl relative left-0 top-0 z-10;
}

.main {
  @apply w-full pb-2 overflow-x-auto box-border;
}

.mainCon {
  @apply w-max;
}

.curve {
  @apply w-full bg-no-repeat bg-center my-2.5 relative left-0 top-0 overflow-hidden;
  background-image: url('curve.png');
  background-size: 100% auto;
  height: 90px;
}

.mainCon .curve canvas {
  @apply absolute left-0 top-0;
}

.mainCon .list {
  @apply flex relative left-0 top-0 pl-0.5;
}

.mainCon .list .item {
  @apply box-content flex-none;
  width: 260px;
}

.mainCon .list .item .date {
  @apply text-brand-primary pb-1;
  font-size: 17px;
  line-height: 1.43em;
}

.mainCon .list .item .text {
  @apply text-xs text-white w-3/5 pb-5;
  line-height: 1.47em;
}

.mainCon .list.next {
  @apply pl-20;
}

.centertext {
  @apply text-center;
}

.glow {
  filter: brightness(300%);
}

.reverse {
  @apply invert;
}

.DropShadow {
  filter: drop-shadow(0px 0px 4px rgba(255, 255, 255, 1)) brightness(500%);
}

@keyframes LogoEnter {
  from {
    transform: translate3d(-2rem, 0, 0);
    opacity: 0;
  }

  to {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}

@media only screen and (max-width: 900px) {
  .first {
    @apply grid gap-0 bg-no-repeat bg-center grid-cols-1 justify-center items-center;
    padding-top: 125px;
    background-image: url('bg-1.png');
    grid-template-rows: 0.1fr 2fr;
    grid-template-areas: ".";
  }

  .Logo {
    @apply p-0 max-w-[145px] min-w-[100px];
  }

  .LogoContainer {
    @apply bg-transparent bg-no-repeat bg-center grid grid-cols-1 grid-rows-1 justify-center items-center;
  }

  .mainTitle {
    @apply mx-auto;
  }

  .Explanation {
    @apply px-0 py-0 px-[23px] pb-[100px] animate-fade-in;
  }

  .StatsContent {
    @apply flex-col items-center p-0;
  }

  .StatsHeader {
    @apply text-[42px];
  }
  .InfoHeader {
    @apply p-4 pl-0 text-[25px];
  }

  .third {
    @apply grid-cols-1 grid-rows-1 gap-8;
    grid-template-areas:
      "."
      ".";
  }
}

@media only screen and (max-width: 770px) {
  .second {
    @apply grid-cols-1 grid-rows-[2fr_2fr_1fr_0.2fr_0.2fr_1fr_0.2fr_0.2fr_1fr_0.2fr_0.2fr_1fr_0.2fr] pb-[15vh];
    grid-template-areas:
      "Information"
      "Information"
      "Eth"
      "EthExp"
      "next1"
      "vEth2"
      "vEth2Exp"
      "next2"
      "reward"
      "rewardExp"
      "next3"
      "harvest"
      "harvestExp";
  }

  .certikLogo {
    @apply max-w-[80%] text-center;
  }

  .mainTitle {
    @apply text-[46px] leading-[1.1] mb-8;
  }
}

@media only screen and (max-width: 375px) {
  .mainTitle {
    @apply text-[36px];
  }
}
</style>
