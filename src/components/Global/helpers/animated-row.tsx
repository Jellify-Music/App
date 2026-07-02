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
		// Keep the testID and layout when animations are off — reduced motion
		// is reported as true on emulators with animations disabled (CI), and
		// dropping the testID here makes these rows invisible to Maestro.
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
