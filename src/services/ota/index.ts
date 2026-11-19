import { OTA_DOWNLOAD_URL, OTA_VERSION_URL } from '../../configs/ota.config'
import { Alert } from 'react-native'
import { OTAUpdateManager, reloadApp } from 'react-native-nitro-ota'
import i18n from '../../i18n'
import navigationRef from '../../screens/navigation'

const otaManager = new OTAUpdateManager(OTA_DOWNLOAD_URL, OTA_VERSION_URL)

export const checkGitVersion = () => {
	// JS-side check: understands the JSON manifest on every native version and honours the blacklist
	otaManager
		.hasCompatibleUpdate()
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
			console.log('OTA download:', otaManager.lastDownload)
			// The download can finish before the navigator mounts, so fall back to an alert
			if (navigationRef.isReady()) navigationRef.navigate('Ota')
			else
				Alert.alert(i18n.t('ota.updated'), i18n.t('ota.restartInstructions'), [
					{ text: i18n.t('common.ok'), onPress: () => reloadApp() },
					{ text: i18n.t('common.cancel'), style: 'cancel' },
				])
		})
		.catch((error) => {
			if (showCatchAlert) {
				Alert.alert(i18n.t('ota.notAvailable'))
			}
			console.error('Error downloading update:', error)
		})
}
