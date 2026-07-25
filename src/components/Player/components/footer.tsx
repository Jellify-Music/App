import { Spacer, useTheme, XStack, YStack } from 'tamagui'

import Icon from '../../Global/components/icon'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import { PlayerParamList } from '../../../screens/Player/types'
import useRawLyrics from '../../../api/queries/lyrics'
import { ICON_PRESS_STYLES } from '../../../configs/styling/elements'
import { CastButton, CastState } from 'react-native-nitro-player'
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
				<Icon
					small
					name='message-text-outline'
					onPress={() => navigation.navigate('LyricsScreen', { lyrics: lyrics })}
					{...ICON_PRESS_STYLES}
					enterStyle={{
						opacity: 0,
					}}
					exitStyle={{
						opacity: 0,
					}}
					transition={'quick'}
				/>
			)}

			<YStack alignItems='center' justifyContent='center'>
				{/* nitro-player Cast button — opens the native device picker and
				    reflects the live connection state. */}
				<CastButton
					style={styles.castButton}
					size={24}
					color={theme.color.val}
					activeColor={theme.primary.val}
					hideWhenNoDevices={false}
					renderIcon={CastIcon}
				/>
			</YStack>
		</XStack>
	)
}

interface CastIconProps {
	state: CastState
	isCasting: boolean
}

function CastIcon({ isCasting }: CastIconProps) {
	const color = isCasting ? '$primary' : '$color'

	return <Icon name='cast-audio' small color={color} />
}

const styles = StyleSheet.create({
	castButton: {
		flex: 1,
	},
})
