import { PlayerParamList } from '@/src/screens/Player/types'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { useTheme, XStack } from 'tamagui'

export default function QueueTracklistHeader() {
	const navigation = useNavigation<NativeStackNavigationProp<PlayerParamList>>()

	const { color } = useTheme()

	const onBackPress = () => navigation.goBack()

	return (
		<XStack
			alignContent='center'
			justifyContent='flex-start'
			margin={'$4'}
			marginHorizontal={'$2.5'}
		>
			<MaterialDesignIcons
				name='chevron-left'
				color={color.val}
				size={22}
				onPress={onBackPress}
			/>
		</XStack>
	)
}
