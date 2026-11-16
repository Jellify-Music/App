import MediaInfoQueryKey from './keys'
import { fetchMediaInfo } from './utils'
import { getApi } from '../../../stores/auth/utils'
import {
	useCastDeviceProfileStore,
	useDownloadingDeviceProfileStore,
	useStreamingDeviceProfileStore,
} from '../../../stores/profile'
import { SourceType } from '../../../types/JellifyTrack'
import { queryClient } from '../../client'
import { PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models/playback-info-response'
import { QueryExecuteOptions } from '@tanstack/react-query'
import { QueryAges } from '../../../constants/durations'

/**
 * Where the stream plays: on this device, as a download, or on a Cast receiver
 */
export type MediaInfoSource = SourceType | 'cast'

const deviceProfileFor = (source: MediaInfoSource) => {
	switch (source) {
		case 'download':
			return useDownloadingDeviceProfileStore.getState().deviceProfile
		case 'cast':
			return useCastDeviceProfileStore.getState().deviceProfile
		default:
			return useStreamingDeviceProfileStore.getState().deviceProfile
	}
}

export const MediaInfoQuery = (
	itemId: string | null | undefined,
	source: MediaInfoSource,
	signal?: AbortSignal,
) => {
	const api = getApi()

	const profile = deviceProfileFor(source)

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
		staleTime: QueryAges.OneMinute * 5,
		gcTime: QueryAges.OneMinute * 5,
	} as QueryExecuteOptions<PlaybackInfoResponse>
}

export default async function queryForMediaInfo(
	itemId: string | null | undefined,
	source: MediaInfoSource,
	signal?: AbortSignal,
) {
	return await queryClient.query<PlaybackInfoResponse>(MediaInfoQuery(itemId, source, signal))
}
