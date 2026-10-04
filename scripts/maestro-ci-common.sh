#!/usr/bin/env bash
# Shared helpers for the platform-specific Maestro CI scripts
# (run-maestro-android-ci.sh, run-maestro-ios-ci.sh). Source, don't execute.

APP_ID="com.cosmonautical.jellify"
FLOW_PATH="${FLOW_PATH:-./maestro/flow-full.yaml}"
# Self-hosted runners have Maestro on PATH (Ansible-managed); fall back to the
# get.maestro.mobile.dev install location for anything else.
MAESTRO_BIN="${MAESTRO_BIN:-$(command -v maestro || echo "$HOME/.maestro/bin/maestro")}"
SERVER_ADDRESS="${MAESTRO_SERVER_ADDRESS:-https://jellyfin.jellify.app}"
SERVER_USERNAME="${MAESTRO_USERNAME:-jerry}"
SUMMARY_FILE="${GITHUB_STEP_SUMMARY:-/dev/null}"
MAESTRO_PLATFORM="${MAESTRO_PLATFORM:-unknown}"

# Every exit path records one of: passed, infra, crash, assertion.
# "infra" means the app was never exercised (server down, install failed),
# so a red run of that kind says nothing about the code under test.
finish() {
  local classification="$1"
  local detail="$2"
  local exit_code="$3"

  echo "maestro_result=${classification}" >> "${GITHUB_OUTPUT:-/dev/null}"
  {
    echo "## Maestro (${MAESTRO_PLATFORM}): ${classification}"
    echo
    echo "${detail}"
  } >> "${SUMMARY_FILE}"
  echo "🏁 Result: ${classification}"
  exit "${exit_code}"
}

# The flows log in to a shared demo server. Check it is up and that the test
# account still signs in with an empty password before spending device time,
# so an outage is not reported as an app failure.
preflight_server() {
  echo "🩺 Preflight: ${SERVER_ADDRESS}"
  local auth_header="MediaBrowser Client=\"Jellify Maestro CI\", Device=\"CI\", DeviceId=\"jellify-maestro-ci\", Version=\"1.0.0\""
  local ok=0 info_status auth_status
  for attempt in 1 2 3; do
    info_status=$(curl -s -o preflight-info.json -w '%{http_code}' --max-time 15 "${SERVER_ADDRESS}/System/Info/Public" || echo 000)
    auth_status=$(curl -s -o /dev/null -w '%{http_code}' --max-time 15 \
      -X POST "${SERVER_ADDRESS}/Users/AuthenticateByName" \
      -H 'Content-Type: application/json' \
      -H "Authorization: ${auth_header}" \
      -d "{\"Username\":\"${SERVER_USERNAME}\",\"Pw\":\"\"}" || echo 000)
    echo "  attempt ${attempt}: System/Info/Public=${info_status} AuthenticateByName=${auth_status}"
    if [[ "${info_status}" == "200" && "${auth_status}" == "200" ]]; then
      ok=1
      break
    fi
    sleep 10
  done
  cat preflight-info.json 2>/dev/null && echo
  if [[ "${ok}" != "1" ]]; then
    finish infra "Demo server preflight failed (System/Info/Public=${info_status}, AuthenticateByName=${auth_status}). The app was not tested." 1
  fi
}

# Runs the flow and sets MAESTRO_EXIT and FAILED_STEP. Extra arguments go
# before `test`, e.g. `--device <udid>`.
run_maestro() {
  echo "🎭 Running Maestro flow: ${FLOW_PATH}"
  MAESTRO_EXIT=0
  "${MAESTRO_BIN}" "$@" test --debug-output debug-output "${FLOW_PATH}" \
    --env server_address="${SERVER_ADDRESS}" --env username="${SERVER_USERNAME}" 2>&1 \
    | tee maestro-output.log || MAESTRO_EXIT=$?

  if grep -Eiq 'Assertion is false:|\.\.\. FAILED$' maestro-output.log; then
    echo "❌ Maestro reported failed assertions in output; marking step as failed."
    MAESTRO_EXIT=1
  fi
  FAILED_STEP=$(grep -E '\.\.\. FAILED$|Assertion is false:' maestro-output.log | head -1 || true)
}

# A crash fails the run even if every assertion passed after a relaunch.
# APP_CRASH and APP_ANR are set by the platform script.
finish_from_results() {
  if [[ -n "${APP_CRASH:-}" ]]; then
    finish crash "$(printf 'The app crashed during the run.\n\nFirst failing Maestro step: `%s`\n\n```\n%s\n```' "${FAILED_STEP:-none}" "$(echo "${APP_CRASH}" | head -40)")" 1
  fi
  if [[ -n "${APP_ANR:-}" ]]; then
    finish crash "$(printf 'The app hit an ANR during the run.\n\n```\n%s\n```' "${APP_ANR}")" 1
  fi
  if [[ "${MAESTRO_EXIT}" != "0" ]]; then
    finish assertion "$(printf 'A Maestro step failed with no app crash.\n\n```\n%s\n```' "${FAILED_STEP:-maestro exited ${MAESTRO_EXIT}}")" "${MAESTRO_EXIT}"
  fi
  finish passed "All Maestro steps passed with no crash or ANR." 0
}
