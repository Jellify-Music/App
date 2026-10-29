#!/usr/bin/env bash
# Installs the release APK on the running emulator and runs the full Maestro
# flow against it. Called from the android-emulator-runner step in
# .github/workflows/test-maestro.yml.
set -uo pipefail

APK_PATH="$1"

MAESTRO_PLATFORM=android
source "$(dirname "$0")/maestro-ci-common.sh"

echo "📋 Runner: os=${RUNNER_OS:-unknown}, arch=${RUNNER_ARCH:-unknown}"
echo "📋 APK expected: ${APK_PATH}"
ls -lah "$(dirname "${APK_PATH}")" || true

preflight_server

echo "📋 ADB devices before install:"
adb devices -l || true

echo "📱 Installing release APK..."
if ! adb install -r "${APK_PATH}"; then
  adb uninstall "${APP_ID}" || true
  if ! adb install "${APK_PATH}"; then
    finish infra "APK install failed. The app was not tested." 1
  fi
fi

echo "🚀 Starting logcat capture..."
adb logcat -c -b all || adb logcat -c
adb logcat -b main,system,crash '*:W' ReactNative:V ReactNativeJS:V TrackPlayer:V > logcat.txt 2>&1 &
LOGCAT_PID=$!

echo "🚀 Launching app..."
adb shell cmd package resolve-activity --brief "${APP_ID}" 2>/dev/null | tail -n 1 | tr -d '\r' | xargs -I{} adb shell am start -W -n "{}" || adb shell monkey -p "${APP_ID}" -c android.intent.category.LAUNCHER 1 || echo "⚠️ App launch command failed; continuing to let Maestro attempt launch."

sleep 5

run_maestro

echo "📋 Stopping logcat..."
kill "${LOGCAT_PID}" 2>/dev/null || true

# The crash and events buffers survive app restarts (clearState, launchApp),
# so they catch crashes the flow papered over as well as the one that ended it.
adb logcat -d -b crash > logcat-crash.txt 2>&1 || true
adb logcat -d -b events > logcat-events.txt 2>&1 || true

echo "📋 Last 200 lines of logcat:"
tail -200 logcat.txt || true

echo "📋 React Native specific logs:"
grep -i 'ReactNative\|ReactNativeJS\|TrackPlayer\|FATAL\|CRASH\|Error' logcat.txt | tail -100 || true

echo "📋 Dumping UI hierarchy..."
adb shell uiautomator dump /sdcard/ui_hierarchy.xml 2>/dev/null || true
adb pull /sdcard/ui_hierarchy.xml ui_hierarchy.xml 2>/dev/null || true

# JS fatals rethrown by React Native can log without a "Process:" line, so
# keep every FATAL block unless it names some other process.
APP_CRASH=$(awk -v proc="Process: ${APP_ID}" '
  /FATAL EXCEPTION/ { if (keep) out = out blk; blk = ""; keep = 1 }
  keep { blk = blk $0 "\n"; if ($0 ~ /Process: / && index($0, proc) == 0) keep = 0 }
  END { if (keep) out = out blk; printf "%s", out }
' logcat-crash.txt)
if [[ -z "${APP_CRASH}" ]]; then
  APP_CRASH=$(grep -E "am_crash.*${APP_ID}" logcat-events.txt || true)
fi
APP_ANR=$(grep -E "am_anr.*${APP_ID}" logcat-events.txt || true)

finish_from_results
