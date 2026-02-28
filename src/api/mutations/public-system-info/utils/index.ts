import { getSystemApi } from '@jellyfin/sdk/lib/utils/api'

import { Jellyfin } from '@jellyfin/sdk/lib/jellyfin'
import { JellyfinInfo } from '../../../info'
import { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models'
import { Api } from '@jellyfin/sdk'
import HTTPS, { HTTP } from '../../../../constants/protocols'
import { selfSignedFetch } from '../../../../utils/self-signed-http'

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

/**
 * Validates that the response is a valid PublicSystemInfo object.
 * Simple runtime check without external libraries.
 */
function isValidPublicSystemInfo(data: unknown): data is PublicSystemInfo {
	if (!data || typeof data !== 'object') return false
	const obj = data as Record<string, unknown>
	// Version is the critical field - if it exists, server responded correctly
	return typeof obj.Version === 'string' && obj.Version.length > 0
}

function connect(
	api: Api,
	connectionType: ConnectionType,
	allowSelfSignedCerts?: boolean,
): Promise<{
	publicSystemInfoResponse: PublicSystemInfo
	connectionType: ConnectionType
}> {
	const url = `${api.basePath}/System/Info/Public`

	if (allowSelfSignedCerts) {
		return selfSignedFetch<unknown>(url, { method: 'GET' })
			.then((result) => {
				if (!isValidPublicSystemInfo(result.data)) {
					throw new Error(
						`Invalid response from Jellyfin instance via ${connectionType}: missing Version`,
					)
				}

				return {
					publicSystemInfoResponse: result.data,
					connectionType,
				}
			})
			.catch((error: Error) => {
				console.error('An error occurred getting public system info', error)
				throw new Error(
					`Unable to connect to Jellyfin via ${connectionType}: ${error.message}`,
				)
			})
	}

	return getSystemApi(api)
		.getPublicSystemInfo()
		.then((response) => {
			if (!isValidPublicSystemInfo(response.data)) {
				throw new Error(
					`Invalid response from Jellyfin instance via ${connectionType}: missing Version`,
				)
			}

			return {
				publicSystemInfoResponse: response.data,
				connectionType,
			}
		})
		.catch((error) => {
			console.error('An error occurred getting public system info', error)
			const message = error instanceof Error ? error.message : String(error)
			throw new Error(`Unable to connect to Jellyfin via ${connectionType}: ${message}`)
		})
}
