import React from 'react'
import { View } from 'tamagui'
import useDownloadingAlbumsStore from '../../stores/downloading-albums'
import CircularProgressIndicator from '../Global/components/DownloadIndicator/circular-progress-indicator'

/**
 * The circle a track shows while it downloads, for an album that is downloading, at the same size.
 * Nothing when it is not.
 */
export default function AlbumDownloadIndicator({
	albumId,
}: {
	albumId: string | null | undefined
}): React.JSX.Element | null {
	const progress = useDownloadingAlbumsStore((state) =>
		albumId ? state.progress[albumId] : undefined,
	)

	if (progress === undefined) return null

	// a margin, not a gap on the row: a row's gap would still leave a space where nothing is shown
	return (
		<View marginRight='$1'>
			<CircularProgressIndicator progress={progress} size={12} strokeWidth={4} />
		</View>
	)
}
