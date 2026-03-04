/**
 * The maximum number of seconds a track can be played
 * and still allow for a "skip to previous" action. If
 * the track has been playing for longer than this threshold,
 * the "skip to previous" action will instead restart the
 * current track.
 */
export const SKIP_TO_PREVIOUS_THRESHOLD = 3

/**
 * Number of tracks to prefetch ahead of current track
 */
export const TRACKPLAYER_LOOKAHEAD_COUNT = 5
