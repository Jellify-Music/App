import Config from 'react-native-superconfig'

const IS_MAESTRO_BUILD = Config.IS_MAESTRO_BUILD === 'true'
const GLITCHTIP_DSN = Config.GLITCHTIP_DSN ?? ''
const TELEMETRYDECK_APPID = Config.TELEMETRYDECK_APPID ?? ''

export { IS_MAESTRO_BUILD, GLITCHTIP_DSN, TELEMETRYDECK_APPID }

export const MONOCHROME_ICON_URL =
	'https://raw.githubusercontent.com/Jellify-Music/App/refs/heads/main/assets/monochrome-logo.svg'
