#!/usr/bin/env bash
# Boots a throwaway iOS simulator, installs the Release simulator build and
# runs the full Maestro flow against it. Called from the maestro-ios job in
# .github/workflows/test-maestro.yml.
set -uo pipefail

APP_PATH="$1"

MAESTRO_PLATFORM=ios
source "$(dirname "$0")/maestro-ci-common.sh"

APP_EXECUTABLE="$(/usr/libexec/PlistBuddy -c 'Print :CFBundleExecutable' "${APP_PATH}/Info.plist" 2>/dev/null || echo Jellify)"
CRASH_REPORT_DIR="${HOME}/Library/Logs/DiagnosticReports"
SIM_NAME="maestro-${GITHUB_RUN_ID:-local}-${GITHUB_RUN_ATTEMPT:-0}"
SIM_UDID=""

echo "📋 Runner: os=${RUNNER_OS:-unknown}, arch=${RUNNER_ARCH:-unknown}"
echo "📋 App expected: ${APP_PATH} (executable ${APP_EXECUTABLE})"
xcodebuild -version || true

preflight_server

# The runners' HOME persists between jobs, so each run makes its own
# simulator and deletes it afterwards rather than reusing a dirty one.
cleanup() {
  [[ -n "${LOG_PID:-}" ]] && kill "${LOG_PID}" 2>/dev/null
  if [[ -n "${SIM_UDID}" ]]; then
    xcrun simctl shutdown "${SIM_UDID}" >/dev/null 2>&1 || true
    xcrun simctl delete "${SIM_UDID}" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

# Newest installed iOS runtime, and the newest iPhone it supports.
read -r RUNTIME_ID DEVICE_TYPE_ID < <(xcrun simctl list runtimes -j available | node -e '
  const { runtimes } = JSON.parse(require("fs").readFileSync(0, "utf8"))
  const ios = runtimes
    .filter((r) => r.platform === "iOS" && r.isAvailable)
    .sort((a, b) => a.version.localeCompare(b.version, undefined, { numeric: true }))
    .pop()
  if (!ios) process.exit(1)
  // simctl lists device types newest first
  const iphones = ios.supportedDeviceTypes.filter((d) => d.productFamily === "iPhone")
  const device = iphones.find((d) => !/\b(SE|mini|Plus|Max|Air)\b|\d+e\b/.test(d.name)) ?? iphones[0]
  console.log(ios.identifier, device.identifier)
')
if [[ -z "${RUNTIME_ID:-}" || -z "${DEVICE_TYPE_ID:-}" ]]; then
  finish infra "No available iOS simulator runtime on this runner. Install one with \`xcodebuild -downloadPlatform iOS\`. The app was not tested." 1
fi
echo "📱 Creating simulator ${SIM_NAME}: ${DEVICE_TYPE_ID} on ${RUNTIME_ID}"
SIM_UDID=$(xcrun simctl create "${SIM_NAME}" "${DEVICE_TYPE_ID}" "${RUNTIME_ID}") || finish infra "Simulator creation failed. The app was not tested." 1

xcrun simctl boot "${SIM_UDID}" || finish infra "Simulator failed to boot. The app was not tested." 1
xcrun simctl bootstatus "${SIM_UDID}" -b || finish infra "Simulator never finished booting. The app was not tested." 1

echo "📱 Installing app..."
xcrun simctl install "${SIM_UDID}" "${APP_PATH}" || finish infra "App install failed. The app was not tested." 1

# Crash reports for simulator apps land in the host's DiagnosticReports;
# anything newer than this marker came from this run.
CRASH_MARKER=$(mktemp)

echo "🚀 Starting simulator log capture..."
xcrun simctl spawn "${SIM_UDID}" log stream --style compact --level debug \
  --predicate "process == \"${APP_EXECUTABLE}\"" > simulator.log 2>&1 &
LOG_PID=$!

echo "🚀 Launching app..."
xcrun simctl launch "${SIM_UDID}" "${APP_ID}" || echo "⚠️ App launch command failed; continuing to let Maestro attempt launch."

sleep 5

run_maestro --device "${SIM_UDID}"

kill "${LOG_PID}" 2>/dev/null || true
LOG_PID=""

echo "📋 Last 200 lines of simulator log:"
tail -200 simulator.log || true

echo "📋 Dumping UI hierarchy..."
"${MAESTRO_BIN}" --device "${SIM_UDID}" hierarchy > ui_hierarchy.json 2>/dev/null || true
xcrun simctl io "${SIM_UDID}" screenshot final_state.png >/dev/null 2>&1 || true

mkdir -p crash-reports
find "${CRASH_REPORT_DIR}" -maxdepth 1 -name "${APP_EXECUTABLE}*.ips" -newer "${CRASH_MARKER}" -exec cp {} crash-reports/ \; 2>/dev/null || true
APP_CRASH=""
for report in crash-reports/*.ips; do
  [[ -e "${report}" ]] || continue
  # .ips is a one-line JSON header followed by the JSON report body.
  APP_CRASH+="$(tail -n +2 "${report}" | node -e '
    const r = JSON.parse(require("fs").readFileSync(0, "utf8"))
    const ex = r.exception ?? {}
    const lines = [`${ex.type ?? "?"} (${ex.signal ?? "?"}) ${r.asi ? JSON.stringify(r.asi) : ""}`]
    const t = (r.threads ?? []).find((t) => t.triggered)
    for (const f of (t?.frames ?? []).slice(0, 25)) {
      const img = r.usedImages?.[f.imageIndex]?.name ?? "?"
      lines.push(`  ${img}  ${f.symbol ?? "0x" + f.imageOffset.toString(16)}`)
    }
    console.log(lines.join("\n"))
  ' 2>/dev/null || echo "(unparseable crash report ${report})")"$'\n'
done
# No ANR equivalent on iOS; watchdog kills show up as crash reports.
APP_ANR=""

finish_from_results
