import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import {
	buildPlaylistArtistIndex,
	mergePlaylists,
	playlistVersion,
	summaryVersion,
} from '../../src/utils/artist-playlists'

const track = (overrides: Partial<BaseItemDto>): BaseItemDto => ({ Id: 't', ...overrides })

describe('buildPlaylistArtistIndex', () => {
	it('collects track artists and album artists, without duplicates', () => {
		const index = buildPlaylistArtistIndex([
			track({
				ArtistItems: [{ Id: 'a' }, { Id: 'b' }],
				AlbumArtists: [{ Id: 'a' }],
			}),
			track({ ArtistItems: [{ Id: 'b' }], AlbumArtists: [{ Id: 'c' }] }),
			track({}),
		])

		expect(index.artistIds.sort()).toEqual(['a', 'b', 'c'])
	})

	it('is empty for a playlist without tracks', () => {
		expect(buildPlaylistArtistIndex([])).toEqual({ artistIds: [] })
	})

	it('ignores credits without an ID', () => {
		const index = buildPlaylistArtistIndex([track({ ArtistItems: [{ Name: 'No ID' }] })])

		expect(index.artistIds).toEqual([])
	})
})

describe('playlistVersion', () => {
	it('changes whenever the Etag does, even if the track count is the same', () => {
		// e.g. one track swapped for another, or the playlist reordered
		expect(playlistVersion({ Etag: 'e1', ChildCount: 3 })).not.toBe(
			playlistVersion({ Etag: 'e2', ChildCount: 3 }),
		)
	})

	it('is stable while the Etag is', () => {
		expect(playlistVersion({ Etag: 'e1', ChildCount: 3 })).toBe(
			playlistVersion({ Etag: 'e1', ChildCount: 4 }),
		)
	})

	it('falls back to the track count without an Etag', () => {
		expect(playlistVersion({ ChildCount: 2 })).not.toBe(playlistVersion({ ChildCount: 3 }))
		expect(playlistVersion({ ChildCount: 0 })).toBeDefined()
	})

	it('has nothing to offer without an Etag or a count', () => {
		expect(playlistVersion({})).toBeUndefined()
		expect(playlistVersion({ ChildCount: null })).toBeUndefined()
	})
})

describe('mergePlaylists', () => {
	it('merges both lists, drops duplicates and sorts by name', () => {
		const merged = mergePlaylists(
			[
				{ Id: 'b', Name: 'beta' },
				{ Id: 'a', Name: 'Alpha' },
			],
			[
				{ Id: 'a', Name: 'Alpha (copy)' },
				{ Id: 'c', Name: 'Charlie' },
			],
		)

		expect(merged.map((playlist) => playlist.Id)).toEqual(['a', 'b', 'c'])
		expect(merged[0].Name).toBe('Alpha')
	})

	it('compares names with one collator, not localeCompare, which is very slow in Hermes', () => {
		// regression: sorting 10,000 playlists with localeCompare(..., options) took about 4 seconds
		// on a device, as Hermes builds a new collator for every comparison. It can't be seen in
		// Jest, where it is fast, so this checks for the cause instead
		const localeCompare = jest.spyOn(String.prototype, 'localeCompare')

		const playlists = Array.from({ length: 500 }, (_, i) => ({ Id: `${i}`, Name: `Name ${i}` }))

		mergePlaylists(playlists, undefined)

		expect(localeCompare).not.toHaveBeenCalled()

		localeCompare.mockRestore()
	})

	it('sorts regardless of case and accents on letters', () => {
		const merged = mergePlaylists(
			[
				{ Id: '1', Name: 'zebra' },
				{ Id: '2', Name: 'Éclair' },
				{ Id: '3', Name: 'apple' },
				{ Id: '4', Name: 'Banana' },
			],
			undefined,
		)

		expect(merged.map(({ Name }) => Name)).toEqual(['apple', 'Banana', 'Éclair', 'zebra'])
	})

	it('copes with lists that have not loaded and keeps empty playlists', () => {
		expect(mergePlaylists(undefined, undefined)).toEqual([])
		expect(mergePlaylists(undefined, [{ Id: 'x', Name: 'Empty', ChildCount: 0 }])).toHaveLength(
			1,
		)
	})
})

describe('summaryVersion', () => {
	it('uses the playlist version, falling back to a fixed one when it has none', () => {
		expect(summaryVersion({ Etag: 'abc' })).toBe('etag:abc')
		expect(summaryVersion({})).toBe('unknown')
	})
})
