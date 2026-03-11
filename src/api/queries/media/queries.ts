import MediaInfoQueryKey from './keys'
import { fetchMediaInfo } from './utils'
import { getApi } from '../../../stores'
import {
	useDownloadingDeviceProfileStore,
	useStreamingDeviceProfileStore,
} from '../../../stores/device-profile'
import { SourceType } from '../../../types/JellifyTrack'
import { queryClient } from '../../../constants/query-client'
import { PlaybackInfoResponse } from '@jellyfin/sdk/lib/generated-client/models/playback-info-response'

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
		staleTime: Infinity, // Only refetch when the user's device profile changes
		gcTime: Infinity,
	}
}

export default async function ensureMediaInfoQuery(
	itemId: string | null | undefined,
	source: SourceType,
) {
	return await queryClient.ensureQueryData<PlaybackInfoResponse>(MediaInfoQuery(itemId, source))
}
