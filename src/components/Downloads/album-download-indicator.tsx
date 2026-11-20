import React from 'react'
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client'
import { View } from 'tamagui'
import useDownloadingAlbumsStore from '../../stores/downloading-albums'
import { isAlbumDownloaded } from '../../utils/downloaded-albums'
import { DownloadStatus } from '../Global/components/DownloadIndicator'

/**
 * How a track shows its download, for an album: the circle while it downloads, and the tick once
 * every track of it is downloaded. The same display, at the same size.
 */
export default function AlbumDownloadIndicator({
	album,
}: {
	album: BaseItemDto
}): React.JSX.Element | null {
	const albumId = album.Id

	const progress = useDownloadingAlbumsStore((state) =>
		albumId ? state.progress[albumId] : undefined,
	)
	const downloadedCount = useDownloadingAlbumsStore((state) =>
		albumId ? state.downloaded[albumId] : undefined,
	)

	// queued is not downloading yet: with no progress there is no circle to draw, and no room for one
	const isDownloading = progress !== undefined && progress > 0
	const isDownloaded = !isDownloading && isAlbumDownloaded(downloadedCount, album.ChildCount)

	if (!isDownloading && !isDownloaded) return null

	// a margin, not a gap on the row: a row's gap would still leave a space where nothing is shown
	return (
		<View marginRight='$1'>
			<DownloadStatus
				isDownloaded={isDownloaded}
				isDownloading={isDownloading}
				progress={progress ?? 0}
				size='4'
			/>
		</View>
	)
}
