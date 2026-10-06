import { PermissionsAndroid, Platform } from 'react-native'
import registerNitroPlayer from '../../../src/services/player'

jest.mock('../../../src/services/player/utils/initialization', () => ({
	syncDeviceProfiles: jest.fn(),
	registerPlayerEventHandlers: jest.fn(),
	restoreFromStorage: jest.fn(),
}))

jest.mock('../../../src/stores/settings/player', () => ({
	usePlayerSettingsStore: { getState: () => ({ lookahead: 1 }) },
}))

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))

it('logs a warning instead of an unhandled rejection when the notification permission request fails', async () => {
	jest.replaceProperty(Platform, 'OS', 'android')
	jest.spyOn(Platform, 'Version', 'get').mockReturnValue(33)
	const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
	jest.spyOn(PermissionsAndroid, 'request').mockRejectedValue(new Error('no activity'))

	registerNitroPlayer()
	await flush()

	expect(warn).toHaveBeenCalledWith(
		expect.anything(),
		'Notification permission request failed',
		expect.any(Error),
	)
})
