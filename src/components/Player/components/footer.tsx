import { Spacer, useTheme, XStack, YStack } from 'tamagui'
import Icon from '../../Global/components/icon'
import { ICON_PRESS_STYLES } from '../../../configs/styling/elements'
import { CastButton, CastState } from 'react-native-nitro-player'
import { usePlayerContext } from '../../../providers/Player'
import { StyleSheet } from 'react-native'
import useRawLyrics from '../../../api/queries/lyrics'
import useAutoIsConnected from '../../../stores/auto'

export default function Footer(): React.JSX.Element {
	const { setPage } = usePlayerContext()

	const theme = useTheme()

	const { displayLyrics, setDisplayLyrics } = usePlayerContext()

	const rawLyricsQuery = useRawLyrics()

	const isAutoConnected = useAutoIsConnected()

	const displayLyricsAvailable = rawLyricsQuery.data || displayLyrics

	return (
		<XStack justifyContent='center' alignItems='center' gap='3'>
			<XStack alignItems='center' justifyContent='flex-start' flex={1}>
				<Icon
					size='7'
					testID='queue-button-test-id'
					name='playlist-music'
					onPress={() => setPage(1)}
					{...ICON_PRESS_STYLES}
				/>
			</XStack>

			<Spacer flex={1} />

			{displayLyricsAvailable && (
				<Icon
					size='7'
					name='message-text-outline'
					onPress={() => setDisplayLyrics(!displayLyrics)}
					{...ICON_PRESS_STYLES}
					opacity='1 hover:0.8 press:0.6 enter:0 exit:0'
					transition={'quick'}
					color={displayLyrics ? 'primary' : 'color'}
				/>
			)}

			<YStack alignItems='center' justifyContent='center'>
				{isAutoConnected ? (
					// CarPlay / Android Auto owns the audio route, so show that instead of Cast
					<Icon name='car-connected' size='7' color='primary' />
				) : (
					// nitro-player Cast button — opens the native device picker and
					// reflects the live connection state.
					<CastButton
						style={styles.castButton}
						size={28}
						color={theme.color.val}
						activeColor={theme.primary.val}
						hideWhenNoDevices={false}
						renderIcon={CastIcon}
					/>
				)}
			</YStack>
		</XStack>
	)
}

interface CastIconProps {
	state: CastState
	isCasting: boolean
}

function CastIcon({ isCasting }: CastIconProps) {
	const color = isCasting ? 'primary' : 'color'

	return <Icon name='cast-audio' size='7' color={color} />
}

const styles = StyleSheet.create({
	castButton: {
		flex: 1,
		paddingHorizontal: 4,
	},
})
