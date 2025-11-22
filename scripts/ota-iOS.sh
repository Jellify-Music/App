
version=$(jq -r '.version' "$(dirname "$0")/../package.json")
target_branch="nitro_${version}_ios"
cd ios
rm -rf App-Bundles
git clone https://github.com/Jellify-Music/App-Bundles.git
cd App-Bundles
if git ls-remote --exit-code --heads origin "$target_branch" >/dev/null 2>&1; then
  echo "Branch '$target_branch' already exists on remote."
  git checkout "$target_branch"
else
  echo "Branch '$target_branch' does not exist on remote. Attempting to create it..."
  git checkout -b "$target_branch"
fi
rm -rf Readme.md
cd ../..
bun createBundle:ios
cd ios/App-Bundles
bash ../../scripts/getRandomVersion.sh
git add .
git commit -m "OTA-Update - $(date +'%b %d %H:%M')"
git push https://x-access-token:$SIGNING_REPO_PAT@github.com/Jellify-Music/App-Bundles.git "$target_branch"
cd ..
rm -rf App-Bundles
cd ..
