import Animated, { FadeInUp, FadeOut, LinearTransition } from 'react-native-reanimated'
import { H3 } from 'tamagui'
import { StyleSheet } from 'react-native'

interface HeadingProps {
	title: string
}

export default function Heading({ title }: HeadingProps): React.JSX.Element {
	return (
		<Animated.View
			entering={FadeInUp}
			exiting={FadeOut}
			layout={LinearTransition}
			style={styles.container}
		>
			<H3 textAlign='center' marginBottom='2' testID='library_selection_title'>
				{title}
			</H3>
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	container: {
		justifyContent: 'center',
		flex: 1,
	},
})
