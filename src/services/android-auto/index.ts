import { Platform } from 'react-native'
import { BaseItemDto, ImageType } from '@jellyfin/sdk/lib/generated-client/models'
import {
	AndroidAutoMediaLibraryHelper,
	TrackPlayer,
	type MediaItem,
} from 'react-native-nitro-player'
import useJellifyStore from '../../stores/auth'
import { getLibrary, getUser } from '../../stores/auth/utils'
import { useAutoStore } from '../../stores/auto'
import { getItemImageUrl } from '../../api/queries/image/utils'
import getTrackDto from '../../utils/mapping/track-extra-payload'
import { captureError, captureInfo, LoggingContext } from '../../utils/logging'
import { loadDownloads, loadFrequentlyPlayed, loadRecentlyPlayed, loadUserPlaylists } from './data'
import {
	DownloadGroup,
	groupDownloadedAlbums,
	groupDownloadedArtists,
	groupDownloadedSongs,
} from './downloads'
import { deleteAllAaPlaylists, materializePlaylist } from './playlists'
import {
	AaIds,
	AaPlaylistRef,
	buildDownloadsFolder,
	buildHomeFolder,
	buildLibrary,
	buildPlaylistsFolder,
	buildSignedOutLibrary,
} from './tree'

export { AA_PLAYLIST_NAME_PREFIX } from './tree'

async function toRef(
	id: string,
	title: string,
	items: BaseItemDto[],
	subtitle?: string,
): Promise<AaPlaylistRef | null> {
	const playlistId = await materializePlaylist(title, items)
	if (!playlistId) return null

	return {
		id,
		title,
		playlistId,
		subtitle: subtitle ?? `${items.length} tracks`,
		iconUrl: items[0] ? getItemImageUrl(items[0], ImageType.Primary) : undefined,
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
async function buildDownloads(): Promise<MediaItem> {
	const { data: downloads } = await loadDownloads()
	const tracks = downloads
		.map((download) => getTrackDto(download.originalTrack))
		.filter((track): track is BaseItemDto => !!track?.Id)

	captureInfo(LoggingContext.AndroidAuto, `Downloads: ${tracks.length} tracks`)

	return buildDownloadsFolder({
		artists: await groupsToRefs('aa-dl-artist', groupDownloadedArtists(tracks)),
		albums: await groupsToRefs('aa-dl-album', groupDownloadedAlbums(tracks)),
		songs: await groupsToRefs('aa-dl-songs', groupDownloadedSongs(tracks)),
	})
}

async function buildHome(): Promise<MediaItem> {
	const [recents, frequents] = await Promise.all([loadRecentlyPlayed(), loadFrequentlyPlayed()])

	captureInfo(
		LoggingContext.AndroidAuto,
		`Home: ${recents.data.length} recent, ${frequents.data.length} frequent tracks`,
	)

	return buildHomeFolder({
		error: recents.error && frequents.error,
		playItAgain: await toRef(AaIds.PlayItAgain, 'Play it again', recents.data),
		onRepeat: await toRef(AaIds.OnRepeat, 'On Repeat', frequents.data),
	})
}

async function buildPlaylists(): Promise<MediaItem> {
	const { data, error } = await loadUserPlaylists()
	const playlists: AaPlaylistRef[] = []

	for (const { playlist, tracks } of data) {
		const ref = await toRef(
			`aa-playlist-${playlist.Id}`,
			playlist.Name ?? 'Untitled Playlist',
			tracks,
		)
		if (ref) playlists.push(ref)
	}

	captureInfo(LoggingContext.AndroidAuto, `Playlists: ${playlists.length}`)

	return buildPlaylistsFolder({ error, playlists })
}

async function publish(): Promise<void> {
	if (!getUser() || !getLibrary()) {
		captureInfo(LoggingContext.AndroidAuto, 'No session — publishing sign-in prompt')
		AndroidAutoMediaLibraryHelper.set(buildSignedOutLibrary())
		return
	}

	await deleteAllAaPlaylists()

	// Phase 1: local content right away; remote sections say "Loading…".
	const downloads = await buildDownloads()
	AndroidAutoMediaLibraryHelper.set(
		buildLibrary([
			buildHomeFolder({ loading: true, playItAgain: null, onRepeat: null }),
			buildPlaylistsFolder({ loading: true, playlists: [] }),
			downloads,
		]),
	)

	// Phase 2: remote sections (cache when fresh, network otherwise). A throw here (e.g. a
	// materializePlaylist rejection) must not leave the phase-1 tree stuck on "Loading…" —
	// fall back to an explicit error tree instead of letting the exception bubble.
	try {
		const [home, playlists] = await Promise.all([buildHome(), buildPlaylists()])
		AndroidAutoMediaLibraryHelper.set(buildLibrary([home, playlists, downloads]))
	} catch (error) {
		captureError(
			error,
			LoggingContext.AndroidAuto,
			'Failed to load remote Android Auto sections',
		)
		AndroidAutoMediaLibraryHelper.set(
			buildLibrary([
				buildHomeFolder({ error: true, playItAgain: null, onRepeat: null }),
				buildPlaylistsFolder({ error: true, playlists: [] }),
				downloads,
			]),
		)
	}

	captureInfo(LoggingContext.AndroidAuto, 'Media library published')
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

	TrackPlayer.onAndroidAutoConnectionChange((connected: boolean) => {
		useAutoStore.getState().setIsConnected(connected)
		captureInfo(LoggingContext.AndroidAuto, connected ? 'Connected' : 'Disconnected')
		if (connected) void publishMediaLibrary()
	})

	// Switching account or music library on the phone changes what the car should show.
	useJellifyStore.subscribe((state, previous) => {
		const changed =
			state.user?.id !== previous.user?.id ||
			state.library?.musicLibraryId !== previous.library?.musicLibraryId
		if (changed && useAutoStore.getState().isConnected) void publishMediaLibrary()
	})

	// Drop persisted Android Auto playlists from a previous session right away so the
	// native fallback list can't show duplicates before the first publish runs.
	void deleteAllAaPlaylists()

	if (TrackPlayer.isAndroidAutoConnected()) {
		useAutoStore.getState().setIsConnected(true)
		void publishMediaLibrary()
	}

	return () => {
		// nitro player has no unregister for the connection callback; it lives for the app lifetime.
	}
}
