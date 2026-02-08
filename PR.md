## Summary
- add Playwright e2e coverage for the Earn airdrop claim flow using a dev-only wallet mock
- fix Earn async component rendering so the claim panel loads correctly
- add dev-only e2e wallet injection and Playwright config/scripts
- clean up lint warnings and document intentional v-html usage in blog posts

## Changes
- update dependency pins and remove unused webpack-era tooling (`raw-loader`, `webpack-dev-server`)
- add dev-only mock airdrop contract fallback for local/dev use
- seed wallet store in dev via `?e2eAddress=...` query
- add Playwright config + airdrop flow test
- fix mobile sidebar overlay gap and soften vEth2 panel header styling

## Risk
- Low: dev-only wallet injection and mock airdrop are guarded by `import.meta.env.DEV`
- Low: async component change aligns with Vue 3 expectations

## Testing
- bun run test:e2e
- bun run pre-commit
- bun audit --level moderate
- bun run type-check
- bun run build

## Notes
- The e2e wallet mock is only active in dev mode when `e2eAddress` is provided in the URL query string.
