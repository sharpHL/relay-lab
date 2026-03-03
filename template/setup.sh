#!/bin/bash
set -e

# ═══════════════════════════════════════════════════
# AI Continuous Dev — New Project Setup
# Usage: ./setup.sh <repo-name> [--private]
# ═══════════════════════════════════════════════════

REPO_NAME="${1:?Usage: ./setup.sh <repo-name> [--private]}"
VISIBILITY="${2:---public}"
OWNER="sharpHL"
BOARD_URL="https://github.com/users/sharpHL/projects/2"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Setting up $REPO_NAME ==="

# 1. Create repo
echo "[1/8] Creating GitHub repo..."
mkdir -p "$REPO_NAME" && cd "$REPO_NAME"
git init
echo "# $REPO_NAME" > README.md
echo "node_modules/" > .gitignore
git add -A && git commit -m "init: project skeleton"
gh repo create "$REPO_NAME" "$VISIBILITY" --source=. --push

# 2. Copy template files
echo "[2/8] Copying template files..."
cp -r "$SCRIPT_DIR/.github" .
cp -r "$SCRIPT_DIR/.claude" .
cp "$SCRIPT_DIR/CLAUDE.md" .
# Replace placeholder in CLAUDE.md
sed -i '' "s/YOUR_PROJECT_NAME/$REPO_NAME/g" CLAUDE.md 2>/dev/null || \
sed -i "s/YOUR_PROJECT_NAME/$REPO_NAME/g" CLAUDE.md
git add -A && git commit -m "feat: add CI, agent dispatch, and issue templates"

# 3. Create labels
echo "[3/8] Creating labels..."
gh label create feature --color 0E8A16 --description "New feature" --force
gh label create bug --color D73A4A --description "Bug fix" --force
gh label create "agent:ready" --color 1D76DB --description "Ready for agent pickup" --force

# 4. Copy secrets from relay-lab (reuse existing tokens)
echo "[4/8] Setting up secrets..."
echo "  → You need to set these secrets manually:"
echo "    gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo $OWNER/$REPO_NAME"
echo "    gh secret set BOARD_TOKEN --repo $OWNER/$REPO_NAME"
echo "  (Use the same tokens as relay-lab)"
echo ""
read -p "  Press Enter after setting secrets (or 's' to skip)... " SKIP_SECRETS

# 5. Push workflow files (needs workflow scope)
echo "[5/8] Pushing workflow files..."
git push || {
  echo "  → If push fails, run: gh auth refresh -s workflow"
  exit 1
}

# 6. Set up branch protection
echo "[6/8] Setting branch protection..."
gh api "repos/$OWNER/$REPO_NAME/branches/main/protection" --method PUT \
  --input - <<'JSON' 2>/dev/null || echo "  → Branch protection requires admin access"
{
  "required_status_checks": {"strict": true, "contexts": ["test"]},
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
JSON

# 7. Enable auto-merge
echo "[7/8] Enabling auto-merge..."
gh api "repos/$OWNER/$REPO_NAME" --method PATCH --field allow_auto_merge=true >/dev/null

# 8. Done
echo "[8/8] Setup complete!"
echo ""
echo "═══════════════════════════════════════════════"
echo "  Repo:  https://github.com/$OWNER/$REPO_NAME"
echo "  Board: $BOARD_URL"
echo ""
echo "  Next steps:"
echo "  1. Edit CLAUDE.md with your project's architecture"
echo "  2. Edit .github/workflows/ci.yml with your test command"
echo "  3. Create your first Issue → add agent:ready label"
echo "═══════════════════════════════════════════════"
