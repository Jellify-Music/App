cd ios
rm -rf App-Bundles
git clone https://github.com/Jellify-Music/App-Bundles.git
cd App-Bundles
git checkout iOS
rm -rf Readme.md
cd ../..
yarn createBundle:ios
cd ios/App-Bundles
git add .
git commit -m "OTA-Update - $(date +'%b %d %H:%M')"
git push https://x-access-token:$SIGNING_REPO_PAT@github.com/Jellify-Music/App-Bundles.git iOS
cd ..
rm -rf App-Bundles
cd ..
