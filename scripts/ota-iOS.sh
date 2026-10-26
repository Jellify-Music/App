
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
rm -rf ../App-Bundles-prev
git worktree add --detach ../App-Bundles-prev HEAD
rm -rf Readme.md
cd ../..
bun createBundle:ios
# Upload the OTA bundle's source map so GlitchTip can symbolicate it (matched by debug ID)
if [ -n "$SENTRY_AUTH_TOKEN" ]; then
  node_modules/.bin/sentry-cli sourcemaps upload ios/App-Bundles/main.jsbundle ios/main.jsbundle.map || echo "warning: source map upload failed"
fi
rm -f ios/main.jsbundle.map
cd ios/App-Bundles
bash ../../scripts/getRandomVersion.sh
bash ../../scripts/generate-ota-patch.sh ../App-Bundles-prev .
git add .
git commit -m "OTA-Update - $(date +'%b %d %H:%M')"
git push https://x-access-token:$SIGNING_REPO_PAT@github.com/Jellify-Music/App-Bundles.git "$target_branch"
cd ..
rm -rf App-Bundles App-Bundles-prev
cd ..
