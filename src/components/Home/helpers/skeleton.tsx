import React, { useEffect } from 'react'
import { XStack, YStack, View, useTheme } from 'tamagui'
import Animated, {
	useSharedValue,
	useAnimatedStyle,
	withRepeat,
	withTiming,
	Easing,
	SharedValue,
} from 'react-native-reanimated'
import { useDisplayContext } from '../../../providers/Display/display-provider'

const AnimatedView = Animated.createAnimatedComponent(View)

function SkeletonBox({
	width,
	height,
	borderRadius = 8,
	opacity,
	backgroundColor,
}: {
	width: number | string
	height: number | string
	borderRadius?: number
	opacity: SharedValue<number>
	backgroundColor: string
}) {
	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}))

	return (
		<AnimatedView
			style={[
				{
					width,
					height,
					borderRadius,
					backgroundColor,
				},
				animatedStyle,
			]}
		/>
	)
}

export default function HomeSectionSkeleton(): React.JSX.Element {
	const { horizontalItems } = useDisplayContext()
	const theme = useTheme()
	const opacity = useSharedValue(0.3)

	// Get actual color value from theme for Reanimated
	const skeletonColor = theme.gray8?.val ?? '#374151'

	useEffect(() => {
		opacity.value = withRepeat(
			withTiming(0.7, { duration: 800, easing: Easing.inOut(Easing.ease) }),
			-1,
			true,
		)
	}, [])

	const cardCount = Math.min(horizontalItems, 5)

	return (
		<YStack gap='$2' marginVertical='$2'>
			{/* Header skeleton */}
			<XStack alignItems='center' marginLeft='$2' gap='$2'>
				<SkeletonBox
					width={120}
					height={20}
					borderRadius={4}
					opacity={opacity}
					backgroundColor={skeletonColor}
				/>
			</XStack>

			{/* Cards skeleton */}
			<XStack gap='$2' paddingHorizontal='$2'>
				{Array.from({ length: cardCount }).map((_, i) => (
					<YStack key={i} gap='$1'>
						<SkeletonBox
							width={88}
							height={88}
							borderRadius={8}
							opacity={opacity}
							backgroundColor={skeletonColor}
						/>
						<SkeletonBox
							width={80}
							height={12}
							borderRadius={4}
							opacity={opacity}
							backgroundColor={skeletonColor}
						/>
						<SkeletonBox
							width={60}
							height={10}
							borderRadius={4}
							opacity={opacity}
							backgroundColor={skeletonColor}
						/>
					</YStack>
				))}
			</XStack>
		</YStack>
	)
}
