import { queryClient } from '../../constants/query-client'
import { DownloadedTrack } from 'react-native-nitro-player'
import ALL_DOWNLOADS_QUERY from './queries'

export const ensureDownloadedTracks = async () =>
	await queryClient.ensureQueryData<DownloadedTrack[]>(ALL_DOWNLOADS_QUERY)
