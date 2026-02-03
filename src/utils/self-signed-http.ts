import ReactNativeBlobUtil, { FetchBlobResponse } from 'react-native-blob-util'

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'

export interface SelfSignedFetchOptions {
	method?: HttpMethod
	headers?: Record<string, string>
	body?: string
}

export interface SelfSignedFetchResult<T> {
	data: T
	status: number
}

/**
 * HTTP client that bypasses SSL certificate validation.
 * Use only for servers with self-signed certificates.
 *
 * @param url The full URL to fetch
 * @param options Fetch options (method, headers, body)
 * @returns The parsed JSON response and status
 * @throws Error with context if the request fails or returns a non-2xx status
 */
export async function selfSignedFetch<T>(
	url: string,
	options: SelfSignedFetchOptions = {},
): Promise<SelfSignedFetchResult<T>> {
	const { method = 'GET', headers = {}, body } = options

	if (!url) {
		throw new Error('selfSignedFetch: URL is required')
	}

	try {
		const response: FetchBlobResponse = await ReactNativeBlobUtil.config({
			trusty: true,
		}).fetch(method, url, headers, body)

		const status = response.info().status

		// Reject 4xx/5xx responses
		if (status >= 400) {
			const errorBody = response.text()
			throw new Error(
				`selfSignedFetch failed: ${method} ${url} returned ${status}${errorBody ? `: ${errorBody}` : ''}`,
			)
		}

		// Parse JSON response
		let data: T
		try {
			data = response.json() as T
		} catch {
			throw new Error(`selfSignedFetch: Failed to parse JSON response from ${method} ${url}`)
		}

		return { data, status }
	} catch (error) {
		// Re-throw our own errors as-is
		if (error instanceof Error && error.message.startsWith('selfSignedFetch')) {
			throw error
		}
		// Wrap other errors with context
		const message = error instanceof Error ? error.message : String(error)
		throw new Error(`selfSignedFetch failed: ${method} ${url} - ${message}`)
	}
}
