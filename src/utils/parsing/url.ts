export function parseBitrateFromTranscodingUrl(transcodingUrl: string): number {
	return parseInt(
		transcodingUrl
			.split('&')
			.find((part) => part.includes('AudioBitrate'))!
			.split('=')[1],
	)
}
