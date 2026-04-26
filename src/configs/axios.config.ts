/* eslint-disable @typescript-eslint/no-explicit-any */
import axios, {
	AxiosAdapter,
	AxiosError,
	AxiosHeaders,
	AxiosResponse,
	InternalAxiosRequestConfig,
} from 'axios'
import { nitroFetchOnWorklet } from 'react-native-nitro-fetch'
import { captureError } from '../utils/logging'
import LoggingContext from '../utils/logging/enums'

type NitroMappedResponse = {
	status: number
	statusText: string
	headers: Array<{ key: string; value: string }>
	data: unknown
}

function mapNitroJsonPayload(payload: {
	status: number
	statusText: string
	headers: Array<{ key: string; value: string }>
	bodyString?: string
}): NitroMappedResponse {
	'worklet'

	const rawBody = payload.bodyString ?? ''
	let data: unknown = null
	if (rawBody.length > 0) {
		try {
			data = JSON.parse(rawBody)
		} catch {
			data = rawBody
		}
	}

	return {
		status: payload.status,
		statusText: payload.statusText,
		headers: payload.headers,
		data,
	}
}

const nitroAxiosAdapter: AxiosAdapter = async (config) => {
	const url = buildFullURL(config)

	// Merge axios's signal / cancelToken / timeout into one AbortController
	// so native code sees a single abort event.
	const controller = new AbortController()
	const abortWith = (reason?: unknown) => controller.abort(reason)

	const external = config.signal
	const onExternalAbort = () => abortWith((external as any)?.reason)
	if (external) {
		if (external.aborted) abortWith((external as any).reason)
		else external.addEventListener?.('abort', onExternalAbort, { once: true })
	}

	config.cancelToken?.promise.then((cancel) => abortWith(cancel))

	let timeoutId: ReturnType<typeof setTimeout> | undefined
	if (config.timeout && config.timeout > 0) {
		timeoutId = setTimeout(() => {
			abortWith(
				new AxiosError(
					`timeout of ${config.timeout}ms exceeded`,
					AxiosError.ECONNABORTED,
					config,
				),
			)
		}, config.timeout)
	}

	try {
		const headers = AxiosHeaders.from(config.headers as any).toJSON() as Record<string, unknown>
		const normalizedHeaders: Record<string, string> = {}
		for (const [key, value] of Object.entries(headers)) {
			if (value === undefined || value === null) continue
			normalizedHeaders[key] = Array.isArray(value) ? value.join(',') : String(value)
		}

		const mapper = mapNitroJsonPayload

		const requestPromise = nitroFetchOnWorklet(
			url,
			{
				method: (config.method ?? 'get').toUpperCase(),
				headers: normalizedHeaders,
				// `config.data` is already transformed by axios's transformRequest
				// pipeline by the time the adapter sees it (string / FormData /
				// URLSearchParams / Blob / ArrayBuffer). Don't re-serialize.
				body: config.data,
				signal: controller.signal,
			},
			mapper,
			{
				preferBytes: false,
			},
		)

		const canceledPromise = new Promise<never>((_, reject) => {
			const onAbort = () => {
				const reason = (controller.signal as any).reason
				if (reason instanceof AxiosError) {
					reject(reason)
					return
				}
				reject(
					new AxiosError(reason?.message ?? 'canceled', AxiosError.ERR_CANCELED, config),
				)
			}

			if (controller.signal.aborted) {
				onAbort()
				return
			}

			controller.signal.addEventListener('abort', onAbort, { once: true })
		})

		const response = await Promise.race([requestPromise, canceledPromise])

		const data = response.data

		const responseHeaders = new AxiosHeaders()
		response.headers.forEach(({ value, key }) => responseHeaders.set(key, value))

		const axiosResponse: AxiosResponse = {
			data,
			status: response.status,
			statusText: response.statusText,
			headers: responseHeaders,
			config,
			request: null,
		}

		const validate = config.validateStatus
		if (!validate || validate(response.status)) return axiosResponse

		throw new AxiosError(
			`Request failed with status code ${response.status}`,
			Math.floor(response.status / 100) === 4
				? AxiosError.ERR_BAD_REQUEST
				: AxiosError.ERR_BAD_RESPONSE,
			config,
			null,
			axiosResponse,
		)
	} catch (err: any) {
		if (err?.name === 'AbortError' || controller.signal.aborted) {
			if (err instanceof AxiosError) throw err
			throw new AxiosError(err?.message ?? 'canceled', AxiosError.ERR_CANCELED, config)
		}
		throw err
	} finally {
		if (timeoutId !== undefined) clearTimeout(timeoutId)
		external?.removeEventListener?.('abort', onExternalAbort)
	}
}

function buildFullURL(config: InternalAxiosRequestConfig): string {
	let url = config.url ?? ''
	const isAbsolute = /^([a-z][a-z\d+\-.]*:)?\/\//i.test(url)
	if (config.baseURL && !isAbsolute) {
		url = config.baseURL.replace(/\/+$/, '') + '/' + url.replace(/^\/+/, '')
	}
	if (config.params) {
		const serializer = config.paramsSerializer
		const qs =
			typeof serializer === 'function'
				? serializer(config.params)
				: new URLSearchParams(config.params as Record<string, string>).toString()
		if (qs) url += (url.includes('?') ? '&' : '?') + qs
	}
	return url
}

const AXIOS_INSTANCE = axios.create({
	timeout: 60000,
	adapter: nitroAxiosAdapter,
})

export default AXIOS_INSTANCE
