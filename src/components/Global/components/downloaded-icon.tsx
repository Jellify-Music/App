import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models'
import Icon from './icon'
import Animated, { Easing, FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated'
import useIsDownloaded from '../../../hooks/downloads'

function DownloadedIcon({ item }: { item: BaseItemDto }) {
	const isDownloaded = useIsDownloaded([item.Id])

	return isDownloaded ? (
		<Animated.View
			entering={FadeIn.easing(Easing.in(Easing.ease))}
			exiting={FadeOut.easing(Easing.out(Easing.ease))}
			layout={LinearTransition.springify()}
		>
			<Icon small name='download-circle' color={'$success'} flex={1} />
		</Animated.View>
	) : (
		<></>
	)
}

export default DownloadedIcon
