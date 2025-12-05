import { Api } from '@jellyfin/sdk'
import { nitroFetchOnWorklet } from 'react-native-nitro-fetch'
import { isUndefined } from 'lodash'

/**
 * Helper to perform a GET request using NitroFetch.
 * @param api The Jellyfin Api instance (used for basePath and accessToken).
 * @param path The API endpoint path (e.g., '/Items').
 * @param params Optional query parameters object.
 * @returns The parsed JSON response.
 */
export async function nitroFetch<T>(
	api: Api | undefined,
	path: string,
	params?: Record<string, string | number | boolean | undefined | string[]>,
	timeoutMs: number = 60000,
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

	console.debug(`[NitroFetch] GET ${url}`)

	try {
		// Use nitroFetchOnWorklet to offload JSON parsing to a background thread
		const data = await nitroFetchOnWorklet<T>(
			url,
			{
				method: 'GET',
				headers: {
					'Content-Type': 'application/json',
					'X-Emby-Token': accessToken,
					Authorization: `MediaBrowser Client="Jellify", Device="ReactNative", DeviceId="Unknown", Version="0.0.1", Token="${accessToken}"`,
				},
				// @ts-expect-error - timeoutMs is a custom property supported by nitro-fetch
				timeoutMs,
			},
			(response) => {
				'worklet'
				if (response.status >= 200 && response.status < 300) {
					if (response.bodyString) {
						return JSON.parse(response.bodyString) as T
					}
					throw new Error('NitroFetch error: Empty response body')
				} else {
					throw new Error(`NitroFetch error: ${response.status} ${response.bodyString}`)
				}
			},
		)
		return data
	} catch (error) {
		console.error('[NitroFetch] Error:', error)
		throw error
	}
}
