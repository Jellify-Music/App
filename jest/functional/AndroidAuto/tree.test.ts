import {
	AA_MAX_FLAT_ITEMS,
	AaIds,
	AaMediaItem,
	AaMessages,
	AaPlaylistRef,
	MAX_HOME_SECTION_ITEMS,
	albumFolder,
	albumFolderFromDto,
	bucketed,
	buildDownloadsFolder,
	buildDownloadsUnavailableFolder,
	buildHomeFolder,
	buildPlaylistsFolder,
	buildRootLibrary,
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
	const downloads = buildDownloadsFolder({ artists: [], albums: [], songs: [] })
	const albums = (prefix: string, count: number) =>
		Array.from({ length: count }, (_, i) => albumFolder(`${prefix}${i}`, `${prefix} ${i}`))
	const empty = { playItAgain: null, onRepeat: null, downloads }
	const rows = (home: AaMediaItem) =>
		(home.children as AaMediaItem[]).map((c) => [c.groupTitle, c.title])

	it('shows a loading row plus the Downloads tile while remote data is pending', () => {
		const home = buildHomeFolder({ ...empty, loading: true })

		expect(home.id).toBe(AaIds.Home)
		expect(rows(home)).toEqual([
			['Quick picks', AaMessages.Loading],
			['Downloads', 'Downloads'],
		])
	})

	it('lists every section in order under its group title, Downloads last', () => {
		const home = buildHomeFolder({
			playItAgain: ref(1, 'Play it again'),
			onRepeat: ref(2, 'On Repeat'),
			recentlyPlayed: albums('rp', 1),
			recentlyAdded: albums('ra', 1),
			mostPlayed: albums('mp', 1),
			downloads,
		})

		expect(rows(home)).toEqual([
			['Quick picks', 'Play it again'],
			['Quick picks', 'On Repeat'],
			['Recently played albums', 'rp 0'],
			['Recently added', 'ra 0'],
			['Most played albums', 'mp 0'],
			['Downloads', 'Downloads'],
		])
		expect(home.children?.[0].playlistId).toBe('pl-1')
		expect(home.children?.[5]).toMatchObject({ id: AaIds.Downloads, layoutType: 'grid' })
	})

	it('adds Favourites to Quick picks after On Repeat', () => {
		const home = buildHomeFolder({
			...empty,
			playItAgain: ref(1, 'Play it again'),
			onRepeat: ref(2, 'On Repeat'),
			favorites: ref(3, 'Favourites'),
		})

		expect(rows(home).slice(0, 3)).toEqual([
			['Quick picks', 'Play it again'],
			['Quick picks', 'On Repeat'],
			['Quick picks', 'Favourites'],
		])
	})

	it(`caps each album section at ${MAX_HOME_SECTION_ITEMS}`, () => {
		const home = buildHomeFolder({ ...empty, recentlyAdded: albums('ra', 20) })

		expect(home.children).toHaveLength(MAX_HOME_SECTION_ITEMS + 1)
	})

	it('explains a server failure instead of showing an empty list', () => {
		expect(rows(buildHomeFolder({ ...empty, error: true }))).toEqual([
			['Quick picks', AaMessages.ServerUnreachable],
			['Downloads', 'Downloads'],
		])
	})

	it('distinguishes empty from error', () => {
		expect(rows(buildHomeFolder(empty))[0]).toEqual(['Quick picks', AaMessages.NoRecents])
	})
})

describe('albumFolder', () => {
	it('opens the lazy album page', () => {
		expect(albumFolder('al1', 'Arrival', 'ABBA', 'art')).toEqual({
			id: 'aa-lib-album:al1',
			title: 'Arrival',
			subtitle: 'ABBA',
			iconUrl: 'art',
			isPlayable: false,
			mediaType: 'folder',
			children: [],
		})
	})
})

describe('albumFolderFromDto', () => {
	it('falls back to the track artists when there is no album artist', () => {
		expect(
			albumFolderFromDto({ Id: 'al2', Name: 'Blue', Artists: ['Joni Mitchell'] }),
		).toMatchObject({ id: 'aa-lib-album:al2', title: 'Blue', subtitle: 'Joni Mitchell' })
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

	it('lists playlists as full-width rows', () => {
		const folder = buildPlaylistsFolder({ playlists: [ref(1, 'Road trip')] })

		expect(folder.id).toBe(AaIds.Playlists)
		expect(folder.layoutType).toBe('list')
		expect(folder.children?.[0]).toMatchObject({ title: 'Road trip', mediaType: 'playlist' })
	})

	it('puts Favourites first, so the tab is never empty for someone with favourites', () => {
		const folder = buildPlaylistsFolder({
			playlists: [],
			favorites: ref(3, 'Favourites'),
		})

		expect(folder.children?.map((c) => c.title)).toEqual(['Favourites'])
	})

	it('tells the user where to create a playlist', () => {
		expect(AaMessages.NoPlaylists).toBe('No playlists yet. Create one on your phone')
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

	it('uses the given artwork for its Home tile', () => {
		const folder = buildDownloadsFolder({
			artists: [],
			albums: [],
			songs: [ref(3, 'All songs')],
			iconUrl: 'art:al1',
		})

		expect(folder).toMatchObject({ title: 'Downloads', iconUrl: 'art:al1' })
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

describe('buildRootLibrary', () => {
	it('has the tabs Home, Artists, Albums, Playlists and grids by default', () => {
		const home = buildHomeFolder({
			playItAgain: null,
			onRepeat: null,
			downloads: buildDownloadsFolder({ artists: [], albums: [], songs: [] }),
		})
		const library = buildRootLibrary(home, buildPlaylistsFolder({ playlists: [] }))

		expect(library.layoutType).toBe('grid')
		expect(library.rootItems.map((c) => [c.id, c.title])).toEqual([
			[AaIds.Home, 'Home'],
			[AaIds.LibraryArtists, 'Artists'],
			[AaIds.LibraryAlbums, 'Albums'],
			[AaIds.Playlists, 'Playlists'],
		])
	})

	it('makes Artists a lazy grid tab and Albums a lazy list tab', () => {
		const [, artists, albums] = buildRootLibrary(
			buildHomeFolder({
				playItAgain: null,
				onRepeat: null,
				downloads: buildDownloadsUnavailableFolder(),
			}),
			buildPlaylistsFolder({ playlists: [] }),
		).rootItems

		expect(artists).toMatchObject({ layoutType: 'grid', children: [] })
		expect(albums).toMatchObject({ layoutType: 'list', children: [] })
	})
})

describe('buildSignedOutLibrary', () => {
	it('tells the user to sign in on the phone', () => {
		expect(buildSignedOutLibrary().rootItems.map((c) => c.title)).toEqual([AaMessages.SignIn])
	})
})
