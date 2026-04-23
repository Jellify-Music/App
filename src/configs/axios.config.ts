import axios, { AxiosAdapter } from 'axios'
import { fetch, nitroFetchOnWorklet, NitroResponse } from 'react-native-nitro-fetch'
import { HTTP_TIMEOUT } from './network.config'
import { createWorkletRuntime } from 'react-native-worklets'
import JellifyRuntime from '../enums/runtimes'

const nitroFetchRuntime = createWorkletRuntime({
	name: JellifyRuntime.Fetch,
})

interface NitroWorkletResult {
	headers: Record<string, string>
	status: number
	statusText: string
	body: Record<string, unknown> | null
}

const nitroWorkletMapperConfig = {
	preferBytes: false,
	runtimeName: nitroFetchRuntime.name,
}

const nitroWorkletMapper = (payload: {
	url: string
	status: number
	statusText: string
	ok: boolean
	redirected: boolean
	headers: { key: string; value: string }[]
	bodyString?: string
}) => {
	'worklet'
	return {
		headers: payload.headers.reduce(
			(acc, { key, value }) => {
				acc[key] = value
				return acc
			},
			{} as Record<string, string>,
		),
		status: payload.status,
		statusText: payload.statusText,
		body: JSON.parse(payload.bodyString ?? '{}') as Record<string, unknown>,
	} as NitroWorkletResult
}

/**
 * Custom Axios adapter using {@link fetch} from `react-native-nitro-fetch`.
 *
 * This will handle HTTP requests made through Axios by leveraging the Nitro Fetch API.
 *
 * @param config the Axios request config
 * @returns
 */
const nitroAxiosAdapter: AxiosAdapter = async (config) => {
	const {
		headers,
		status,
		statusText,
		body: data,
	} = await nitroFetchOnWorklet(
		config.url!,
		{
			method: config.method?.toUpperCase(),
			headers: config.headers,
			body: config.data,
			cache: 'no-store',
		},
		nitroWorkletMapper,
		nitroWorkletMapperConfig,
	)

	return {
		data,
		status,
		statusText,
		headers,
		config,
		request: null, // Axios includes the original request object here, but Nitro Fetch does not expose it
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
	timeout: HTTP_TIMEOUT,
	adapter: nitroAxiosAdapter,
})

export default AXIOS_INSTANCE
