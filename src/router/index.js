import Vue from "vue";
import VueRouter from "vue-router";
// import { timeout } from "../utils/helpers"
// import store from "../store/index"
// const InfoPage = "https://docs.sharedstake.org"
// const DaoPage = "https://snapshot.page/#/sharedstake.eth"

const Stake = () => import("../components/Stake/Stake.vue")
const Earn = () => import("../components/Earn/Earn.vue")
//const Dashboard = () => import("../components/Dashboard/Dashboard.vue")
const PrivacyPolicy = () => import("../components/Privacy/PrivacyPolicy.vue")
const TermsOfService = () => import("../components/TermsOfService/TermsOfService.vue")
const FAQ = () => import("../components/FAQ/FAQ.vue")
// const Root = () => import("../components/Root/Root.vue")
// const Info = () => import("../components/Info/Info.vue")
// const Dao = () => import("../components/Dao/Dao.vue")
// const Landing = () => import("../components/Landing/Landing.vue")
// const Roadmap = () => import("../components/Landing/Roadmap/Roadmap.vue")
const Root = () => import("../Root.vue")
const Landing = () => import("../components/Landing/Landing.vue")

const Withdraw = () => import("../components/Withdraw/Withdraw.vue")
const Rollover = () => import("../components/Withdraw/Rollover.vue")
const Wrap = () => import("../components/Stake/Wrap.vue");
const Unwrap = () => import("../components/Stake/Unwrap.vue");

Vue.use(VueRouter);

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
//    {
//        path: "/dashboard",
//        name: "Dashboard",
//        component: Dashboard,
//    },
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
    }]
},
    // {
    //     path: "/roadmap",
    //     name: "Roadmap",
    //     component: Roadmap,
    // }, {
    //     path: "/app",
    //     name: "Root",
    //     component: Root,
    //     beforeEnter: async (to, from, next) => {
    //         await store.dispatch('setAddress');
    //         await timeout(200);
    //         next();
    //     },
    //     children: [
    //         {
    //             path: "/",
    //             name: "/",
    //         },
    //         {
    //             path: "/stake",
    //             name: "Stake",
    //             component: Stake,
    //         },
    //         {
    //             path: "/info",
    //             name: "Info",
    //             beforeEnter() { location.href = InfoPage },
    //             component: Info,
    //         },
    //         {
    //             path: "/earn",
    //             name: "Earn",
    //             component: Earn,
    //             children: [
    //                 {
    //                     path: ":address",
    //                     name: "Indexer",
    //                     component: Indexer
    //                 }
    //             ]
    //         },
    //         {
    //             path: "/stats",
    //             name: "Stats",
    //             component: Stats,
    //         },
    //         {
    //             path: "/dao",
    //             name: "Dao",
    //             beforeEnter() { location.href = DaoPage },
    //             component: Dao,
    //         },
    //         {
    //             path: "*",
    //             redirect: "/",
    //         },
    //     ]
    // }
];

const router = new VueRouter({
    mode: "history",
    base: "",
    routes,
    scrollBehavior (to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
    }
});

export default router;
