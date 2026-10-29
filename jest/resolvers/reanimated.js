// react-native-reanimated 4.6.0 doesn't ship its jest/resolver.js yet (fixed upstream in
// https://github.com/software-mansion/react-native-reanimated/pull/10377, not released as of writing).
// Without it, Jest resolves Reanimated's internal `.native.ts` files, which try to initialize
// the real native module and crash with `[Reanimated] setCSSEventHandler is not available in JSReanimated`.
// This mirrors that upstream resolver so the web variants are used under Jest instead.
// TODO: remove this once a react-native-reanimated release includes react-native-reanimated/jest/resolver.
const workletsResolver = require('react-native-worklets/jest/resolver')

const WEB_ONLY_IN_JEST = new Set([
	'initializers',
	'mutables',
	'mappers',
	'ConfigHelper',
	'UpdateLayoutAnimations',
	'useAnimatedRef',
	'useAnimatedStyle',
	'WorkletEventHandler',
	'JSPropsUpdater',
	'updateProps',
	'util',
	'css/component/AnimatedComponent',
])

/** @type {import('jest-resolve').SyncResolver} */
module.exports = (request, options) => {
	const basename = request.split('/').pop()
	const isWebOnly = [...WEB_ONLY_IN_JEST].some((entry) =>
		entry.includes('/') ? request.endsWith(entry) : basename === entry,
	)

	if (
		request.startsWith('.') &&
		isWebOnly &&
		options.basedir.includes('react-native-reanimated')
	) {
		return options.defaultResolver(request, {
			...options,
			extensions: options.extensions?.filter((ext) => !ext.includes('native')),
		})
	}

	return workletsResolver(request, options)
}
