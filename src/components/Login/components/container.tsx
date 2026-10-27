import { useAnimatedKeyboard } from 'react-native-keyboard-controller'
import Animated, { useAnimatedStyle } from 'react-native-reanimated'
import { loginStyles } from '../styles'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface LoginContainerProps {
	children: React.ReactNode
}

export function LoginContainer({ children }: LoginContainerProps) {
	const { bottom } = useSafeAreaInsets()

	const keyboard = useAnimatedKeyboard()

	const containerStyle = useAnimatedStyle(() => ({
		marginBottom: keyboard.height.get() ?? bottom,
	}))

	return <Animated.View style={[loginStyles.container, containerStyle]}>{children}</Animated.View>
}
