import { AndroidAutoMediaLibraryHelper, MediaLibrary } from 'react-native-nitro-player'
import { publishMediaLibrary } from '../../../src/services/android-auto'
import { AaIds, AaMediaItem, AaMessages } from '../../../src/services/android-auto/tree'
import {
	loadDownloads,
	loadFrequentlyPlayed,
	loadRecentlyAdded,
	loadRecentlyPlayed,
	loadUserPlaylists,
} from '../../../src/services/android-auto/data'
import { getLibrary, getUser } from '../../../src/stores/auth/utils'
import {
	deleteAllAaPlaylists,
	materializePlaylist,
} from '../../../src/services/android-auto/playlists'

jest.mock('../../../src/stores/auth/utils', () => ({
	getApi: jest.fn(() => ({})),
	getUser: jest.fn(),
	getLibrary: jest.fn(),
}))
jest.mock('../../../src/stores/auth', () => ({
	__esModule: true,
	default: { getState: () => ({}), subscribe: jest.fn() },
}))
jest.mock('../../../src/services/android-auto/data', () => ({
	loadRecentlyPlayed: jest.fn(),
	loadFrequentlyPlayed: jest.fn(),
	loadRecentlyAdded: jest.fn(),
	loadUserPlaylists: jest.fn(),
	loadDownloads: jest.fn(),
}))
jest.mock('../../../src/services/android-auto/playlists', () => ({
	deleteAllAaPlaylists: jest.fn().mockResolvedValue(undefined),
	materializePlaylist: jest.fn((title: string, items: unknown[]) =>
		Promise.resolve(items.length ? `native:${title}` : null),
	),
}))
jest.mock('../../../src/services/android-auto/library', () => ({
	clearLibraryCache: jest.fn(),
	loadLibraryChildren: jest.fn(),
}))
jest.mock('../../../src/services/android-auto/artwork', () => ({
	artworkUri: (item: { Id: string } | undefined) => (item ? `art:${item.Id}` : undefined),
}))
jest.mock('../../../src/utils/mapping/track-extra-payload', () => ({
	__esModule: true,
	default: (track: { extraPayload: { item: string } }) => JSON.parse(track.extraPayload.item),
}))

const track = { Id: 't1', Name: 'Song', Album: 'Album', AlbumId: 'al', AlbumArtist: 'Artist' }
const download = {
	trackId: 't1',
	originalTrack: { id: 't1', extraPayload: { item: JSON.stringify(track) } },
}

const set = AndroidAutoMediaLibraryHelper.set as jest.Mock
const published = (): MediaLibrary[] => set.mock.calls.map(([library]) => library)
const folder = (library: MediaLibrary, id: string) =>
	[...library.rootItems, ...(library.rootItems[0].children ?? [])].find((item) => item.id === id)
const titles = (library: MediaLibrary, id: string) =>
	folder(library, id)?.children?.map((c) => c.title)
/** Home without its trailing Downloads tile, as [groupTitle, title]. */
const homeRows = (library: MediaLibrary) =>
	(folder(library, AaIds.Home)?.children as AaMediaItem[])
		.filter((c) => c.id !== AaIds.Downloads)
		.map((c) => [c.groupTitle, c.title])

beforeAll(() => {
	// captureInfo/captureError log via console.info/console.error; silence them so test
	// output stays pristine (same pattern as data.test.ts).
	jest.spyOn(console, 'info').mockImplementation(() => {})
	jest.spyOn(console, 'error').mockImplementation(() => {})
	jest.spyOn(console, 'warn').mockImplementation(() => {})
})

beforeEach(() => {
	jest.clearAllMocks()
	;(getUser as jest.Mock).mockReturnValue({ id: 'u1' })
	;(getLibrary as jest.Mock).mockReturnValue({ musicLibraryId: 'lib' })
	;(loadDownloads as jest.Mock).mockResolvedValue({ data: [download], error: false })
	;(loadRecentlyPlayed as jest.Mock).mockResolvedValue({ data: [track], error: false })
	;(loadFrequentlyPlayed as jest.Mock).mockResolvedValue({ data: [], error: false })
	;(loadRecentlyAdded as jest.Mock).mockResolvedValue({
		data: [
			{ Id: 'ra1', Name: 'Fresh', Type: 'MusicAlbum', AlbumArtist: 'New Band' },
			{ Id: 'rs1', Name: 'Single song', Type: 'Audio' },
		],
		error: false,
	})
	;(loadUserPlaylists as jest.Mock).mockResolvedValue({
		data: [{ playlist: { Id: 'p1', Name: 'Road trip' }, tracks: [track] }],
		error: false,
	})
})

describe('publishMediaLibrary', () => {
	it('publishes a sign-in prompt when there is no session', async () => {
		;(getUser as jest.Mock).mockReturnValue(undefined)

		await publishMediaLibrary()

		expect(published()).toHaveLength(1)
		expect(published()[0].rootItems.map((i) => i.title)).toEqual([AaMessages.SignIn])
		expect(loadRecentlyPlayed).not.toHaveBeenCalled()
	})

	it('drops persisted Android Auto playlists (and their auth headers) when signed out', async () => {
		;(getUser as jest.Mock).mockReturnValue(undefined)

		await publishMediaLibrary()

		expect(deleteAllAaPlaylists).toHaveBeenCalledTimes(1)
	})

	it('publishes local content first, then the remote sections', async () => {
		await publishMediaLibrary()

		const [first, second] = published()
		expect(published()).toHaveLength(2)

		const tabs = [AaIds.Home, AaIds.LibraryArtists, AaIds.LibraryAlbums, AaIds.Playlists]
		expect(first.rootItems.map((i) => i.id)).toEqual(tabs)
		expect(second.rootItems.map((i) => i.id)).toEqual(tabs)
		expect(titles(first, AaIds.Home)).toEqual([AaMessages.Loading, 'Downloads'])
		expect(titles(first, AaIds.Downloads)).toEqual(['Artists', 'Albums', 'All songs'])
		// The Downloads tile shows its first album's artwork.
		expect(folder(first, AaIds.Downloads)?.iconUrl).toBe('art:t1')

		expect(homeRows(second)).toEqual([
			['Quick picks', 'Play it again'],
			['Recently played albums', 'Album'],
			['Recently added', 'Fresh'],
		])
		expect(folder(second, AaIds.Home)?.children?.[1]).toMatchObject({
			id: 'aa-lib-album:al',
			subtitle: 'Artist',
			iconUrl: 'art:t1',
		})
		expect(titles(second, AaIds.Downloads)).toEqual(['Artists', 'Albums', 'All songs'])
		expect(titles(second, AaIds.Playlists)).toEqual(['Road trip'])
		expect(second.rootItems[3].children?.[0].playlistId).toBe('native:Road trip')
		// Playlist rows show the playlist's own artwork; Home rows use their first track's.
		expect(second.rootItems[3].children?.[0].iconUrl).toBe('art:p1')
		expect(second.rootItems[0].children?.[0].iconUrl).toBe('art:t1')
	})

	it('lists each played album once, most played last', async () => {
		const other = { ...track, Id: 't2', AlbumId: 'al2', Album: 'Other' }
		;(loadRecentlyPlayed as jest.Mock).mockResolvedValue({
			data: [track, { ...track, Id: 't3' }, other],
			error: false,
		})
		;(loadFrequentlyPlayed as jest.Mock).mockResolvedValue({ data: [other], error: false })
		;(loadRecentlyAdded as jest.Mock).mockResolvedValue({ data: [], error: false })

		await publishMediaLibrary()

		expect(homeRows(published()[1])).toEqual([
			['Quick picks', 'Play it again'],
			['Quick picks', 'On Repeat'],
			['Recently played albums', 'Album'],
			['Recently played albums', 'Other'],
			['Most played albums', 'Other'],
		])
	})

	it('logs how many tracks a publish materialized', async () => {
		await publishMediaLibrary()

		// 1 download x (artist + album + all songs) + Play it again + Road trip
		expect(console.info).toHaveBeenCalledWith(
			expect.anything(),
			'Media library published (5 tracks materialized)',
		)
	})

	it('shows the server error row when remote loads fail', async () => {
		;(loadRecentlyPlayed as jest.Mock).mockResolvedValue({ data: [], error: true })
		;(loadFrequentlyPlayed as jest.Mock).mockResolvedValue({ data: [], error: true })
		;(loadRecentlyAdded as jest.Mock).mockResolvedValue({ data: [], error: true })
		;(loadUserPlaylists as jest.Mock).mockResolvedValue({ data: [], error: true })

		await publishMediaLibrary()

		const [, second] = published()
		expect(titles(second, AaIds.Home)).toEqual([AaMessages.ServerUnreachable, 'Downloads'])
		expect(titles(second, AaIds.Playlists)).toEqual([AaMessages.ServerUnreachable])
		expect(titles(second, AaIds.Downloads)).toEqual(['Artists', 'Albums', 'All songs'])
	})

	it('marks Downloads unavailable and still loads remote sections when phase 1 throws', async () => {
		;(materializePlaylist as jest.Mock).mockRejectedValueOnce(new Error('disk full'))

		await publishMediaLibrary()

		const [first, second] = published()
		expect(published()).toHaveLength(2)
		expect(titles(first, AaIds.Downloads)).toEqual([AaMessages.DownloadsUnavailable])
		expect(titles(first, AaIds.Home)).toEqual([AaMessages.Loading, 'Downloads'])
		expect(homeRows(second)[0]).toEqual(['Quick picks', 'Play it again'])
		expect(titles(second, AaIds.Downloads)).toEqual([AaMessages.DownloadsUnavailable])
	})

	it('publishes the error tree for both remote sections when phase 2 throws', async () => {
		;(loadUserPlaylists as jest.Mock).mockRejectedValue(new Error('boom'))

		await publishMediaLibrary()

		const [, second] = published()
		expect(second.rootItems.map((i) => i.id)).toEqual([
			AaIds.Home,
			AaIds.LibraryArtists,
			AaIds.LibraryAlbums,
			AaIds.Playlists,
		])
		expect(titles(second, AaIds.Home)).toEqual([AaMessages.ServerUnreachable, 'Downloads'])
		expect(titles(second, AaIds.Playlists)).toEqual([AaMessages.ServerUnreachable])
	})

	it('collapses overlapping publish requests into one follow-up publish', async () => {
		const first = publishMediaLibrary()
		const second = publishMediaLibrary()
		const third = publishMediaLibrary()
		await Promise.all([first, second, third])
		await new Promise((resolve) => setTimeout(resolve, 0))
		await new Promise((resolve) => setTimeout(resolve, 0))

		// 2 sets for the first run + 2 sets for the single coalesced re-run
		expect(set).toHaveBeenCalledTimes(4)
	})
})
