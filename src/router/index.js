import { createRouter, createWebHistory } from "vue-router";
// import { timeout } from "../utils/helpers"
// import store from "../store/index"
// const InfoPage = "https://docs.sharedstake.org"
// const DaoPage = "https://snapshot.page/#/sharedstake.eth"

const Stake = () => import("../components/Stake/Stake.vue")
const Earn = () => import("../components/Earn/Earn.vue")
const PrivacyPolicy = () => import("../components/Privacy/PrivacyPolicy.vue")
const TermsOfService = () => import("../components/TermsOfService/TermsOfService.vue")
const FAQ = () => import("../components/FAQ/FAQ.vue")
const Root = () => import("../Root.vue")
const Landing = () => import("../components/Landing/Landing.vue")

const Withdraw = () => import("../components/Withdraw/Withdraw.vue")
const Rollover = () => import("../components/Withdraw/Rollover.vue")
const WithdrawFromDeprecated = () => import("../components/Withdraw/WithdrawFromDeprecated.vue")
const Wrap = () => import("../components/Stake/Wrap.vue");
const Unwrap = () => import("../components/Stake/Unwrap.vue");
const Blog = () => import("../components/Blog/Blog.vue");
const BlogPost = () => import("../components/Blog/BlogPost.vue");
const ModularStakingApp = () => import("../components/ModularStaking/ModularStakingApp.vue");
const DocsCenter = () => import("../components/Docs/DocsCenter.vue");
const DocsOverviewPage = () => import("../components/Docs/pages/DocsOverviewPage.vue");
const DocsUserGuidePage = () => import("../components/Docs/pages/DocsUserGuidePage.vue");
const DocsReferralPage = () => import("../components/Docs/pages/DocsReferralPage.vue");
const DocsStakingRoutesPage = () => import("../components/Docs/pages/DocsStakingRoutesPage.vue");
const DocsArchitecturePage = () => import("../components/Docs/pages/DocsArchitecturePage.vue");
const DocsSecurityRisksPage = () => import("../components/Docs/pages/DocsSecurityRisksPage.vue");
const DocsOpsDeployPage = () => import("../components/Docs/pages/DocsOpsDeployPage.vue");
const DocsFaqPage = () => import("../components/Docs/pages/DocsFaqPage.vue");

// Vue.use(VueRouter); // No longer needed in Vue Router 4

let routes = [{
    path: "/",
    name: "/",
    component: Root,
    children: [{
        path: "/",
        name: "Landing",
        component: Landing,
    },
    {
        path: "/stake",
        name: "Stake",
        component: Stake,
    },
    {
        path: "/earn",
        name: "Earn",
        component: Earn,
    },
    {
        path: "/privacy",
        name: "Privacy Policy",
        component: PrivacyPolicy,
    },
    {
        path: "/terms",
        name: "Terms of Service",
        component: TermsOfService,
    },
    {
        path: "/faq",
        name: "FAQ",
        component: FAQ,
    },
    {
        path: "/withdraw",
        name: "Withdraw",
        component: Withdraw,
    },
    {
        path: "/rollover",
        name: "Rollover",
        component: Rollover,
    },
    {
        path: "/withdraw-from-deprecated",
        name: "WithdrawFromDeprecated",
        component: WithdrawFromDeprecated,
    },
    {
        path: "/wrap",
        name: "Wrap",
        component: Wrap,
    },
    {
        path: "/unwrap",
        name: "Unwrap",
        component: Unwrap,
    },
    {
        path: "/blog",
        name: "Blog",
        component: Blog,
    },
    {
        path: "/blog/:slug",
        name: "BlogPost",
        component: BlogPost,
    },
    {
        path: "/architecture",
        name: "Architecture",
        redirect: {
            path: "/docs/architecture",
            hash: "#protocol-architecture",
        },
    },
    {
        path: "/docs",
        component: DocsCenter,
        children: [
            {
                path: "",
                name: "DocsOverview",
                component: DocsOverviewPage,
            },
            {
                path: "user-guide",
                name: "DocsUserGuide",
                component: DocsUserGuidePage,
            },
            {
                path: "referral",
                name: "DocsReferral",
                component: DocsReferralPage,
            },
            {
                path: "staking-routes",
                name: "DocsStakingRoutes",
                component: DocsStakingRoutesPage,
            },
            {
                path: "architecture",
                name: "DocsArchitecture",
                component: DocsArchitecturePage,
            },
            {
                path: "security-risks",
                name: "DocsSecurityRisks",
                component: DocsSecurityRisksPage,
            },
            {
                path: "ops-deploy",
                name: "DocsOpsDeploy",
                component: DocsOpsDeployPage,
            },
            {
                path: "faq",
                name: "DocsFaq",
                component: DocsFaqPage,
            },
        ]
    },
    {
        path: "/v2",
        name: "V2 Staking",
        component: ModularStakingApp,
    },
    ]
}
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior (to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
          }
        if (to.hash) {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve({
                        el: to.hash,
                        top: 96,
                        behavior: "smooth",
                    });
                }, 150);
            });
        }
        return { top: 0, behavior: "smooth" };
    }
});

export default router;
