import { DownloadManager } from 'react-native-nitro-player'
import ALL_DOWNLOADS_KEY from './keys'

const ALL_DOWNLOADS_QUERY = {
	queryKey: ALL_DOWNLOADS_KEY,
	queryFn: () => DownloadManager.getAllDownloadedTracks(),
}

export default ALL_DOWNLOADS_QUERY
