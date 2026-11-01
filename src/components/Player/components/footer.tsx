import { Spacer, useTheme, XStack, YStack } from 'tamagui'

import Icon from '../../Global/components/icon'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useNavigation } from '@react-navigation/native'
import { PlayerParamList } from '../../../screens/Player/types'
import useRawLyrics from '../../../api/queries/lyrics'
import { ICON_PRESS_STYLES } from '../../../configs/styling/elements'
import { CastButton, CastState } from 'react-native-nitro-player'
import { usePlayerContext } from '../../../providers/Player'
import { Pressable, StyleSheet } from 'react-native'
import { CastIcon as HolidayCastIcon, QueueIcon } from '../../Holidays/player-icons'
import { useIsHolidays } from '../../Holidays/hooks'

export default function Footer(): React.JSX.Element {
	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()

	const { setPage } = usePlayerContext()

	const theme = useTheme()

	const isHolidays = useIsHolidays()

	const { data: lyrics } = useRawLyrics()

	return (
		// Holidays: the design's footer icons sit 10px from the screen edge, in 48px boxes
		<XStack
			justifyContent='center'
			alignItems='center'
			gap='3'
			marginHorizontal={isHolidays ? -8 : undefined}
		>
			<XStack alignItems='center' justifyContent='flex-start' flex={1}>
				{isHolidays ? (
					<Pressable
						testID='queue-button-test-id'
						accessibilityRole='button'
						accessibilityLabel='Queue'
						onPress={() => setPage(1)}
						style={styles.holidayButton}
					>
						<QueueIcon color={theme.color.val} />
					</Pressable>
				) : (
					<Icon
						size='7'
						testID='queue-button-test-id'
						name='playlist-music'
						onPress={() => setPage(1)}
						{...ICON_PRESS_STYLES}
					/>
				)}
			</XStack>

			<Spacer flex={1} />

			{lyrics && (
				<Icon
					size='7'
					name='message-text-outline'
					onPress={() => navigation.navigate('LyricsScreen', { lyrics: lyrics })}
					{...ICON_PRESS_STYLES}
					opacity='1 hover:0.8 press:0.6 enter:0 exit:0'
					transition={'quick'}
				/>
			)}

			<YStack alignItems='center' justifyContent='center'>
				{/* nitro-player Cast button — opens the native device picker and
				    reflects the live connection state. */}
				<CastButton
					style={styles.castButton}
					size={28}
					color={theme.color.val}
					activeColor={theme.primary.val}
					hideWhenNoDevices={false}
					renderIcon={isHolidays ? HolidayCast : CastIcon}
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
	const color = isCasting ? 'primary' : 'color'

	return <Icon name='cast-audio' size='7' color={color} />
}

function HolidayCast({ isCasting }: CastIconProps) {
	const theme = useTheme()

	return (
		<Pressable style={styles.holidayButton} pointerEvents='none'>
			<HolidayCastIcon color={isCasting ? theme.primary.val : theme.color.val} />
		</Pressable>
	)
}

const styles = StyleSheet.create({
	holidayButton: {
		width: 48,
		height: 48,
		alignItems: 'center',
		justifyContent: 'center',
	},
	castButton: {
		flex: 1,
		paddingHorizontal: 4,
	},
})
