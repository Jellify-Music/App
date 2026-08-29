/**
 * Global Console Override for Production Builds
 *
 * This utility disables ALL console methods in production builds by replacing them with no-op functions.
 * In development, console methods work normally.
 *
 * Usage: Import this file early in your app's entry point (index.js)
 *
 * Benefits:
 * - No need to modify existing console.log statements throughout the codebase
 * - Catches all console usage (log, warn, error, info, debug, etc.)
 * - Reduces bundle size and improves performance in production
 * - Prevents sensitive debug information from appearing in production
 */

// No-op function for production console methods
const noop = () => {}

/**
 * Initialize console override
 * Disables all console methods in production builds (__DEV__ = false)
 * Preserves console methods in development builds (__DEV__ = true)
 */
export const initializeConsoleOverride = () => {
	if (!__DEV__) {
		// Production: Replace all console methods with no-op functions
		console.log = noop
		console.warn = noop
		console.error = noop
		console.info = noop
		console.debug = noop
		console.trace = noop
		console.table = noop
		console.group = noop
		console.groupCollapsed = noop
		console.groupEnd = noop
		console.time = noop
		console.timeEnd = noop
		console.timeLog = noop
		console.count = noop
		console.countReset = noop
		console.assert = noop
		console.clear = noop
		console.dir = noop
		console.dirxml = noop
		console.profile = noop
		console.profileEnd = noop
		console.timeStamp = noop
	}
	// In development (__DEV__ = true), console methods remain unchanged
}

/*
 * DEBUGGING CAVEAT: because console.error and console.warn are no-ops in release
 * builds, a JavaScript error that only reproduces in release produces no output at
 * all — the app just dies silently. This actively obstructed diagnosing the
 * "Invalid font weight value: 32" launch crash, which was invisible here and only
 * became findable via `adb logcat -b crash -d` because it surfaced as a native
 * exception.
 *
 * When chasing a release-only bug, temporarily comment out the call to
 * initializeConsoleOverride() below so JS errors reach logcat.
 */

// Auto-initialize when this module is imported
initializeConsoleOverride()
