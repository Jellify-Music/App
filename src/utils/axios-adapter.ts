import { AxiosRequestConfig, AxiosResponse, AxiosHeaders, InternalAxiosRequestConfig } from 'axios'
import { selfSignedFetch } from './self-signed-http'

/**
 * Axios adapter that uses ReactNativeBlobUtil with SSL certificate bypass.
 * Used for connecting to servers with self-signed certificates.
 */
export const selfSignedAdapter = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
	const { url, method, headers, data } = config

	if (!url) {
		throw new Error('selfSignedAdapter: URL is required')
	}

	const result = await selfSignedFetch<unknown>(url, {
		method: (method?.toUpperCase() || 'GET') as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
		headers: headers as Record<string, string>,
		body: data,
	})

	const axiosResponse: AxiosResponse = {
		data: result.data,
		status: result.status,
		statusText: result.status >= 200 && result.status < 300 ? 'OK' : 'Error',
		headers: {} as AxiosHeaders,
		config: config as InternalAxiosRequestConfig,
		request: undefined,
	}

	return axiosResponse
}
