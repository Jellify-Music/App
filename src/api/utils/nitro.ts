import { Api } from '@jellyfin/sdk'
import { nitroFetchOnWorklet } from 'react-native-nitro-fetch'
import { isUndefined } from 'lodash'
import { getModel, getUniqueIdSync } from 'react-native-device-info'
import { name, version } from '../../../package.json'
import { selfSignedFetch } from '../../utils/self-signed-http'
import useJellifyStore from '../../stores'

/** Helper to get allowSelfSignedCerts setting from store */
export function getAllowSelfSignedCerts(): boolean {
	return useJellifyStore.getState().server?.allowSelfSignedCerts ?? false
}

/**
 * Helper to perform a GET request using NitroFetch.
 * @param api The Jellyfin Api instance (used for basePath and accessToken).
 * @param path The API endpoint path (e.g., '/Items').
 * @param params Optional query parameters object.
 * @param options Optional settings including timeout and self-signed cert handling.
 * @returns The parsed JSON response.
 */
export async function nitroFetch<T>(
	api: Api | undefined,
	path: string,
	params?: Record<string, string | number | boolean | undefined | string[]>,
	options?: {
		timeoutMs?: number
		allowSelfSignedCerts?: boolean
	},
): Promise<T> {
	const { timeoutMs = 60000, allowSelfSignedCerts = getAllowSelfSignedCerts() } = options ?? {}

	if (isUndefined(api)) {
		throw new Error('nitroFetch: Client instance not set')
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

	console.debug(`[nitroFetch] GET ${url}`)

	const headers = {
		'Content-Type': 'application/json',
		'X-Emby-Token': accessToken ?? '',
		Authorization: `MediaBrowser Client="${name}", Device="${getModel()}", DeviceId="${getUniqueIdSync()}", Version="${version}", Token="${accessToken}"`,
	}

	try {
		if (allowSelfSignedCerts) {
			const result = await selfSignedFetch<T>(url, {
				method: 'GET',
				headers,
			})
			return result.data
		}

		// Use nitroFetchOnWorklet to offload JSON parsing to a background thread
		const data = await nitroFetchOnWorklet<T>(
			url,
			{
				method: 'GET',
				headers,
				// @ts-expect-error - timeoutMs is a custom property supported by nitro-fetch
				timeoutMs,
			},
			(response) => {
				'worklet'
				if (response.status >= 200 && response.status < 300) {
					if (response.bodyString) {
						return JSON.parse(response.bodyString) as T
					}
					throw new Error('nitroFetch: Empty response body')
				} else {
					throw new Error(
						`nitroFetch failed: GET ${path} returned ${response.status}${response.bodyString ? `: ${response.bodyString}` : ''}`,
					)
				}
			},
		)
		return data
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error)
		console.error(`[nitroFetch] Error fetching ${path}:`, message)
		throw error
	}
}
