/**
 * Auto-detect music server type from URL.
 * Attempts to identify whether the server is Jellyfin or Navidrome/Subsonic.
 */

import { ServerBackend } from './types'

/**
 * Detection result with server info.
 */
export interface ServerDetectionResult {
	backend: ServerBackend
	serverName: string
	version: string
}

/**
 * Detect the server type from a URL by probing known endpoints.
 *
 * Detection strategy:
 * 1. Try both Jellyfin and Subsonic endpoints in parallel
 * 2. Return whichever succeeds first
 *
 * @param url Base URL of the server (e.g., "https://music.example.com")
 * @returns Detection result or null if server type cannot be determined
 */
export async function detectServerType(url: string): Promise<ServerDetectionResult | null> {
	// Normalize URL - remove trailing slash
	const baseUrl = url.replace(/\/+$/, '')

	// Try both in parallel for faster detection
	const [jellyfinResult, subsonicResult] = await Promise.all([
		tryJellyfin(baseUrl),
		trySubsonic(baseUrl),
	])

	// Return Jellyfin if detected, otherwise Subsonic
	if (jellyfinResult) {
		return jellyfinResult
	}

	if (subsonicResult) {
		return subsonicResult
	}

	return null
}

/**
 * Attempt to detect a Jellyfin server.
 */
async function tryJellyfin(baseUrl: string): Promise<ServerDetectionResult | null> {
	try {
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 5000)

		const response = await fetch(`${baseUrl}/System/Info/Public`, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
			},
			signal: controller.signal,
		})

		clearTimeout(timeoutId)

		if (!response.ok) {
			return null
		}

		const data = await response.json()

		// Verify it's actually Jellyfin
		if (data.ProductName?.toLowerCase().includes('jellyfin')) {
			return {
				backend: 'jellyfin',
				serverName: data.ServerName || 'Jellyfin Server',
				version: data.Version || 'unknown',
			}
		}

		return null
	} catch {
		return null
	}
}

/**
 * Attempt to detect a Navidrome/Subsonic server.
 * Subsonic servers return a valid response structure even without auth.
 */
async function trySubsonic(baseUrl: string): Promise<ServerDetectionResult | null> {
	try {
		const controller = new AbortController()
		const timeoutId = setTimeout(() => controller.abort(), 5000)

		// Subsonic ping - even without proper auth, will return valid Subsonic response structure
		const pingUrl = `${baseUrl}/rest/ping.view?v=1.16.1&c=jellify&f=json`

		const response = await fetch(pingUrl, {
			method: 'GET',
			headers: {
				Accept: 'application/json',
			},
			signal: controller.signal,
		})

		clearTimeout(timeoutId)

		// Subsonic returns 200 even for auth failures, with status="failed" in body
		// But some servers might return other codes - try to parse anyway
		let data
		try {
			data = await response.json()
		} catch {
			// Not JSON, not a Subsonic server
			return null
		}

		const subsonicResponse = data['subsonic-response']

		// If we have a subsonic-response object, it's a Subsonic-compatible server
		// This works even if status is "failed" due to auth
		if (subsonicResponse) {
			// Try to detect if it's Navidrome specifically
			const serverType = subsonicResponse.type || subsonicResponse.serverVersion || ''
			const isNavidrome = serverType.toLowerCase().includes('navidrome')

			return {
				backend: 'navidrome',
				serverName: isNavidrome ? 'Navidrome' : 'Subsonic Server',
				version: subsonicResponse.version || 'unknown',
			}
		}

		return null
	} catch {
		return null
	}
}

/**
 * Validate that a URL is properly formatted.
 */
export function isValidServerUrl(url: string): boolean {
	try {
		const parsed = new URL(url)
		return parsed.protocol === 'http:' || parsed.protocol === 'https:'
	} catch {
		return false
	}
}

/**
 * Normalize a server URL for consistent storage.
 * Removes trailing slashes and ensures protocol is present.
 */
export function normalizeServerUrl(url: string): string {
	let normalized = url.trim()

	// Add https:// if no protocol
	if (!normalized.match(/^https?:\/\//i)) {
		normalized = `https://${normalized}`
	}

	// Remove trailing slashes
	normalized = normalized.replace(/\/+$/, '')

	return normalized
}
