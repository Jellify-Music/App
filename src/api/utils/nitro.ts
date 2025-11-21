import { Api } from '@jellyfin/sdk'
import { fetch as nativeFetch } from 'react-native-nitro-fetch'
import { isUndefined } from 'lodash'
import { createWorkletRuntime, runOnRuntime } from 'react-native-worklets'

const workletRuntime = createWorkletRuntime('nitro-fetch')

const parseJsonWorklet = (text: string) => {
	'worklet'
	return JSON.parse(text)
}

/**
 * Helper to perform a request using NitroFetch.
 * @param api The Jellyfin Api instance (used for basePath and accessToken).
 * @param path The API endpoint path (e.g., '/Items').
 * @param params Optional query parameters object.
 * @param method The HTTP method to use (default: 'GET').
 * @param body Optional body for POST/PUT requests.
 * @returns The parsed JSON response.
 */
export async function nitroFetch<T>(
	api: Api | undefined,
	path: string,
	params?: Record<string, string | number | boolean | undefined | string[]>,
	method: 'GET' | 'POST' | 'DELETE' = 'GET',
	body?: unknown,
	timeoutMs: number = 30000,
): Promise<T> {
	if (isUndefined(api)) {
		throw new Error('Client instance not set')
	}

	const basePath = api.basePath
	const accessToken = api.accessToken

	// Construct query string
	const urlParams = new URLSearchParams()
	if (params) {
		Object.entries(params).forEach(([key, value]) => {
			if (value !== undefined && value !== null) {
				if (Array.isArray(value)) {
					// Jellyfin often expects comma-separated values or repeated keys.
					// The SDK usually does comma-separated for things like 'Fields'.
					// We'll join with commas for now as that's common for Jellyfin lists in query params.
					urlParams.append(key, value.join(','))
				} else {
					urlParams.append(key, String(value))
				}
			}
		})
	}

	const url = `${basePath}${path}?${urlParams.toString()}`

	console.debug(`[NitroFetch] ${method} ${url}`)

	try {
		const response = await nativeFetch(url, {
			method,
			headers: {
				'Content-Type': 'application/json',
				'X-Emby-Token': accessToken,
				Authorization: `MediaBrowser Client="Jellify", Device="ReactNative", DeviceId="Unknown", Version="0.0.1", Token="${accessToken}"`,
			},
			body: body ? JSON.stringify(body) : undefined,
			// @ts-expect-error - timeoutMs is a custom property supported by nitro-fetch
			timeoutMs,
		})

		if (response.status >= 200 && response.status < 300) {
			const text = await response.text()
			return (await runOnRuntime(workletRuntime, parseJsonWorklet)(text)) as T
		} else {
			throw new Error(`NitroFetch error: ${response.status} ${await response.text()}`)
		}
	} catch (error) {
		console.error('[NitroFetch] Error:', error)
		throw error
	}
}
