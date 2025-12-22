import axios, { AxiosAdapter } from 'axios'
import { fetch } from 'react-native-nitro-fetch'

const nitroAxiosAdapter: AxiosAdapter = async (config) => {
	const response = await fetch(config.url!, {
		method: config.method?.toUpperCase(),
		headers: config.headers,
		body: config.data,
	})

	const data = await response.json()

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
 * Default timeout is set to 60 seconds.
 */
const AXIOS_INSTANCE = axios.create({
	timeout: 60000,
	adapter: nitroAxiosAdapter,
})

export default AXIOS_INSTANCE
