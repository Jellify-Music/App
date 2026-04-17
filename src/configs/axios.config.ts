import axios, { AxiosAdapter } from 'axios'
import { fetch } from 'react-native-nitro-fetch'

/**
 * Custom Axios adapter using {@link fetch} from `react-native-nitro-fetch`.
 *
 * This will handle HTTP requests made through Axios by leveraging the Nitro Fetch API.
 *
 * Response parsing contract:
 * - If the response declares a JSON content-type, parse it as JSON.
 * - If JSON parsing fails on a 2xx response, surface a descriptive error that
 *   includes a snippet of the body instead of a cryptic "Unexpected character".
 * - For non-JSON content types (HTML error pages, plain text, redirects), keep
 *   the raw text as `data` so upstream error handlers can see what the server
 *   actually returned. Axios' default validateStatus will still reject non-2xx
 *   responses as errors, but now with a useful body instead of a parse failure.
 *
 * @param config the Axios request config
 * @returns
 */
export const nitroAxiosAdapter: AxiosAdapter = async (config) => {
	const url = config.url ?? ''
	const response = await fetch(url, {
		method: config.method?.toUpperCase(),
		headers: config.headers,
		body: config.data,
		cache: 'no-store',
	})

	const responseText = await response.text()

	const headers: Record<string, string> = {}
	response.headers.forEach((value, key) => {
		headers[key] = value
	})

	// Content-Type is case-insensitive and may include parameters (charset, boundary, etc.),
	// so normalize to a bare lowercase media type before matching.
	const rawContentType = headers['content-type'] ?? ''
	const mediaType = rawContentType.split(';', 1)[0]?.trim().toLowerCase() ?? ''
	const looksLikeJson = mediaType === 'application/json' || mediaType.endsWith('+json')

	let data: unknown = null
	if (responseText.length > 0) {
		if (looksLikeJson) {
			try {
				data = JSON.parse(responseText)
			} catch (parseError) {
				// Only a fatal problem when the server claimed JSON with a 2xx —
				// otherwise we just keep the raw text so error handlers can use it.
				if (response.status >= 200 && response.status < 300) {
					const snippet = responseText.slice(0, 200)
					const reason =
						parseError instanceof Error ? parseError.message : String(parseError)
					throw new Error(
						`Failed to parse JSON response from ${url} (HTTP ${response.status}): ${reason}. Body starts with: ${snippet}`,
					)
				}
				data = responseText
			}
		} else {
			data = responseText
		}
	}

	return {
		data,
		status: response.status,
		statusText: response.statusText,
		headers,
		config,
		request: null,
	}
}

/**
 * The Axios instance for making HTTP requests.
 *
 * Leverages the {@link nitroAxiosAdapter} for handling requests.
 *
 * Default timeout is set to 60 seconds.
 */
const AXIOS_INSTANCE = axios.create({
	timeout: 60000,
	adapter: nitroAxiosAdapter,
})

export default AXIOS_INSTANCE
