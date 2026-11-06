set -euo pipefail

if [ -z "${1:-}" ] || [[ "${2:-}" != "android" && "${2:-}" != "ios" ]]; then
  echo "Error: PR number and platform are required"
  echo "Usage: $0 <pr-number> <android|ios>"
  exit 1
fi

version="$1"
platform="$2"

if [ "$platform" = "android" ]; then
target_branch="PULL_REQUEST_${version}_android"
cd android
rm -rf App-Bundles
if git ls-remote --exit-code --heads https://github.com/Jellify-Music/App-Bundles.git "$target_branch" >/dev/null 2>&1; then
  echo "Branch '$target_branch' already exists on remote."
  git clone --depth 1 --single-branch --branch "$target_branch" https://github.com/Jellify-Music/App-Bundles.git
  cd App-Bundles
else
  echo "Branch '$target_branch' does not exist on remote. Attempting to create it..."
  git clone --depth 1 https://github.com/Jellify-Music/App-Bundles.git
  cd App-Bundles
  git checkout -b "$target_branch"
fi
rm -rf ../App-Bundles-prev
git worktree add --detach ../App-Bundles-prev HEAD
cd ../..
bun createBundle:android
cd android/App-Bundles
bash ../../scripts/getRandomVersion.sh --PR
bash ../../scripts/generate-ota-patch.sh ../App-Bundles-prev .
git add .
git commit -m "OTA-Update - $(date +'%b %d %H:%M')"
git push https://x-access-token:$SIGNING_REPO_PAT@github.com/Jellify-Music/App-Bundles.git "$target_branch"
cd ..
rm -rf App-Bundles App-Bundles-prev
cd ..
fi

if [ "$platform" = "ios" ]; then
target_branch="PULL_REQUEST_${version}_ios"
cd ios
rm -rf App-Bundles
if git ls-remote --exit-code --heads https://github.com/Jellify-Music/App-Bundles.git "$target_branch" >/dev/null 2>&1; then
  echo "Branch '$target_branch' already exists on remote."
  git clone --depth 1 --single-branch --branch "$target_branch" https://github.com/Jellify-Music/App-Bundles.git
  cd App-Bundles
else
  echo "Branch '$target_branch' does not exist on remote. Attempting to create it..."
  git clone --depth 1 https://github.com/Jellify-Music/App-Bundles.git
  cd App-Bundles
  git checkout -b "$target_branch"
fi
rm -rf ../App-Bundles-prev
git worktree add --detach ../App-Bundles-prev HEAD
rm -rf Readme.md
cd ../..
bun createBundle:ios
cd ios/App-Bundles
bash ../../scripts/getRandomVersion.sh --PR
bash ../../scripts/generate-ota-patch.sh ../App-Bundles-prev .
git add .
git commit -m "OTA-Update - $(date +'%b %d %H:%M')"
git push https://x-access-token:$SIGNING_REPO_PAT@github.com/Jellify-Music/App-Bundles.git "$target_branch"
cd ..
rm -rf App-Bundles App-Bundles-prev
cd ..
fi
