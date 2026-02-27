import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import Icon from './icon'
import Animated, { Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import { useIsDownloaded } from '../../../hooks/downloads'
import { useDownloadProgress } from 'react-native-nitro-player'
import CircularProgressIndicator from './circular-progress-indicator'

function DownloadedIcon({ item }: { item: BaseItemDto }) {
	const isDownloaded = useIsDownloaded([item.Id])

	const { overallProgress } = useDownloadProgress({
		trackIds: [item.Id!],
		activeOnly: true,
	})

	return isDownloaded ? (
		<Animated.View
			entering={FadeIn.easing(Easing.in(Easing.ease))}
			exiting={FadeOut.easing(Easing.out(Easing.ease))}
		>
			<Icon small name='download-circle' color={'$success'} flex={1} />
		</Animated.View>
	) : (
		<Animated.View
			entering={FadeIn.easing(Easing.in(Easing.ease))}
			exiting={FadeOut.easing(Easing.out(Easing.ease))}
		>
			<CircularProgressIndicator progress={overallProgress} size={24} strokeWidth={4} />
		</Animated.View>
	)
}

export default DownloadedIcon
