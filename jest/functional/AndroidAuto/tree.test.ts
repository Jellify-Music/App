import {
	AA_MAX_FLAT_ITEMS,
	AaIds,
	AaMessages,
	AaPlaylistRef,
	LIBRARY_LETTERS,
	bucketed,
	buildDownloadsFolder,
	buildHomeFolder,
	buildLibraryFolder,
	buildPlaylistsFolder,
	buildSignedOutLibrary,
} from '../../../src/services/android-auto/tree'

const ref = (n: number, title = `Item ${n}`): AaPlaylistRef => ({
	id: `id-${n}`,
	title,
	playlistId: `pl-${n}`,
})

const many = (count: number, title: (i: number) => string) =>
	Array.from({ length: count }, (_, i) => ref(i, title(i)))

describe('bucketed', () => {
	it('stays flat at the limit', () => {
		const items = bucketed(
			'x',
			many(AA_MAX_FLAT_ITEMS, (i) => `Item ${i}`),
		)

		expect(items).toHaveLength(AA_MAX_FLAT_ITEMS)
		expect(items.every((item) => item.mediaType === 'playlist')).toBe(true)
	})

	it('splits into letter folders above the limit, # last', () => {
		const refs = many(AA_MAX_FLAT_ITEMS + 1, (i) =>
			i % 3 === 0 ? `Beta ${i}` : i % 3 === 1 ? `Alpha ${i}` : `${i} numeric`,
		)
		const items = bucketed('x', refs)

		expect(items.map((item) => item.title)).toEqual(['A', 'B', '#'])
		expect(items.map((item) => item.id)).toEqual(['x-A', 'x-B', 'x-other'])
		expect(items[0].children).toHaveLength(
			refs.filter((r) => r.title.startsWith('Alpha')).length,
		)
		expect(items[0].children?.[0].mediaType).toBe('playlist')
	})
})

describe('buildHomeFolder', () => {
	it('shows a loading row while remote data is pending', () => {
		const home = buildHomeFolder({ loading: true, playItAgain: null, onRepeat: null })

		expect(home.id).toBe(AaIds.Home)
		expect(home.children?.map((c) => c.title)).toEqual([AaMessages.Loading])
	})

	it('lists both playlists when present', () => {
		const home = buildHomeFolder({
			playItAgain: ref(1, 'Play it again'),
			onRepeat: ref(2, 'On Repeat'),
		})

		expect(home.children?.map((c) => c.title)).toEqual(['Play it again', 'On Repeat'])
		expect(home.children?.[0].playlistId).toBe('pl-1')
	})

	it('explains a server failure instead of showing an empty list', () => {
		const home = buildHomeFolder({ error: true, playItAgain: null, onRepeat: null })

		expect(home.children?.map((c) => c.title)).toEqual([AaMessages.ServerUnreachable])
	})

	it('distinguishes empty from error', () => {
		const home = buildHomeFolder({ playItAgain: null, onRepeat: null })

		expect(home.children?.map((c) => c.title)).toEqual([AaMessages.NoRecents])
	})
})

describe('buildPlaylistsFolder', () => {
	it('shows No playlists found when the server returned none', () => {
		expect(buildPlaylistsFolder({ playlists: [] }).children?.map((c) => c.title)).toEqual([
			AaMessages.NoPlaylists,
		])
	})

	it('shows the error row on failure', () => {
		expect(
			buildPlaylistsFolder({ error: true, playlists: [] }).children?.map((c) => c.title),
		).toEqual([AaMessages.ServerUnreachable])
	})

	it('lists playlists', () => {
		const folder = buildPlaylistsFolder({ playlists: [ref(1, 'Road trip')] })

		expect(folder.id).toBe(AaIds.Playlists)
		expect(folder.children?.[0]).toMatchObject({ title: 'Road trip', mediaType: 'playlist' })
	})

	it('splits many playlists into letter folders', () => {
		const folder = buildPlaylistsFolder({
			playlists: many(AA_MAX_FLAT_ITEMS + 1, (i) => (i % 2 ? `Alpha ${i}` : `Beta ${i}`)),
		})

		expect(folder.children?.map((c) => c.id)).toEqual([
			`${AaIds.Playlists}-A`,
			`${AaIds.Playlists}-B`,
		])
		expect(folder.children?.[0].children?.[0].mediaType).toBe('playlist')
	})
})

describe('buildDownloadsFolder', () => {
	it('shows No downloaded music when nothing is downloaded', () => {
		const folder = buildDownloadsFolder({ artists: [], albums: [], songs: [] })

		expect(folder.children?.map((c) => c.title)).toEqual([AaMessages.NoDownloads])
	})

	it('exposes Artists, Albums and a single All songs playlist', () => {
		const folder = buildDownloadsFolder({
			artists: [ref(1, 'ABBA')],
			albums: [ref(2, 'Arrival')],
			songs: [ref(3, 'All songs')],
		})

		expect(folder.children?.map((c) => c.title)).toEqual(['Artists', 'Albums', 'All songs'])
		expect(folder.children?.[2].mediaType).toBe('playlist')
	})

	it('nests song letter playlists under a Songs folder', () => {
		const folder = buildDownloadsFolder({
			artists: [],
			albums: [],
			songs: [ref(1, 'A'), ref(2, 'B')],
		})

		expect(folder.children?.[2]).toMatchObject({ id: AaIds.DownloadedSongs, title: 'Songs' })
		expect(folder.children?.[2].children).toHaveLength(2)
	})
})

describe('buildLibraryFolder', () => {
	it('has Artists and Albums folders, each with 27 lazy letter folders', () => {
		const library = buildLibraryFolder()

		expect(library.id).toBe(AaIds.Library)
		expect(library.children?.map((c) => c.id)).toEqual([
			AaIds.LibraryArtists,
			AaIds.LibraryAlbums,
		])

		for (const section of library.children ?? []) {
			expect(section.children).toHaveLength(27)
			expect(section.children?.map((c) => c.title)).toEqual(LIBRARY_LETTERS)
			expect(section.children?.map((c) => c.id)).toEqual(
				LIBRARY_LETTERS.map((letter) => `${section.id}:${letter}`),
			)
			expect(section.children?.every((c) => c.children?.length === 0)).toBe(true)
		}
	})
})

describe('buildSignedOutLibrary', () => {
	it('tells the user to sign in on the phone', () => {
		expect(buildSignedOutLibrary().rootItems.map((c) => c.title)).toEqual([AaMessages.SignIn])
	})
})
