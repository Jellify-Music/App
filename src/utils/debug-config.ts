/**
 * Debug configuration for controlling console output and in-app warnings
 * This disables console.debug, console.log in production builds
 * and removes yellow/red warning boxes from the app interface
 */

import { LogBox } from 'react-native'

// Disable all LogBox warnings (yellow boxes) in the app
LogBox.ignoreAllLogs(true)

// Only keep warnings and errors in production
if (!__DEV__) {
	console.debug = () => {}
	console.log = () => {}
	// Optionally disable warnings too:
	// console.warn = () => {}

	// Keep console.error for critical issues even in production
	// console.error is preserved
}

// For development, you can control specific debug levels
export const DEBUG_LEVELS = {
	PLAYER: __DEV__, // Player-related debug messages
	API: __DEV__, // API-related debug messages
	QUEUE: __DEV__, // Queue-related debug messages
	GENERAL: __DEV__, // General debug messages
}

// Utility functions for conditional logging
export const debugLog = {
	player: (...args: unknown[]) => DEBUG_LEVELS.PLAYER && console.debug('[PLAYER]', ...args),
	api: (...args: unknown[]) => DEBUG_LEVELS.API && console.debug('[API]', ...args),
	queue: (...args: unknown[]) => DEBUG_LEVELS.QUEUE && console.debug('[QUEUE]', ...args),
	general: (...args: unknown[]) => DEBUG_LEVELS.GENERAL && console.debug('[DEBUG]', ...args),
}
