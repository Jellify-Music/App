import React from 'react'
import { YStack, ZStack, View, getTokenValue } from 'tamagui'
import { Platform } from 'react-native'
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated'
import { GestureDetector } from 'react-native-gesture-handler'

import Scrubber from './components/scrubber'
import Controls from './components/controls'
import Footer from './components/footer'
import BlurredBackground from './components/blurred-background'
import PlayerHeader from './components/header'
import SongInfo from './components/song-info'

import { usePlayerGestures } from '../../shared/hooks/use-player-gestures'
import { usePrevious, useSkip } from '../../../../hooks/player/callbacks'
import useHapticFeedback from '../../../../hooks/use-haptic-feedback'
import Icon from '../../../Global/components/icon'

import type { PlayerThemeComponent, PlayerThemeProps } from '../types'

function DefaultPlayer({ swipeX, dimensions, insets }: PlayerThemeProps): React.JSX.Element {
	const skip = useSkip()
	const previous = usePrevious()
	const trigger = useHapticFeedback()

	const isAndroid = Platform.OS === 'android'
	const { width, height } = dimensions
	const { top, bottom } = insets

	const gesture = usePlayerGestures({
		swipeX,
		onSkipNext: () => skip(undefined),
		onSkipPrevious: previous,
		onHapticFeedback: (type) => trigger(type as Parameters<typeof trigger>[0]),
	})

	// Edge icon opacity styles
	const leftIconStyle = useAnimatedStyle(() => ({
		opacity: interpolate(Math.max(0, -swipeX.value), [0, 40, 120], [0, 0.25, 1]),
	}))
	const rightIconStyle = useAnimatedStyle(() => ({
		opacity: interpolate(Math.max(0, swipeX.value), [0, 40, 120], [0, 0.25, 1]),
	}))

	const mainContainerStyle = {
		marginTop: isAndroid ? top : getTokenValue('$4'),
		marginBottom: bottom + getTokenValue(isAndroid ? '$10' : '$12', 'space'),
	}

	return (
		<ZStack width={width} height={height}>
			<BlurredBackground />

			{/* Swipe feedback icons (topmost overlay) */}
			<Animated.View
				pointerEvents='none'
				style={{
					position: 'absolute',
					top: 0,
					bottom: 0,
					left: 0,
					right: 0,
					zIndex: 9999,
				}}
			>
				<YStack flex={1} justifyContent='center'>
					<Animated.View style={[{ position: 'absolute', left: 12 }, leftIconStyle]}>
						<Icon name='skip-next' color='$primary' large />
					</Animated.View>
					<Animated.View style={[{ position: 'absolute', right: 12 }, rightIconStyle]}>
						<Icon name='skip-previous' color='$primary' large />
					</Animated.View>
				</YStack>
			</Animated.View>

			{/* Central large swipe area overlay (captures swipe like big album art) */}
			<GestureDetector gesture={gesture}>
				<View
					style={{
						position: 'absolute',
						top: height * 0.18,
						left: width * 0.06,
						right: width * 0.06,
						height: height * 0.36,
						zIndex: 9998,
					}}
				/>
			</GestureDetector>

			<YStack
				justifyContent='center'
				flex={1}
				marginHorizontal={'$5'}
				{...mainContainerStyle}
			>
				<PlayerHeader />

				<YStack justifyContent='flex-start' gap={'$4'} flexShrink={1}>
					<SongInfo />
					<Scrubber />
					<Controls />
					<Footer />
				</YStack>
			</YStack>
		</ZStack>
	)
}

function DefaultPreview({ width, height }: { width: number; height: number }): React.JSX.Element {
	const scale = Math.min(width / 390, height / 844)

	return (
		<YStack
			width={width}
			height={height}
			backgroundColor='$background'
			borderRadius='$2'
			overflow='hidden'
			padding='$2'
			justifyContent='space-between'
		>
			{/* Mini album art representation */}
			<YStack alignItems='center' flex={1} justifyContent='center'>
				<YStack
					width={width * 0.7}
					height={width * 0.7}
					backgroundColor='$background50'
					borderRadius='$3'
				/>
			</YStack>

			{/* Mini controls representation */}
			<YStack gap='$1' paddingBottom='$1'>
				{/* Song info placeholder */}
				<YStack gap='$0.5' paddingHorizontal='$1'>
					<YStack
						width='60%'
						height={10 * scale}
						backgroundColor='$borderColor'
						borderRadius='$1'
					/>
					<YStack
						width='40%'
						height={8 * scale}
						backgroundColor='$background50'
						borderRadius='$1'
					/>
				</YStack>

				{/* Scrubber placeholder */}
				<YStack
					height={4 * scale}
					backgroundColor='$background50'
					borderRadius='$1'
					marginHorizontal='$1'
				/>

				{/* Controls placeholder */}
				<YStack flexDirection='row' justifyContent='center' gap='$2' paddingTop='$1'>
					<YStack
						width={20 * scale}
						height={20 * scale}
						backgroundColor='$background50'
						borderRadius={10 * scale}
					/>
					<YStack
						width={28 * scale}
						height={28 * scale}
						backgroundColor='$primary'
						borderRadius={14 * scale}
					/>
					<YStack
						width={20 * scale}
						height={20 * scale}
						backgroundColor='$background50'
						borderRadius={10 * scale}
					/>
				</YStack>
			</YStack>
		</YStack>
	)
}

const DefaultTheme: PlayerThemeComponent = {
	Player: DefaultPlayer,
	Preview: DefaultPreview,
	metadata: {
		id: 'default',
		name: 'Modern',
		description: 'Clean, modern player with album artwork focus',
		icon: 'play-circle-outline',
	},
}

export default DefaultTheme
