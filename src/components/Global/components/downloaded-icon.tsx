import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import Icon from './icon'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { memo } from 'react'
import { useIsDownloaded } from '../../../api/queries/download'

function DownloadedIcon({ item }: { item: BaseItemDto }) {
	const isDownloaded = useIsDownloaded([item.Id])

	return isDownloaded ? (
		<Animated.View entering={FadeIn} exiting={FadeOut}>
			<Icon small name='download-circle' color={'$success'} flex={1} />
		</Animated.View>
	) : (
		<></>
	)
}

// Memoize the component to prevent unnecessary re-renders
export default memo(DownloadedIcon, (prevProps, nextProps) => {
	// Only re-render if the item ID changes
	return prevProps.item.Id === nextProps.item.Id
})
