import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { githubOTA } from 'react-native-nitro-ota'
import Config from 'react-native-superconfig'
import { GITHUB_ORG_URL } from './config'

export const OTA_UPDATE_ENABLED = Config.OTA_UPDATE_ENABLED === 'true'

export const APP_GITHUB_URL = `${GITHUB_ORG_URL}/App`
export const OTA_GITHUB_URL = `${GITHUB_ORG_URL}/App-Bundles`

const version = DeviceInfo.getVersion()

const gitBranch = `nitro_${version}_${Platform.OS}`

const { downloadUrl, versionUrl } = githubOTA({
	githubUrl: OTA_GITHUB_URL,
	otaVersionPath: 'ota.version.json', // JSON manifest, lists differential patches
	ref: gitBranch, // optional, defaults to 'main'
})

export const OTA_DOWNLOAD_URL = downloadUrl
export const OTA_VERSION_URL = versionUrl

export default OTA_GITHUB_URL
