import { useAnimatedKeyboard } from 'react-native-keyboard-controller'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native'

interface LoginContainerProps {
	children: React.ReactNode
}

export function LoginContainer({ children }: LoginContainerProps) {
	const { bottom } = useSafeAreaInsets()

	const keyboard = useAnimatedKeyboard()

	const containerStyle = useAnimatedStyle(() => ({
		marginBottom: keyboard.height.get() ?? bottom,
	}))

	return (
		<SafeAreaView style={styles.container}>
			<Animated.View style={[styles.container, containerStyle]}>{children}</Animated.View>
		</SafeAreaView>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
})
