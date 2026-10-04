import MediaInfoQueryKey from './keys'
import { fetchMediaInfo } from './utils'
import { getApi } from '../../../stores/auth/utils'
import {
	useDownloadingDeviceProfileStore,
	useStreamingDeviceProfileStore,
} from '../../../stores/device-profile'
import { SourceType } from '../../../types/JellifyTrack'
import { ONE_DAY, queryClient } from '../../../constants/query-client'
import { PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models/playback-info-response'
import { EnsureQueryDataOptions } from '@tanstack/react-query'

export const MediaInfoQuery = (
	itemId: string | null | undefined,
	source: SourceType,
	signal?: AbortSignal,
) => {
	const api = getApi()

	const streamingProfile = useStreamingDeviceProfileStore.getState().deviceProfile
	const downloadingProfile = useDownloadingDeviceProfileStore.getState().deviceProfile
	const profile = source === 'stream' ? streamingProfile : downloadingProfile

	return {
		queryKey: MediaInfoQueryKey({
			api,
			deviceProfile: profile,
			itemId,
		}),
		queryFn: () => fetchMediaInfo(profile, itemId, signal),
		enabled: Boolean(api && profile && itemId),
		staleTime: ONE_DAY,
	} as EnsureQueryDataOptions<PlaybackInfoResponse>
}

/**
 * Retrieves the {@link PlaybackInfoResponse} for an item.
 *
 * Streams always fetch fresh playback info: each response carries a `PlaySessionId`
 * (and for transcodes, a `TranscodingUrl`) that the server tears down once playback
 * of that session stops. Reusing a cached response hands the player a dead stream
 * URL, which leaves it buffering indefinitely.
 */
export default async function ensureMediaInfoQuery(
	itemId: string | null | undefined,
	source: SourceType,
	signal?: AbortSignal,
) {
	if (source === 'stream')
		return await queryClient.fetchQuery<PlaybackInfoResponse>({
			...MediaInfoQuery(itemId, source, signal),
			staleTime: 0,
		})

	return await queryClient.ensureQueryData<PlaybackInfoResponse>(
		MediaInfoQuery(itemId, source, signal),
	)
}
