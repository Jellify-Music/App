import { Platform } from 'react-native'
import type { MediaItem } from 'react-native-nitro-player'
import NativeJellifyAndroidAuto from '../../../src/specs/NativeJellifyAndroidAuto'
import {
	onCustomAction,
	registerChildrenLoader,
	registerSearchProvider,
	setArtworkServer,
	setFavoriteButton,
} from '../../../src/services/android-auto/bridge'

type Handler<T> = (event: T) => void | Promise<void>

const handlers: Record<string, Handler<never>> = {}

const capture =
	(name: string) =>
	(handler: Handler<never>): { remove: () => void } => {
		handlers[name] = handler
		return { remove: jest.fn() }
	}

jest.mock('../../../src/specs/NativeJellifyAndroidAuto', () => ({
	__esModule: true,
	default: {
		registerChildrenLoader: jest.fn(),
		resolveChildren: jest.fn(),
		registerSearchProvider: jest.fn(),
		resolveSearch: jest.fn(),
		setArtworkServer: jest.fn(),
		setFavoriteButton: jest.fn(),
		onLoadChildren: jest.fn(),
		onSearch: jest.fn(),
		onCustomAction: jest.fn(),
	},
}))

const native = NativeJellifyAndroidAuto as unknown as Record<string, jest.Mock>

const items: MediaItem[] = [
	{
		id: 'aa-lib-artist:1',
		title: 'Artist',
		isPlayable: false,
		mediaType: 'folder',
	} as MediaItem,
]

beforeAll(() => {
	Platform.OS = 'android'
	jest.spyOn(console, 'error').mockImplementation(() => {})
	jest.spyOn(console, 'warn').mockImplementation(() => {})
})

beforeEach(() => {
	jest.clearAllMocks()
	native.onLoadChildren.mockImplementation(capture('loadChildren'))
	native.onSearch.mockImplementation(capture('search'))
	native.onCustomAction.mockImplementation(capture('customAction'))
})

const emit = async <T>(name: string, event: T) => {
	await (handlers[name] as Handler<T>)(event)
}

it('resolves children with the JSON the loader returns', async () => {
	const load = jest.fn().mockResolvedValue(items)
	registerChildrenLoader(load)

	expect(native.registerChildrenLoader).toHaveBeenCalledTimes(1)

	await emit('loadChildren', { requestId: '1', parentId: 'aa-lib-artists:A' })

	expect(load).toHaveBeenCalledWith('aa-lib-artists:A')
	expect(native.resolveChildren).toHaveBeenCalledWith('1', JSON.stringify(items))
})

it('resolves with an empty list when the loader rejects', async () => {
	registerChildrenLoader(jest.fn().mockRejectedValue(new Error('boom')))

	await emit('loadChildren', { requestId: '2', parentId: 'aa-lib-albums:B' })

	expect(native.resolveChildren).toHaveBeenCalledWith('2', '[]')
})

it('answers a search with the JSON the provider returns', async () => {
	const search = jest.fn().mockResolvedValue(items)
	registerSearchProvider(search)

	expect(native.registerSearchProvider).toHaveBeenCalledTimes(1)

	await emit('search', { requestId: '3', query: 'abba' })

	expect(search).toHaveBeenCalledWith('abba')
	expect(native.resolveSearch).toHaveBeenCalledWith('3', JSON.stringify(items))
})

it('answers a search with an empty list when the provider rejects', async () => {
	registerSearchProvider(jest.fn().mockRejectedValue(new Error('boom')))

	await emit('search', { requestId: '4', query: 'abba' })

	expect(native.resolveSearch).toHaveBeenCalledWith('4', '[]')
})

it('passes a pressed button action on to the handler', async () => {
	const handle = jest.fn()
	onCustomAction(handle)

	await emit('customAction', { action: 'com.jellify.FAVORITE' })

	expect(handle).toHaveBeenCalledWith('com.jellify.FAVORITE')
})

it('passes the server url through to the native module', () => {
	setArtworkServer('https://server.example.com')

	expect(native.setArtworkServer).toHaveBeenCalledWith('https://server.example.com')
})

it('passes null when the server url is undefined', () => {
	setArtworkServer(undefined)

	expect(native.setArtworkServer).toHaveBeenCalledWith(null)
})

it('maps the heart state to what the native side expects', () => {
	setFavoriteButton(true)
	setFavoriteButton(false)
	setFavoriteButton(null)

	expect(native.setFavoriteButton.mock.calls).toEqual([['favorite'], ['not-favorite'], [null]])
})

it('does nothing off Android', () => {
	Platform.OS = 'ios'
	jest.resetModules()

	const bridge = require('../../../src/services/android-auto/bridge')
	bridge.registerChildrenLoader(jest.fn())
	bridge.setArtworkServer('https://server.example.com')

	expect(native.registerChildrenLoader).not.toHaveBeenCalled()
	expect(native.setArtworkServer).not.toHaveBeenCalled()
	Platform.OS = 'android'
})
