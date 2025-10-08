<template>
  <div class="Landing">
    <!-- Animated background elements -->
    <div class="animated-bg">
      <div class="gradient-orb orb-1" />
      <div class="gradient-orb orb-2" />
      <div class="gradient-orb orb-3" />
      <div class="floating-shapes">
        <div class="shape shape-1" />
        <div class="shape shape-2" />
        <div class="shape shape-3" />
        <div class="shape shape-4" />
      </div>
    </div>
    <div
      v-show="scrolled >= 0"
      class="Container first"
    >
      <div class="LogoContainer">
        <ImageVue
          class="align-self-center justify-self-center"
          :src="'logo-red.svg'"
          :size="windowWidth > 900 ? '180px' : '20vw'"
        />
      </div>
      <div class="flex flex-col justify-center h-full p-4">
        <div class="mb-8 text-center md-large:max-w-xl md-large:text-left">
          <h1 class="relative mb-6 mainTitle">
            <span
              title="Established in 2020"
              class="absolute p-1 px-2 text-xs font-semibold text-gray-800 transform -translate-x-1/2 bg-gradient-to-r from-yellow-300 to-orange-400 rounded-sm -bottom-6 md:bottom-auto md:-top-6 md:left-0 left-1/2 md:translate-x-0 animate-pulse"
            >
              EST. 2020
            </span>
            <span class="gradient-text">ETHEREUM LIQUID STAKING DERIVATIVE!</span> <br>
            <span class="subtitle-text">Experience the Future of DeFi</span>
          </h1>
          <div class="exp">
            SharedStake is a decentralized Ethereum 2 staking solution that
            allows users to stake any amount of Ether and earn additional yield
            on top of their ETH2 rewards.
          </div>
        </div>
        <div
          class="flex items-center justify-center gap-6 mb-8 md-large:justify-start"
        >
          <div
            class="px-6 py-3 text-xl font-semibold transition-all border-2 border-transparent rounded-full bg-gradient-to-r from-gray-600 to-gray-700 md:font-medium md:text-3xl md:px-8 whitespace-nowrap cursor-not-allowed opacity-50 flex flex-col items-center shadow-lg"
          >
            <span>STAKE V2</span>
            <div class="text-xs mt-1">
              Coming Soon
            </div>
          </div>
          <a
            class="px-6 py-3 text-xl font-medium transition-all duration-300 border border-transparent rounded-full whitespace-nowrap md:text-2xl md:px-8 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 hover:from-purple-600 hover:via-pink-600 hover:to-red-600 hover:scale-105 hover:shadow-xl text-white"
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
            class="social-link"
          >
            <ImageVue
              :src="'socialmediaicons/Discord.svg'"
              size="24px"
              class="socialLogo"
            />
          </a>

          <div class="cursor-not-allowed opacity-50 flex flex-col items-center">
            <ImageVue
              :src="'socialmediaicons/TG.svg'"
              size="24px"
              class="socialLogo"
            />
            <div class="text-xs mt-1 text-center">
              Coming Soon
            </div>
          </div>
          <a
            href="https://github.com/SharedStake"
            target="_blank"
            rel="noopener noreferrer"
            class="social-link"
          >
            <ImageVue
              :src="'socialmediaicons/Git.svg'"
              size="24px"
              class="socialLogo"
            />
          </a>
          <a
            href="https://medium.com/@chimera_defi"
            target="_blank"
            rel="noopener noreferrer"
            class="social-link"
          >
            <ImageVue
              :src="'socialmediaicons/Medium.svg'"
              size="24px"
              class="socialLogo"
            />
          </a>
          <a
            href="https://twitter.com/ChimeraDefi"
            target="_blank"
            rel="noopener noreferrer"
            class="social-link"
          >
            <ImageVue
              :src="'socialmediaicons/Twitter.svg'"
              size="24px"
              class="socialLogo"
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
            class="px-4 py-2 text-base font-medium transition-all duration-300 border border-cyan-400 rounded-full whitespace-nowrap md:text-lg hover:border-cyan-300 hover:text-cyan-300 hover:bg-cyan-400/10 md:px-6 cursor-pointer"
            to="/rollover"
          >
            Rollover (Returning soon!)
          </span>
          <div
            class="px-4 py-2 text-base font-medium transition-all border border-gray-500 rounded-full whitespace-nowrap md:text-lg md:px-6 cursor-not-allowed opacity-50 flex flex-col items-center bg-gradient-to-r from-gray-600 to-gray-700"
          >
            <span>Withdraw</span>
            <div class="text-xs mt-1">
              Coming Soon
            </div>
          </div>
        </div>
      </div>
    </div>
    <div
      v-show="scrolled >= 0"
      class="downSign glow"
    >
      <ImageVue
        :src="'down.svg'"
        :size="'30px'"
      />
    </div>
    <div
      v-show="scrolled >= 350"
      class="Stats flex flex-col items-center justify-evenly"
    >
      <div class="StatsHeader gradient-text">
        Capital efficient staking
      </div>
      <div class="StatsExp">
        <span class="highlight-text">Financial optimization at its finest.</span>
      </div>
      <div class="StatsExp">
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
    <div
      v-show="scrolled >= 1000"
      class="Container"
    >
      <div class="exp background2" />
      <div class="second">
        <div class="X Eth">
          <ImageVue
            :src="'eth.png'"
            :size="'90px'"
          />
        </div>
        <ImageVue
          :src="windowWidth > 900 ? 'next.svg' : 'down.svg'"
          :size="'15px'"
          class="X next1"
        />
        <div class="X vEth2">
          <ImageVue
            :src="'vEth2.png'"
            :size="'163px'"
          />
        </div>
        <ImageVue
          :src="windowWidth > 900 ? 'next.svg' : 'down.svg'"
          :size="'15px'"
          class="X next2"
        />
        <div class="X reward">
          <ImageVue
            :src="'Reward.png'"
            :size="'127px'"
          />
        </div>
        <ImageVue
          :src="windowWidth > 900 ? 'next.svg' : 'down.svg'"
          :size="'15px'"
          class="X next3"
        />
        <div class="X harvest">
          <ImageVue
            :src="'Harvest.png'"
            :size="'92px'"
          />
        </div>
        <div class="Exp EthExp">
          Stake any amount of Eth
        </div>
        <div class="Exp vEth2Exp">
          Receive your vEth2 token
        </div>
        <div class="Exp rewardExp">
          Simply holding vEth2 entitles you to staking rewards
        </div>
        <div class="Exp harvestExp">
          Harvest more yield with your vEth2 in supported DeFi protocols!
        </div>
        <div
          v-show="scrolled >= 1500"
          class="exp Information"
        >
          <div
            v-show="scrolled >= 1500"
            class="InfoHeader centertext"
          >
            Staking with SharedStake
          </div>
          <div
            v-show="scrolled >= 1500"
            class="exp Info"
          >
            SharedStake users earn staking rewards every block, whether you hodl
            your stake or decide to invest your vEth2 in supported Ethereum
            dapps like Uniswap, SushiSwap, Curve, Maker, Compound, Aave, and
            many more...
          </div>
          <div
            v-show="scrolled >= 1500"
            class="exp Info"
          >
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
      v-show="scrolled >= 2500"
      class="Container flex flex-col items-center justify-evenly"
      :style="{ paddingBottom: '5rem' }"
    >
      <div class="vEth2PanelHeader flex flex-row items-center justify-evenly">
        <ImageVue
          :src="'vEth2.png'"
          :size="'123px'"
          class="exp"
        />
        <div class="StatsHeader gradient-text">
          vEth2
        </div>
      </div>
      <div class="exp InfoHeader DropShadow centertext gradient-text">
        Yield Bearing Wrapped Ether
      </div>
      <div class="exp background3" />
      <div class="third">
        <div class="Bubble enhanced-bubble">
          <div class="exp InfoHeader gradient-text">
            Financially Optimized
          </div>
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
        <div class="Bubble enhanced-bubble">
          <div class="exp InfoHeader gradient-text">
            DeFi Compatible
          </div>
          <div class="exp Info mb30">
            By using vEth2 instead of other wrapped Ether tokens, DeFi users
            gain an extra 8-9% yearly growth with off-chain profit distribution.
            <br>
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
        <div class="Bubble enhanced-bubble">
          <div class="exp InfoHeader gradient-text">
            Incentivized Staking
          </div>
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
        <div class="Bubble enhanced-bubble">
          <div class="exp InfoHeader gradient-text">
            Built-in Exit Pool
          </div>
          <div class="exp Info mb30">
            10% of all staked Ether remains in the staking contract, creating a
            liquidity bridge between all users, old and new. <br>
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
      <div class="LearnButton enhanced-learn-button">
        <a
          href="https://sips.sharedstake.org/SIPS/sip-3.html"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn More</a>
      </div>
    </div>
    <div v-show="scrolled > 3800">
      <Partners />
    </div>
    <div
      v-show="scrolled >= 4400"
      class="BadgeContainer flex flex-col items-center justify-evenly"
      :style="{ paddingBottom: '5rem' }"
    >
      <div class="StatsHeader">
        Audit
      </div>
      <div class="flex flex-col items-center justify-evenly">
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
    <!-- Roadmap section disabled - outdated content -->
    <div
      v-show="false"
      class="exp roadMap"
    >
      <div class="mainBox">
        <div class="exp titleBox">
          <div class="X">
            Roadmap
          </div>
        </div>
        <div class="main">
          <div class="mainCon">
            <div class="list">
              <div class="item">
                <div class="date">
                  2020 Q4
                </div>
                <div class="text">
                  Protocol Launch
                </div>
              </div>

              <div class="item">
                <div class="date">
                  2021 Q1
                </div>
                <div class="text">
                  Smart Contract Security Audit by Certik &amp; SGT Airdrop
                </div>
              </div>

              <div class="item">
                <div class="date">
                  2021 Q2
                </div>
                <div class="text">
                  500 Validators Created
                </div>
              </div>

              <div class="item">
                <div class="date">
                  2021 Q3
                </div>
                <div class="text">
                  Leveraged Eth2 Staking with Ruler
                </div>
              </div>

              <div class="item">
                <div class="date">
                  2021 Q4
                </div>
                <div class="text">
                  Decentralized Validators Backed by SGT
                </div>
              </div>

              <div class="item">
                <div class="date">
                  2022
                </div>
                <div class="text">
                  vEth2-backed AMM Provides Eth2 Staking Profits to LPs
                </div>
              </div>
              <div class="item">
                <div class="date">
                  2023
                </div>
                <div class="text">
                  SGT-based Decentralized Automated Staking Mechanism on Mainnet
                </div>
              </div>
            </div>
            <div class="curve" />
            <div class="list next">
              <div class="item">
                <div class="date">
                  2021 Q1
                </div>
                <div class="text">
                  DAO Launched
                </div>
              </div>
              <div class="item">
                <div class="date">
                  2021 Q2
                </div>
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
                <div class="date">
                  2023
                </div>
                <div class="text">
                  Ethereum2 Deployed
                </div>
              </div>
              <div class="item">
                <div class="date">
                  Eth2 &amp; Beyond
                </div>
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
  </div>
</template>

<script>
import ImageVue from "../Handlers/ImageVue.vue";
// import MailingListSubscribeForm from "../Common/MailingListSubscribeForm";
import Partners from "./Partners.vue";
import axios from "axios";
import BN from "bignumber.js";
import { SGT_uniswap, geyser_SGT_uniswap, vEth2 } from "@/contracts";
import { priceInUsdAsync } from "@/utils/coingecko";

export default {
  components: {
    ImageVue,
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
/*this is ok until 900px */

/* Animated background elements */
.animated-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  overflow: hidden;
}

.gradient-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  opacity: 0.3;
  animation: float 20s ease-in-out infinite;
}

.orb-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.orb-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(45deg, #a8e6cf, #ffd3a5);
  top: 60%;
  right: 20%;
  animation-delay: -7s;
}

.orb-3 {
  width: 250px;
  height: 250px;
  background: linear-gradient(45deg, #ff9a9e, #fecfef);
  bottom: 20%;
  left: 30%;
  animation-delay: -14s;
}

.floating-shapes {
  position: absolute;
  width: 100%;
  height: 100%;
}

.shape {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: float 15s ease-in-out infinite;
}

.shape-1 {
  width: 20px;
  height: 20px;
  top: 20%;
  left: 80%;
  animation-delay: -3s;
}

.shape-2 {
  width: 15px;
  height: 15px;
  top: 70%;
  left: 10%;
  animation-delay: -8s;
}

.shape-3 {
  width: 25px;
  height: 25px;
  top: 40%;
  right: 15%;
  animation-delay: -12s;
}

.shape-4 {
  width: 18px;
  height: 18px;
  bottom: 30%;
  left: 70%;
  animation-delay: -5s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-30px) rotate(120deg);
  }
  66% {
    transform: translateY(15px) rotate(240deg);
  }
}

/* Enhanced text styles */
.gradient-text {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4);
  background-size: 300% 300%;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: gradientShift 3s ease-in-out infinite;
}

.subtitle-text {
  font-size: 0.6em;
  font-weight: 300;
  color: rgba(255, 255, 255, 0.8);
  margin-top: 0.5rem;
  display: block;
}

.highlight-text {
  background: linear-gradient(45deg, #ffd700, #ffed4e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-weight: 500;
}

@keyframes gradientShift {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

/* Enhanced social links */
.social-link {
  transition: all 0.3s ease;
  border-radius: 50%;
  padding: 8px;
}

.social-link:hover {
  background: rgba(255, 255, 255, 0.1);
  transform: translateY(-2px) scale(1.1);
  box-shadow: 0 4px 15px rgba(255, 255, 255, 0.2);
}

/* Enhanced bubble styling */
.enhanced-bubble {
  transition: all 0.3s ease;
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
}

.enhanced-bubble:hover {
  transform: translateY(-5px);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
}

/* Enhanced learn button */
.enhanced-learn-button {
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  border: 2px solid transparent;
  background-clip: padding-box;
  position: relative;
  overflow: hidden;
}

.enhanced-learn-button::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: left 0.5s;
}

.enhanced-learn-button:hover::before {
  left: 100%;
}

.enhanced-learn-button:hover {
  transform: scale(1.05);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.downSign {
  display: flex;
  justify-content: center;
  align-items: center;
  bottom: 10px;
  position: sticky;
}

.Container {
  position: relative;
  min-height: 100vh;
  color: #fff;
  z-index: 1;
}

.LogoContainer {
  background-image: url(bg-1.png);
  background-repeat: no-repeat;
  background-position: center;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: 1fr;
  justify-content: center;
  align-items: center;
}

.BadgeContainer {
  position: relative;
  justify-content: center;
  align-items: center;
  color: #fff;
  z-index: 1;
}

.first {
  padding-top: 10rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr;
  gap: 0px 0px;
  grid-template-areas: ". .";
}

.Explanation {
  padding: 0 75px 200px 0;
  animation: TextEnter 0.4s ease-out backwards;
}

.Exp,
.Explanation,
.Logo {
  align-self: center;
  justify-self: center;
}

.mainTitle {
  overflow-wrap: normal;
  max-width: 900px;
  font-size: 64px;
  font-weight: 500;
  line-height: 1.05;
}

.exp {
  font-size: 21px;
  line-height: 31px;
  font-weight: 300;
  padding: 0px;
  color: rgba(255, 255, 255, 0.9);
  /* text-align: justify; */
  text-justify: inter-word;
  animation: TextEnter 0.6s ease-out backwards 0.2s;
  z-index: 1;
}

.social {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  animation: TextEnter 0.8s ease-out backwards;
  margin-top: 30px;
}

.socialLogo {
  filter: brightness(300%);
  transition: filter 0.5s ease-out;
  cursor: pointer;
}

.socialLogo:hover {
  filter: brightness(500%);
}

.LearnButton {
  width: fit-content;
  margin: 24px auto 0;
  font-size: 21px;
  padding: 0.5rem 1.5rem 0.5rem 1.5rem;
  border: 2px solid #fff;
  border-radius: 10px;
  text-align: center;
  transition: transform 0.5s ease-out;
  cursor: pointer;
  z-index: 3;
  grid-area: Button;
}

.LearnButton:hover,
.StakeButton:hover {
  transform: scale(0.98);
}

.StakeButton {
  font-size: 21px;
  font-weight: 500;
  color: black;
  padding: 0.5rem 1.5rem 0.5rem 1.5rem;
  border: 2px solid #e6007a;
  background-color: #e6007a;
  border-radius: 10px;
  text-align: center;
  width: 142px;
  /* max-height: 25px; */
  transition: transform 0.5s ease-out;
  cursor: pointer;
  z-index: 3;
  grid-area: Button;
}

.background2 {
  background-image: url(bg-2.png);
  position: absolute;
  z-index: 0;
  width: 100%;
  height: 100%;
  top: 0;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  mask-image: radial-gradient(
    circle,
    rgba(0, 0, 0, 1) 20%,
    rgba(0, 0, 0, 0.4) 60%
  );
}

.second {
  width: 90%;
  height: 90%;
  margin: auto;
  padding: 10% 5% 0 5%;
  display: grid;
  grid-template-columns: 1fr 0.2fr 1fr 0.2fr 1fr 0.2fr 1fr;
  grid-template-rows: 0.6fr 0.4fr 1fr;
  gap: 0px 0px;
  grid-template-areas:
    "Eth next1 vEth2 next2 reward next3 harvest"
    "EthExp . vEth2Exp . rewardExp . harvestExp"
    "Information Information Information Information Information Information Information";
  justify-content: center;
  align-items: center;
}

.Information {
  margin-top: 2.5vh;
  padding: 5vh;
  width: 70%;
  grid-area: Information;
  font-size: 1.2rem;
  max-width: 1500px;
  background-color: rgba(17, 26, 25, 0.85);
  position: relative;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.9);
  -webkit-box-shadow: inset 0px 0px 100px -60px rgba(255, 255, 255, 0.517);
  -moz-box-shadow: inset 0px 0px 100px -60px rgba(255, 255, 255, 0.619);
  box-shadow: inset 0px 0px 100px -60px rgba(255, 255, 255, 0.469);
}

.InfoHeader {
  font-size: 34px;
  font-weight: 300;
  line-height: 42px;
  margin-bottom: 30px;
  color: rgba(255, 255, 255, 0.95);
  grid-area: Header;
  align-self: center;
}

.Info {
  margin-bottom: 10px;
  font-size: 16px;
  grid-area: Info;
}

.ICON {
  grid-area: Icon;
  align-self: center;
  justify-self: end;
}

.Information,
.X {
  justify-self: center;
  align-self: center;
  z-index: 10;
}

.Exp {
  max-width: 200px;
  font-size: 16px;
  padding: 0 10px 0 10px;
  line-height: 31px;
  font-weight: 300;
  padding: 0px;
  color: rgba(255, 255, 255, 0.9);
  z-index: 2;
  align-self: start;
  /* text-align: justify; */
  text-justify: inter-word;
}

.EthExp,
.Eth {
  grid-area: Eth;
  opacity: 0;
  animation: LogoEnter 0.5s ease-out 0.4s forwards;
}

.EthExp {
  grid-area: EthExp;
}

.vEth2Exp,
.vEth2 {
  grid-area: vEth2;
  opacity: 0;
  animation: LogoEnter 0.5s ease-out 0.6s forwards;
  filter: brightness(200%);
}

.vEth2Exp {
  grid-area: vEth2Exp;
}

.rewardExp,
.reward {
  grid-area: reward;
  opacity: 0;
  animation: LogoEnter 0.5s ease-out 0.8s forwards;
}

.rewardExp {
  grid-area: rewardExp;
}

.harvestExp,
.harvest {
  grid-area: harvest;
  opacity: 0;
  animation: LogoEnter 0.5s ease-out 1s forwards;
}

.harvestExp {
  grid-area: harvestExp;
}

.next1 {
  grid-area: next1;
  opacity: 0;
  animation: LogoEnter 0.5s ease-out 0.5s forwards;
}

.next2 {
  grid-area: next2;
  opacity: 0;
  animation: LogoEnter 0.5s ease-out 0.7s forwards;
}

.next3 {
  grid-area: next3;
  opacity: 0;
  animation: LogoEnter 0.5s ease-out 0.9s forwards;
}

.Stats {
  width: calc(100% - 60px);
  min-height: auto;
  max-width: 1500px;
  margin: 0px auto;
  padding: 120px 0px;
  position: relative;
  overflow: hidden;
  color: #fff;
  justify-content: space-between;
}

.StatsHeader {
  color: rgb(255, 255, 255);
  -webkit-box-align: center;
  padding: 0 0 50px 0;
  align-items: center;
  font-size: 50px;
  line-height: 1.16em;
  margin: 30px;
  font-weight: 300;
  animation: TextEnter 0.4s ease-out backwards;
  text-align: center;
}

.StatsExp {
  max-width: 800px;
  text-align: center;
  margin: 0px auto 30px;
  font-size: 22px;
  line-height: 31px;
  font-weight: 300;
  padding: 0px;
  color: rgba(255, 255, 255, 0.75);
  animation: TextEnter 0.4s ease-out backwards 0.2s;
}

.StatsContent {
  display: flex;
  width: calc(100% - 60px);
  -webkit-box-pack: justify;
  justify-content: space-between;
  max-width: 1500px;
  margin: 0px auto;
  padding: 120px 0px;
  animation: TextEnter 0.4s ease-out backwards 0.4s;
}

.Stat {
  display: flex;
  height: 100%;
  flex-direction: column;
  align-items: center;
  padding: 1.5rem 2rem;
  gap: 0.5rem;
  border-radius: 2rem;
  text-align: center;
  flex-basis: 1/3;
}

.Num {
  font-size: 64px;
  line-height: 1.125;
  font-weight: 600;
}
.Num:after {
  content: "";
  @apply bg-brand-primary h-1 w-16 block mx-auto my-1;
}

.NumExp {
  font-weight: 300;
  font-size: 21px;
  line-height: 1.25;
}

.NumDetail {
  font-weight: 300;
  font-size: 14px;
  color: rgb(143, 143, 143);
}

.background3 {
  background-image: url(bg-3.png);
  position: absolute;
  width: 100%;
  height: 100%;
  z-index: 0;
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center;
  mask-image: radial-gradient(
    circle,
    rgba(0, 0, 0, 1) 30%,
    rgba(0, 0, 0, 0.5) 100%
  );
}

.vEth2PanelHeader {
  padding-top: 5vw;
  z-index: 5;
  animation: Glow 1s linear alternate infinite;
}

.third {
  width: 90%;
  height: 90%;
  padding: 0% 5% 1% 5%;
  z-index: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-template-rows: 1fr 1fr;
  gap: 30px 30px;
  grid-template-areas:
    ". ."
    ". .";
  max-width: 1500px;
  justify-content: center;
  align-items: center;
}

.Bubble {
  min-height: calc(77%);
  font-size: 1.2rem;
  background-color: rgba(17, 26, 25, 1);
  position: relative;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.9);
  align-self: stretch;
  justify-self: stretch;
  padding: 45px 45px 35px 45px;
  display: grid;
  grid-template-columns: 1fr 0.3fr;
  grid-template-rows: 0.4fr 1fr;
  gap: 0px 0px;
  grid-template-areas:
    "Header Icon"
    "Info Info ";
}

.mb30 {
  margin-bottom: 30px;
}

.roadMap {
  padding-top: 2rem;
  padding-bottom: 5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.mainBox {
  padding-bottom: 1.13rem;
  width: 80%;
}

.titleBox {
  color: #ffffff;
  font-size: 50px;
  position: relative;
  left: 0;
  top: 0;
  z-index: 10;
}

.main {
  width: 100%;
  padding-bottom: 0.5rem;
  overflow-x: auto;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
}

.mainCon {
  width: -webkit-max-content;
  width: -moz-max-content;
  width: max-content;
}

.curve {
  width: 100%;
  background-image: url(curve.png);
  background-size: 100% auto;
  background-repeat: no-repeat;
  background-position: center;
  height: 90px;
  margin: 0.6rem 0;
  position: relative;
  left: 0;
  top: 0;
  overflow: hidden;
}

.mainCon .curve canvas {
  position: absolute;
  left: 0;
  top: 0;
}

.mainCon .list {
  display: -webkit-flex;
  display: -moz-box;
  display: -ms-flexbox;
  display: flex;
  position: relative;
  left: 0;
  top: 0;
  padding-left: 0.1rem;
}

.mainCon .list .item {
  width: 260px;
  /**HERE */
  -moz-box-sizing: content-box;
  box-sizing: content-box;
  -webkit-flex: none;
  -moz-box-flex: 0;
  -ms-flex: none;
  flex: none;
}

.mainCon .list .item .date {
  font-size: 17px;
  color: #e6007a;
  line-height: 1.43em;
  padding-bottom: 0.3rem;
}

.mainCon .list .item .text {
  font-size: 12px;
  color: #ffffff;
  line-height: 1.47em;
  width: 60%;
  padding-bottom: 20px;
}

.mainCon .list.next {
  padding-left: 5rem;
}

/* body .roadMap .mainBox .main::-webkit-scrollbar-thumb {
  height: 5px;
  background: #555;
}
body .roadMap .mainBox .main::-webkit-scrollbar {
  background: #888;
  height: 4px;
} */
.centertext {
  text-align: center;
}

.glow {
  filter: brightness(300%);
}

.reverse {
  filter: invert(1);
}

.DropShadow {
  filter: drop-shadow(0px 0px 4px rgba(256, 256, 256, 1)) brightness(500%);
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

@keyframes Glow {
  from {
    filter: drop-shadow(0px 0px 4px rgba(255, 255, 255, 0.01)) brightness(120%);
  }

  to {
    filter: drop-shadow(0px 0px 4px rgba(256, 256, 256, 1)) brightness(200%);
  }
}

@keyframes TextEnter {
  from {
    transform: translate3d(0, 2rem, 0);
    opacity: 0;
  }

  to {
    transform: translate3d(0, 0, 0);
    opacity: 1;
  }
}

@media only screen and (max-width: 900px) {
  .first {
    padding-top: 125px;
    display: grid;
    gap: 0px 0px;
    grid-template-areas: ".";
    background-image: url(bg-1.png);
    background-repeat: no-repeat;
    background-position: center;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 0.1fr 2fr;
    justify-content: center;
    align-items: center;
  }

  .Logo {
    padding: 0;
    max-width: 145px;
    min-width: 100px;
  }

  .LogoContainer {
    background: transparent;
    background-repeat: no-repeat;
    background-position: center;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    justify-content: center;
    align-items: center;
  }

  .mainTitle {
    margin: 0 auto;
  }

  .Explanation {
    padding: 0 23px 100px 23px;
    animation: TextEnter 0.4s ease-out backwards;
  }

  .StatsContent {
    flex-direction: column;
    align-items: center;
    padding: 0px;
  }

  .StatsHeader {
    font-size: 42px;
  }
  .InfoHeader {
    padding: 15px 15px 15px 0;
    font-size: 25px;
  }

  .third {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr;
    gap: 30px 30px;
    grid-template-areas:
      "."
      ".";
  }
}

@media only screen and (max-width: 770px) {
  .second {
    grid-template-columns: 1fr;
    grid-template-rows: 2fr 2fr 1fr 0.2fr 0.2fr 1fr 0.2fr 0.2fr 1fr 0.2fr 0.2fr 1fr 0.2fr;
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
    padding-bottom: 15vh;
  }

  .certikLogo {
    max-width: 80%;
    text-align: center;
  }

  .mainTitle {
    font-size: 46px;
    line-height: 1.1;
    margin-bottom: 32px;
  }
}

@media only screen and (max-width: 375px) {
  .mainTitle {
    font-size: 36px;
  }
}
</style>
