import { applyHapticFeedback } from '../../utils/haptics'
import OTA_GITHUB_URL from '../../configs/ota.config'
import { Platform, Alert } from 'react-native'

import { githubOTA, OTAUpdateManager, reloadApp } from 'react-native-nitro-ota'
import i18n from '../../i18n'

export const downloadPRUpdate = (prNumber: number) => {
	const gitBranch = `PULL_REQUEST_${prNumber}_${Platform.OS}`
	const { downloadUrl, versionUrl } = githubOTA({
		githubUrl: OTA_GITHUB_URL,
		otaVersionPath: 'ota.version.json', // JSON manifest, lists differential patches
		ref: gitBranch, // optional, defaults to 'main'
	})
	const otaManager = new OTAUpdateManager(downloadUrl, versionUrl)

	otaManager
		.downloadUpdate()
		.then(() => {
			applyHapticFeedback('success')
			Alert.alert(i18n.t('ota.prUpdated'), i18n.t('ota.restart'), [
				{ text: i18n.t('common.ok'), onPress: reloadApp },
				{ text: i18n.t('common.cancel'), style: 'cancel' },
			])
		})
		.catch((error) => {
			applyHapticFeedback('fatal')
			Alert.alert(i18n.t('ota.prNotAvailable'))
		})
}
