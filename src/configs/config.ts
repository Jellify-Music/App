import Config from 'react-native-superconfig'

const IS_MAESTRO_BUILD = Config.IS_MAESTRO_BUILD === 'true'
const GLITCHTIP_DSN = Config.GLITCHTIP_DSN ?? ''
const TELEMETRYDECK_APPID = Config.TELEMETRYDECK_APPID ?? ''
// F-Droid / FOSS build: compiled without proprietary Google libraries (e.g. Google Cast)
const IS_FOSS_BUILD = Config.IS_FOSS_BUILD === 'true'

export { IS_MAESTRO_BUILD, GLITCHTIP_DSN, TELEMETRYDECK_APPID, IS_FOSS_BUILD }

export const MONOCHROME_ICON_URL =
	'https://raw.githubusercontent.com/Jellify-Music/App/refs/heads/main/assets/monochrome-logo.svg'

export const GITHUB_ORG_URL = 'https://github.com/Jellify-Music'

export const WEBSITE_URL = 'https://jellify.app'
