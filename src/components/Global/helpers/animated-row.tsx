import Animated, {
	FadeIn,
	ReduceMotion,
	FadeOut,
	LinearTransition,
	Easing,
	useReducedMotion,
} from 'react-native-reanimated'

interface AnimatedRowProps {
	children: React.ReactNode
	testID?: string
}

export default function AnimatedRow({ children, testID }: AnimatedRowProps) {
	const reducedMotionEnabled = useReducedMotion()

	return (
		<Animated.View
			testID={testID}
			entering={
				reducedMotionEnabled
					? undefined
					: FadeIn.easing(Easing.in(Easing.ease)).reduceMotion(ReduceMotion.System)
			}
			exiting={
				reducedMotionEnabled
					? undefined
					: FadeOut.easing(Easing.out(Easing.ease)).reduceMotion(ReduceMotion.System)
			}
			layout={
				reducedMotionEnabled
					? undefined
					: LinearTransition.springify().reduceMotion(ReduceMotion.System)
			}
		>
			{children}
		</Animated.View>
	)
}
