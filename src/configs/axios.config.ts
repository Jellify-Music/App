import axios, { AxiosAdapter } from 'axios'
import { fetch } from 'react-native-nitro-fetch'

/**
 * Custom Axios adapter using {@link fetch} from `react-native-nitro-fetch`.
 *
 * This will handle HTTP requests made through Axios by leveraging the Nitro Fetch API.
 *
 * @param config the Axios request config
 * @returns
 */
const nitroAxiosAdapter: AxiosAdapter = async (config) => {
	const response = await fetch(config.url!, {
		method: config.method?.toUpperCase(),
		headers: config.headers,
		body: config.data,
		cache: 'no-store',
	})

	const responseText = await response.text()

	const data = responseText.length > 0 ? JSON.parse(responseText) : null

	const headers: Record<string, string> = {}
	response.headers.forEach((value, key) => {
		headers[key] = value
	})

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
