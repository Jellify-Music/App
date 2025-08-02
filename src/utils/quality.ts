import { DownloadQuality, StreamingQuality } from '../providers/Settings'

/**
 * Quality utility functions for consistent quality handling across the app
 */

const QUALITY_ORDER: ReadonlyArray<string> = ['low', 'medium', 'high', 'original'] as const

/**
 * Determines if a downloaded file should be used based on quality comparison
 * @param downloadedQuality Quality of the downloaded file
 * @param streamingQuality Desired streaming quality
 * @returns True if downloaded file quality is sufficient
 */
export function shouldUseDownloadedFile(
	downloadedQuality: DownloadQuality | StreamingQuality | undefined,
	streamingQuality: DownloadQuality | StreamingQuality,
): boolean {
	// If no downloaded quality info, assume medium quality for backwards compatibility
	const downloadQual = downloadedQuality || 'medium'

	const downloadedIndex = QUALITY_ORDER.indexOf(downloadQual)
	const streamingIndex = QUALITY_ORDER.indexOf(streamingQuality)

	// Handle invalid quality strings gracefully
	if (downloadedIndex === -1 || streamingIndex === -1) {
		console.warn(
			`Invalid quality comparison: downloaded=${downloadQual}, streaming=${streamingQuality}`,
		)
		return true // Default to using downloaded file to avoid unnecessary streaming
	}

	// Use downloaded file if it's equal or higher quality than requested streaming quality
	return downloadedIndex >= streamingIndex
}

/**
 * Validates if a quality string is valid
 * @param quality Quality string to validate
 * @returns True if quality is valid
 */
export function isValidQuality(quality: string): quality is DownloadQuality {
	return QUALITY_ORDER.includes(quality)
}

/**
 * Gets a safe quality value with fallback
 * @param quality Quality to validate
 * @param fallback Fallback quality if invalid
 * @returns Valid quality string
 */
export function getSafeQuality(
	quality: string | undefined,
	fallback: DownloadQuality = 'medium',
): DownloadQuality {
	if (quality && isValidQuality(quality)) {
		return quality
	}
	return fallback
}
