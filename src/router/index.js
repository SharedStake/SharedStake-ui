import Vue from "vue";
import VueRouter from "vue-router";

const notionInfoPage = "https://www.notion.so/SharedStake-b795e062fcb54f89a79b98f09a922c05"

const Stake = () => import("../components/Stake/Stake.vue")
const Info = () => import("../components/Info/Info.vue")
const Root = () => import("../components/Root/Root.vue")
const Earn = () => import("../components/Earn/Earn.vue")
const Stats = () => import("../components/Stats/Stats.vue")
const Dao = () => import("../components/Dao/Dao.vue")
const Landing = () => import("../components/Landing/Landing.vue")
const Roadmap = () => import("../components/Landing/Roadmap/Roadmap.vue")
const Indexer = () => import("../components/Indexer/Indexer.vue")

Vue.use(VueRouter);

let routes = [{
    path: "/",
    name: "Landing",
    component: Landing
}, {
    path: "/roadmap",
    name: "Roadmap",
    component: Roadmap,
}, {
    path: "/app",
    name: "Root",
    component: Root,
    children: [
        {
            path: "/",
            name: "/",
        },
        {
            path: "/stake",
            name: "Stake",
            component: Stake,
        },
        {
            path: "/info",
            name: "Info",
            beforeEnter() { location.href = notionInfoPage },
            component: Info,
        },
        {
            path: "/earn",
            name: "Earn",
            component: Earn,
            children: [
                {
                    path: ":address",
                    name: "Indexer",
                    component: Indexer
                }
            ]
        },
        {
            path: "/stats",
            name: "Stats",
            component: Stats,
        },
        {
            path: "/dao",
            name: "Dao",
            component: Dao,
        },
        {
            path: "*",
            redirect: "/",
        },
    ]
}];

const router = new VueRouter({
    mode: "history",
    base: "",
    routes,
});

export default router;
