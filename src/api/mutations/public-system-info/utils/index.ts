import { ServerAddressNotAvailableError } from '../../../../types/errors'
import { JellyfinInfo } from '../../../info'
import type { ConnectToServerResult } from '../types'

/**
 * Attempts to connect to a Jellyfin server.
 *
 * Address normalization (protocol, default ports) and candidate ranking is handled by the
 * Jellyfin SDK. Candidates are ranked with HTTPS first, so HTTP is only used as a fallback.
 *
 * @param serverAddress The server address to connect to.
 * @returns The public system info response and the normalized URL of the responding server.
 */
export async function connectToServer(serverAddress: string): Promise<ConnectToServerResult> {
	if (!serverAddress) throw new ServerAddressNotAvailableError()

	const candidates = await JellyfinInfo.discovery.getRecommendedServerCandidates(serverAddress)
	const best = JellyfinInfo.discovery.findBestServer(candidates)

	if (!best?.systemInfo?.Version) throw new Error('Unable to connect to Jellyfin')

	return {
		publicSystemInfoResponse: best.systemInfo,
		resolvedUrl: best.address,
	}
}
