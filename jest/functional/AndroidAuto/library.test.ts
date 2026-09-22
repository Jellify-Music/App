import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { ItemSortBy, SortOrder } from '@jellyfin/sdk/lib/generated-client/models'
import { ApiLimits } from '../../../src/configs/querying/index.config'
import { AaMediaItem, AaMessages, LIBRARY_LETTERS } from '../../../src/services/android-auto/tree'
import {
	FLAT_LIST_MAX,
	albumPlaylistIds,
	clearLibraryCache,
	clearLibraryTabs,
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
	letterArtworkUri: jest.fn((letter: string) => `letter:${letter}`),
	collageArtworkUri: jest.fn(
		(letter: string, items: BaseItemDto[]) =>
			`collage:${letter}:${items.map((i) => i.Id).join(',')}`,
	),
}))

const artist = (id: string, name: string, extra: BaseItemDto = {}): BaseItemDto => ({
	Id: id,
	Name: name,
	Type: 'MusicArtist',
	...extra,
})
const album = (
	id: string,
	name: string,
	albumArtist?: string,
	extra: BaseItemDto = {},
): BaseItemDto => ({
	Id: id,
	Name: name,
	AlbumArtist: albumArtist,
	Type: 'MusicAlbum',
	...extra,
})
const ART = 'content://com.cosmonautical.jellify.dev.artwork/item/Primary'
const artists = (count: number) =>
	Array.from({ length: count }, (_, i) => artist(`a${i}`, `Artist ${i}`))
/** Serves `total` items in pages of ApiLimits.Library. */
const paged = (total: number) => (_u: unknown, _l: unknown, page: number) =>
	Promise.resolve(artists(total).slice(page * ApiLimits.Library, (page + 1) * ApiLimits.Library))
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
	clearLibraryCache()
})

describe('loadLibraryChildren — aa-lib-artists:<L> (library over the list cap)', () => {
	// Above FLAT_LIST_MAX the tab shows all 27 tiles and each letter comes from the server.
	beforeEach(async () => {
		;(fetchArtists as jest.Mock).mockImplementation(paged(5000))
		await loadLibraryChildren('aa-lib-artists')
		;(fetchArtists as jest.Mock).mockReset()
	})

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
				iconUrl: ART,
				isPlayable: false,
				mediaType: 'folder',
				children: [],
				layoutType: 'grid',
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

describe('loadLibraryChildren — aa-lib-artists (tab)', () => {
	it("opens on A–Z tiles for the letters that have artists, each showing that letter's covers", async () => {
		;(fetchArtists as jest.Mock).mockResolvedValueOnce([
			artist('n', '10cc', { SortName: '10cc' }),
			artist('a1', 'ABBA', { Genres: ['Pop', 'Disco', 'Europop', 'Schlager'] }),
			artist('a2', 'The Beatles', { SortName: 'Beatles', Genres: [] }),
		])

		const items = (await loadLibraryChildren('aa-lib-artists')) as AaMediaItem[]

		expect(fetchArtists).toHaveBeenCalledWith(
			user,
			library,
			0,
			undefined,
			[ItemSortBy.SortName],
			[SortOrder.Ascending],
			undefined,
			undefined,
		)
		expect(items.map((i) => [i.id, i.title, i.iconUrl, i.layoutType])).toEqual([
			['aa-lib-artists:A', 'A', 'collage:A:a1', 'grid'],
			['aa-lib-artists:B', 'B', 'collage:B:a2', 'grid'],
			['aa-lib-artists:#', '#', 'collage:#:n', 'grid'],
		])
	})

	it('serves a letter from the loaded tab without asking the server again', async () => {
		;(fetchArtists as jest.Mock).mockResolvedValueOnce([
			artist('a1', 'ABBA', { Genres: ['Pop', 'Disco', 'Europop', 'Schlager'] }),
			artist('a3', 'Aqua'),
			artist('a2', 'The Beatles', { SortName: 'Beatles' }),
		])

		await loadLibraryChildren('aa-lib-artists')
		const items = (await loadLibraryChildren('aa-lib-artists:A')) as AaMediaItem[]

		expect(fetchArtists).toHaveBeenCalledTimes(1)
		expect(items.map((i) => [i.id, i.title, i.subtitle, i.groupTitle])).toEqual([
			['aa-lib-artist:a1', 'ABBA', 'Pop, Disco, Europop', undefined],
			['aa-lib-artist:a3', 'Aqua', undefined, undefined],
		])
		expect(items.every((i) => i.layoutType === 'grid' && i.iconUrl === ART)).toBe(true)
	})

	it('keeps a flat list within the binder budget', () => {
		expect(FLAT_LIST_MAX).toBe(500)
	})

	it('reloads the tab, not a server letter filter, when a letter is opened after a republish', async () => {
		;(fetchArtists as jest.Mock).mockResolvedValue([
			artist('j', '坂本龍一', { SortName: '坂本龍一' }),
			artist('o', 'Ólafur Arnalds'),
		])

		await loadLibraryChildren('aa-lib-artists')
		clearLibraryTabs()
		const hash = await loadLibraryChildren('aa-lib-artists:#')
		const o = await loadLibraryChildren('aa-lib-artists:O')

		expect(hash.map((i) => i.title)).toEqual(['坂本龍一'])
		expect(o.map((i) => i.title)).toEqual(['Ólafur Arnalds'])
		expect((fetchArtists as jest.Mock).mock.calls.every((call) => call[7] === undefined)).toBe(
			true,
		)
	})

	it('answers an empty letter from the loaded tab without asking the server', async () => {
		;(fetchArtists as jest.Mock).mockResolvedValue([artist('a1', 'ABBA')])

		await loadLibraryChildren('aa-lib-artists')
		const items = await loadLibraryChildren('aa-lib-artists:Z')

		expect(fetchArtists).toHaveBeenCalledTimes(1)
		expect(items).toEqual([expect.objectContaining({ title: AaMessages.NoArtists })])
	})

	it(`groups up to ${FLAT_LIST_MAX} artists into letters locally`, async () => {
		;(fetchArtists as jest.Mock).mockImplementation(paged(FLAT_LIST_MAX))

		expect((await loadLibraryChildren('aa-lib-artists')).map((i) => i.title)).toEqual(['A'])
		expect(await loadLibraryChildren('aa-lib-artists:A')).toHaveLength(FLAT_LIST_MAX)
	})

	it('shows every A–Z tile above the limit, loading each letter from the server, fetching no more than needed', async () => {
		;(fetchArtists as jest.Mock).mockImplementation(paged(5000))

		const items = await loadLibraryChildren('aa-lib-artists')

		expect(fetchArtists).toHaveBeenCalledTimes(
			Math.ceil((FLAT_LIST_MAX + 1) / ApiLimits.Library), // 501 at 400/page → 2
		)
		expect(items.map((i) => i.title)).toEqual(LIBRARY_LETTERS)
		expect(items.map((i) => i.id)).toEqual(LIBRARY_LETTERS.map((l) => `aa-lib-artists:${l}`))
		expect(items.every((i) => i.layoutType === 'grid' && i.children?.length === 0)).toBe(true)
		expect(items.map((i) => i.iconUrl)).toEqual(LIBRARY_LETTERS.map((l) => `letter:${l}`))

		;(fetchArtists as jest.Mock).mockClear()
		await loadLibraryChildren('aa-lib-artists:B')
		expect(fetchArtists).toHaveBeenCalledWith(
			user,
			library,
			0,
			undefined,
			[ItemSortBy.SortName],
			[SortOrder.Ascending],
			undefined,
			{ nameStartsWith: 'B' },
		)
	})

	it('caches the tab until clearLibraryCache', async () => {
		;(fetchArtists as jest.Mock).mockResolvedValue([artist('a1', 'ABBA')])

		await loadLibraryChildren('aa-lib-artists')
		await loadLibraryChildren('aa-lib-artists')
		expect(fetchArtists).toHaveBeenCalledTimes(1)

		clearLibraryCache()
		await loadLibraryChildren('aa-lib-artists')
		expect(fetchArtists).toHaveBeenCalledTimes(2)
	})

	it('skips artists without an Id', async () => {
		;(fetchArtists as jest.Mock).mockResolvedValueOnce([
			{ Name: 'Ghost', Type: 'MusicArtist' },
			artist('a1', 'ABBA'),
		])

		await loadLibraryChildren('aa-lib-artists')
		expect((await loadLibraryChildren('aa-lib-artists:A')).map((i) => i.id)).toEqual([
			'aa-lib-artist:a1',
		])
		expect((await loadLibraryChildren('aa-lib-artists')).map((i) => i.title)).toEqual(['A'])
	})

	it('returns a No artists found row for an empty library', async () => {
		;(fetchArtists as jest.Mock).mockResolvedValueOnce([])

		expect(await loadLibraryChildren('aa-lib-artists')).toEqual([
			expect.objectContaining({ title: AaMessages.NoArtists }),
		])
	})
})

describe('loadLibraryChildren — aa-lib-albums (tab)', () => {
	it('lists albums with the album artist (or track artists) as subtitle and letter headers', async () => {
		;(fetchAlbums as jest.Mock).mockResolvedValueOnce([
			album('al1', 'Arrival', 'ABBA'),
			album('al2', 'Blue', undefined, { Artists: ['Joni Mitchell'] }),
		])

		const items = (await loadLibraryChildren('aa-lib-albums')) as AaMediaItem[]

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
			undefined,
		)
		expect(items.map((i) => [i.groupTitle, i.id, i.subtitle])).toEqual([
			['A', 'aa-lib-album:al1', 'ABBA'],
			['B', 'aa-lib-album:al2', 'Joni Mitchell'],
		])
	})

	it('falls back to A–Z tiles above the limit', async () => {
		;(fetchAlbums as jest.Mock).mockImplementation(
			(_api: unknown, _u: unknown, _l: unknown, page: number) =>
				Promise.resolve(page < 3 ? artists(ApiLimits.Library) : []),
		)

		const items = await loadLibraryChildren('aa-lib-albums')

		expect(items.map((i) => i.id)).toEqual(LIBRARY_LETTERS.map((l) => `aa-lib-albums:${l}`))
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
				iconUrl: ART,
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
			album('al2', 'Voulez-Vous', 'ABBA'),
		])

		const items = await loadLibraryChildren('aa-lib-artist:artist-1')

		expect(ensureArtistAlbumsQueryData).toHaveBeenCalledWith({ Id: 'artist-1' })
		expect(items).toEqual([
			expect.objectContaining({ id: 'aa-lib-album:al1', title: 'Arrival', subtitle: 'ABBA' }),
			expect.objectContaining({ id: 'aa-lib-album:al2', title: 'Voulez-Vous' }),
		])
	})

	it('goes straight to the songs when the artist has one album', async () => {
		;(ensureArtistAlbumsQueryData as jest.Mock).mockResolvedValueOnce([
			album('al1', 'Baby Dolittle World Animals', 'Baby Einstein'),
		])
		;(ensureAlbumDiscsQuery as jest.Mock).mockResolvedValue([
			{ title: '1', data: [track('t1', 'Symphony No. 9, New World')] },
		])
		;(materializePlaylist as jest.Mock).mockResolvedValue('native-1')

		const items = await loadLibraryChildren('aa-lib-artist:artist-3')

		expect(ensureAlbumDiscsQuery).toHaveBeenCalledWith({ Id: 'al1' })
		expect(items).toEqual([expect.objectContaining({ id: 'native-1:t1', isPlayable: true })])
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
				iconUrl: ART,
				isPlayable: true,
				mediaType: 'audio',
			},
			{
				id: 'native-1:t2',
				title: 'Waterloo',
				subtitle: 'Unknown Artist',
				iconUrl: ART,
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

	it('clearLibraryCache forces re-materialization', async () => {
		const tracks = [track('t1', 'Dancing Queen')]
		;(ensureAlbumDiscsQuery as jest.Mock).mockResolvedValue([{ title: '1', data: tracks }])
		;(materializePlaylist as jest.Mock).mockResolvedValue('native-1')

		await loadLibraryChildren('aa-lib-album:album-1')
		clearLibraryCache()
		await loadLibraryChildren('aa-lib-album:album-1')

		expect(materializePlaylist).toHaveBeenCalledTimes(2)
	})

	it('does not keep an album playlist built for a session that ended during the load', async () => {
		const tracks = [track('t1', 'Dancing Queen')]
		;(ensureAlbumDiscsQuery as jest.Mock).mockResolvedValue([{ title: '1', data: tracks }])
		let finish!: (id: string) => void
		;(materializePlaylist as jest.Mock).mockReturnValueOnce(
			new Promise((resolve) => (finish = resolve)),
		)

		const loading = loadLibraryChildren('aa-lib-album:album-1')
		await new Promise((resolve) => setImmediate(resolve))
		clearLibraryCache()
		finish('old-session')
		await loading

		expect(albumPlaylistIds()).toEqual(new Set())
	})

	it('clearLibraryTabs keeps album playlists, so an open album page stays playable', async () => {
		const tracks = [track('t1', 'Dancing Queen')]
		;(ensureAlbumDiscsQuery as jest.Mock).mockResolvedValue([{ title: '1', data: tracks }])
		;(materializePlaylist as jest.Mock).mockResolvedValue('native-1')

		await loadLibraryChildren('aa-lib-album:album-1')
		clearLibraryTabs()
		await loadLibraryChildren('aa-lib-album:album-1')

		expect(materializePlaylist).toHaveBeenCalledTimes(1)
		expect(albumPlaylistIds()).toEqual(new Set(['native-1']))
	})

	it('returns a No tracks found row when the album has no tracks', async () => {
		;(ensureAlbumDiscsQuery as jest.Mock).mockResolvedValue([{ title: '1', data: [] }])

		const items = await loadLibraryChildren('aa-lib-album:empty-album')

		expect(materializePlaylist).not.toHaveBeenCalled()
		expect(items).toEqual([expect.objectContaining({ title: AaMessages.NoTracks })])
	})
})

describe('loadLibraryChildren — errors and unknown ids', () => {
	it('returns a ServerUnreachable row and does not throw when the fetch fails', async () => {
		;(fetchArtists as jest.Mock).mockRejectedValueOnce(new Error('network down'))

		const items = await loadLibraryChildren('aa-lib-artists:A')

		expect(items).toEqual([expect.objectContaining({ title: AaMessages.ServerUnreachable })])
	})

	it('returns an empty list for status rows and unknown letters without fetching', async () => {
		for (const id of [
			'aa-lib-artists:A-empty',
			'aa-lib-album:x-error',
			'aa-lib-artist:x-loading',
			'aa-lib-artists-status',
			'aa-lib-artists:AB',
			'aa-lib-albums:1',
		]) {
			expect(await loadLibraryChildren(id)).toEqual([])
		}
		expect(fetchArtists).not.toHaveBeenCalled()
		expect(fetchAlbums).not.toHaveBeenCalled()
		expect(ensureArtistAlbumsQueryData).not.toHaveBeenCalled()
		expect(ensureAlbumDiscsQuery).not.toHaveBeenCalled()
	})

	it('answers with a ServerUnreachable row when the server hangs for 15 s', async () => {
		jest.useFakeTimers()
		try {
			;(fetchArtists as jest.Mock).mockReturnValueOnce(new Promise(() => {}))

			const pending = loadLibraryChildren('aa-lib-artists:A')
			await jest.advanceTimersByTimeAsync(15_000)

			expect(await pending).toEqual([
				expect.objectContaining({ title: AaMessages.ServerUnreachable }),
			])
		} finally {
			jest.useRealTimers()
		}
	})

	it('returns an empty list for an unrecognized id', async () => {
		const items = await loadLibraryChildren('aa-something-else')

		expect(items).toEqual([])
	})
})
