import Config from 'react-native-config'

const OTA_UPDATE_ENABLED = Config.OTA_UPDATE_ENABLED === 'true'
const IS_MAESTRO_BUILD = Config.IS_MAESTRO_BUILD === 'true'

export { OTA_UPDATE_ENABLED, IS_MAESTRO_BUILD }

export const MONOCHROME_ICON_URL =
	'https://raw.githubusercontent.com/Jellify-Music/App/refs/heads/main/assets/monochrome-logo.svg'
