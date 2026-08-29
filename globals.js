import * as Crypto from 'react-native-quick-crypto'

// https://telemetrydeck.com/docs/guides/react-setup/#react-native-%26-expo-support
//
// KNOWN ISSUE: this *replaces* the entire `crypto` global rather than extending it,
// so `crypto.randomUUID` and `crypto.getRandomValues` do not exist anywhere in the
// app. Anything reaching for them silently gets `undefined` and fails.
//
// Consequences:
//   - `crypto.randomUUID()` cannot be used, which is why react-native-uuid is still
//     a dependency across 9 files.
//   - Any library expecting a standards-shaped `crypto` object will break here.
//
// Fix would be to spread the existing global instead of overwriting it, or install
// react-native-quick-crypto's full polyfill (it provides randomUUID and
// getRandomValues, and is already a dependency). Verify nothing depends on the
// current narrow shape before changing it.
globalThis.crypto = {
	subtle: {
		digest: (algorithm, message) => Crypto.digest(algorithm, message),
	},
}

global.TextEncoder = require('text-encoding').TextEncoder
