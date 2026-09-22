import {
	AA_MAX_FLAT_ITEMS,
	AaIds,
	AaMessages,
	AaPlaylistRef,
	bucketed,
	buildDownloadsFolder,
	buildHomeFolder,
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

describe('buildSignedOutLibrary', () => {
	it('tells the user to sign in on the phone', () => {
		expect(buildSignedOutLibrary().rootItems.map((c) => c.title)).toEqual([AaMessages.SignIn])
	})
})
