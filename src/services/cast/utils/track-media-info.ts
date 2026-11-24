import { Cast, TrackItem } from 'react-native-nitro-player'
import resolveTrackUrls from '../../../utils/fetching/track-media-info'
import { getApi } from '../../../stores/auth/utils'
import { captureError, LoggingContext } from '../../../utils/logging'

/**
 * Resolves URLs the Cast receiver can play, using the Cast device profile, and hands
 * them to the receiver. The phone's own track URLs and queue are left untouched.
 */
export async function updateCastTrackMediaInfo(tracks: TrackItem[]): Promise<void> {
	try {
		const resolvedTracks = await resolveTrackUrls(tracks, 'cast')

		// Tracks that failed to resolve keep their phone URL, which isn't one for the receiver.
		// Leaving them out makes the player ask for them again.
		const resolvedIds = new Set(
			resolvedTracks
				.filter((track, index) => track !== tracks[index])
				.map((track) => track.id),
		)

		const urls = Object.fromEntries(
			resolvedTracks
				.filter((track) => resolvedIds.has(track.id) && track.url)
				.map((track) => [track.id, withApiKey(track.url)]),
		)

		await Cast.setCastUrls(urls)
	} catch (error) {
		captureError(error, LoggingContext.Cast, 'Failed to resolve Cast URLs')
	}
}

/**
 * The receiver can't send our authorization header, so the token has to ride in the URL.
 * Transcoding URLs from the server already carry one.
 */
function withApiKey(url: string): string {
	const accessToken = getApi()?.accessToken

	if (!accessToken || /[?&](api_key|ApiKey)=/.test(url)) return url

	return `${url}${url.includes('?') ? '&' : '?'}api_key=${encodeURIComponent(accessToken)}`
}
