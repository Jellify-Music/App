import React from 'react'
import { YStack } from 'tamagui'
import { useDownloadingAlbums } from '../../hooks/downloads/queue'
import DownloadingList from '../Downloads/downloading-list'
import useIsLightMode from '../../hooks/use-is-light-mode'

/**
 * Which of the artist's albums are downloading and how far along each is, under the buttons it is
 * opened from. It follows the pills' look, so it reads on any artwork in either theme.
 */
export default function ArtistDownloadsPanel({
	trackIds,
	top,
}: {
	trackIds: string[]
	/** How far down from the top of the screen the buttons end */
	top: number
}): React.JSX.Element | null {
	const isLightMode = useIsLightMode()

	const groups = useDownloadingAlbums(new Set(trackIds))

	if (groups.length === 0) return null

	return (
		<YStack
			position='absolute'
			top={top}
			left='$2'
			right='$2'
			maxHeight='60%'
			padding='$3'
			borderRadius={24}
			backgroundColor={isLightMode ? '$lightBackground' : '$darkBackground'}
			borderWidth={isLightMode ? 1 : 0}
			borderColor='$borderColor'
			testID='artist-downloads-panel'
		>
			<DownloadingList groups={groups} />
		</YStack>
	)
}
