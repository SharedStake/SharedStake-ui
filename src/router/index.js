import Vue from "vue";
import VueRouter from "vue-router";
// import { timeout } from "../utils/helpers"
// import store from "../store/index"
// const InfoPage = "https://docs.sharedstake.org"
// const DaoPage = "https://snapshot.page/#/sharedstake.eth"

const Stake = () => import("../components/Stake/Stake.vue")
// const Info = () => import("../components/Info/Info.vue")
// const Root = () => import("../components/Root/Root.vue")
const Earn = () => import("../components/Earn/Earn.vue")
// const Stats = () => import("../components/Stats/Stats.vue")
// const Dao = () => import("../components/Dao/Dao.vue")
// const Landing = () => import("../components/Landing/Landing.vue")
// const Roadmap = () => import("../components/Landing/Roadmap/Roadmap.vue")
const Root = () => import("../Root.vue")
const Landing = () => import("../components/Landing/Landing.vue")

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
    }
    ]
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
});

export default router;
