import { Platform } from 'react-native'
import DeviceInfo from 'react-native-device-info'
import { githubOTA } from 'react-native-nitro-ota'
import Config from 'react-native-superconfig'

export const OTA_UPDATE_ENABLED = Config.OTA_UPDATE_ENABLED === 'true'

const OTA_GITHUB_URL = 'https://github.com/Jellify-Music/App-Bundles'

const version = DeviceInfo.getVersion()

const gitBranch = `nitro_${version}_${Platform.OS}`

const { downloadUrl, versionUrl } = githubOTA({
	githubUrl: OTA_GITHUB_URL,
	otaVersionPath: 'ota.version', // optional, defaults to 'ota.version'
	ref: gitBranch, // optional, defaults to 'main'
})

export const OTA_DOWNLOAD_URL = downloadUrl
export const OTA_VERSION_URL = versionUrl

export default OTA_GITHUB_URL
