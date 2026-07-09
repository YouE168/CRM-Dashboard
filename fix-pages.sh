#!/bin/bash
for file in $(grep -rl "localStorage\|window" app/**/page.tsx 2>/dev/null); do
  echo "Processing: $file"
  if ! grep -q '"use client"' "$file"; then
    sed -i '' '1s/^/'"'"use client"'"'\\n\\n/' "$file"
    echo "  ✅ Added 'use client'"
  fi
  if ! grep -q 'export const dynamic = ' "$file"; then
    sed -i '' '/"use client"/a\'$'\n'"export const dynamic = 'force-dynamic';"$'\n' "$file"
    echo "  ✅ Added export const dynamic"
  fi
done
echo "🎉 All pages updated!"
