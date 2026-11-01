import type { AudioBitrate } from '../../types/audio/quality'
import { HIGH_BITRATE_THRESHOLD } from '../../configs/categorizing/audio'
import { isAndroidTranscode } from './transcoding'

/**
 * Parses the bitrate and container of an audio file or stream
 * and returns a sexy, human comprehensible name to display in
 * the quality badge.
 *
 * @param bitrate The bitrate of the audio stream or file
 * @param container The container of the audio stream or file
 * @returns
 */
export function formatContainerName(bitrate: AudioBitrate, container: string): string {
	let formattedContainer = container.toUpperCase()

	// Set name for m4as
	if (formattedContainer.includes('MOV')) {
		if (isHighBitrate(bitrate)) formattedContainer = 'ALAC'
		else formattedContainer = 'AAC'
	}

	// Set name for Android transcodes
	else if (isAndroidTranscode(container)) {
		formattedContainer = 'AAC'
	}

	// Set name for oggs
	else if (formattedContainer.includes('OGG') || formattedContainer.includes('OPUS')) {
		formattedContainer = 'OPUS'
	}

	return formattedContainer
}

function isHighBitrate(bitrate: AudioBitrate): boolean {
	return bitrate > HIGH_BITRATE_THRESHOLD
}
