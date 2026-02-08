# Agent Notes

## Pull Request Creation (GitHub CLI)

1. Create and switch to a feature branch:
   - `git checkout -b chore/deps-airdrop-e2e`
2. Stage changes:
   - `git add -A`
3. Commit with a clear message:
   - `git commit -m "Update deps, add airdrop e2e"`
4. Push the branch:
   - `git push -u origin chore/deps-airdrop-e2e`
5. Create a PR from CLI (uses PR.md for body if present):
   - `gh pr create --base main --head chore/deps-airdrop-e2e --title "Update deps and add airdrop e2e" --body-file PR.md`
