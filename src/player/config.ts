/**
 * Interval in milliseconds for progress updates from the track player
 * Lower value provides smoother scrubber movement but uses more resources
 * 250ms provides good balance of smoothness and performance for the scrubber
 */
export const UPDATE_INTERVAL: number = 250

/**
 * Interval in milliseconds for the miniplayer progress updates from the track player
 *
 * Lower value provides smoother progress movement, but because of the math involved to
 * determine playback progress, updates are only visible every full second.
 *
 * This is therefore set to 1000ms
 */
export const MINIPLAYER_UPDATE_INTERVAL: number = 1000

/**
 * Indicates the seconds the progress position must be
 * less than in order to do a skip to the previous
 */
export const SKIP_TO_PREVIOUS_THRESHOLD: number = 4

/**
 * Indicates the number of seconds the progress update
 * event will be emitted from the track player
 */
export const PROGRESS_UPDATE_EVENT_INTERVAL: number = 30
