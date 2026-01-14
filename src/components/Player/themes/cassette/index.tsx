import React from 'react'
import { YStack, ZStack, getTokenValue } from 'tamagui'
import { Platform } from 'react-native'
import Animated, { interpolate, useAnimatedStyle } from 'react-native-reanimated'
import { GestureDetector } from 'react-native-gesture-handler'

import CassetteBackground from './components/cassette-background'
import TapeDeck from './components/tape-deck'
import CassetteControls from './components/cassette-controls'
import TapeScrubber from './components/tape-scrubber'
import CassetteHeader from './components/cassette-header'
import CassetteFooter from './components/cassette-footer'

import { usePlayerGestures } from '../../shared/hooks/use-player-gestures'
import { usePrevious, useSkip } from '../../../../hooks/player/callbacks'
import useHapticFeedback from '../../../../hooks/use-haptic-feedback'
import Icon from '../../../Global/components/icon'

import type { PlayerThemeComponent, PlayerThemeProps } from '../types'

function CassettePlayer({
	nowPlaying,
	swipeX,
	dimensions,
	insets,
}: PlayerThemeProps): React.JSX.Element {
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

	// Edge icon opacity styles for swipe feedback
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
			<CassetteBackground width={width} height={height} />

			{/* Swipe feedback icons */}
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
						<Icon name='skip-next' color='$warning' large />
					</Animated.View>
					<Animated.View style={[{ position: 'absolute', right: 12 }, rightIconStyle]}>
						<Icon name='skip-previous' color='$warning' large />
					</Animated.View>
				</YStack>
			</Animated.View>

			{/* Gesture area */}
			<GestureDetector gesture={gesture}>
				<YStack
					position='absolute'
					top={height * 0.15}
					left={width * 0.05}
					right={width * 0.05}
					height={height * 0.45}
					zIndex={9998}
				/>
			</GestureDetector>

			{/* Main content */}
			<YStack flex={1} {...mainContainerStyle}>
				<CassetteHeader />

				<YStack flex={1} justifyContent='center' alignItems='center' gap='$4'>
					<TapeDeck nowPlaying={nowPlaying} swipeX={swipeX} width={width} />
				</YStack>

				<YStack gap='$4' paddingBottom='$2'>
					<TapeScrubber />
					<CassetteControls />
					<CassetteFooter />
				</YStack>
			</YStack>
		</ZStack>
	)
}

function CassettePreview({ width, height }: { width: number; height: number }): React.JSX.Element {
	const cassetteWidth = width * 0.85
	const cassetteHeight = cassetteWidth * 0.5

	return (
		<YStack
			width={width}
			height={height}
			borderRadius='$2'
			overflow='hidden'
			justifyContent='center'
			alignItems='center'
			backgroundColor='#2C1810'
		>
			{/* Mini cassette representation */}
			<YStack
				width={cassetteWidth}
				height={cassetteHeight}
				backgroundColor='#D4C4B5'
				borderRadius={6}
				padding='$1'
				alignItems='center'
				justifyContent='center'
			>
				{/* Window area */}
				<YStack
					width={cassetteWidth * 0.9}
					height={cassetteHeight * 0.5}
					backgroundColor='#1A1A1A'
					borderRadius={3}
					flexDirection='row'
					alignItems='center'
					justifyContent='space-around'
					paddingHorizontal='$1'
				>
					{/* Left reel */}
					<YStack
						width={cassetteHeight * 0.3}
						height={cassetteHeight * 0.3}
						borderRadius={cassetteHeight * 0.15}
						backgroundColor='#3D2A1F'
						borderWidth={2}
						borderColor='#4A4A4A'
					/>
					{/* Right reel */}
					<YStack
						width={cassetteHeight * 0.3}
						height={cassetteHeight * 0.3}
						borderRadius={cassetteHeight * 0.15}
						backgroundColor='#3D2A1F'
						borderWidth={2}
						borderColor='#4A4A4A'
					/>
				</YStack>

				{/* Label area */}
				<YStack
					width={cassetteWidth * 0.8}
					height={cassetteHeight * 0.25}
					backgroundColor='#F5E6D3'
					borderRadius={2}
					marginTop='$0.5'
				/>
			</YStack>

			{/* Mini controls representation */}
			<YStack flexDirection='row' gap='$1' marginTop='$2'>
				<YStack width={16} height={10} backgroundColor='#4A4A4A' borderRadius={2} />
				<YStack width={20} height={10} backgroundColor='#5A3A2A' borderRadius={2} />
				<YStack width={16} height={10} backgroundColor='#4A4A4A' borderRadius={2} />
			</YStack>
		</YStack>
	)
}

const CassetteTheme: PlayerThemeComponent = {
	Player: CassettePlayer,
	Preview: CassettePreview,
	metadata: {
		id: 'cassette',
		name: 'Cassette',
		description: 'Retro tape deck with spinning reels',
		icon: 'cassette',
		experimental: true,
	},
}

export default CassetteTheme
