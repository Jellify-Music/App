#!/usr/bin/env bash
# Usage: generate-ota-patch.sh <previous-release-dir> <release-dir>
# Builds a differential patch from the previously published bundle so devices
# download a few KB instead of the full bundle. Skips when there is no previous bundle.
set -euo pipefail

prev="$1"
new="$2"
root="$(cd "$(dirname "$0")/.." && pwd)"

rm -rf "$new/patches"
# GitHub archives honour export-ignore: patches stay out of the full zip but remain reachable via raw URLs
echo 'patches/ export-ignore' > "$new/.gitattributes"

if ! compgen -G "$prev/*.bundle" >/dev/null && ! compgen -G "$prev/*.jsbundle" >/dev/null; then
  echo "No previous bundle in $prev, skipping patch generation"
  exit 0
fi

"$root/node_modules/.bin/nitro-ota" patch --old "$prev" --new "$new"
