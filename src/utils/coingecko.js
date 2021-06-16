import axios from "axios"

const apiUrl = "https://api.coingecko.com/api/v3/";
export async function priceInUsdAsync(coinId) {
    const priceUrl = apiUrl + `coins/${coinId}?localization=false`
    let response = await axios.get(priceUrl);
    const tokenPrice = { price: response.data.market_data.current_price.usd, change: response.data.market_data.price_change_percentage_24h.toFixed(1) };
    console.log(tokenPrice)
    return tokenPrice;
}