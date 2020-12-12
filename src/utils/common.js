/**
 * This file includes common libraries and settings for them; such as axios, web3, bignumber.js.
 * import the libraries from here to use
 */
import axios from "axios"

export const getCurrentGasPrices = async () => {
    let response = await axios.get('https://ethgasstation.info/json/ethgasAPI.json')
    return {
        low: response.data.safeLow / 10,
        medium: response.data.average / 10,
        high: response.data.fast / 10
    }
}
