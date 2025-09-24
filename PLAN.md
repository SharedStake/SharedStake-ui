## Upgrade and Maintenance Plan

### Goals
- Keep the app compiling, linting, and building reliably.
- Modernize dependencies conservatively to avoid breaking the Vue 2 UI.
- Document follow-ups for major upgrades or code rewrites.

### Current Stack (detected)
- Framework: Vue 2 (`vue@^2.6`), Vue Router 3, Vuex 3
- Build tooling: Vue CLI 4, Babel, ESLint 6
- Styling: Tailwind CSS 2 (PostCSS 7 compat), Autoprefixer 9
- Web3: `ethers@^6`, `web3@^1`, `@web3-onboard` packages

### Strategy
1. Align build tooling versions (keep Vue CLI 4 for PostCSS 7 compatibility).
2. Apply safe dependency upgrades within current major versions unless clearly compatible.
3. Build and fix compile/runtime errors iteratively.
4. Temporarily set `NODE_OPTIONS=--openssl-legacy-provider` for Node ≥17 to unblock builds.
5. After stabilization, plan larger upgrades (Vue 3, Tailwind 3+, PostCSS 8, ESLint 8).

### Risk Notes
- Mixing Vue CLI 5 with PostCSS 7 compat tends to break CSS build; keep CLI 4 for now.
- `ethers@6` has API differences from v5; verify call sites.

### Near-Term Tasks
- Align `@vue/cli-*` packages on v4.5.x
- Update security-sensitive libs (e.g., axios) within safe range
- Build, fix TS/JS errors, and run lints
- Replace OpenSSL legacy flag by pinning Node 16/18 LTS in CI and local (`.nvmrc`)

### Longer-Term Upgrades (post-stabilization)
- Migrate to Vue 3 + Vue Router 4 + Vuex → Pinia
- Move to Tailwind 3/4 + PostCSS 8
- Upgrade ESLint to v8 and config to latest `eslint-plugin-vue`
- Assess replacing legacy `web3` where not needed; consolidate on ethers

### Best Practices To Adopt
- Lock Node version via `.nvmrc` and CI
- Run `yarn lint` and `yarn build` in CI for PRs
- Dependabot/Renovate for automated upgrades

