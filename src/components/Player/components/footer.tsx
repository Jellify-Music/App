import { Spacer, XStack } from 'tamagui'

import Icon from '../../Global/components/icon'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import { PlayerParamList } from '../../../screens/Player/types'
import { useIsCasting } from '../../../stores/player/engine'
import useRawLyrics from '../../../api/queries/lyrics'
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated'
import { ICON_PRESS_STYLES } from '../../../configs/style.config'

export default function Footer(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()
	const isCasting = useIsCasting()

	const { data: lyrics } = useRawLyrics()

	const castIconName = isCasting ? 'cast-connected' : 'cast'

	const castIconColor = isCasting ? '$primary' : '$color'

	const onCastIconPress = () => {
		navigation.navigate('CastDialog')
	}

	return (
		<XStack justifyContent='center' alignItems='center' gap={'$3'}>
			<Icon
				small
				name={castIconName}
				onPress={onCastIconPress}
				color={castIconColor}
				{...ICON_PRESS_STYLES}
			/>

			{lyrics && (
				<Animated.View
					entering={FadeIn.easing(Easing.in(Easing.ease))}
					exiting={FadeOut.easing(Easing.out(Easing.ease))}
				>
					<Icon
						small
						name='message-text-outline'
						onPress={() => navigation.navigate('LyricsScreen', { lyrics: lyrics })}
						{...ICON_PRESS_STYLES}
					/>
				</Animated.View>
			)}

			<Spacer flex={1} />

			<XStack alignItems='center' justifyContent='flex-end' flex={1}>
				<Icon
					small
					testID='queue-button-test-id'
					name='playlist-music'
					onPress={() => {
						navigation.navigate('QueueScreen')
					}}
					{...ICON_PRESS_STYLES}
				/>
			</XStack>
		</XStack>
	)
}
