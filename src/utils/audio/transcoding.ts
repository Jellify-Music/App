import type { AudioBitrate } from '../../types/audio/quality'
import { Platform } from 'react-native'

export function parseBitrateFromTranscodingUrl(transcodingUrl: string): AudioBitrate {
	return parseInt(
		transcodingUrl
			.split('&')
			.find((part) => part.includes('AudioBitrate'))!
			.split('=')[1],
	)
}

/**
 * Determines if the given container represents an AAC transcode in relation to the device {@link Platform} profile.
 * @param container
 * @returns True if the container represents an AAC transcode for Android, false otherwise
 * @see ./device-profiles.ts
 */
export function isAndroidTranscode(container: string): boolean {
	return Platform.OS === 'android' && container.toUpperCase() === 'TS'
}
