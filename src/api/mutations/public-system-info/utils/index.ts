import { getSystemApi } from '@jellyfin/sdk/lib/utils/api'

import { Jellyfin } from '@jellyfin/sdk/lib/jellyfin'
import { JellyfinInfo } from '../../../info'
import { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models'
import { Api } from '@jellyfin/sdk'
import HTTPS, { HTTP } from '../../../../constants/protocols'
import ReactNativeBlobUtil, { FetchBlobResponse } from 'react-native-blob-util'

type ConnectionType = 'hostname' | 'ipAddress'

/**
 * Attempts to connect to a Jellyfin server.
 *
 * @param serverAddress The server address to connect to.
 * @param useHttps Whether to use HTTPS.
 * @param allowSelfSignedCerts Whether to allow self-signed certificates.
 * @returns The public system info response.
 */
export function connectToServer(
	serverAddress: string,
	useHttps: boolean,
	allowSelfSignedCerts?: boolean,
): Promise<{
	publicSystemInfoResponse: PublicSystemInfo
	connectionType: ConnectionType
}> {
	return new Promise((resolve, reject) => {
		if (!serverAddress) return reject(new Error('Server address was empty'))

		const serverAddressContainsProtocol =
			serverAddress.includes(HTTP) || serverAddress.includes(HTTPS)

		const jellyfin = new Jellyfin(JellyfinInfo)

		const hostnameApi = jellyfin.createApi(
			`${serverAddressContainsProtocol ? '' : useHttps ? HTTPS : HTTP}${serverAddress}`,
		)

		return connect(hostnameApi, 'hostname', allowSelfSignedCerts)
			.then((response) => resolve(response))
			.catch(reject)
	})
}

function connect(api: Api, connectionType: ConnectionType, allowSelfSignedCerts?: boolean) {
	if (allowSelfSignedCerts) {
		return ReactNativeBlobUtil.config({
			trusty: true,
		})

			.fetch('GET', `${api.basePath}/System/Info/Public`)
			.then((response: FetchBlobResponse) => {
				if (response.info().status >= 200 && response.info().status < 300) {
					const data = response.json() as PublicSystemInfo
					if (!data.Version)
						throw new Error(
							`Jellyfin instance did not respond to our ${connectionType} request`,
						)

					return {
						publicSystemInfoResponse: data,
						connectionType,
					}
				} else {
					throw new Error(
						`Unable to connect to Jellyfin via ${connectionType}: ${response.info().status}`,
					)
				}
			})
			.catch((error: Error) => {
				console.error('An error occurred getting public system info', error)
				throw new Error(`Unable to connect to Jellyfin via ${connectionType}`)
			}) as Promise<{
			publicSystemInfoResponse: PublicSystemInfo
			connectionType: ConnectionType
		}>
	}

	return getSystemApi(api)
		.getPublicSystemInfo()
		.then((response) => {
			if (!response.data.Version)
				throw new Error(
					`Jellyfin instance did not respond to our ${connectionType} request`,
				)

			return {
				publicSystemInfoResponse: response.data,
				connectionType,
			}
		})
		.catch((error) => {
			console.error('An error occurred getting public system info', error)
			throw new Error(`Unable to connect to Jellyfin via ${connectionType}`)
		})
}
