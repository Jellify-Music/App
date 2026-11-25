import { Platform } from 'react-native'
import NetInfo from '@react-native-community/netinfo'
import {
	CarPlayHelper,
	DownloadManager,
	PlayerQueue,
	TrackPlayer,
	type CarPlayImageRow,
	type CarPlayListTemplate,
	type CarPlayTemplate,
} from 'react-native-nitro-player'
import { getApi, getLibrary, getUser } from '../../src/stores/auth/utils'
import { refreshPlaylistTracks, refreshUserPlaylists } from '../../src/api/queries/playlist/cache'
import { fetchRecentlyAdded, fetchRecentlyPlayed } from '../../src/api/queries/recents/utils'
import { fetchFrequentlyPlayed } from '../../src/api/queries/frequents/utils/frequents'
import { registerCarPlayService } from '../../src/services/auto/carplay'
import useJellifyStore from '../../src/stores/auth'

const mockGetItems = jest.fn()

jest.mock('@jellyfin/sdk/lib/utils/api', () => ({
	...jest.requireActual('@jellyfin/sdk/lib/utils/api'),
	getLibraryApi: () => ({ getItems: mockGetItems }),
}))

jest.mock('../../src/utils/mapping/item-to-audio-api-url', () => ({
	__esModule: true,
	default: (item: { Id: string }) => `https://server/Audio/${item.Id}/universal`,
}))

jest.mock('react-native-nitro-player', () => ({
	CarPlayHelper: {
		isAvailable: jest.fn(() => true),
		isConnected: jest.fn(() => false),
		set: jest.fn(),
		push: jest.fn(),
		reload: jest.fn(),
		setTemplateLoader: jest.fn(),
		onSelect: jest.fn(),
		onAlbumArtistPress: jest.fn(),
		onConnectionChange: jest.fn(() => () => {}),
	},
	DownloadManager: { getAllDownloadedTracks: jest.fn().mockResolvedValue([]) },
	PlayerQueue: {
		getAllPlaylists: jest.fn(() => []),
		createPlaylist: jest.fn().mockResolvedValue('car'),
		addTracksToPlaylist: jest.fn(),
		deletePlaylist: jest.fn().mockResolvedValue(undefined),
	},
	TrackPlayer: { getState: jest.fn().mockResolvedValue({}) },
	AndroidAutoMediaLibraryHelper: { isAvailable: jest.fn(() => false) },
}))

jest.mock('../../src/stores/auth/utils', () => ({
	getApi: jest.fn(),
	getLibrary: jest.fn(),
	getUser: jest.fn(),
}))

jest.mock('../../src/api/queries/playlist/cache', () => ({
	refreshUserPlaylists: jest.fn(),
	refreshPlaylistTracks: jest.fn(),
}))

jest.mock('../../src/api/queries/recents/utils', () => ({
	fetchRecentlyAdded: jest.fn(),
	fetchRecentlyPlayed: jest.fn(),
}))

jest.mock('../../src/api/queries/frequents/utils/frequents', () => ({
	fetchFrequentlyPlayed: jest.fn(),
}))

jest.mock('../../src/hooks/downloads/utils', () => ({
	ensureDownloadedTracks: jest.fn().mockResolvedValue([]),
}))

jest.mock('../../src/utils/mapping/item-to-track', () => ({
	mapDtosToTracks: (items: { Id: string; Name: string }[]) =>
		items.map((item) => ({
			id: item.Id,
			title: item.Name,
			artist: 'Artist',
			album: 'Album',
			artwork: `https://art/${item.Id}`,
			url: 'https://stream',
			duration: 0,
		})),
}))

const songs = (prefix: string, count: number) =>
	Array.from({ length: count }, (_, i) => ({
		Id: `${prefix}${i}`,
		Name: `Song ${i}`,
		Type: 'Audio',
	}))

const loader = () =>
	(CarPlayHelper.setTemplateLoader as jest.Mock).mock.calls[0][0] as (
		id: string,
	) => Promise<CarPlayTemplate>

const rowTitles = (template: CarPlayTemplate) =>
	(template as CarPlayListTemplate).sections!.flatMap((section) =>
		section.items.map((item) => item.title),
	)

describe('CarPlay service', () => {
	let onNetworkChange: (state: { isInternetReachable: boolean | null }) => void

	beforeAll(() => {
		Platform.OS = 'ios'
		// Left over from an earlier session: one stale, one still playing, one not ours
		;(PlayerQueue.getAllPlaylists as jest.Mock).mockReturnValueOnce([
			{ id: 'stale', name: 'jellify-aa:album:old' },
			{ id: 'playing', name: 'jellify-aa:album:current' },
			{ id: 'mine', name: 'Road trip' },
		])
		;(TrackPlayer.getState as jest.Mock).mockResolvedValueOnce({ currentPlaylistId: 'playing' })
		registerCarPlayService()
		onNetworkChange = (NetInfo.addEventListener as jest.Mock).mock.calls.at(-1)[0]
	})

	beforeEach(() => mockGetItems.mockResolvedValue({ data: { Items: [] } }))

	test('deletes car playlists from earlier sessions except the playing one', async () => {
		await new Promise(setImmediate)
		expect(PlayerQueue.deletePlaylist).toHaveBeenCalledWith('stale')
		expect(PlayerQueue.deletePlaylist).not.toHaveBeenCalledWith('playing')
		expect(PlayerQueue.deletePlaylist).not.toHaveBeenCalledWith('mine')
	})

	test('registering again is a no-op', () => {
		registerCarPlayService()
		expect(CarPlayHelper.set).toHaveBeenCalledTimes(1)
		expect(CarPlayHelper.setTemplateLoader).toHaveBeenCalledTimes(1)
	})

	test('sets four lazy tabs with Now Playing', () => {
		const root = (CarPlayHelper.set as jest.Mock).mock.calls[0][0]
		expect(root.templates.map((t: CarPlayTemplate) => [t.id, t.type, t.lazy])).toEqual([
			['home', 'list', true],
			['artists', 'list', true],
			['albums', 'list', true],
			['playlists', 'list', true],
		])
		expect(root.nowPlaying).toEqual({ upNextTitle: 'Queue', albumArtist: true })
	})

	test('asks to sign in on the phone while signed out', async () => {
		;(getApi as jest.Mock).mockReturnValue(undefined)
		expect(rowTitles(await loader()('home'))).toEqual(['Open Jellify on your phone to sign in'])
	})

	describe('signed in', () => {
		beforeEach(() => {
			;(getApi as jest.Mock).mockReturnValue({})
			;(getUser as jest.Mock).mockReturnValue({ id: 'user' })
			;(getLibrary as jest.Mock).mockReturnValue({ musicLibraryId: 'music' })
		})

		test('shows Home as artwork grids of songs and albums', async () => {
			;(fetchRecentlyPlayed as jest.Mock).mockResolvedValueOnce(songs('r', 20))
			;(fetchFrequentlyPlayed as jest.Mock).mockResolvedValueOnce(songs('f', 3))
			;(fetchRecentlyAdded as jest.Mock).mockResolvedValueOnce([
				{ Id: 'a1', Name: 'Abbey Road', AlbumArtist: 'The Beatles', Type: 'MusicAlbum' },
			])
			const home = (await loader()('home')) as CarPlayListTemplate
			const [library, tiles] = home.sections!
			const [recents, frequents, added] = tiles.items as CarPlayImageRow[]
			expect(tiles.items.map((row) => [row.id, row.title])).toEqual([
				['picks:recents', 'Play it again'],
				['picks:frequents', 'On Repeat'],
				['added', 'Recently added'],
			])
			expect(recents.multipleLines).toBe(true)
			expect(recents.elements).toHaveLength(8)
			expect(recents.elements[2]).toMatchObject({
				title: 'Song 2',
				subtitle: 'Artist',
				image: 'https://art/r2',
				playlistId: 'car',
				trackId: 'r2',
			})
			expect(frequents.elements).toHaveLength(3)
			expect(added.elements[0]).toMatchObject({
				title: 'Abbey Road',
				subtitle: 'The Beatles',
				template: { type: 'list', id: 'album:a1', lazy: true },
			})
			expect(library).toMatchObject({ header: 'Your library' })
			expect(rowTitles({ ...home, sections: [library] })).toEqual(['Favorites'])
		})

		test('keeps Favorites and Downloads on Home without a connection', async () => {
			;(fetchRecentlyPlayed as jest.Mock).mockRejectedValueOnce(new Error('offline'))
			;(fetchFrequentlyPlayed as jest.Mock).mockRejectedValueOnce(new Error('offline'))
			;(fetchRecentlyAdded as jest.Mock).mockRejectedValueOnce(new Error('offline'))
			;(DownloadManager.getAllDownloadedTracks as jest.Mock).mockResolvedValueOnce([{}])
			expect(rowTitles(await loader()('home'))).toEqual([
				'Favorites',
				'Downloads',
				"Couldn't reach your Jellyfin server",
			])
		})

		test('lists letters for artists', async () => {
			const titles = rowTitles(await loader()('artists'))
			expect(titles[0]).toBe('#')
			expect(titles).toHaveLength(27)
		})

		test('turns a server error into a retry row', async () => {
			;(refreshUserPlaylists as jest.Mock).mockRejectedValueOnce(new Error('offline'))
			expect(rowTitles(await loader()('playlists'))).toEqual([
				"Couldn't reach your Jellyfin server",
			])
		})

		test('asks to sign in again after a 401', async () => {
			;(refreshUserPlaylists as jest.Mock).mockRejectedValueOnce({
				response: { status: 401 },
			})
			expect(rowTitles(await loader()('playlists'))).toEqual([
				'Sign in again in Jellify on your phone',
			])
		})

		test('pages long lists with a lazy More row', async () => {
			;(refreshUserPlaylists as jest.Mock).mockResolvedValueOnce(
				Array.from({ length: 150 }, (_, i) => ({ Id: `p${i}`, Name: `Playlist ${i}` })),
			)
			const template = (await loader()('playlists')) as CarPlayListTemplate
			const items = template.sections![0].items
			expect(items).toHaveLength(101)
			expect(items[100]).toMatchObject({
				id: 'playlists@100',
				title: 'More…',
				template: { id: 'playlists@100', title: 'Playlists', lazy: true },
			})
		})
	})

	describe('lists', () => {
		beforeEach(() => {
			;(getApi as jest.Mock).mockReturnValue({})
			;(getUser as jest.Mock).mockReturnValue({ id: 'user' })
			;(getLibrary as jest.Mock).mockReturnValue({ musicLibraryId: 'music' })
			;(PlayerQueue.createPlaylist as jest.Mock).mockClear()
			;(PlayerQueue.addTracksToPlaylist as jest.Mock).mockClear()
			;(PlayerQueue.deletePlaylist as jest.Mock).mockClear()
			mockGetItems.mockClear()
		})

		test('# looks up names before A', async () => {
			await loader()('albums') // registers the letter titles
			mockGetItems.mockResolvedValueOnce({
				data: { Items: [{ Id: 'x', Name: '10cc', AlbumArtist: '10cc' }] },
			})
			const template = (await loader()('albums:#')) as CarPlayListTemplate
			expect(mockGetItems).toHaveBeenCalledWith(
				expect.objectContaining({
					parentId: 'music',
					includeItemTypes: ['MusicAlbum'],
					nameLessThan: 'A',
					startIndex: 0,
					limit: 101,
				}),
			)
			expect(mockGetItems.mock.calls[0][0]).not.toHaveProperty('nameStartsWith')
			expect(template.title).toBe('#')
			expect(template.sections![0].items[0]).toMatchObject({
				id: 'album:x',
				title: '10cc',
				subtitle: '10cc',
				template: { type: 'list', id: 'album:x', title: '10cc', lazy: true },
			})
		})

		test('a More page continues from its offset and keeps the list title', async () => {
			await loader()('artists') // registers the letter titles
			mockGetItems.mockResolvedValueOnce({
				data: {
					Items: Array.from({ length: 101 }, (_, i) => ({
						Id: `b${i}`,
						Name: `B artist ${i}`,
					})),
				},
			})
			const template = (await loader()('artists:B@100')) as CarPlayListTemplate
			expect(mockGetItems).toHaveBeenCalledWith(
				expect.objectContaining({
					includeItemTypes: ['MusicArtist'],
					nameStartsWith: 'B',
					startIndex: 100,
				}),
			)
			const items = template.sections![0].items
			expect(items).toHaveLength(101)
			expect(items[0]).toMatchObject({ id: 'artist:b0', subtitle: undefined })
			expect(items[100]).toMatchObject({
				id: 'artists:B@200',
				template: { id: 'artists:B@200', title: 'B' },
			})
		})

		test('an artist lists their albums, newest first', async () => {
			mockGetItems.mockResolvedValueOnce({
				data: { Items: [{ Id: 'a1', Name: 'Abbey Road', AlbumArtist: 'The Beatles' }] },
			})
			const template = (await loader()('artist:beatles')) as CarPlayListTemplate
			expect(mockGetItems).toHaveBeenCalledWith(
				expect.objectContaining({
					albumArtistIds: ['beatles'],
					sortBy: ['PremiereDate', 'SortName'],
					sortOrder: ['Descending'],
				}),
			)
			expect(rowTitles(template)).toEqual(['Abbey Road'])
		})

		test('an album lists only its songs, playable from a car playlist', async () => {
			mockGetItems.mockResolvedValueOnce({
				data: {
					Items: [
						...songs('t', 2),
						{ Id: 'video', Name: 'Music video', Type: 'MusicVideo' },
					],
				},
			})
			const template = (await loader()('album:abbey')) as CarPlayListTemplate
			expect(mockGetItems).toHaveBeenCalledWith(
				expect.objectContaining({ parentId: 'abbey', includeItemTypes: ['Audio'] }),
			)
			expect(PlayerQueue.createPlaylist).toHaveBeenCalledWith('jellify-aa:album:abbey')
			expect(PlayerQueue.addTracksToPlaylist).toHaveBeenCalledWith(
				'car',
				expect.arrayContaining([expect.objectContaining({ id: 't0' })]),
			)
			expect(template.sections![0].items).toEqual([
				expect.objectContaining({ id: 'car:0', playlistId: 'car', trackId: 't0' }),
				expect.objectContaining({ id: 'car:1', playlistId: 'car', trackId: 't1' }),
			])
		})

		test('opening a list again replaces its old car playlist unless it is playing', async () => {
			;(TrackPlayer.getState as jest.Mock).mockResolvedValueOnce({
				currentPlaylistId: 'playing',
			})
			;(PlayerQueue.getAllPlaylists as jest.Mock).mockReturnValueOnce([
				{ id: 'old', name: 'jellify-aa:album:abbey' },
				{ id: 'playing', name: 'jellify-aa:album:abbey' },
				{ id: 'other', name: 'jellify-aa:album:other' },
			])
			mockGetItems.mockResolvedValueOnce({ data: { Items: songs('t', 1) } })
			await loader()('album:abbey')
			expect((PlayerQueue.deletePlaylist as jest.Mock).mock.calls).toEqual([['old']])
		})

		test('an empty album says so without making a playlist', async () => {
			expect(rowTitles(await loader()('album:empty'))).toEqual(['Nothing here yet'])
			expect(PlayerQueue.createPlaylist).not.toHaveBeenCalled()
		})

		test('a playlist plays its songs', async () => {
			;(refreshPlaylistTracks as jest.Mock).mockResolvedValueOnce(songs('p', 3))
			const template = (await loader()('playlist:mix')) as CarPlayListTemplate
			expect(refreshPlaylistTracks).toHaveBeenCalledWith({ Id: 'mix' })
			expect(PlayerQueue.createPlaylist).toHaveBeenCalledWith('jellify-aa:playlist:mix')
			expect(rowTitles(template)).toEqual(['Song 0', 'Song 1', 'Song 2'])
		})

		test('Favorites asks the server for favorite songs', async () => {
			mockGetItems.mockResolvedValueOnce({ data: { Items: songs('f', 1) } })
			await loader()('picks:favorites')
			expect(mockGetItems).toHaveBeenCalledWith(
				expect.objectContaining({
					parentId: 'music',
					includeItemTypes: ['Audio'],
					isFavorite: true,
					limit: 500,
				}),
			)
			expect(PlayerQueue.createPlaylist).toHaveBeenCalledWith('jellify-aa:picks:favorites')
		})

		test('Downloads lists the newest first, with local artwork and a castable URL', async () => {
			;(DownloadManager.getAllDownloadedTracks as jest.Mock).mockResolvedValueOnce([
				{
					trackId: 'old',
					downloadedAt: 1,
					localArtworkPath: '/art/old.jpg',
					originalTrack: { id: 'old', title: 'Old', artwork: 'https://art/old' },
				},
				{
					trackId: 'new',
					downloadedAt: 2,
					originalTrack: { id: 'new', title: 'New', artwork: 'https://art/new' },
				},
			])
			const template = (await loader()('picks:downloads')) as CarPlayListTemplate
			expect(rowTitles(template)).toEqual(['New', 'Old'])
			const [tracks] = (PlayerQueue.addTracksToPlaylist as jest.Mock).mock.calls[0].slice(1)
			expect(tracks).toEqual([
				expect.objectContaining({
					id: 'new',
					url: 'https://server/Audio/new/universal',
					artwork: 'https://art/new',
				}),
				expect.objectContaining({
					id: 'old',
					url: 'https://server/Audio/old/universal',
					artwork: 'file:///art/old.jpg',
				}),
			])
		})

		test('Recently added lists every album and skips other items', async () => {
			;(fetchRecentlyAdded as jest.Mock).mockResolvedValueOnce([
				{ Id: 'a1', Name: 'Abbey Road', Type: 'MusicAlbum' },
				{ Id: 's1', Name: 'Single song', Type: 'Audio' },
			])
			expect(rowTitles(await loader()('added'))).toEqual(['Abbey Road'])
		})

		test('Recently added says so when empty', async () => {
			;(fetchRecentlyAdded as jest.Mock).mockResolvedValueOnce([])
			expect(rowTitles(await loader()('added'))).toEqual(['Nothing here yet'])
		})

		test('Home leaves out a row with no songs', async () => {
			;(fetchRecentlyPlayed as jest.Mock).mockResolvedValueOnce([])
			;(fetchFrequentlyPlayed as jest.Mock).mockResolvedValueOnce(songs('f', 1))
			;(fetchRecentlyAdded as jest.Mock).mockResolvedValueOnce([])
			const [, tiles] = ((await loader()('home')) as CarPlayListTemplate).sections!
			expect(tiles.items.map((row) => row.id)).toEqual(['picks:frequents'])
		})

		test('an unknown list is empty', async () => {
			expect(((await loader()('nope')) as CarPlayListTemplate).sections).toEqual([])
		})
	})

	describe('album and artist buttons on Now Playing', () => {
		const onAlbumArtistPress = () =>
			(CarPlayHelper.onAlbumArtistPress as jest.Mock).mock.calls[0][0]
		const track = (item: object) => ({
			id: 't',
			title: 'Come Together',
			album: 'Abbey Road',
			extraPayload: { item: JSON.stringify(item) },
		})

		beforeEach(() => (CarPlayHelper.push as jest.Mock).mockClear())

		test('open the album', () => {
			onAlbumArtistPress()(track({ AlbumId: 'abbey', ArtistItems: [{ Id: 'b' }] }))
			expect(CarPlayHelper.push).toHaveBeenCalledWith({
				type: 'list',
				id: 'album:abbey',
				title: 'Abbey Road',
				lazy: true,
			})
		})

		test('fall back to the artist without an album', () => {
			onAlbumArtistPress()(track({ ArtistItems: [{ Id: 'b', Name: 'The Beatles' }] }))
			expect(CarPlayHelper.push).toHaveBeenCalledWith({
				type: 'list',
				id: 'artist:b',
				title: 'The Beatles',
				lazy: true,
			})
		})

		test('do nothing with neither', () => {
			onAlbumArtistPress()(track({}))
			expect(CarPlayHelper.push).not.toHaveBeenCalled()
		})
	})

	describe('reloading', () => {
		beforeEach(() => (CarPlayHelper.reload as jest.Mock).mockClear())

		test('reloads once the server is reachable again', () => {
			onNetworkChange({ isInternetReachable: true })
			expect(CarPlayHelper.reload).not.toHaveBeenCalled()
			onNetworkChange({ isInternetReachable: false })
			onNetworkChange({ isInternetReachable: null })
			expect(CarPlayHelper.reload).not.toHaveBeenCalled()
			onNetworkChange({ isInternetReachable: true })
			expect(CarPlayHelper.reload).toHaveBeenCalledTimes(1)
		})

		test('reloads when the user, server or library changes', () => {
			useJellifyStore.setState({ user: { id: 'someone-else' } as never })
			expect(CarPlayHelper.reload).toHaveBeenCalledTimes(1)
		})
	})

	test('retry rows reload their list', () => {
		const onSelect = (CarPlayHelper.onSelect as jest.Mock).mock.calls[0][0]
		onSelect('retry', 'playlists')
		expect(CarPlayHelper.reload).toHaveBeenCalledWith('playlists')
	})

	test('the title of an artwork row opens its whole list', () => {
		const onSelect = (CarPlayHelper.onSelect as jest.Mock).mock.calls[0][0]
		onSelect('picks:recents', 'home')
		expect(CarPlayHelper.push).toHaveBeenCalledWith({
			type: 'list',
			id: 'picks:recents',
			title: 'Play it again',
			lazy: true,
		})
	})
})
