import { PlayerQueue, TrackPlayer } from 'react-native-nitro-player'
import { captureError, captureInfo, LoggingContext } from '../../utils/logging'
import { onCustomAction, setShuffleButton } from './bridge'
import { loadShuffle } from './data'
import { materializePlaylist } from './playlists'

/** Must match AndroidAutoBrowseModule.SHUFFLE_ACTION. */
const SHUFFLE_ACTION = 'com.jellify.SHUFFLE'

// ponytail: every "New shuffle" press makes a new native playlist and the previous one is left
// for the next publish to delete (it isn't current any more). Bounded by how often a driver
// presses; reuse one playlist only if the player ever allows swapping a playing list's tracks.
/** Native playlists holding a shuffle; playing one of them shows the button. */
const shufflePlaylists = new Set<string>()

/** Called by each publish with the Home Shuffle row's playlist (null when there is none). */
export function setShufflePlaylist(playlistId: string | null): void {
	if (playlistId) shufflePlaylists.add(playlistId)
}

/** Shows the button while a shuffle is what's playing, and only then. */
function refresh(): void {
	const current = PlayerQueue.getCurrentPlaylistId()
	setShuffleButton(!!current && shufflePlaylists.has(current))
}

/** Draws a fresh set of random songs and plays it from the first. */
async function reshuffle(): Promise<void> {
	const { data, error } = await loadShuffle()
	if (error || data.length === 0) return

	const playlistId = await materializePlaylist('Shuffle', data)
	if (!playlistId) return

	shufflePlaylists.add(playlistId)
	await PlayerQueue.loadPlaylist(playlistId, 0)
	await TrackPlayer.play()
	captureInfo(LoggingContext.AndroidAuto, `New shuffle: ${data.length} songs`)
}

/**
 * The "New shuffle" button beside the heart on the playback screen: while a shuffle plays, one
 * press replaces it with new random songs, without going back to Home.
 */
export function registerShuffleButton(): void {
	// A press while one is still drawing would only start a second, competing shuffle.
	let busy = false
	onCustomAction((action) => {
		if (action !== SHUFFLE_ACTION || busy) return
		busy = true
		reshuffle()
			.catch((error) => captureError(error, LoggingContext.AndroidAuto, 'New shuffle failed'))
			.finally(() => {
				busy = false
				refresh()
			})
	})
	TrackPlayer.onChangeTrack(() => refresh())
}

/** Hides the button and forgets the shuffles (sign-out: they belong to that session). */
export function hideShuffleButton(): void {
	shufflePlaylists.clear()
	setShuffleButton(false)
}
