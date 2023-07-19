
# SharedStake
```
vue implementation proposal on sharedstake
```

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).


## Codebase Implementations
### Referral Links

A referral link should look like the following:
`https://sharedstake.org/ref/<address>`
Where *"address"* is a placeholder of a wallet address.

*Example:*
`https://sharedstake.org/ref/0x868b66d7EE3960B83Df33D85b022b41E2454e23E`

This referral link will take the client to the SharedStake landing page `https://sharedstake.org/`.

In order to retrieve the referral address at any point throughout the codebase, use this local storage call `localStorage.getItem('referralAddress')`
