import MediaInfoQueryKey from './keys'
import { fetchMediaInfo } from './utils'
import { getApi } from '../../../stores/auth/utils'
import {
	useDownloadingDeviceProfileStore,
	useStreamingDeviceProfileStore,
} from '../../../stores/device-profile'
import { SourceType } from '../../../types/JellifyTrack'
import { ONE_MINUTE, queryClient } from '../../../constants/query-client'
import { PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models/playback-info-response'
import { QueryExecuteOptions } from '@tanstack/react-query'

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
		/**
		 * Playback info carries a `PlaySessionId` (and for transcodes, a `TranscodingUrl`)
		 * that the server tears down once playback of that session stops, so it must not
		 * be reused for long or the player is handed a dead stream URL.
		 */
		staleTime: ONE_MINUTE * 5,
	} as QueryExecuteOptions<PlaybackInfoResponse>
}

export default async function queryForMediaInfo(
	itemId: string | null | undefined,
	source: SourceType,
	signal?: AbortSignal,
) {
	return await queryClient.query<PlaybackInfoResponse>(MediaInfoQuery(itemId, source, signal))
}
