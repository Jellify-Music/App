#!/usr/bin/env bash
set -uo pipefail

RUNNER_OS="$1"
RUNNER_ARCH="$2"
EMULATOR_ARCH="$3"
APK_PATH="$4"
FLOW_PATH="$5"

APP_ID="com.cosmonautical.jellify"
MAESTRO_BIN="$HOME/.maestro/bin/maestro"

echo "📋 Runner: os=${RUNNER_OS}, arch=${RUNNER_ARCH}"
echo "📋 Emulator arch: ${EMULATOR_ARCH}"
echo "📋 APK expected: ${APK_PATH}"
ls -lah "$(dirname "${APK_PATH}")" || true

echo "📋 ADB devices before install:"
adb devices -l || true

echo "📱 Installing release APK..."
if ! adb install -r "${APK_PATH}"; then
  adb uninstall "${APP_ID}" || true
  adb install "${APK_PATH}"
fi

echo "🚀 Starting logcat capture..."
adb logcat -c
adb logcat '*:W' ReactNative:V ReactNativeJS:V TrackPlayer:V > logcat.txt 2>&1 &
LOGCAT_PID=$!

echo "🚀 Launching app..."
adb shell cmd package resolve-activity --brief "${APP_ID}" 2>/dev/null | tail -n 1 | tr -d '\r' | xargs -I{} adb shell am start -W -n "{}" || adb shell monkey -p "${APP_ID}" -c android.intent.category.LAUNCHER 1 || echo "⚠️ App launch command failed; continuing to let Maestro attempt launch."

sleep 5

echo "🎭 Running Maestro flow: ${FLOW_PATH}"
MAESTRO_EXIT=0
"${MAESTRO_BIN}" test --debug-output debug-output "${FLOW_PATH}" --env server_address=https://jellyfin.jellify.app --env username=jerry 2>&1 | tee maestro-output.log || MAESTRO_EXIT=$?

if grep -Eiq 'Assertion is false:|\.\.\. FAILED$' maestro-output.log; then
  echo "❌ Maestro reported failed assertions in output; marking step as failed."
  MAESTRO_EXIT=1
fi

echo "📋 Stopping logcat..."
kill "${LOGCAT_PID}" 2>/dev/null || true

echo "📋 Last 200 lines of logcat:"
tail -200 logcat.txt || true

echo "📋 React Native specific logs:"
grep -i 'ReactNative\|ReactNativeJS\|TrackPlayer\|FATAL\|CRASH\|Error' logcat.txt | tail -100 || true

echo "📋 Dumping UI hierarchy..."
adb shell uiautomator dump /sdcard/ui_hierarchy.xml 2>/dev/null || true
adb pull /sdcard/ui_hierarchy.xml ui_hierarchy.xml 2>/dev/null || true
cat ui_hierarchy.xml 2>/dev/null || true

exit "${MAESTRO_EXIT}"
