import Config from 'react-native-superconfig'

const IS_MAESTRO_BUILD = Config.IS_MAESTRO_BUILD === 'true'
const GLITCHTIP_DSN = Config.GLITCHTIP_DSN ?? ''
const TELEMETRYDECK_APPID = Config.TELEMETRYDECK_APPID ?? ''

export { IS_MAESTRO_BUILD, GLITCHTIP_DSN, TELEMETRYDECK_APPID }

export const MONOCHROME_ICON_URL =
	'https://raw.githubusercontent.com/Jellify-Music/App/refs/heads/main/assets/monochrome-logo.svg'

export const PRIVACY_POLICY_URL = 'https://jellify.app/privacy'

export const LOGGING_PROVIDER_PRIVACY_POLICY_URL = 'https://glitchtip.com/legal/privacy'

const PATRON_API_BASE_URL = 'https://patrons.jellify.app/api/v1'

export const PATRON_API_ENDPOINT = `${PATRON_API_BASE_URL}/patrons`

export const SPECIAL_THANKS_API_ENDPOINT = `${PATRON_API_BASE_URL}/special-thanks`
