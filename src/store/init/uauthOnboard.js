import UAuthBncOnboard from "@uauth/bnc-onboard"

const uauthOnboard = new UAuthBncOnboard({
  dappID: process.env.DAPP_ID,
  clientID: process.env.VUE_APP_CLIENT_ID,
  redirectUri: process.env.VUE_APP_REDIRECT_URI,
  postLogoutRedirectUri: process.env.VUE_APP_POST_LOGOUT_REDIRECT_URI,
  scope: "openid wallet email"
})

export default uauthOnboard
