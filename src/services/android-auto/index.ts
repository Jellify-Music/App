import { Platform } from 'react-native'
import { BaseItemDto, BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models'
import { AndroidAutoMediaLibraryHelper, TrackPlayer } from 'react-native-nitro-player'
import useJellifyStore from '../../stores/auth'
import { getLibrary, getUser } from '../../stores/auth/utils'
import { useAutoStore } from '../../stores/auto'
import getTrackDto from '../../utils/mapping/track-extra-payload'
import { captureError, captureInfo, LoggingContext } from '../../utils/logging'
import {
	loadDownloads,
	loadFrequentlyPlayed,
	loadRecentlyAdded,
	loadRecentlyPlayed,
	loadUserPlaylists,
} from './data'
import {
	DownloadGroup,
	groupDownloadedAlbums,
	groupDownloadedArtists,
	groupDownloadedSongs,
} from './downloads'
import { deleteAllAaPlaylists, materializePlaylist } from './playlists'
import { clearLibraryCache, loadLibraryChildren } from './library'
import { artworkUri } from './artwork'
import { registerChildrenLoader, setArtworkServer } from './bridge'
import {
	AaIds,
	AaMediaItem,
	AaPlaylistRef,
	MAX_HOME_SECTION_ITEMS,
	albumFolder,
	buildDownloadsFolder,
	buildDownloadsUnavailableFolder,
	buildHomeFolder,
	buildPlaylistsFolder,
	buildRootLibrary,
	buildSignedOutLibrary,
} from './tree'

export { AA_PLAYLIST_NAME_PREFIX } from './tree'

/** Tracks written to native playlists by the publish in progress (publishes never overlap). */
let materializedTracks = 0

async function toRef(
	id: string,
	title: string,
	items: BaseItemDto[],
	subtitle?: string,
	/** Whose artwork the row shows; defaults to the first track. */
	artworkItem: BaseItemDto | undefined = items[0],
): Promise<AaPlaylistRef | null> {
	const playlistId = await materializePlaylist(title, items)
	if (!playlistId) return null
	materializedTracks += items.length

	return {
		id,
		title,
		playlistId,
		subtitle: subtitle ?? `${items.length} tracks`,
		iconUrl: artworkUri(artworkItem),
	}
}

async function groupsToRefs(idPrefix: string, groups: DownloadGroup[]): Promise<AaPlaylistRef[]> {
	const refs: AaPlaylistRef[] = []

	for (const group of groups) {
		const ref = await toRef(`${idPrefix}-${group.id}`, group.name, group.tracks, group.subtitle)
		if (ref) refs.push(ref)
	}

	return refs
}

// ponytail: every downloaded track is materialized three times (artist, album, songs playlists).
// Fine for a phone's worth of downloads; revisit if playlists.json writes get slow past ~10k downloads.
async function buildDownloads(): Promise<AaMediaItem> {
	const { data: downloads } = await loadDownloads()
	const tracks = downloads
		.map((download) => getTrackDto(download.originalTrack))
		.filter((track): track is BaseItemDto => !!track?.Id)

	captureInfo(LoggingContext.AndroidAuto, `Downloads: ${tracks.length} tracks`)

	const albums = groupDownloadedAlbums(tracks)

	return buildDownloadsFolder({
		artists: await groupsToRefs('aa-dl-artist', groupDownloadedArtists(tracks)),
		albums: await groupsToRefs('aa-dl-album', albums),
		songs: await groupsToRefs('aa-dl-songs', groupDownloadedSongs(tracks)),
		iconUrl: artworkUri(albums[0]?.tracks[0]),
	})
}

/** Each track's album once, in track order, as lazy album pages. */
function albumsOf(tracks: BaseItemDto[]): AaMediaItem[] {
	const seen = new Set<string>()
	const albums: AaMediaItem[] = []

	for (const track of tracks) {
		if (albums.length === MAX_HOME_SECTION_ITEMS) break
		if (!track.AlbumId || seen.has(track.AlbumId)) continue
		seen.add(track.AlbumId)
		albums.push(
			albumFolder(
				track.AlbumId,
				track.Album ?? 'Untitled Album',
				track.AlbumArtist ?? undefined,
				artworkUri(track),
			),
		)
	}

	return albums
}

async function buildHome(downloads: AaMediaItem): Promise<AaMediaItem> {
	const [recents, frequents, recentlyAdded] = await Promise.all([
		loadRecentlyPlayed(),
		loadFrequentlyPlayed(),
		loadRecentlyAdded(),
	])

	captureInfo(
		LoggingContext.AndroidAuto,
		`Home: ${recents.data.length} recent, ${frequents.data.length} frequent tracks, ` +
			`${recentlyAdded.data.length} recently added`,
	)

	return buildHomeFolder({
		error: recents.error && frequents.error && recentlyAdded.error,
		playItAgain: await toRef(AaIds.PlayItAgain, 'Play it again', recents.data),
		onRepeat: await toRef(AaIds.OnRepeat, 'On Repeat', frequents.data),
		recentlyPlayed: albumsOf(recents.data),
		recentlyAdded: recentlyAdded.data
			.filter((item) => item.Type === BaseItemKind.MusicAlbum)
			.map((album) =>
				albumFolder(
					album.Id ?? '',
					album.Name ?? 'Untitled Album',
					album.AlbumArtist ?? undefined,
					artworkUri(album),
				),
			),
		mostPlayed: albumsOf(frequents.data),
		downloads,
	})
}

async function buildPlaylists(): Promise<AaMediaItem> {
	const { data, error } = await loadUserPlaylists()
	const playlists: AaPlaylistRef[] = []

	for (const { playlist, tracks } of data) {
		const ref = await toRef(
			`aa-playlist-${playlist.Id}`,
			playlist.Name ?? 'Untitled Playlist',
			tracks,
			undefined,
			playlist,
		)
		if (ref) playlists.push(ref)
	}

	captureInfo(LoggingContext.AndroidAuto, `Playlists: ${playlists.length}`)

	return buildPlaylistsFolder({ error, playlists })
}

async function publish(): Promise<void> {
	if (!getUser() || !getLibrary()) {
		captureInfo(LoggingContext.AndroidAuto, 'No session — publishing sign-in prompt')
		// Persisted AA playlists carry the signed-out user's auth headers; drop them.
		await deleteAllAaPlaylists()
		AndroidAutoMediaLibraryHelper.set(buildSignedOutLibrary())
		return
	}

	await deleteAllAaPlaylists()
	clearLibraryCache()
	materializedTracks = 0

	// Phase 1: local content right away; remote sections say "Loading…". A throw here
	// must not stop the remote sections from loading.
	let downloads: AaMediaItem
	try {
		downloads = await buildDownloads()
	} catch (error) {
		captureError(error, LoggingContext.AndroidAuto, 'Failed to build Android Auto downloads')
		downloads = buildDownloadsUnavailableFolder()
	}
	AndroidAutoMediaLibraryHelper.set(
		buildRootLibrary(
			buildHomeFolder({ loading: true, playItAgain: null, onRepeat: null, downloads }),
			buildPlaylistsFolder({ loading: true, playlists: [] }),
		),
	)

	// Phase 2: remote sections (cache when fresh, network otherwise). A throw here (e.g. a
	// materializePlaylist rejection) must not leave the phase-1 tree stuck on "Loading…" —
	// fall back to an explicit error tree instead of letting the exception bubble.
	try {
		const [home, playlists] = await Promise.all([buildHome(downloads), buildPlaylists()])
		AndroidAutoMediaLibraryHelper.set(buildRootLibrary(home, playlists))
	} catch (error) {
		captureError(
			error,
			LoggingContext.AndroidAuto,
			'Failed to load remote Android Auto sections',
		)
		AndroidAutoMediaLibraryHelper.set(
			buildRootLibrary(
				buildHomeFolder({ error: true, playItAgain: null, onRepeat: null, downloads }),
				buildPlaylistsFolder({ error: true, playlists: [] }),
			),
		)
	}

	captureInfo(
		LoggingContext.AndroidAuto,
		`Media library published (${materializedTracks} tracks materialized)`,
	)
}

let isPublishing = false
let republishRequested = false

/**
 * (Re)builds and publishes the Android Auto browse tree. Safe to call at any time;
 * overlapping calls collapse into a single follow-up publish.
 */
export async function publishMediaLibrary(): Promise<void> {
	if (!AndroidAutoMediaLibraryHelper.isAvailable()) return

	if (isPublishing) {
		republishRequested = true
		return
	}

	isPublishing = true
	try {
		await publish()
	} catch (error) {
		captureError(error, LoggingContext.AndroidAuto, 'Failed to publish media library')
	} finally {
		isPublishing = false
		if (republishRequested) {
			republishRequested = false
			void publishMediaLibrary()
		}
	}
}

let isRegistered = false

export function registerAndroidAutoService(): () => void {
	if (Platform.OS !== 'android') return () => {}

	// Guard against re-registration on JS reload — the native side keeps every
	// listener we add, so each Fast Refresh would otherwise compound publishes.
	if (isRegistered) return () => {}
	isRegistered = true

	registerChildrenLoader(loadLibraryChildren)
	setArtworkServer(useJellifyStore.getState().server?.url)

	TrackPlayer.onAndroidAutoConnectionChange((connected: boolean) => {
		const wasConnected = useAutoStore.getState().isConnected
		useAutoStore.getState().setIsConnected(connected)
		captureInfo(LoggingContext.AndroidAuto, connected ? 'Connected' : 'Disconnected')
		// Native fires "connected" repeatedly (every browser client bind); only a new
		// connection needs a fresh tree.
		if (connected && !wasConnected) void publishMediaLibrary()
	})

	// Switching account or music library on the phone changes what the car should show.
	useJellifyStore.subscribe((state, previous) => {
		if (state.server?.url !== previous.server?.url) setArtworkServer(state.server?.url)

		const changed =
			state.user?.id !== previous.user?.id ||
			state.library?.musicLibraryId !== previous.library?.musicLibraryId
		if (changed && useAutoStore.getState().isConnected) void publishMediaLibrary()
	})

	if (TrackPlayer.isAndroidAutoConnected()) {
		useAutoStore.getState().setIsConnected(true)
		void publishMediaLibrary()
	} else {
		// Drop persisted Android Auto playlists from a previous session right away so the
		// native fallback list can't show duplicates before the first publish runs
		// (publishing does this itself).
		void deleteAllAaPlaylists()
	}

	return () => {
		// nitro player has no unregister for the connection callback; it lives for the app lifetime.
	}
}
