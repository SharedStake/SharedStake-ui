// Howto: `npm i got; node mva.js`

const got = require("got");

const getFromCG = async function (suffix) {
  let url = `https://api.coingecko.com/api/v3/${suffix}`;
  let res = await got(url);
  const text = await res.body;
  return JSON.parse(text);
};

const getSGTPriceAtTime = async (dateStr = "9-9-2021") => {
  let token = "sharedstake-governance-token",
    prefix = "/history/?date=",
    loc = "&localization=false",
    url = `coins/${token}${prefix}${dateStr}${loc}`;
  let res = await getFromCG(url);

  return res.market_data.current_price.usd;
};

const getAvg = arr => arr.reduce((a, b) => a + b) / arr.length;

const getTAvg = async t => {
  let days = getDatesArr(t - 1);
  pricemap = await Promise.all(
    days.map(async d => {
      return await getSGTPriceAtTime(d);
    }),
  );
  return getAvg(pricemap);
};

const getDatesArr = num => {
  let d = new Date();
  d.setDate(d.getDate() - num);
  return dateLoop(d);
};

const dateLoop = start => {
  var now = new Date();
  var daysOfYear = [];
  for (var d = new Date(start); d <= now; d.setDate(d.getDate() + 1)) {
    day = String(d.getDate()).padStart(2, "0");
    daysOfYear.push(`${day}-${d.getMonth() + 1}-${d.getFullYear()}`);
  }
  return daysOfYear;
};

async function main() {
  let weeklyAvg = await getTAvg(7);
  let monthlyAvg = await getTAvg(30);

  if (monthlyAvg > weeklyAvg) {
    console.log(`Current Monthly MA > Weekly MA - reduce rewards`);
  } else {
    console.log(`Current Monthly MA < Weekly MA - increase rewards`);
  }
  console.log(`Weekly: ${weeklyAvg} | Monthly: ${monthlyAvg}`);
}

main();
