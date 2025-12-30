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
