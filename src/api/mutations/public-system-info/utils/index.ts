import { Jellyfin } from '@jellyfin/sdk/lib/jellyfin'
import { JellyfinInfo } from '../../../info'
import { PublicSystemInfo } from '@jellyfin/sdk/lib/generated-client/models'

/**
 * Attempts to connect to a Jellyfin server.
 *
 * Address normalization (protocol, default ports) and candidate ranking is handled by the
 * Jellyfin SDK. Candidates are ranked with HTTPS first, so HTTP is only used as a fallback.
 *
 * @param serverAddress The server address to connect to.
 * @returns The public system info response and the normalized URL of the responding server.
 */
export async function connectToServer(serverAddress: string): Promise<{
	publicSystemInfoResponse: PublicSystemInfo
	resolvedUrl: string
}> {
	if (!serverAddress) throw new Error('Server address was empty')

	const jellyfin = new Jellyfin(JellyfinInfo)

	const candidates = await jellyfin.discovery.getRecommendedServerCandidates(serverAddress)
	const best = jellyfin.discovery.findBestServer(candidates)

	if (!best?.systemInfo?.Version) throw new Error('Unable to connect to Jellyfin')

	return {
		publicSystemInfoResponse: best.systemInfo,
		resolvedUrl: best.address,
	}
}
