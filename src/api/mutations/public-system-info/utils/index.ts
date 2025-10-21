import { getSystemApi } from '@jellyfin/sdk/lib/utils/api'

import { Jellyfin } from '@jellyfin/sdk/lib/jellyfin'
import { JellyfinInfo } from '../../../info'
import { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models'
import { getIpAddressesForHostname } from 'react-native-dns-lookup'
import { Api } from '@jellyfin/sdk'
import HTTPS, { HTTP } from '../../../../constants/protocols'

type ConnectionType = 'hostname' | 'ipAddress'

/**
 * Attempts to connect to a Jellyfin server.
 *
 * @param serverAddress The server address to connect to.
 * @param useHttps Whether to use HTTPS.
 * @returns The public system info response.
 */
export function connectToServer(
	serverAddress: string,
	useHttps: boolean,
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

		const connectViaIpAddress = () => {
			return getIpAddressesForHostname(serverAddress.split(':')[0])
				.then((ipAddress) => {
					const ipAddressApi = jellyfin.createApi(
						`${serverAddressContainsProtocol ? '' : useHttps ? HTTPS : HTTP}${ipAddress[0]}:${serverAddress.split(':')[1]}`,
					)
					return connect(ipAddressApi, `ipAddress`)
				})
				.catch(() => {
					throw new Error(`Unable to lookup IP Addresses for Hostname`)
				})
		}

		return connect(hostnameApi, 'hostname')
			.then((response) => resolve(response))
			.catch(() =>
				connectViaIpAddress()
					.then((response) => resolve(response))
					.catch(reject),
			)
	})
}

function connect(api: Api, connectionType: ConnectionType) {
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
