/**
 * Interval in milliseconds for progress updates from the track player
 * Lower value provides smoother scrubber movement but uses more resources
 * 250ms provides good balance of smoothness and performance for the scrubber
 */
export const UPDATE_INTERVAL: number = 250

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
