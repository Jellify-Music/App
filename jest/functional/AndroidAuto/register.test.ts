import type * as Nitro from 'react-native-nitro-player'
import type * as Service from '../../../src/services/android-auto'
import type * as Playlists from '../../../src/services/android-auto/playlists'
import type * as Bridge from '../../../src/services/android-auto/bridge'
import type * as Library from '../../../src/services/android-auto/library'
import type * as AuthStore from '../../../src/stores/auth'

jest.mock('../../../src/stores/auth/utils', () => ({
	getApi: jest.fn(() => ({})),
	// Signed out: every publish is a single sign-in library set, easy to count.
	getUser: jest.fn(),
	getLibrary: jest.fn(),
}))
jest.mock('../../../src/stores/auth', () => ({
	__esModule: true,
	default: { getState: () => ({}), subscribe: jest.fn() },
}))
jest.mock('../../../src/services/android-auto/playlists', () => ({
	deleteAllAaPlaylists: jest.fn().mockResolvedValue(undefined),
	materializePlaylist: jest.fn(),
}))
jest.mock('../../../src/services/android-auto/library', () => ({
	clearLibraryPlaylists: jest.fn(),
	loadLibraryChildren: jest.fn(),
}))
jest.mock('../../../src/services/android-auto/bridge', () => ({
	registerChildrenLoader: jest.fn(),
	setArtworkServer: jest.fn(),
}))

type Loaded = {
	nitro: typeof Nitro
	playlists: typeof Playlists
	bridge: typeof Bridge
	library: typeof Library
	auth: typeof AuthStore
	subscribe: jest.Mock
	onConnectionChange: (connected: boolean) => void
}

/** Registers the service in a fresh module registry (it only registers once per registry). */
function register(connectedAtStartup: boolean): Loaded {
	let loaded!: Loaded
	jest.isolateModules(() => {
		require('react-native').Platform.OS = 'android'
		const nitro: typeof Nitro = require('react-native-nitro-player')
		;(nitro.TrackPlayer.isAndroidAutoConnected as jest.Mock).mockReturnValue(connectedAtStartup)
		const service: typeof Service = require('../../../src/services/android-auto')
		const auth: typeof AuthStore = require('../../../src/stores/auth')

		service.registerAndroidAutoService()

		loaded = {
			nitro,
			playlists: require('../../../src/services/android-auto/playlists'),
			bridge: require('../../../src/services/android-auto/bridge'),
			library: require('../../../src/services/android-auto/library'),
			auth,
			subscribe: auth.default.subscribe as jest.Mock,
			onConnectionChange: (nitro.TrackPlayer.onAndroidAutoConnectionChange as jest.Mock).mock
				.calls[0][0],
		}
	})
	return loaded
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0))
const publishCount = ({ nitro }: Loaded) =>
	(nitro.AndroidAutoMediaLibraryHelper.set as jest.Mock).mock.calls.length

beforeAll(() => {
	jest.spyOn(console, 'info').mockImplementation(() => {})
})

it('registers the on-demand library children loader once', () => {
	const loaded = register(false)

	expect(loaded.bridge.registerChildrenLoader).toHaveBeenCalledTimes(1)
	expect(loaded.bridge.registerChildrenLoader).toHaveBeenCalledWith(
		loaded.library.loadLibraryChildren,
	)
})

it('pushes the current server url to the artwork provider at registration', () => {
	const loaded = register(false)

	expect(loaded.bridge.setArtworkServer).toHaveBeenCalledWith(undefined)
})

it('pushes a new server url to the artwork provider when it changes', async () => {
	const loaded = register(false)
	loaded.onConnectionChange(true)
	await flush()
	;(loaded.bridge.setArtworkServer as jest.Mock).mockClear()

	const [listener] = loaded.subscribe.mock.calls[0]
	listener(
		{ server: { url: 'https://b.example.com' }, library: { musicLibraryId: 'a' } },
		{ server: { url: 'https://a.example.com' }, library: { musicLibraryId: 'a' } },
	)

	expect(loaded.bridge.setArtworkServer).toHaveBeenCalledWith('https://b.example.com')
})

it('publishes on the first connect only, not on a repeated connected event', async () => {
	const loaded = register(false)
	await flush()
	expect(publishCount(loaded)).toBe(0)

	loaded.onConnectionChange(true)
	await flush()
	expect(publishCount(loaded)).toBe(1)

	loaded.onConnectionChange(true)
	await flush()
	expect(publishCount(loaded)).toBe(1)

	loaded.onConnectionChange(false)
	loaded.onConnectionChange(true)
	await flush()
	expect(publishCount(loaded)).toBe(2)
})

it('republishes on a library switch while connected', async () => {
	const loaded = register(false)
	loaded.onConnectionChange(true)
	await flush()

	const [listener] = loaded.subscribe.mock.calls[0]
	listener({ library: { musicLibraryId: 'b' } }, { library: { musicLibraryId: 'a' } })
	await flush()

	expect(publishCount(loaded)).toBe(2)
})

it('drops stale playlists at startup only when not connected (publish does it otherwise)', async () => {
	const disconnected = register(false)
	await flush()
	expect(disconnected.playlists.deleteAllAaPlaylists).toHaveBeenCalledTimes(1)

	const connected = register(true)
	await flush()
	expect(publishCount(connected)).toBe(1)
	// The single call comes from the publish itself, not a second standalone delete.
	expect(connected.playlists.deleteAllAaPlaylists).toHaveBeenCalledTimes(1)
})
