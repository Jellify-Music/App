import {
	AxiosPromise,
	AxiosRequestConfig,
	AxiosResponse,
	AxiosHeaders,
	InternalAxiosRequestConfig,
} from 'axios'
import ReactNativeBlobUtil, { FetchBlobResponse } from 'react-native-blob-util'

type BlobUtilMethod =
	| 'POST'
	| 'GET'
	| 'DELETE'
	| 'PUT'
	| 'PATCH'
	| 'post'
	| 'get'
	| 'delete'
	| 'put'
	| 'patch'

export const selfSignedAdapter = async (config: AxiosRequestConfig): Promise<AxiosResponse> => {
	return new Promise((resolve, reject) => {
		const { url, method, headers, data } = config

		if (!url) {
			return reject(new Error('URL is required'))
		}

		ReactNativeBlobUtil.config({
			trusty: true,
		})
			.fetch(
				(method?.toUpperCase() || 'GET') as BlobUtilMethod,
				url,
				headers as Record<string, string>,
				data,
			)
			.then((response) => {
				const responseData = response.json()
				const responseHeaders = response.info().headers

				const axiosResponse: AxiosResponse = {
					data: responseData,
					status: response.info().status,
					statusText: response.info().respType,
					headers: responseHeaders as unknown as AxiosHeaders,
					config: config as InternalAxiosRequestConfig,
					request: undefined,
				}

				resolve(axiosResponse)
			})
			.catch((error) => {
				reject(error)
			})
	})
}
