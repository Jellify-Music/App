import { Paragraph, Spacer, useTheme, XStack } from 'tamagui'
import { usePlayerContext } from '../../../providers/Player'
import MaterialDesignIcons from '@react-native-vector-icons/material-design-icons'

export default function QueueListHeader() {
	const { color } = useTheme()

	const { setPage } = usePlayerContext()

	const onUpIconPress = () => {
		return setPage(0)
	}

	return (
		<XStack
			alignContent='center'
			padding={'$3'}
			borderBottomWidth={'$1'}
			borderColor={'$borderColor'}
		>
			<MaterialDesignIcons
				size={22}
				color={color.val}
				name='chevron-up'
				onPress={onUpIconPress}
				style={{
					flexShrink: 1,
					marginVertical: 'auto',
					alignContent: 'center',
					justifyContent: 'center',
				}}
			/>

			<Paragraph flex={1} fontWeight={'$6'} fontSize={'$4'} textAlign='center'>
				Next Up
			</Paragraph>

			<Spacer flexShrink={1} />
		</XStack>
	)
}
