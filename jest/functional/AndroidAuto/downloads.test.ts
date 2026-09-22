import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { AA_MAX_FLAT_ITEMS } from '../../../src/services/android-auto/tree'
import {
	groupDownloadedAlbums,
	groupDownloadedArtists,
	groupDownloadedSongs,
} from '../../../src/services/android-auto/downloads'
import { slimifyDto } from '../../../src/utils/mapping/slimify-dto'

// Downloads persist `slimifyDto(item)` (item-to-track.ts), so fixtures go through it too:
// grouping may only rely on fields a real download actually stores.
const track = (overrides: Partial<BaseItemDto>): BaseItemDto =>
	slimifyDto({
		Id: overrides.Name as string | undefined,
		Type: 'Audio',
		AlbumId: 'album-arrival',
		Album: 'Arrival',
		AlbumArtist: 'ABBA',
		ParentIndexNumber: 1,
		IndexNumber: 1,
		...overrides,
	})

const tracks: BaseItemDto[] = [
	track({ Name: 'Dancing Queen', IndexNumber: 2 }),
	track({ Name: 'When I Kissed the Teacher', IndexNumber: 1 }),
	track({
		Name: 'Money for Nothing',
		AlbumId: 'album-bia',
		Album: 'Brothers in Arms',
		AlbumArtist: 'Dire Straits',
		ParentIndexNumber: 2,
	}),
	track({
		Name: 'So Far Away',
		AlbumId: 'album-bia',
		Album: 'Brothers in Arms',
		AlbumArtist: 'Dire Straits',
		ParentIndexNumber: 1,
	}),
	track({
		Name: 'Orphan',
		AlbumId: undefined,
		Album: undefined,
		AlbumArtist: undefined,
		ArtistItems: [{ Name: 'zed', Id: 'z' }],
	}),
]

describe('groupDownloadedAlbums', () => {
	it('groups by AlbumId, sorts albums by name and tracks by disc then index', () => {
		const albums = groupDownloadedAlbums(tracks)

		expect(albums.map((a) => a.name)).toEqual(['Arrival', 'Brothers in Arms', 'Unknown Album'])
		expect(albums[0]).toMatchObject({ id: 'album-arrival', subtitle: 'ABBA' })
		expect(albums[0].tracks.map((t) => t.Name)).toEqual([
			'When I Kissed the Teacher',
			'Dancing Queen',
		])
		expect(albums[1].tracks.map((t) => t.Name)).toEqual(['So Far Away', 'Money for Nothing'])
	})
})

describe('groupDownloadedArtists', () => {
	it('groups by album artist, falling back to the first artist item', () => {
		const artists = groupDownloadedArtists(tracks)

		expect(artists.map((a) => a.name)).toEqual(['ABBA', 'Dire Straits', 'zed'])
		expect(artists[0].tracks).toHaveLength(2)
	})
})

describe('groupDownloadedSongs', () => {
	it('returns one All songs group for small libraries, sorted by name', () => {
		const songs = groupDownloadedSongs(tracks)

		expect(songs).toHaveLength(1)
		expect(songs[0].name).toBe('All songs')
		expect(songs[0].tracks.map((t) => t.Name)).toEqual([
			'Dancing Queen',
			'Money for Nothing',
			'Orphan',
			'So Far Away',
			'When I Kissed the Teacher',
		])
	})

	it('returns letter groups for large libraries', () => {
		const large = Array.from({ length: AA_MAX_FLAT_ITEMS + 1 }, (_, i) =>
			track({ Name: `${i % 2 ? 'A' : 'B'} song ${i}` }),
		)
		const songs = groupDownloadedSongs(large)

		expect(songs.map((g) => g.name)).toEqual(['A', 'B'])
		expect(songs[0].id).toBe('A')
	})

	it('handles empty input', () => {
		expect(groupDownloadedSongs([])).toEqual([])
	})
})
