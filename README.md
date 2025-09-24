# SharedStake
```
vue implementation of sharedstake
```

## Project setup
```
# Use a compatible Node version (nvm will read .nvmrc)
nvm use

# Install dependencies
yarn install
```

### Compiles and hot-reloads for development
```
yarn serve
```

### Compiles and minifies for production
```
yarn build
```

### Lints and fixes files
```
yarn lint
```

### Notes
- This repo targets Vue 2 with Vue CLI 4 and Tailwind 2 (PostCSS 7 compat).
- Node 18 LTS is recommended. For Node ≥17, scripts set `NODE_OPTIONS=--openssl-legacy-provider` to avoid OpenSSL issues with webpack/Terser.

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).
