import { Platform } from 'react-native'
import { Event } from 'react-native-track-player'

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

export const BUFFERS =
	Platform.OS === 'android'
		? {
				maxCacheSize: 50 * 1024, // 50MB cache
				maxBuffer: 30, // 30 seconds buffer
				playBuffer: 2.5, // 2.5 seconds play buffer
				backBuffer: 5, // 5 seconds back buffer
			}
		: {}

export const PLAYER_EVENTS: Event[] = [
	Event.PlaybackActiveTrackChanged,
	Event.PlaybackProgressUpdated,
	Event.PlaybackState,
]
