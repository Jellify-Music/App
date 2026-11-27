import { Api } from '@jellyfin/sdk'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { fetchAlbumDiscs } from '../../item'
import { mapWithConcurrency } from '../../../../utils/concurrency'

/** How many albums to ask the server about at once */
const ALBUM_REQUESTS_AT_ONCE = 6

/**
 * Every track on the given albums, in the albums' order, each once. An artist's discography and the
 * albums they're featured on can overlap, and a track with no disc number is listed under every disc.
 */
export async function fetchAlbumsTracks(
	api: Api | undefined,
	albums: BaseItemDto[],
	signal?: AbortSignal,
): Promise<BaseItemDto[]> {
	const perAlbum = await mapWithConcurrency(albums, ALBUM_REQUESTS_AT_ONCE, async (album) =>
		(await fetchAlbumDiscs(api, album, signal)).flatMap((disc) => disc.data),
	)

	const seen = new Set<string>()

	return perAlbum.flat().filter((track) => {
		if (!track.Id || seen.has(track.Id)) return false

		seen.add(track.Id)
		return true
	})
}
