/**
 * A prefix used for the player query keys
 *
 * This is used as to avoid collisions with other keys
 */
const QUERY_KEY_PREFEX = 'PLAYER'

enum PlayerQueryKeys {
	PlayQueue = QUERY_KEY_PREFEX + 'PLAY_QUEUE',
	NowPlaying = QUERY_KEY_PREFEX + 'NOW_PLAYING',
	ActiveIndex = QUERY_KEY_PREFEX + 'ACTIVE_INDEX',
	PlaybackState = QUERY_KEY_PREFEX + 'PLAYBACK_STATE',
	PlayQueueRef = QUERY_KEY_PREFEX + 'PlayQueueRef',
	UnshuffledQueue = QUERY_KEY_PREFEX + 'UNSHUFFLED_QUEUE',
	RepeatMode = QUERY_KEY_PREFEX + 'REPEAT_MODE',
	Shuffled = QUERY_KEY_PREFEX + 'SHUFFLED',
}

export default PlayerQueryKeys
