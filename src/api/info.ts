import { Jellyfin } from '@jellyfin/sdk'
import { getDeviceNameSync, getUniqueIdSync } from 'react-native-device-info'
import { name, version } from '../../package.json'
import { capitalize } from 'lodash'

/**
 * Client object that represents Jellify on the Jellyfin server.
 */
export const JellyfinInfo: Jellyfin = new Jellyfin({
	clientInfo: {
		name: capitalize(name),
		version: version,
	},
	deviceInfo: {
		name: getDeviceNameSync(),
		id: getUniqueIdSync(),
	},
})
