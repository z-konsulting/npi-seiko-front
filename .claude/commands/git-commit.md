# Git Commit Command

Custom command to stage and commit changes. **Never push** — the user handles pushing manually.

## Workflow

When this command is executed, you MUST follow these steps in order:

### 1. Review All Modifications

Check what has been changed:

```bash
git status
git diff
```

**Analyze:**

- List all modified files
- Identify the nature of changes (feature, fix, refactor, etc.)
- Group related changes by theme/purpose

### 2. Stage Changes

**Rules:**

- Stage specific files by name (avoid `git add .` or `git add -A`)
- Only stage files that belong together logically
- Ask user confirmation if unsure about including certain files

### 3. Create Commit Message

**MANDATORY REQUIREMENTS:**

- All commit messages MUST be in English
- Message must be clear, detailed, and concise
- Focus on the "why" and "what", not the "how"
- Format: `[Type] Brief summary (max 70 chars)`
- Add body with details if needed
- List only key changes in the body and don't add the files changed
- **If multiple similar changes:**

- Group them into a single logical commit
- Summarize the overall impact in the message
- List key changes in the body if needed

**Commit message structure:**

```
[Type] Brief summary of changes

- Detail 1
- Detail 2
- Detail 3

Committed by agent.
```

**Types:**

- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code refactoring
- `update` - Enhancement to existing feature
- `style` - Formatting, missing semi colons, etc.
- `docs` - Documentation only
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

### 4. Create Commit

```bash
git add [specific files]
git commit -m "$(cat <<'EOF'
[Commit message here]

Committed by agent.
EOF
)"
```

**After commit:**

- Run `git status` to verify success
- If pre-commit hooks fail, fix issues and create a NEW commit (never use `--amend`)

### 5. Confirm Success

After successful commit:

- Display commit summary (hash + message)
- Confirm which files were staged
- **STOP — do not push. The user will push manually.**

## Safety Rules

**NEVER:**

- Push to any remote (`git push` is forbidden)
- Use `git add -A` or `git add .` without reviewing
- Commit sensitive files (.env, credentials, etc.)
- Use `--no-verify` without explicit user request
- Amend commits after pre-commit hook failures
- Use French or any language other than English

**ALWAYS:**

- Review changes before staging
- Use explicit file paths when staging
- Create meaningful commit messages in English
- Verify current branch before committing
- Ask user if unsure about any step

## Error Handling

**If pre-commit hooks fail:**

1. Show error details
2. Fix the issues
3. Re-stage fixed files
4. Create a NEW commit (not amend)

## Examples

### Example 1: Single Feature

```
[feat] Add user deletion feature

- Add delete button to user card component
- Implement deleteUser method in UserRepo
- Add confirmation dialog before deletion
- Update user list after successful deletion

Committed by agent.
```

### Example 2: Multiple Related Fixes

```
[fix] Resolve accessibility issues in forms

- Add proper ARIA labels to all form inputs
- Improve keyboard navigation in user dialog
- Fix color contrast ratios in error messages
- Add focus indicators to buttons

Committed by agent.
```

### Example 3: Refactoring

```
[refactor] Migrate components to OnPush change detection

- Update 5 components to use OnPush strategy
- Convert local state to signals
- Add explicit trackBy functions to all @for loops
- Remove unnecessary change detection triggers

Committed by agent.
```
