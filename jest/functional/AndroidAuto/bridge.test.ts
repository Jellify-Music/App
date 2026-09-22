import { DeviceEventEmitter, NativeModules, Platform } from 'react-native'
import type { MediaItem } from 'react-native-nitro-player'
import { registerChildrenLoader, setArtworkServer } from '../../../src/services/android-auto/bridge'

const LOAD_CHILDREN_EVENT = 'JellifyAndroidAutoLoadChildren'

const items: MediaItem[] = [
	{
		id: 'aa-lib-artist:1',
		title: 'Artist',
		isPlayable: false,
		mediaType: 'folder',
	} as MediaItem,
]

beforeAll(() => {
	jest.spyOn(console, 'error').mockImplementation(() => {})
	jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterEach(() => {
	DeviceEventEmitter.removeAllListeners(LOAD_CHILDREN_EVENT)
	delete (NativeModules as Record<string, unknown>).JellifyAndroidAuto
	jest.clearAllMocks()
})

it('resolves children with the JSON the loader returns', async () => {
	const registerChildrenLoaderMock = jest.fn()
	const resolveChildren = jest.fn()
	NativeModules.JellifyAndroidAuto = {
		registerChildrenLoader: registerChildrenLoaderMock,
		resolveChildren,
	}
	Platform.OS = 'android'

	const load = jest.fn().mockResolvedValue(items)
	registerChildrenLoader(load)
	expect(registerChildrenLoaderMock).toHaveBeenCalledTimes(1)

	DeviceEventEmitter.emit(LOAD_CHILDREN_EVENT, { requestId: '1', parentId: 'aa-lib-artists:A' })
	await Promise.resolve()
	await Promise.resolve()

	expect(load).toHaveBeenCalledWith('aa-lib-artists:A')
	expect(resolveChildren).toHaveBeenCalledWith('1', JSON.stringify(items))
})

it('resolves with an empty list when the loader rejects', async () => {
	const resolveChildren = jest.fn()
	NativeModules.JellifyAndroidAuto = {
		registerChildrenLoader: jest.fn(),
		resolveChildren,
	}
	Platform.OS = 'android'

	const load = jest.fn().mockRejectedValue(new Error('boom'))
	registerChildrenLoader(load)

	DeviceEventEmitter.emit(LOAD_CHILDREN_EVENT, { requestId: '2', parentId: 'aa-lib-albums:B' })
	await Promise.resolve()
	await Promise.resolve()

	expect(resolveChildren).toHaveBeenCalledWith('2', '[]')
})

it('does nothing when the native module is missing', () => {
	delete (NativeModules as Record<string, unknown>).JellifyAndroidAuto
	Platform.OS = 'android'

	expect(() => registerChildrenLoader(jest.fn())).not.toThrow()
	expect(DeviceEventEmitter.listenerCount(LOAD_CHILDREN_EVENT)).toBe(0)
})

it('passes the server url through to the native module', () => {
	const setArtworkServerMock = jest.fn()
	NativeModules.JellifyAndroidAuto = {
		registerChildrenLoader: jest.fn(),
		resolveChildren: jest.fn(),
		setArtworkServer: setArtworkServerMock,
	}
	Platform.OS = 'android'

	setArtworkServer('https://server.example.com')

	expect(setArtworkServerMock).toHaveBeenCalledWith('https://server.example.com')
})

it('passes null when the server url is undefined', () => {
	const setArtworkServerMock = jest.fn()
	NativeModules.JellifyAndroidAuto = {
		registerChildrenLoader: jest.fn(),
		resolveChildren: jest.fn(),
		setArtworkServer: setArtworkServerMock,
	}
	Platform.OS = 'android'

	setArtworkServer(undefined)

	expect(setArtworkServerMock).toHaveBeenCalledWith(null)
})

it('does not throw setting the artwork server when the native module is missing', () => {
	delete (NativeModules as Record<string, unknown>).JellifyAndroidAuto
	Platform.OS = 'android'

	expect(() => setArtworkServer('https://server.example.com')).not.toThrow()
})
