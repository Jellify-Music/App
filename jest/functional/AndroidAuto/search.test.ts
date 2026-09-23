import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { fetchSearchResults } from '../../../src/api/queries/search/utils'
import { playlistFor, trackRows } from '../../../src/services/android-auto/library'
import {
	SEARCH_GROUP_CAP,
	SEARCH_TRACK_CAP,
	matchScore,
	searchLibrary,
} from '../../../src/services/android-auto/search'
import { AaMessages } from '../../../src/services/android-auto/tree'

jest.mock('../../../src/stores/auth/utils', () => ({
	getApi: () => ({}),
	getUser: () => ({ id: 'user-1' }),
	getLibrary: () => ({ musicLibraryId: 'lib-1' }),
}))
jest.mock('../../../src/api/queries/search/utils', () => ({ fetchSearchResults: jest.fn() }))
jest.mock('../../../src/services/android-auto/library', () => ({
	playlistFor: jest.fn(async () => 'native-playlist'),
	trackRows: jest.fn((playlistId: string, tracks: BaseItemDto[]) =>
		tracks.map((track) => ({
			id: `${playlistId}:${track.Id}`,
			title: track.Name,
			isPlayable: true,
			mediaType: 'audio',
		})),
	),
}))
jest.mock('../../../src/services/android-auto/artwork', () => ({
	artworkUri: jest.fn(() => 'content://artwork/item'),
}))

const item = (type: BaseItemKind, id: string, name: string, extra: BaseItemDto = {}) =>
	({ Id: id, Name: name, Type: type, ...extra }) as BaseItemDto

const artist = (id: string, name: string) => item(BaseItemKind.MusicArtist, id, name)
const album = (id: string, name: string, extra: BaseItemDto = {}) =>
	item(BaseItemKind.MusicAlbum, id, name, extra)
const song = (id: string, name: string) => item(BaseItemKind.Audio, id, name)
const playlist = (id: string, name: string) => item(BaseItemKind.Playlist, id, name)

const results = (items: BaseItemDto[]) => (fetchSearchResults as jest.Mock).mockResolvedValue(items)

describe('Android Auto search', () => {
	beforeEach(() => jest.clearAllMocks())

	it('asks the server, so it finds music that was never browsed in the car', async () => {
		results([artist('artist-1', 'ABBA')])

		await searchLibrary('abba')

		expect(fetchSearchResults).toHaveBeenCalledWith('lib-1', 'abba')
	})

	it('does not search for an empty query', async () => {
		expect(await searchLibrary('   ')).toEqual([])
		expect(fetchSearchResults).not.toHaveBeenCalled()
	})

	it('opens artists, albums and playlists on their usual pages', async () => {
		results([
			artist('artist-1', 'ABBA'),
			album('album-1', 'Arrival', { AlbumArtist: 'ABBA' }),
			playlist('playlist-1', 'Road Trip'),
		])

		const rows = await searchLibrary('abba')

		expect(rows.map((row) => [row.id, row.groupTitle, row.isPlayable])).toEqual([
			['aa-lib-artist:artist-1', 'Artists', false],
			['aa-lib-album:album-1', 'Albums', false],
			['aa-lib-playlist:playlist-1', 'Playlists', false],
		])
		expect(rows[1].subtitle).toBe('ABBA')
	})

	it('plays songs from one native playlist built for the query', async () => {
		results([song('track-1', 'Dancing Queen'), song('track-2', 'Waterloo')])

		const rows = await searchLibrary('abba')

		expect(playlistFor).toHaveBeenCalledWith('search:abba', 'Search: abba', [
			expect.objectContaining({ Id: 'track-1' }),
			expect.objectContaining({ Id: 'track-2' }),
		])
		expect(trackRows).toHaveBeenCalled()
		expect(rows.map((row) => [row.id, row.groupTitle, row.isPlayable])).toEqual([
			['native-playlist:track-1', 'Songs', true],
			['native-playlist:track-2', 'Songs', true],
		])
	})

	it('leads with the group whose name matches the query outright', async () => {
		results([song('track-1', 'Abbamania'), artist('artist-1', 'ABBA')])

		const rows = await searchLibrary('abba')

		expect(rows[0].id).toBe('aa-lib-artist:artist-1')
	})

	it('leads with the song when the song is the exact match', async () => {
		results([artist('artist-1', 'Queen'), song('track-1', 'Dancing Queen')])

		const rows = await searchLibrary('Dancing Queen')

		expect(rows[0].id).toBe('native-playlist:track-1')
	})

	it('ignores case and diacritics when ranking', () => {
		expect(matchScore('Beyoncé', 'beyonce')).toBe(3)
		expect(matchScore('The Beatles', 'beatles')).toBe(1)
		expect(matchScore('Bee Gees', 'bee')).toBe(2)
		expect(matchScore('Nirvana', 'abba')).toBe(0)
	})

	it('bounds how much travels to the car', async () => {
		results([
			...Array.from({ length: SEARCH_GROUP_CAP + 5 }, (_, i) =>
				artist(`artist-${i}`, `Artist ${i}`),
			),
			...Array.from({ length: SEARCH_TRACK_CAP + 5 }, (_, i) =>
				song(`track-${i}`, `Song ${i}`),
			),
		])

		const rows = await searchLibrary('a')

		expect(rows.filter((row) => row.groupTitle === 'Artists')).toHaveLength(SEARCH_GROUP_CAP)
		expect(rows.filter((row) => row.groupTitle === 'Songs')).toHaveLength(SEARCH_TRACK_CAP)
	})

	it('says so when nothing matches', async () => {
		results([])

		expect(await searchLibrary('abba')).toEqual([
			expect.objectContaining({ title: AaMessages.NoResults }),
		])
	})

	it('says so when the server cannot be reached', async () => {
		;(fetchSearchResults as jest.Mock).mockRejectedValue(new Error('offline'))

		expect(await searchLibrary('abba')).toEqual([
			expect.objectContaining({ title: AaMessages.ServerUnreachable }),
		])
	})

	it('skips results the server returned without an id', async () => {
		results([{ Name: 'Nameless', Type: BaseItemKind.MusicArtist } as BaseItemDto])

		expect(await searchLibrary('abba')).toEqual([
			expect.objectContaining({ title: AaMessages.NoResults }),
		])
	})
})
