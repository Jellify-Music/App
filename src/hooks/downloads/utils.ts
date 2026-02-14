import { queryClient } from '../../constants/query-client'
import ALL_DOWNLOADS_KEY from './keys'

export function refetchDownloadsAfterDelay() {
	setTimeout(() => {
		queryClient.refetchQueries({ queryKey: ALL_DOWNLOADS_KEY })
	}, 3000) // Refetch downloads after a delay to allow the new download to be registered
}
