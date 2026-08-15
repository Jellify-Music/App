import * as Crypto from 'react-native-quick-crypto'

// https://telemetrydeck.com/docs/guides/react-setup/#react-native-%26-expo-support
globalThis.crypto = {
	subtle: {
		digest: (algorithm, message) => Crypto.digest(algorithm, message),
	},
}

global.TextEncoder = require('text-encoding').TextEncoder
