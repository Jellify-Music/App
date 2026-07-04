import { Spacer, useTheme, XStack, YStack } from 'tamagui'

import Icon from '../../Global/components/icon'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import { PlayerParamList } from '../../../screens/Player/types'
import { useIsCasting } from '../../../stores/player/engine'
import useRawLyrics from '../../../api/queries/lyrics'
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated'
import { ICON_PRESS_STYLES } from '../../../configs/styling/elements'
import CastContext, { CastButton } from 'react-native-google-cast'
import { usePlayerContext } from '../../../providers/Player'

export default function Footer(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()
	const isCasting = useIsCasting()

	const { setPage } = usePlayerContext()

	const theme = useTheme()

	const { data: lyrics } = useRawLyrics()

	const castIconName = isCasting ? 'cast-connected' : 'cast'

	const castIconColor = isCasting ? '$primary' : '$color'

	const onCastIconPress = () => {
		console.debug('Cast icon pressed')
		CastContext.showIntroductoryOverlay()
			.then(() => {
				console.debug('navigating to cast dialog')
				navigation.navigate('CastDialog')
			})
			.catch((error) => {
				console.debug(error)
			})
	}

	const castButtonStyle = {
		width: 24,
		height: 24,
		tintColor: theme.color.val,
	}

	return (
		<XStack justifyContent='center' alignItems='center' gap={'$3'}>
			{/* <Icon
				small
				name={castIconName}
				onPress={onCastIconPress}
				color={castIconColor}
				{...ICON_PRESS_STYLES}
			/> */}

			{/* <YStack alignItems='center' justifyContent='center'>
				<CastButton style={castButtonStyle} />
			</YStack> */}

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
						setPage(2)
					}}
					{...ICON_PRESS_STYLES}
				/>
			</XStack>
		</XStack>
	)
}
