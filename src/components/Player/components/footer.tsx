import { Spacer, useTheme, XStack, YStack } from 'tamagui'

import Icon from '../../Global/components/icon'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import { PlayerParamList } from '../../../screens/Player/types'
import useRawLyrics from '../../../api/queries/lyrics'
import Animated, { Easing, FadeIn, FadeOut } from 'react-native-reanimated'
import { ICON_PRESS_STYLES } from '../../../configs/styling/elements'
// Google Cast button now comes from nitro-player (native Cast). RNGC removed.
// import CastContext, { CastButton } from 'react-native-google-cast'
import { CastButton } from 'react-native-nitro-player'
import { usePlayerContext } from '../../../providers/Player'
import { StyleSheet } from 'react-native'

export default function Footer(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()

	const { setPage } = usePlayerContext()

	const theme = useTheme()

	const { data: lyrics } = useRawLyrics()

	return (
		<XStack justifyContent='center' alignItems='center' gap={'$3'}>
			<XStack alignItems='center' justifyContent='flex-start' flex={1}>
				<Icon
					small
					testID='queue-button-test-id'
					name='playlist-music'
					onPress={() => setPage(1)}
					{...ICON_PRESS_STYLES}
				/>
			</XStack>

			<Spacer flex={1} />

			{lyrics && (
				<Animated.View
					entering={FadeIn.easing(Easing.in(Easing.ease))}
					exiting={FadeOut.easing(Easing.out(Easing.ease))}
				>
					<Icon
						flex={1}
						small
						name='message-text-outline'
						onPress={() => navigation.navigate('LyricsScreen', { lyrics: lyrics })}
						{...ICON_PRESS_STYLES}
					/>
				</Animated.View>
			)}

			<YStack alignItems='center' justifyContent='center'>
				{/* nitro-player Cast button — opens the native device picker and
				    reflects the live connection state. */}
				<CastButton
					style={styles.castButton}
					size={24}
					color={theme.color.val}
					activeColor={theme.primary.val}
				/>
			</YStack>
		</XStack>
	)
}

const styles = StyleSheet.create({
	castButton: {
		flex: 1,
	},
})
