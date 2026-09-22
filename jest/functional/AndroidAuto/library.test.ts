import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models'
import { ApiLimits } from '../../../src/configs/querying/index.config'
import { AaMessages } from '../../../src/services/android-auto/tree'
import {
	clearLibraryPlaylists,
	loadLibraryChildren,
} from '../../../src/services/android-auto/library'
import { fetchArtists } from '../../../src/api/queries/artist/utils/artist'
import { fetchAlbums } from '../../../src/api/queries/album/utils/album'
import { ensureArtistAlbumsQueryData } from '../../../src/api/queries/artist/queries'
import { ensureAlbumDiscsQuery } from '../../../src/api/queries/album'
import { materializePlaylist } from '../../../src/services/android-auto/playlists'

const user = { id: 'user-1' }
const library = { musicLibraryId: 'lib-1' }

jest.mock('../../../src/stores/auth/utils', () => ({
	getApi: () => ({}),
	getUser: () => ({ id: 'user-1' }),
	getLibrary: () => ({ musicLibraryId: 'lib-1' }),
}))
jest.mock('../../../src/api/queries/artist/utils/artist', () => ({
	fetchArtists: jest.fn(),
}))
jest.mock('../../../src/api/queries/album/utils/album', () => ({
	fetchAlbums: jest.fn(),
}))
jest.mock('../../../src/api/queries/artist/queries', () => ({
	ensureArtistAlbumsQueryData: jest.fn(),
}))
jest.mock('../../../src/api/queries/album', () => ({
	ensureAlbumDiscsQuery: jest.fn(),
}))
jest.mock('../../../src/services/android-auto/playlists', () => ({
	materializePlaylist: jest.fn(),
}))
jest.mock('../../../src/services/android-auto/artwork', () => ({
	artworkUri: jest.fn(() => 'content://com.cosmonautical.jellify.dev.artwork/item/Primary'),
}))

const artist = (id: string, name: string): BaseItemDto => ({
	Id: id,
	Name: name,
	Type: 'MusicArtist',
})
const album = (id: string, name: string, albumArtist?: string): BaseItemDto => ({
	Id: id,
	Name: name,
	AlbumArtist: albumArtist,
	Type: 'MusicAlbum',
})
const track = (id: string, name: string, artists?: string[]): BaseItemDto => ({
	Id: id,
	Name: name,
	Artists: artists,
	Album: 'The Album',
	Type: 'Audio',
})

beforeAll(() => {
	jest.spyOn(console, 'error').mockImplementation(() => {})
	jest.spyOn(console, 'info').mockImplementation(() => {})
	jest.spyOn(console, 'warn').mockImplementation(() => {})
})

beforeEach(() => {
	jest.clearAllMocks()
	clearLibraryPlaylists()
})

describe('loadLibraryChildren — aa-lib-artists:<L>', () => {
	it('filters by nameStartsWith and stops paging on a short page', async () => {
		;(fetchArtists as jest.Mock).mockResolvedValueOnce([artist('a1', 'ABBA')])

		const items = await loadLibraryChildren('aa-lib-artists:A')

		expect(fetchArtists).toHaveBeenCalledTimes(1)
		expect(fetchArtists).toHaveBeenCalledWith(
			user,
			library,
			0,
			undefined,
			[ItemSortBy.SortName],
			[SortOrder.Ascending],
			undefined,
			{ nameStartsWith: 'A' },
		)
		expect(items).toEqual([
			{
				id: 'aa-lib-artist:a1',
				title: 'ABBA',
				iconUrl: 'content://com.cosmonautical.jellify.dev.artwork/item/Primary',
				isPlayable: false,
				mediaType: 'folder',
				children: [],
			},
		])
	})

	it('pages until a page shorter than the page limit', async () => {
		const fullPage = Array.from({ length: ApiLimits.Library }, (_, i) =>
			artist(`a${i}`, `Artist ${i}`),
		)
		const shortPage = [artist('last', 'Zzz')]
		;(fetchArtists as jest.Mock)
			.mockResolvedValueOnce(fullPage)
			.mockResolvedValueOnce(shortPage)

		const items = await loadLibraryChildren('aa-lib-artists:A')

		expect(fetchArtists).toHaveBeenCalledTimes(2)
		expect(fetchArtists).toHaveBeenNthCalledWith(
			2,
			user,
			library,
			1,
			undefined,
			[ItemSortBy.SortName],
			[SortOrder.Ascending],
			undefined,
			{ nameStartsWith: 'A' },
		)
		expect(items).toHaveLength(ApiLimits.Library + 1)
	})

	it('caps at 500 items even when every page is full', async () => {
		const fullPage = Array.from({ length: ApiLimits.Library }, (_, i) =>
			artist(`a${i}`, `Artist ${i}`),
		)
		;(fetchArtists as jest.Mock).mockResolvedValue(fullPage)

		const items = await loadLibraryChildren('aa-lib-artists:B')

		expect(items).toHaveLength(500)
		expect(fetchArtists).toHaveBeenCalledTimes(2)
	})

	it('uses nameLessThan "A" for the # bucket', async () => {
		;(fetchArtists as jest.Mock).mockResolvedValueOnce([])

		await loadLibraryChildren('aa-lib-artists:#')

		expect(fetchArtists).toHaveBeenCalledWith(
			user,
			library,
			0,
			undefined,
			[ItemSortBy.SortName],
			[SortOrder.Ascending],
			undefined,
			{ nameLessThan: 'A' },
		)
	})

	it('returns a No artists found row when the letter is empty', async () => {
		;(fetchArtists as jest.Mock).mockResolvedValueOnce([])

		const items = await loadLibraryChildren('aa-lib-artists:Q')

		expect(items).toEqual([
			expect.objectContaining({ title: AaMessages.NoArtists, mediaType: 'folder' }),
		])
	})
})

describe('loadLibraryChildren — aa-lib-albums:<L>', () => {
	it('filters by nameStartsWith and returns album folders with artist subtitle', async () => {
		;(fetchAlbums as jest.Mock).mockResolvedValueOnce([album('al1', 'Arrival', 'ABBA')])

		const items = await loadLibraryChildren('aa-lib-albums:A')

		expect(fetchAlbums).toHaveBeenCalledWith(
			{},
			user,
			library,
			0,
			undefined,
			[ItemSortBy.SortName],
			[SortOrder.Ascending],
			undefined,
			undefined,
			undefined,
			{ nameStartsWith: 'A' },
		)
		expect(items).toEqual([
			{
				id: 'aa-lib-album:al1',
				title: 'Arrival',
				subtitle: 'ABBA',
				iconUrl: 'content://com.cosmonautical.jellify.dev.artwork/item/Primary',
				isPlayable: false,
				mediaType: 'folder',
				children: [],
			},
		])
	})

	it('returns a No albums found row when the letter is empty', async () => {
		;(fetchAlbums as jest.Mock).mockResolvedValueOnce([])

		const items = await loadLibraryChildren('aa-lib-albums:Z')

		expect(items).toEqual([
			expect.objectContaining({ title: AaMessages.NoAlbums, mediaType: 'folder' }),
		])
	})
})

describe('loadLibraryChildren — aa-lib-artist:<id>', () => {
	it("returns the artist's albums as folders", async () => {
		;(ensureArtistAlbumsQueryData as jest.Mock).mockResolvedValueOnce([
			album('al1', 'Arrival', 'ABBA'),
		])

		const items = await loadLibraryChildren('aa-lib-artist:artist-1')

		expect(ensureArtistAlbumsQueryData).toHaveBeenCalledWith({ Id: 'artist-1' })
		expect(items).toEqual([
			expect.objectContaining({ id: 'aa-lib-album:al1', title: 'Arrival', subtitle: 'ABBA' }),
		])
	})

	it('returns a No albums found row when the artist has none', async () => {
		;(ensureArtistAlbumsQueryData as jest.Mock).mockResolvedValueOnce([])

		const items = await loadLibraryChildren('aa-lib-artist:artist-2')

		expect(items).toEqual([
			expect.objectContaining({ title: AaMessages.NoAlbums, mediaType: 'folder' }),
		])
	})
})

describe('loadLibraryChildren — aa-lib-album:<id>', () => {
	it('materializes a playlist and returns playlistId:trackId audio rows', async () => {
		const tracks = [track('t1', 'Dancing Queen', ['ABBA']), track('t2', 'Waterloo')]
		;(ensureAlbumDiscsQuery as jest.Mock).mockResolvedValue([{ title: '1', data: tracks }])
		;(materializePlaylist as jest.Mock).mockResolvedValue('native-1')

		const items = await loadLibraryChildren('aa-lib-album:album-1')

		expect(ensureAlbumDiscsQuery).toHaveBeenCalledWith({ Id: 'album-1' })
		expect(materializePlaylist).toHaveBeenCalledWith('The Album', tracks)
		expect(items).toEqual([
			{
				id: 'native-1:t1',
				title: 'Dancing Queen',
				subtitle: 'ABBA',
				isPlayable: true,
				mediaType: 'audio',
			},
			{
				id: 'native-1:t2',
				title: 'Waterloo',
				subtitle: 'Unknown Artist',
				isPlayable: true,
				mediaType: 'audio',
			},
		])
	})

	it('reuses the materialized playlist on a second open of the same album', async () => {
		const tracks = [track('t1', 'Dancing Queen')]
		;(ensureAlbumDiscsQuery as jest.Mock).mockResolvedValue([{ title: '1', data: tracks }])
		;(materializePlaylist as jest.Mock).mockResolvedValue('native-1')

		await loadLibraryChildren('aa-lib-album:album-1')
		await loadLibraryChildren('aa-lib-album:album-1')

		expect(materializePlaylist).toHaveBeenCalledTimes(1)
	})

	it('clearLibraryPlaylists forces re-materialization', async () => {
		const tracks = [track('t1', 'Dancing Queen')]
		;(ensureAlbumDiscsQuery as jest.Mock).mockResolvedValue([{ title: '1', data: tracks }])
		;(materializePlaylist as jest.Mock).mockResolvedValue('native-1')

		await loadLibraryChildren('aa-lib-album:album-1')
		clearLibraryPlaylists()
		await loadLibraryChildren('aa-lib-album:album-1')

		expect(materializePlaylist).toHaveBeenCalledTimes(2)
	})

	it('returns a No tracks found row when the album has no tracks', async () => {
		;(ensureAlbumDiscsQuery as jest.Mock).mockResolvedValue([{ title: '1', data: [] }])

		const items = await loadLibraryChildren('aa-lib-album:empty-album')

		expect(materializePlaylist).not.toHaveBeenCalled()
		expect(items).toEqual([expect.objectContaining({ title: 'No tracks found' })])
	})
})

describe('loadLibraryChildren — errors and unknown ids', () => {
	it('returns a ServerUnreachable row and does not throw when the fetch fails', async () => {
		;(fetchArtists as jest.Mock).mockRejectedValueOnce(new Error('network down'))

		const items = await loadLibraryChildren('aa-lib-artists:A')

		expect(items).toEqual([expect.objectContaining({ title: AaMessages.ServerUnreachable })])
	})

	it('returns an empty list for an unrecognized id', async () => {
		const items = await loadLibraryChildren('aa-something-else')

		expect(items).toEqual([])
	})
})
