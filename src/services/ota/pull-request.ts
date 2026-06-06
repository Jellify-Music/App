import { applyHapticFeedback } from '../../utils/haptics'
import OTA_GITHUB_URL from '../../configs/ota.config'
import { Platform, Alert } from 'react-native'

import { githubOTA, OTAUpdateManager, reloadApp } from 'react-native-nitro-ota'

export const downloadPRUpdate = (prNumber: number) => {
	const gitBranch = `PULL_REQUEST_${prNumber}_${Platform.OS}`
	const { downloadUrl, versionUrl } = githubOTA({
		githubUrl: OTA_GITHUB_URL,
		otaVersionPath: 'ota.version', // optional, defaults to 'ota.version'
		ref: gitBranch, // optional, defaults to 'main'
	})
	const otaManager = new OTAUpdateManager(downloadUrl, versionUrl)

	otaManager
		.downloadUpdate()
		.then(() => {
			applyHapticFeedback('success')
			Alert.alert('Jellify has been updated with the PR', 'Restart to apply the changes', [
				{ text: 'OK', onPress: reloadApp },
				{ text: 'Cancel', style: 'cancel' },
			])
		})
		.catch((error) => {
			applyHapticFeedback('fatal')
			Alert.alert('PR is not available or to be found')
		})
}
