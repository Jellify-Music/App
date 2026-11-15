import { Platform } from 'react-native'
import {
	CarPlayHelper,
	DownloadManager,
	type CarPlayImageRow,
	type CarPlayListTemplate,
	type CarPlayTemplate,
} from 'react-native-nitro-player'
import { getApi, getLibrary, getUser } from '../../src/stores/auth/utils'
import { refreshUserPlaylists } from '../../src/api/queries/playlist/cache'
import { fetchRecentlyAdded, fetchRecentlyPlayed } from '../../src/api/queries/recents/utils'
import { fetchFrequentlyPlayed } from '../../src/api/queries/frequents/utils/frequents'
import { registerCarPlayService } from '../../src/services/auto/carplay'

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
		deletePlaylist: jest.fn(),
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
	beforeAll(() => {
		Platform.OS = 'ios'
		registerCarPlayService()
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
			const [tiles, library] = home.sections!
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
				"Couldn't reach your Jellyfin server",
				'Favorites',
				'Downloads',
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
