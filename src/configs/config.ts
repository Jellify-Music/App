import Config from 'react-native-config'

// DEV_RELEASE builds should force OTA updates off regardless of .env value.
export const IS_DEV_RELEASE = Config.DEV_RELEASE === 'true'
const OTA_UPDATE_ENABLED = !IS_DEV_RELEASE && Config.OTA_UPDATE_ENABLED === 'true'
const IS_MAESTRO_BUILD = Config.IS_MAESTRO_BUILD === 'true'

export { OTA_UPDATE_ENABLED, IS_MAESTRO_BUILD }

export const MONOCHROME_ICON_URL =
	'https://raw.githubusercontent.com/Jellify-Music/App/refs/heads/main/assets/monochrome-logo.svg'
