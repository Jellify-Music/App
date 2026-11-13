import { useEffect, useState } from 'react'
import { GetProps, SizableText, useTheme } from 'tamagui'
import { usePlayerSettingsStore } from '../../../../stores/settings/player'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import Slider from '@jellify-music/react-native-reanimated-slider'
import { getTokenValue, View } from '@tamagui/core'
import { Setting } from '../sections'

const MAX_LOOKAHEAD = 10

const DIAL_VALUES = Array.from({ length: MAX_LOOKAHEAD + 1 }, (_, value) => value)

const dialTextProps: GetProps<typeof SizableText> = {
	textAlign: 'center',
	fontSize: '4',
	fontWeight: '6',
	color: 'primary',
	fontVariant: ['tabular-nums'],
}

export default function LookaheadSettings() {
	const lookahead = usePlayerSettingsStore((state) => state.lookahead)
	const setLookahead = usePlayerSettingsStore((state) => state.setLookahead)

	const { primary, neutral } = useTheme()

	const lookaheadSharedValue = useSharedValue(lookahead)

	const [rowHeight, setRowHeight] = useState(0)

	const dialOffset = useSharedValue(0)

	useEffect(() => {
		dialOffset.value = withSpring(-lookahead * rowHeight)
	}, [lookahead])

	// Rolls the strip of numbers so the current value sits in the window
	const dialStyle = useAnimatedStyle(() => ({
		opacity: rowHeight ? 1 : 0,
		transform: [{ translateY: dialOffset.value }],
	}))

	return (
		<Setting
			orientation='vertical'
			title='Track Lookahead'
			description='Number of upcoming tracks to prefetch'
			indicator={
				<View
					minWidth={'3'}
					marginVertical='2'
					borderWidth='1'
					borderRadius='2'
					borderColor='primary'
					justifyContent={'center'}
					overflow='hidden'
				>
					{/* Invisible placeholder that sizes the dial window */}
					<View
						opacity={0}
						onLayout={({ nativeEvent }) => {
							const { height } = nativeEvent.layout
							dialOffset.value = -lookahead * height
							setRowHeight(height)
						}}
					>
						<SizableText {...dialTextProps}>{MAX_LOOKAHEAD}</SizableText>
					</View>

					<Animated.View
						style={[{ position: 'absolute', top: 0, left: 0, right: 0 }, dialStyle]}
					>
						{DIAL_VALUES.map((value) => (
							<SizableText key={value} {...dialTextProps} height={rowHeight}>
								{value}
							</SizableText>
						))}
					</Animated.View>
				</View>
			}
		>
			<View marginBottom='2'>
				<Slider
					value={lookaheadSharedValue}
					onValueUpdate={setLookahead}
					onValueChange={setLookahead}
					maxValue={MAX_LOOKAHEAD}
					thumbWidth={8}
					color={primary.val}
					backgroundColor={neutral.val}
					thumbShadowColor='black'
					trackHeight={getTokenValue('2')}
					step={1}
				/>
			</View>
		</Setting>
	)
}
