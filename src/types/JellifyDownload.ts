import JellifyTrack from './JellifyTrack'
import { DownloadQuality } from '../providers/Settings'

export type JellifyDownload = JellifyTrack & {
	savedAt: string
	isAutoDownloaded: boolean

	/**
	 * Path to the downloaded file
	 *
	 * This can be undefined as it wasn't being
	 * stored originally - so this preverves
	 * backwards compatibility
	 */
	path: string | undefined

	/**
	 * Quality at which the file was downloaded
	 *
	 * This can be undefined for backwards compatibility
	 * with existing downloads
	 */
	quality?: DownloadQuality
}

export type JellifyDownloadProgress = {
	[url: string]: {
		progress: number
		name: string
		songName: string
	}
}
export type JellifyDownloadProgressState = React.Dispatch<
	React.SetStateAction<JellifyDownloadProgress>
>
