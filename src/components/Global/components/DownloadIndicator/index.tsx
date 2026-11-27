import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { useRef } from 'react'
import Icon from '../icon'
import { useIsDownloaded } from '../../../../hooks/downloads'
import { useDownloadProgress } from 'react-native-nitro-player'
import CircularProgressIndicator from './circular-progress-indicator'
import { FontSizeTokens } from 'tamagui'

interface DownloadIndicatorProps {
	item: BaseItemDto
	size: FontSizeTokens
}

export default function DownloadIndicator({ item, size }: DownloadIndicatorProps) {
	const itemId = item.Id
	const isDownloaded = useIsDownloaded(itemId)
	const trackIdsRef = useRef<string[]>([])

	if (itemId) {
		if (trackIdsRef.current.length !== 1 || trackIdsRef.current[0] !== itemId) {
			trackIdsRef.current = [itemId]
		}
	} else if (trackIdsRef.current.length > 0) {
		trackIdsRef.current = []
	}

	const { overallProgress, isDownloading } = useDownloadProgress({
		trackIds: trackIdsRef.current,
		activeOnly: true,
	})

	return (
		<DownloadStatus
			isDownloaded={isDownloaded}
			isDownloading={isDownloading}
			progress={overallProgress}
			size={size}
		/>
	)
}

/**
 * How a download is shown: the tick once it is downloaded, the circle while it downloads, nothing
 * otherwise. Tracks and albums both use it, so they look the same.
 */
export function DownloadStatus({
	isDownloaded,
	isDownloading,
	progress,
	size,
}: {
	isDownloaded: boolean
	isDownloading: boolean
	progress: number
	size: FontSizeTokens
}) {
	if (!isDownloaded && !isDownloading) return null

	return isDownloaded ? (
		<Icon size={size} name='download-circle' color={'success'} />
	) : (
		<CircularProgressIndicator progress={progress} size={12} strokeWidth={4} />
	)
}
