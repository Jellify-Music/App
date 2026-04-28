import MediaInfoQueryKey from './keys'
import { fetchMediaInfo } from './utils'
import { getApi } from '../../../stores'
import {
	useDownloadingDeviceProfileStore,
	useStreamingDeviceProfileStore,
} from '../../../stores/device-profile'
import { SourceType } from '../../../types/JellifyTrack'
import { ONE_DAY, queryClient } from '../../../constants/query-client'
import { PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models/playback-info-response'
import { EnsureQueryDataOptions } from '@tanstack/react-query'

export const MediaInfoQuery = (itemId: string | null | undefined, source: SourceType) => {
	const api = getApi()

	const streamingProfile = useStreamingDeviceProfileStore.getState().deviceProfile
	const downloadingProfile = useDownloadingDeviceProfileStore.getState().deviceProfile

	return {
		queryKey: MediaInfoQueryKey({
			api,
			deviceProfile: source === 'stream' ? streamingProfile : downloadingProfile,
			itemId,
		}),
		queryFn: () =>
			fetchMediaInfo(source === 'stream' ? streamingProfile : downloadingProfile, itemId),
		enabled: Boolean(
			api && (source === 'stream' ? streamingProfile : downloadingProfile) && itemId,
		),
		staleTime: ONE_DAY,
	} as EnsureQueryDataOptions<PlaybackInfoResponse>
}

export default async function ensureMediaInfoQuery(
	itemId: string | null | undefined,
	source: SourceType,
) {
	return await queryClient.ensureQueryData<PlaybackInfoResponse>(MediaInfoQuery(itemId, source))
}
