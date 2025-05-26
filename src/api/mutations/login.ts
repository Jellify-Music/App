import { getSystemApi } from '@jellyfin/sdk/lib/utils/api'

import { http } from '../../components/Login/utils/constants'

import { Jellyfin } from '@jellyfin/sdk/lib/jellyfin'
import { JellyfinInfo } from '../info'
import { https } from '../../components/Login/utils/constants'
import { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models'
import { getIpAddressesForHostname } from 'react-native-dns-lookup'

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
	connectionType: 'hostname' | 'ipAddress'
}> {
	return new Promise((resolve, reject) => {
		if (!serverAddress) return reject(new Error('Server address was empty'))

		const serverAddressContainsProtocol =
			serverAddress.includes(http) || serverAddress.includes(https)

		const jellyfin = new Jellyfin(JellyfinInfo)

		const api = jellyfin.createApi(
			`${serverAddressContainsProtocol ? '' : useHttps ? https : http}${serverAddress}`,
		)

		const connectViaHostnamePromise = () =>
			new Promise<{
				publicSystemInfoResponse: PublicSystemInfo
				connectionType: 'hostname'
			}>((resolve, reject) => {
				getSystemApi(api)
					.getPublicSystemInfo()
					.then((response) => {
						if (!response.data.Version)
							return reject(
								new Error(
									'Jellyfin instance did not respond to our hostname request',
								),
							)
						return resolve({
							publicSystemInfoResponse: response.data,
							connectionType: 'hostname',
						})
					})
					.catch((error) => {
						console.error('An error occurred getting public system info', error)
						return reject(new Error('Unable to connect to Jellyfin via hostname'))
					})
			})

		const connectViaLocalNetworkPromise = () =>
			new Promise<{
				publicSystemInfoResponse: PublicSystemInfo
				connectionType: 'ipAddress'
			}>((resolve, reject) =>
				getIpAddressesForHostname(serverAddress.split(':')[0]).then((ipAddress) => {
					const ipAddressApi = jellyfin.createApi(
						`${serverAddressContainsProtocol ? '' : useHttps ? https : http}${ipAddress[0]}:${serverAddress.split(':')[1]}`,
					)
					getSystemApi(ipAddressApi)
						.getPublicSystemInfo()
						.then((response) => {
							if (!response.data.Version)
								return reject(
									new Error(
										'Jellyfin instance did not respond to our IP Address request',
									),
								)
							return resolve({
								publicSystemInfoResponse: response.data,
								connectionType: 'ipAddress',
							})
						})
						.catch((error) => {
							console.error('An error occurred getting public system info', error)
							return reject(new Error('Unable to connect to Jellyfin via IP Address'))
						})
				}),
			)

		connectViaHostnamePromise()
			.then((response) => resolve(response))
			.catch(() =>
				connectViaLocalNetworkPromise()
					.then((response) => resolve(response))
					.catch(reject),
			)
	})
}
