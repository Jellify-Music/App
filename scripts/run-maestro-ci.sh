#!/usr/bin/env bash
set -uo pipefail

RUNNER_OS="$1"
RUNNER_ARCH="$2"
EMULATOR_ARCH="$3"
APK_PATH="$4"
FLOW_PATH="$5"

APP_ID="com.cosmonautical.jellify"
# Self-hosted runners have Maestro on PATH (Ansible-managed); fall back to the
# get.maestro.mobile.dev install location for anything else.
MAESTRO_BIN="${MAESTRO_BIN:-$(command -v maestro || echo "$HOME/.maestro/bin/maestro")}"
SERVER_ADDRESS="${MAESTRO_SERVER_ADDRESS:-https://jellyfin.jellify.app}"
SERVER_USERNAME="${MAESTRO_USERNAME:-jerry}"
SUMMARY_FILE="${GITHUB_STEP_SUMMARY:-/dev/null}"

# Every exit path records one of: passed, infra, crash, assertion.
# "infra" means the app was never exercised (server down, install failed),
# so a red run of that kind says nothing about the code under test.
finish() {
  local classification="$1"
  local detail="$2"
  local exit_code="$3"

  echo "maestro_result=${classification}" >> "${GITHUB_OUTPUT:-/dev/null}"
  {
    echo "## Maestro: ${classification}"
    echo
    echo "${detail}"
  } >> "${SUMMARY_FILE}"
  echo "🏁 Result: ${classification}"
  exit "${exit_code}"
}

echo "📋 Runner: os=${RUNNER_OS}, arch=${RUNNER_ARCH}"
echo "📋 Emulator arch: ${EMULATOR_ARCH}"
echo "📋 APK expected: ${APK_PATH}"
ls -lah "$(dirname "${APK_PATH}")" || true

# Preflight: the flows log in to a shared demo server. Check it is up and
# that the test account still signs in with an empty password before
# spending emulator time, so an outage is not reported as an app failure.
echo "🩺 Preflight: ${SERVER_ADDRESS}"
AUTH_HEADER="MediaBrowser Client=\"Jellify Maestro CI\", Device=\"CI\", DeviceId=\"jellify-maestro-ci\", Version=\"1.0.0\""
PREFLIGHT_OK=0
for attempt in 1 2 3; do
  INFO_STATUS=$(curl -s -o preflight-info.json -w '%{http_code}' --max-time 15 "${SERVER_ADDRESS}/System/Info/Public" || echo 000)
  AUTH_STATUS=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 \
    -X POST "${SERVER_ADDRESS}/Users/AuthenticateByName" \
    -H 'Content-Type: application/json' \
    -H "Authorization: ${AUTH_HEADER}" \
    -d "{\"Username\":\"${SERVER_USERNAME}\",\"Pw\":\"\"}" || echo 000)
  echo "  attempt ${attempt}: System/Info/Public=${INFO_STATUS} AuthenticateByName=${AUTH_STATUS}"
  if [[ "${INFO_STATUS}" == "200" && "${AUTH_STATUS}" == "200" ]]; then
    PREFLIGHT_OK=1
    break
  fi
  sleep 10
done
cat preflight-info.json 2>/dev/null && echo
if [[ "${PREFLIGHT_OK}" != "1" ]]; then
  finish infra "Demo server preflight failed (System/Info/Public=${INFO_STATUS}, AuthenticateByName=${AUTH_STATUS}). The app was not tested." 1
fi

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

echo "🎭 Running Maestro flow: ${FLOW_PATH}"
MAESTRO_EXIT=0
"${MAESTRO_BIN}" test --debug-output debug-output "${FLOW_PATH}" --env server_address="${SERVER_ADDRESS}" --env username="${SERVER_USERNAME}" 2>&1 | tee maestro-output.log || MAESTRO_EXIT=$?

if grep -Eiq 'Assertion is false:|\.\.\. FAILED$' maestro-output.log; then
  echo "❌ Maestro reported failed assertions in output; marking step as failed."
  MAESTRO_EXIT=1
fi

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
cat ui_hierarchy.xml 2>/dev/null || true

FAILED_STEP=$(grep -E '\.\.\. FAILED$|Assertion is false:' maestro-output.log | head -1 || true)
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

# A crash fails the run even if every assertion passed after a relaunch.
if [[ -n "${APP_CRASH}" ]]; then
  finish crash "$(printf 'The app crashed during the run.\n\nFirst failing Maestro step: `%s`\n\n```\n%s\n```' "${FAILED_STEP:-none}" "$(echo "${APP_CRASH}" | head -40)")" 1
fi
if [[ -n "${APP_ANR}" ]]; then
  finish crash "$(printf 'The app hit an ANR during the run.\n\n```\n%s\n```' "${APP_ANR}")" 1
fi
if [[ "${MAESTRO_EXIT}" != "0" ]]; then
  finish assertion "$(printf 'A Maestro step failed with no app crash.\n\n```\n%s\n```' "${FAILED_STEP:-maestro exited ${MAESTRO_EXIT}}")" "${MAESTRO_EXIT}"
fi
finish passed "All Maestro steps passed with no crash or ANR." 0
