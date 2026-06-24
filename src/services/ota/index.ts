import { OTA_DOWNLOAD_URL, OTA_VERSION_URL } from '../../configs/ota.config'
import { Alert } from 'react-native'
import { OTAUpdateManager, reloadApp } from 'react-native-nitro-ota'

const otaManager = new OTAUpdateManager(OTA_DOWNLOAD_URL, OTA_VERSION_URL)

export const checkGitVersion = () => {
	otaManager
		.checkForUpdates()
		.then((update) => {
			if (update) {
				downloadUpdate()
			}
		})
		.catch((error) => {
			console.error('Error checking for updates:', error)
		})
}

export const downloadUpdate = (showCatchAlert: boolean = false) => {
	otaManager
		.downloadUpdate()
		.then(() => {
			Alert.alert('Jellify has been updated!', 'Restart to apply the changes', [
				{ text: 'OK', onPress: () => reloadApp() },
				{ text: 'Cancel', style: 'cancel' },
			])
		})
		.catch((error) => {
			if (showCatchAlert) {
				Alert.alert('Update not available')
			}
			console.error('Error downloading update:', error)
		})
}
