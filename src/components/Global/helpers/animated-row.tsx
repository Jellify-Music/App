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
	const reducedMotion = useReducedMotion()

	return (
		<Animated.View
			testID={testID}
			entering={FadeIn.easing(Easing.in(Easing.ease)).reduceMotion(ReduceMotion.System)}
			exiting={FadeOut.easing(Easing.out(Easing.ease)).reduceMotion(ReduceMotion.System)}
			layout={
				reducedMotion
					? undefined
					: LinearTransition.springify().reduceMotion(ReduceMotion.System)
			}
			style={{
				flex: 1,
			}}
		>
			{children}
		</Animated.View>
	)
}
