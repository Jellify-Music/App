import Config from 'react-native-config'

const OTA_UPDATE_ENABLED = Config.OTA_UPDATE_ENABLED === 'true'
const IS_MAESTRO_BUILD = Config.IS_MAESTRO_BUILD === 'true'

export { OTA_UPDATE_ENABLED, IS_MAESTRO_BUILD }
