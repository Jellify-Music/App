import { AndroidAutoMediaLibraryHelper, MediaLibrary } from 'react-native-nitro-player'
import { publishMediaLibrary } from '../../../src/services/android-auto'
import { AaIds, AaMessages } from '../../../src/services/android-auto/tree'
import {
	loadDownloads,
	loadFrequentlyPlayed,
	loadRecentlyPlayed,
	loadUserPlaylists,
} from '../../../src/services/android-auto/data'
import { getLibrary, getUser } from '../../../src/stores/auth/utils'

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
	loadUserPlaylists: jest.fn(),
	loadDownloads: jest.fn(),
}))
jest.mock('../../../src/services/android-auto/playlists', () => ({
	deleteAllAaPlaylists: jest.fn().mockResolvedValue(undefined),
	materializePlaylist: jest.fn((title: string, items: unknown[]) =>
		Promise.resolve(items.length ? `native:${title}` : null),
	),
}))
jest.mock('../../../src/api/queries/image/utils', () => ({ getItemImageUrl: () => undefined }))
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
const titles = (library: MediaLibrary, rootId: string) =>
	library.rootItems.find((item) => item.id === rootId)?.children?.map((c) => c.title)

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

	it('publishes local content first, then the remote sections', async () => {
		await publishMediaLibrary()

		const [first, second] = published()
		expect(published()).toHaveLength(2)

		expect(first.rootItems.map((i) => i.id)).toEqual([
			AaIds.Home,
			AaIds.Playlists,
			AaIds.Downloads,
		])
		expect(titles(first, AaIds.Home)).toEqual([AaMessages.Loading])
		expect(titles(first, AaIds.Downloads)).toEqual(['Artists', 'Albums', 'All songs'])

		expect(titles(second, AaIds.Home)).toEqual(['Play it again'])
		expect(titles(second, AaIds.Playlists)).toEqual(['Road trip'])
		expect(second.rootItems[1].children?.[0].playlistId).toBe('native:Road trip')
	})

	it('shows the server error row when remote loads fail', async () => {
		;(loadRecentlyPlayed as jest.Mock).mockResolvedValue({ data: [], error: true })
		;(loadFrequentlyPlayed as jest.Mock).mockResolvedValue({ data: [], error: true })
		;(loadUserPlaylists as jest.Mock).mockResolvedValue({ data: [], error: true })

		await publishMediaLibrary()

		const [, second] = published()
		expect(titles(second, AaIds.Home)).toEqual([AaMessages.ServerUnreachable])
		expect(titles(second, AaIds.Playlists)).toEqual([AaMessages.ServerUnreachable])
		expect(titles(second, AaIds.Downloads)).toEqual(['Artists', 'Albums', 'All songs'])
	})

	it('publishes the error tree for both remote sections when phase 2 throws', async () => {
		;(loadUserPlaylists as jest.Mock).mockRejectedValue(new Error('boom'))

		await publishMediaLibrary()

		const [, second] = published()
		expect(titles(second, AaIds.Home)).toEqual([AaMessages.ServerUnreachable])
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
