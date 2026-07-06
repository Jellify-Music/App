#!/usr/bin/env bash
# Diagnose ConnectivityManager network-callback usage for Jellify.
#
# Android caps a process at 100 outstanding NetworkRequests; exceeding the cap
# crashes with ConnectivityManager$TooManyRequestsException (see Play vitals,
# v197). Run this against a device while exercising flows that touch the
# network stack — long playback, large playlist downloads, Cast sessions,
# Android Auto — to find which flow leaks registrations.
#
# Usage:
#   ./scripts/diagnose-network-callbacks.sh            # one snapshot with owners
#   ./scripts/diagnose-network-callbacks.sh --watch    # poll every 5s, log changes

set -euo pipefail

PKG="com.cosmonautical.jellify"

command -v adb >/dev/null 2>&1 || { echo "adb not found in PATH" >&2; exit 1; }
adb get-state >/dev/null 2>&1 || { echo "no device/emulator connected" >&2; exit 1; }

UID_LINE=$(adb shell dumpsys package "$PKG" 2>/dev/null | grep -m1 -E "userId=|appId=" || true)
[ -z "$UID_LINE" ] && { echo "$PKG is not installed on the connected device" >&2; exit 1; }
APP_UID=$(echo "$UID_LINE" | sed -E 's/.*(userId|appId)=([0-9]+).*/\2/')

snapshot() {
	# 'dumpsys connectivity requests' exists on modern builds; fall back to the
	# full dump when the subcommand is unsupported. Match by uid and by package
	# name since the line format varies across Android versions.
	local out
	out=$(adb shell dumpsys connectivity requests 2>/dev/null || true)
	[ -z "$out" ] && out=$(adb shell dumpsys connectivity 2>/dev/null || true)
	echo "$out" | grep -E "uid[=/: ]{1,2}$APP_UID|requestorUid[=: ]+$APP_UID|$PKG" || true
}

count() {
	snapshot | grep -c . || true
}

if [ "${1:-}" = "--watch" ]; then
	prev="-1"
	echo "Watching outstanding network requests for $PKG (uid $APP_UID); Ctrl-C to stop."
	echo "Exercise one flow at a time: playback exit/relaunch, playlist download, Cast, Android Auto."
	while true; do
		now=$(count)
		if [ "$now" != "$prev" ]; then
			echo "$(date '+%H:%M:%S')  outstanding=$now  (crash at 100)"
			prev="$now"
		fi
		sleep 5
	done
else
	echo "Outstanding network requests owned by $PKG (uid $APP_UID):"
	snapshot
	echo "----"
	echo "total: $(count)   crash threshold: 100"
	echo "Re-run after each app flow; a count that only ever grows is the leak."
fi
