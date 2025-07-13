import ItemImage from '../../../components/Global/components/image'
import { StackParamList } from '../../../components/types'
import { RouteProp } from '@react-navigation/native'
import BlurView from 'blur-react-native'
import { useColorScheme } from 'react-native'
import LinearGradient from 'react-native-linear-gradient'
import { useSafeAreaFrame } from 'react-native-safe-area-context'
import { useTheme, ZStack } from 'tamagui'

export default function PlaylistHeader({
	route,
}: {
	route: RouteProp<StackParamList, 'Playlist'>
}) {
	const isDark = useColorScheme() === 'dark'
	const { width } = useSafeAreaFrame()

	const theme = useTheme()

	return (
		<ZStack
			flex={1}
			justifyContent='center'
			alignItems='center'
			backgroundColor={theme.background.val}
		>
			<LinearGradient
				colors={['transparent', 'transparent', theme.background.val]}
				style={{ flex: 1, width: width, height: width / 2 }}
			/>
			<BlurView
				blurAmount={100}
				blurType={'regular'}
				style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
			>
				<ItemImage item={route.params.playlist} width={width} height={width / 2} />
			</BlurView>
		</ZStack>
	)
}
