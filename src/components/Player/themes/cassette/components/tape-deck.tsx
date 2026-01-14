import React from 'react'
import { YStack, XStack, SizableText } from 'tamagui'
import Animated, {
	useAnimatedStyle,
	useDerivedValue,
	withRepeat,
	withTiming,
	Easing,
	SharedValue,
} from 'react-native-reanimated'
import { useProgress, usePlaybackState } from '../../../../../hooks/player/queries'
import { UPDATE_INTERVAL } from '../../../../../configs/player.config'
import { State } from 'react-native-track-player'
import type JellifyTrack from '../../../../../types/JellifyTrack'
import ItemImage from '../../../../Global/components/image'
import LinearGradient from 'react-native-linear-gradient'
import { StyleSheet } from 'react-native'

interface TapeDeckProps {
	nowPlaying: JellifyTrack
	swipeX: SharedValue<number>
	width: number
}

const CASSETTE_COLORS = {
	body: '#D4C4B5',
	bodyDark: '#B8A89A',
	bodyHighlight: '#E8DDD0',
	window: '#1A1A1A',
	windowFrame: '#0D0D0D',
	reel: '#2D2D2D',
	reelCenter: '#4A4A4A',
	reelHighlight: '#5A5A5A',
	tape: '#3D2A1F',
	tapeShine: '#4D3A2F',
	label: '#F5E6D3',
	labelText: '#2C1810',
	screw: '#8B7355',
	screwHighlight: '#A08060',
}

export default function TapeDeck({ nowPlaying, width }: TapeDeckProps): React.JSX.Element {
	const progress = useProgress(UPDATE_INTERVAL)
	const playbackState = usePlaybackState()
	const isPlaying = playbackState === State.Playing

	const cassetteWidth = Math.min(width - 40, 340)
	const cassetteHeight = cassetteWidth * 0.65

	const progressPercent = progress.duration > 0 ? progress.position / progress.duration : 0

	return (
		<YStack alignItems='center' gap='$4'>
			{/* Cassette body */}
			<YStack
				width={cassetteWidth}
				height={cassetteHeight}
				backgroundColor={CASSETTE_COLORS.body}
				borderRadius={12}
				padding='$2'
				shadowColor='#000'
				shadowOffset={{ width: 0, height: 6 }}
				shadowOpacity={0.4}
				shadowRadius={12}
				elevation={10}
				borderWidth={1}
				borderColor={CASSETTE_COLORS.bodyHighlight}
			>
				{/* Top edge detail / highlight */}
				<YStack
					position='absolute'
					top={0}
					left={0}
					right={0}
					height={6}
					backgroundColor={CASSETTE_COLORS.bodyHighlight}
					borderTopLeftRadius={12}
					borderTopRightRadius={12}
					opacity={0.7}
					zIndex={1}
				/>

				{/* Bottom edge shadow */}
				<YStack
					position='absolute'
					bottom={0}
					left={0}
					right={0}
					height={4}
					backgroundColor={CASSETTE_COLORS.bodyDark}
					borderBottomLeftRadius={12}
					borderBottomRightRadius={12}
					zIndex={1}
				/>

				{/* Screw holes - highest z-index to appear on top */}
				<XStack
					position='absolute'
					top={10}
					left={12}
					right={12}
					justifyContent='space-between'
					zIndex={10}
				>
					<ScrewHole />
					<ScrewHole />
				</XStack>
				<XStack
					position='absolute'
					bottom={10}
					left={12}
					right={12}
					justifyContent='space-between'
					zIndex={10}
				>
					<ScrewHole />
					<ScrewHole />
				</XStack>

				{/* Window area with reels */}
				<YStack
					flex={1}
					marginTop='$3'
					marginHorizontal='$1.5'
					backgroundColor={CASSETTE_COLORS.windowFrame}
					borderRadius={8}
					padding={3}
					overflow='hidden'
					zIndex={2}
				>
					<YStack
						flex={1}
						backgroundColor={CASSETTE_COLORS.window}
						borderRadius={6}
						paddingVertical='$2'
						paddingHorizontal='$3'
						justifyContent='center'
						overflow='hidden'
					>
						<XStack justifyContent='space-between' alignItems='center'>
							{/* Left reel (supply - empties as song plays) */}
							<TapeReel
								size={cassetteWidth * 0.18}
								isPlaying={isPlaying}
								tapeAmount={1 - progressPercent}
								direction={1}
							/>

							{/* Tape window showing tape between reels */}
							<TapeWindow width={cassetteWidth * 0.2} />

							{/* Right reel (take-up - fills as song plays) */}
							<TapeReel
								size={cassetteWidth * 0.18}
								isPlaying={isPlaying}
								tapeAmount={progressPercent}
								direction={1}
							/>
						</XStack>
					</YStack>
				</YStack>

				{/* Label area with album art */}
				<YStack
					borderRadius={6}
					marginTop='$1.5'
					marginHorizontal='$3'
					overflow='hidden'
					height={cassetteHeight * 0.28}
					zIndex={5}
				>
					{/* Album art as background - base layer */}
					<YStack position='absolute' top={0} left={0} right={0} bottom={0} zIndex={1}>
						<ItemImage
							item={nowPlaying.item}
							imageOptions={{ maxWidth: 400, maxHeight: 200 }}
						/>
					</YStack>

					{/* Gradient overlay for text readability */}
					<LinearGradient
						colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.7)']}
						style={[StyleSheet.absoluteFill, { zIndex: 2 }]}
					/>

					{/* Vintage label overlay effect */}
					<YStack
						position='absolute'
						top={0}
						left={0}
						right={0}
						bottom={0}
						backgroundColor='rgba(245, 230, 211, 0.15)'
						zIndex={3}
					/>

					{/* Text content - above overlays */}
					<YStack flex={1} justifyContent='center' padding='$2' gap='$0.5' zIndex={4}>
						<SizableText
							size='$3'
							fontWeight='700'
							color='#FFFFFF'
							numberOfLines={1}
							textAlign='center'
							textShadowColor='rgba(0,0,0,0.8)'
							textShadowOffset={{ width: 0, height: 1 }}
							textShadowRadius={3}
						>
							{nowPlaying.title ?? 'Unknown Track'}
						</SizableText>
						<SizableText
							size='$2'
							color='rgba(255,255,255,0.85)'
							numberOfLines={1}
							textAlign='center'
							textShadowColor='rgba(0,0,0,0.8)'
							textShadowOffset={{ width: 0, height: 1 }}
							textShadowRadius={2}
						>
							{nowPlaying.artist ?? 'Unknown Artist'}
						</SizableText>
					</YStack>

					{/* Subtle label border/frame - topmost */}
					<YStack
						position='absolute'
						top={0}
						left={0}
						right={0}
						bottom={0}
						borderWidth={2}
						borderColor='rgba(139, 115, 85, 0.4)'
						borderRadius={6}
						zIndex={5}
					/>
				</YStack>
			</YStack>
		</YStack>
	)
}

function ScrewHole(): React.JSX.Element {
	return (
		<YStack
			width={10}
			height={10}
			borderRadius={5}
			backgroundColor={CASSETTE_COLORS.screw}
			borderWidth={1.5}
			borderColor='#6B5344'
			alignItems='center'
			justifyContent='center'
		>
			{/* Phillips head cross */}
			<YStack
				position='absolute'
				width={6}
				height={1.5}
				backgroundColor='#5A4334'
				borderRadius={0.5}
			/>
			<YStack
				position='absolute'
				width={1.5}
				height={6}
				backgroundColor='#5A4334'
				borderRadius={0.5}
			/>
		</YStack>
	)
}

interface TapeReelProps {
	size: number
	isPlaying: boolean
	tapeAmount: number // 0-1, how much tape is on this reel
	direction: number // 1 or -1 for rotation direction
}

function TapeReel({ size, isPlaying, tapeAmount, direction }: TapeReelProps): React.JSX.Element {
	const rotation = useDerivedValue(() => {
		if (!isPlaying) return 0
		return withRepeat(
			withTiming(360 * direction, {
				duration: 2000,
				easing: Easing.linear,
			}),
			-1,
			false,
		)
	}, [isPlaying, direction])

	const reelStyle = useAnimatedStyle(() => ({
		transform: [{ rotate: `${rotation.value}deg` }],
	}))

	// Calculate tape radius based on amount (min 30% of reel size, max 48% to stay within bounds)
	// The reel container is `size`, so max radius should be size/2 = 50%, using 48% for safety
	const minTapeRadius = size * 0.3
	const maxTapeRadius = size * 0.48
	const tapeRadius = minTapeRadius + tapeAmount * (maxTapeRadius - minTapeRadius)
	const coreSize = size * 0.4

	return (
		<YStack width={size} height={size} alignItems='center' justifyContent='center'>
			{/* Tape wrapped around reel - base layer */}
			<YStack
				position='absolute'
				width={tapeRadius * 2}
				height={tapeRadius * 2}
				borderRadius={tapeRadius}
				backgroundColor={CASSETTE_COLORS.tape}
				zIndex={1}
			/>
			{/* Tape shine/highlight */}
			<YStack
				position='absolute'
				width={tapeRadius * 1.8}
				height={tapeRadius * 1.8}
				borderRadius={tapeRadius * 0.9}
				borderWidth={1}
				borderColor={CASSETTE_COLORS.tapeShine}
				opacity={0.3}
				zIndex={2}
			/>

			{/* Reel hub - top layer */}
			<Animated.View style={[reelStyle, { zIndex: 3 }]}>
				<YStack
					width={coreSize}
					height={coreSize}
					borderRadius={coreSize / 2}
					backgroundColor={CASSETTE_COLORS.reel}
					alignItems='center'
					justifyContent='center'
					borderWidth={1}
					borderColor='#3D3D3D'
				>
					{/* Center hub with highlight */}
					<YStack
						width={coreSize * 0.45}
						height={coreSize * 0.45}
						borderRadius={coreSize * 0.225}
						backgroundColor={CASSETTE_COLORS.reelCenter}
						borderWidth={1}
						borderColor={CASSETTE_COLORS.reelHighlight}
					/>
					{/* Spokes */}
					{[0, 60, 120, 180, 240, 300].map((angle) => (
						<YStack
							key={angle}
							position='absolute'
							width={2}
							height={coreSize * 0.42}
							backgroundColor={CASSETTE_COLORS.reelCenter}
							style={{ transform: [{ rotate: `${angle}deg` }] }}
							borderRadius={1}
						/>
					))}
				</YStack>
			</Animated.View>
		</YStack>
	)
}

interface TapeWindowProps {
	width: number
}

function TapeWindow({ width }: TapeWindowProps): React.JSX.Element {
	return (
		<YStack
			width={width}
			height={24}
			backgroundColor='#0A0A0A'
			borderRadius={3}
			overflow='hidden'
			justifyContent='center'
			borderWidth={1}
			borderColor='#1A1A1A'
		>
			{/* Tape running through window */}
			<YStack
				position='absolute'
				left={0}
				right={0}
				height={10}
				backgroundColor={CASSETTE_COLORS.tape}
				top={7}
			/>
			{/* Tape shine line */}
			<YStack
				position='absolute'
				left={0}
				right={0}
				height={1}
				backgroundColor={CASSETTE_COLORS.tapeShine}
				top={10}
				opacity={0.4}
			/>
			{/* Tape guides */}
			<XStack justifyContent='space-between' paddingHorizontal={3}>
				<YStack
					width={5}
					height={18}
					backgroundColor='#2A2A2A'
					borderRadius={1}
					borderWidth={1}
					borderColor='#3A3A3A'
				/>
				<YStack
					width={5}
					height={18}
					backgroundColor='#2A2A2A'
					borderRadius={1}
					borderWidth={1}
					borderColor='#3A3A3A'
				/>
			</XStack>
		</YStack>
	)
}
