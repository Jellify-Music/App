/**
 * Configuration for gapless playback in Jellify
 */

/**
 * Number of tracks to prefetch ahead of current track
 */
export const PREFETCH_TRACK_COUNT = 3

/**
 * Time in seconds before track end to start prefetching next tracks
 * Earlier prefetching ensures smooth transitions
 */
export const PREFETCH_THRESHOLD_SECONDS = 45

/**
 * Time in seconds before track end to add next track to TrackPlayer queue
 * This ensures RNTP has the track ready for gapless transition
 */
export const QUEUE_PREPARATION_THRESHOLD_SECONDS = 30

/**
 * Maximum number of tracks to keep in TrackPlayer queue ahead of current track
 */
export const MAX_QUEUE_LOOKAHEAD = 5

/**
 * Minimum buffer time in seconds for smooth playback
 */
export const MIN_BUFFER_SECONDS = 15

/**
 * Time threshold for considering a track "almost finished"
 * Used for scrobbling and cleanup logic
 */
export const TRACK_FINISH_THRESHOLD_SECONDS = 3

/**
 * Crossfade configuration
 */

/**
 * Default crossfade duration in seconds
 */
export const DEFAULT_CROSSFADE_DURATION = 3

/**
 * Minimum crossfade duration in seconds
 */
export const MIN_CROSSFADE_DURATION = 0

/**
 * Maximum crossfade duration in seconds
 */
export const MAX_CROSSFADE_DURATION = 12

/**
 * Default fade curve type for crossfading
 * Options: 'linear', 'logarithmic', 'exponential'
 */
export const DEFAULT_FADE_CURVE = 'logarithmic' as const

/**
 * Crossfade update interval in milliseconds
 * How often to update volume during crossfade
 */
export const CROSSFADE_UPDATE_INTERVAL = 50

/**
 * Default settings for automatic crossfading
 */
export const DEFAULT_AUTO_CROSSFADE = true
