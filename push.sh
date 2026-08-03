#!/bin/bash
# Quick push helper - stages everything, commits, and pushes to GitHub.
# Run this from inside the "CRM Web" folder:
#   bash push.sh "your commit message here"
#
# If you don't pass a message, it uses a default one.

set -e

MESSAGE="${1:-Update CRM dashboard}"

echo "Staging changes..."
git add -A

echo "Files being committed:"
git status --short

echo ""
echo "Committing with message: $MESSAGE"
git commit -m "$MESSAGE"

echo "Pushing to GitHub..."
git push

echo ""
echo "Done. Vercel will auto-deploy from the main branch in a minute or two."
