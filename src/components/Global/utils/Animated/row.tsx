import { StyleSheet, View } from 'react-native'
import Animated, {
	FadeIn,
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

	return !reducedMotion ? (
		<Animated.View
			testID={testID}
			entering={FadeIn.easing(Easing.in(Easing.ease))}
			exiting={FadeOut.easing(Easing.out(Easing.ease))}
			layout={LinearTransition.springify()}
			style={animatedRowStyle.row}
		>
			{children}
		</Animated.View>
	) : (
		// Keep the testID when animations are off — CI emulators report reduced motion,
		// and without it these rows are invisible to Maestro
		<View testID={testID} style={animatedRowStyle.row}>
			{children}
		</View>
	)
}

const animatedRowStyle = StyleSheet.create({
	row: {
		flex: 1,
	},
})
