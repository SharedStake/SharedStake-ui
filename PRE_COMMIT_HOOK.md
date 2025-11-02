# Pre-commit Hook Setup

This project uses a git pre-commit hook to ensure code quality before commits. The hook automatically runs linting, type checking, and build checks before allowing a commit to proceed.

## How It Works

When you try to commit code, the pre-commit hook will:

1. **Run ESLint** (with auto-fix) - Checks for code style and common errors
2. **Run Type Check** - Validates TypeScript types using `vue-tsc`
3. **Run Build** - Ensures the project builds successfully

If any of these checks fail, the commit will be blocked until the issues are fixed.

## Scripts Available

- `bun run pre-commit` - Manually run the pre-commit checks
- `bun run pre-commit:fix` - Attempt to auto-fix issues (shows errors for agent to fix)
- `bun run check` - Quick check script that runs all checks in sequence

## For LLM Agents

When the pre-commit hook fails:

1. The hook will output clear error messages showing what failed
2. Run `bun run pre-commit:fix` to see all errors clearly
3. Use the `read_lints` tool to read linter errors programmatically
4. Fix the issues in the code
5. Run `bun run pre-commit` again to verify fixes
6. Once all checks pass, the commit will proceed

## Common Issues and Fixes

### Linting Errors
- Most linting errors can be auto-fixed by running `bun run lint:fix`
- Remaining errors will be shown and need manual fixes

### Type Errors
- Type errors are shown by `vue-tsc` and need to be fixed in the code
- Common issues: missing types, incorrect imports, type mismatches

### Build Errors
- Build errors usually indicate syntax errors or missing dependencies
- Check the build output for specific file and line numbers

## Disabling the Hook (Not Recommended)

If you absolutely need to bypass the hook (e.g., for emergency hotfixes):

```bash
git commit --no-verify -m "your message"
```

**Warning**: Only use `--no-verify` when absolutely necessary. It bypasses all quality checks and can lead to broken builds.

## Reinstalling the Hook

If the hook gets removed or corrupted, reinstall it:

```bash
cp scripts/pre-commit-check.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit
```
