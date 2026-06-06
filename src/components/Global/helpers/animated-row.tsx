import { StyleSheet } from 'react-native'
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
		children
	)
}

const animatedRowStyle = StyleSheet.create({
	row: {
		flex: 1,
	},
})
