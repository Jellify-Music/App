import MediaInfoQueryKey from './keys'
import { fetchMediaInfo } from './utils'
import { getApi } from '../../../stores/auth/utils'
import {
	useDownloadingDeviceProfileStore,
	useStreamingDeviceProfileStore,
} from '../../../stores/profile'
import { SourceType } from '../../../types/JellifyTrack'
import { CAST_DEVICE_PROFILE } from '../../../utils/audio/device-profiles'
import { queryClient } from '../../client'
import { PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models/playback-info-response'
import { QueryExecuteOptions } from '@tanstack/react-query'
import { QueryAges } from '../../../constants/durations'

export const MediaInfoQuery = (
	itemId: string | null | undefined,
	source: SourceType,
	signal?: AbortSignal,
) => {
	const api = getApi()

	const profile = getDeviceProfileForSource(source)

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
	source: SourceType,
	signal?: AbortSignal,
) {
	return await queryClient.query<PlaybackInfoResponse>(MediaInfoQuery(itemId, source, signal))
}

function getDeviceProfileForSource(source: SourceType) {
	switch (source) {
		case 'stream':
			return useStreamingDeviceProfileStore.getState().deviceProfile
		case 'download':
			return useDownloadingDeviceProfileStore.getState().deviceProfile
		case 'cast':
			return CAST_DEVICE_PROFILE
	}
}
