import axios from "axios"

const apiUrl = "https://api.coingecko.com/api/v3/";

export async function priceInUsdAsync(coinId) {
    const priceUrl = apiUrl + `simple/price?ids=${coinId}&vs_currencies=usd`
    let response = await axios.get(priceUrl);
    const tokenPrice = response.data[coinId].usd;
    return tokenPrice;
}