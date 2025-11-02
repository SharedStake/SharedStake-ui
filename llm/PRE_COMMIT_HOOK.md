# Pre-commit Hook Setup

This project uses a git pre-commit hook to ensure code quality before commits. The hook **automatically runs** linting, type checking, and build checks before allowing a commit to proceed.

## How Git Hooks Work

Git hooks are executable scripts in `.git/hooks/` that run automatically at specific git events. The `pre-commit` hook runs **automatically** every time you run `git commit` - there's no way to miss it (unless you use `--no-verify`).

**This is a standard git feature**: When you have an executable file at `.git/hooks/pre-commit`, git will run it automatically before every commit.

## What Happens When You Commit

When you try to commit code with `git commit`, the pre-commit hook **automatically** runs:

1. **Run ESLint** (with auto-fix) - Checks for code style and common errors
2. **Run Type Check** - Validates TypeScript types using `vue-tsc`
3. **Run Build** - Ensures the project builds successfully

If any of these checks fail, the commit will be blocked until the issues are fixed.

## Scripts Available

- `bun run pre-commit` - Manually run the pre-commit checks
- `bun run pre-commit:fix` - Attempt to auto-fix issues (shows errors for agent to fix)
- `bun run pre-commit:install` - Install/reinstall the git hook

## For LLM Agents

**IMPORTANT**: The pre-commit hook runs **automatically** on every `git commit`. You cannot forget about it - git will run it automatically.

**When committing code:**
1. Run `git commit` as normal
2. Git **automatically** runs `.git/hooks/pre-commit` before the commit
3. Hook runs: `lint:fix`, `type-check`, `build`
4. If all pass, commit proceeds
5. If any fail, commit is **blocked** and you see error messages

**When pre-commit hook fails:**

1. The hook outputs clear error messages showing what failed (you'll see this automatically)
2. Run `bun run pre-commit:fix` to see all errors clearly in one place
3. Use the `read_lints` tool to read linter errors programmatically
4. Fix the issues in the code using your editing tools
5. Run `bun run pre-commit` manually to verify fixes before committing again
6. Once all checks pass, run `git commit` again (hook runs automatically and should pass)

**Remember**: You don't need to manually run the hook - it runs automatically. But you can test it with `bun run pre-commit` before committing.

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

## Automatic Installation

The hook is automatically installed when you run:
- `bun install` (via postinstall script)
- `bun run setup` (includes hook installation)

## Manual Installation

If you need to manually install or reinstall the hook:

```bash
bun run pre-commit:install
# or
bash scripts/install-pre-commit-hook.sh
```
