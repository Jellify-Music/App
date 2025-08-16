import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import { useNetworkContext } from '../../../providers/Network'
import { Spacer } from 'tamagui'
import Icon from './icon'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { memo, useMemo } from 'react'

function DownloadedIcon({ item }: { item: BaseItemDto }) {
	const { downloadedTracks } = useNetworkContext()

	const isDownloaded = useMemo(
		() => downloadedTracks?.find((downloadedTrack) => downloadedTrack.item.Id === item.Id),
		[downloadedTracks, item.Id],
	)

	return isDownloaded ? (
		<Animated.View entering={FadeIn} exiting={FadeOut}>
			<Icon small name='download-circle' color={'$success'} flex={1} />
		</Animated.View>
	) : (
		<Spacer flex={0.5} />
	)
}

// Memoize the component to prevent unnecessary re-renders
export default memo(DownloadedIcon, (prevProps, nextProps) => {
	// Only re-render if the item ID changes
	return prevProps.item.Id === nextProps.item.Id
})
