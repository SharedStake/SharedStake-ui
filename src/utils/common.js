/**
 * This file includes common libraries and settings for them; such as axios, web3, bignumber.js.
 * import the libraries from here to use
 */
import axios from "axios"

export const getCurrentGasPrices = async () => {
    let response = await axios.get('https://www.gasnow.org/api/v3/gas/price')
    return {
        low: response.data.data.slow / 1e9,
        medium: response.data.data.standard / 1e9,
        high: response.data.data.fast / 1e9
    }
}
import Notify from "bnc-notify";

export const notify = Notify({
    dappId: "ba574938-2a97-44e8-812f-653f9a6a499b", // [String] The API key created by step one above
    networkId: 1, // [Integer] The Ethereum network ID your Dapp uses.
    darkMode: true,
    desktopPosition: "topRight",
});
export function notifyHandler(hash) {
    let { emitter } = notify.hash(hash);
    emitter.on("all", (transaction) => ({
        onclick: () =>
            window.open(
                `https://etherscan.io/tx/${transaction.hash}`,
                "_blank",
                "noopener norefferer"
            ),
    }));
}

export function notifyNotification(message, type = "pending") {
    let notificationObject = {
        eventCode: "notification",
        type: type,
        message: message,
    };

    return notify.notification(notificationObject);
}