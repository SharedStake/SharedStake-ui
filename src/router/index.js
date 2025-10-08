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
const Wrap = () => import("../components/Stake/Wrap.vue");
const Unwrap = () => import("../components/Stake/Unwrap.vue");
const Blog = () => import("../components/Blog/Blog.vue");
const BlogPost = () => import("../components/Blog/BlogPost.vue");

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
    ]
}
];

const router = createRouter({
    history: createWebHistory(),
    routes,
    scrollBehavior (to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
    }
});

// SEO and performance route guards
router.beforeEach((to, from, next) => {
    // Preload critical routes that are likely to be visited
    const criticalRoutes = ['/stake', '/earn', '/withdraw'];
    
    if (criticalRoutes.includes(to.path)) {
        // Preload the next likely route
        const nextRoute = criticalRoutes[criticalRoutes.indexOf(to.path) + 1];
        if (nextRoute) {
            // Preload the next route in the background
            setTimeout(() => {
                if (nextRoute === '/stake') {
                    import('../components/Stake/Stake.vue');
                } else if (nextRoute === '/earn') {
                    import('../components/Earn/Earn.vue');
                } else if (nextRoute === '/withdraw') {
                    import('../components/Withdraw/Withdraw.vue');
                }
            }, 1000);
        }
    }
    
    // Set default SEO for routes that don't have specific SEO handling
    const routeSEO = {
        '/stake': {
            title: 'Stake ETH | SharedStake',
            description: 'Stake your ETH with SharedStake and earn 4-8% APR rewards. No 32 ETH minimum required.',
            keywords: 'stake eth, ethereum staking, liquid staking, stake ethereum',
            type: 'website'
        },
        '/earn': {
            title: 'Earn Rewards | SharedStake',
            description: 'Earn additional rewards on your staked ETH with SharedStake\'s DeFi integration opportunities.',
            keywords: 'earn rewards, defi rewards, ethereum rewards, staking rewards',
            type: 'website'
        },
        '/withdraw': {
            title: 'Withdraw ETH | SharedStake',
            description: 'Withdraw your staked ETH and rewards from SharedStake. Fast and secure withdrawal process.',
            keywords: 'withdraw eth, ethereum withdrawal, unstake eth, withdraw rewards',
            type: 'website'
        },
        '/faq': {
            title: 'FAQ | SharedStake',
            description: 'Frequently asked questions about SharedStake, Ethereum staking, and liquid staking derivatives.',
            keywords: 'faq, frequently asked questions, ethereum staking faq, sharedstake faq',
            type: 'website'
        }
    };
    
    // Apply route-specific SEO if available
    if (routeSEO[to.path]) {
        // Store SEO data for the component to use
        to.meta.seo = routeSEO[to.path];
    }
    
    next();
});

export default router;
